// Which proxy writes which header, and why the LAST forwarded entry is the one
// we trust. Shared by every Atlas route, because getting this wrong in one of
// them is enough: the value decides both the rate-limit bucket and the address
// the consent record is hashed from.
//
//   * `x-real-ip` — set by OUR nginx from the TCP peer address it sees. A
//     client cannot forge it, because nginx overwrites whatever arrived. First
//     choice, always.
//   * `x-forwarded-for` — each proxy APPENDS to this list, so a value the
//     client invented sits at the FRONT and our own edge's entry is at the
//     BACK. Reading the leftmost entry (the usual mistake) lets anyone pick
//     their own rate-limit bucket and forge the consent IP; the last entry is
//     the only one written by infrastructure we control.
//   * neither — a direct hit (curl on localhost, a test). We bucket those under
//     the literal 'unknown' so the limiter still counts them and the consent
//     digest is never the hash of an empty string.
export const UNKNOWN_IP = 'unknown';

export const clientIp = (req: Request): string => {
  const realIp = req.headers.get('x-real-ip')?.trim();

  if (realIp) {
    return realIp;
  }

  const forwarded = req.headers.get('x-forwarded-for')?.split(',') ?? [];

  return forwarded[forwarded.length - 1]?.trim() || UNKNOWN_IP;
};
