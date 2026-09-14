// The abuse brake in front of /api/atlas/session: N sessions per rolling hour
// per IP, N = ATLAS_SESSION_LIMIT_PER_HOUR (default 3).
//
// In-memory on purpose: the site runs as one PM2 process; a restart resets the
// counter, which is acceptable here because the worker has its own concurrency
// and daily caps behind this.
//
// The limit is read ONCE, at module load, and a value that is not a whole
// number of sessions is a startup error naming the variable — never a silent
// fall back to the default. A typo in the environment file must stop the
// deploy, not quietly leave the demo wide open or shut.
const WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_MAX_PER_WINDOW = 3;
const LIMIT_VAR = 'ATLAS_SESSION_LIMIT_PER_HOUR';

const readLimit = (raw: string | undefined): number => {
  const value = raw?.trim();

  if (!value) {
    return DEFAULT_MAX_PER_WINDOW;
  }

  // Digits only, and at least one session: '0', '-1', '2.5' and 'three' are
  // all somebody's mistake, and every one of them changes who gets in.
  if (!/^\d+$/.test(value) || Number(value) < 1) {
    throw new Error(
      `${LIMIT_VAR} must be a whole number of sessions per hour, 1 or more — got "${raw}"`,
    );
  }

  return Number(value);
};

export const MAX_PER_WINDOW = readLimit(process.env[LIMIT_VAR]);

let hits = new Map<string, number[]>();

export const checkRateLimit = (ip: string, now = Date.now()) => {
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  const oldest = recent[0];
  if (recent.length >= MAX_PER_WINDOW && oldest !== undefined) {
    hits.set(ip, recent);
    return { allowed: false, retryAfterSec: Math.ceil((oldest + WINDOW_MS - now) / 1000) };
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10_000) {
    hits = new Map([...hits].filter(([, ts]) => ts.some(t => now - t < WINDOW_MS)));
  }
  return { allowed: true, retryAfterSec: 0 };
};

export const _resetRateLimitForTests = () => {
  hits = new Map();
};
