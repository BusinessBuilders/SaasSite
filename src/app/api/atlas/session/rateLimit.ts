// The abuse brakes in front of the two Atlas routes.
//
//   * the session route: N sessions per rolling hour per IP,
//     N = ATLAS_SESSION_LIMIT_PER_HOUR (default 3). Each one costs a LiveKit
//     room and a worker slot, so this is deliberately tight.
//   * the health route: 60 probes per rolling minute per IP. It is public and
//     unauthenticated, and every hit signs a JWT and opens a 5-second outbound
//     connection to the media server — cheap once, a free amplifier at volume.
//     The cap is generous on purpose: the fleet tripwire polls it every minute
//     from one address and must never be the thing that trips it.
//
// In-memory on purpose: the site runs as one PM2 process; a restart resets the
// counters, which is acceptable for an abuse brake (the worker has its own
// concurrency and daily caps behind this).
//
// The session limit is read ONCE, at module load, and a value that is not a
// whole number of sessions is a startup error naming the variable — never a
// silent fall back to the default. A typo in the environment file must stop the
// deploy, not quietly leave the demo wide open or shut.
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const DEFAULT_MAX_PER_WINDOW = 3;
const HEALTH_MAX_PER_MINUTE = 60;
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

/**
 * A sliding-window counter per IP. Each limiter owns its own map, so the
 * health probe's traffic can never spend the session route's budget.
 */
const createRateLimiter = (windowMs: number, maxPerWindow: number) => {
  let hits = new Map<string, number[]>();

  const check = (ip: string, now = Date.now()) => {
    const recent = (hits.get(ip) ?? []).filter(t => now - t < windowMs);
    const oldest = recent[0];
    if (recent.length >= maxPerWindow && oldest !== undefined) {
      hits.set(ip, recent);
      return { allowed: false, retryAfterSec: Math.ceil((oldest + windowMs - now) / 1000) };
    }
    recent.push(now);
    hits.set(ip, recent);
    if (hits.size > 10_000) {
      hits = new Map([...hits].filter(([, ts]) => ts.some(t => now - t < windowMs)));
    }
    return { allowed: true, retryAfterSec: 0 };
  };

  const reset = () => {
    hits = new Map();
  };

  return { check, reset };
};

const sessionLimiter = createRateLimiter(HOUR_MS, MAX_PER_WINDOW);
const healthLimiter = createRateLimiter(MINUTE_MS, HEALTH_MAX_PER_MINUTE);

export const HEALTH_MAX_PER_WINDOW = HEALTH_MAX_PER_MINUTE;

export const checkRateLimit = sessionLimiter.check;
export const checkHealthRateLimit = healthLimiter.check;

export const _resetRateLimitForTests = () => {
  sessionLimiter.reset();
  healthLimiter.reset();
};
