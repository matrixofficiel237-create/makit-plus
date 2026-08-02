import { createHmac, timingSafeEqual } from "crypto";

/**
 * Issue and verify a time-bounded per-user AI token.
 *
 * Token = HMAC-SHA256(userId + ':' + dailyBucket, SESSION_SECRET)
 * where dailyBucket = floor(Date.now() / 86400000).
 *
 * Tokens naturally expire at UTC midnight each day.
 * verifyAiToken accepts the current day's AND previous day's token to
 * handle edge cases where the token was issued just before midnight.
 */
function getSecret(): string {
  const s = process.env["SESSION_SECRET"];
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function currentDayBucket(): number {
  return Math.floor(Date.now() / 86_400_000);
}

function hmacForBucket(userId: string, bucket: number): string {
  return createHmac("sha256", getSecret())
    .update(`${userId}:${bucket}`)
    .digest("hex");
}

/** Returns a token valid for the current UTC day. */
export function signAiToken(userId: string): string {
  return hmacForBucket(userId, currentDayBucket());
}

/**
 * Returns true if the token is valid for the given userId (current or previous day).
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyAiToken(userId: string, token: string): boolean {
  const bucket = currentDayBucket();
  const candidates = [
    hmacForBucket(userId, bucket),
    hmacForBucket(userId, bucket - 1),
  ];
  for (const expected of candidates) {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(token.length === expected.length ? token : "", "hex");
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}
