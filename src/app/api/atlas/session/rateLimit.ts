// Three sessions per rolling hour per IP. In-memory on purpose: the site runs
// as one PM2 process; a restart resets the counter, which is acceptable for an
// abuse brake (the worker has its own concurrency and daily caps behind this).
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 3;
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
