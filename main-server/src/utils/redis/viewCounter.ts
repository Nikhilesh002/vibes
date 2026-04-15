import { getRedis } from './client';

/**
 * Lua script: atomic check-and-increment for deduplicated views.
 *
 * KEYS[1] = dedup key   e.g. "view:{videoId}:{userId}"
 * ARGV[1] = TTL seconds e.g. 86400 (24 hours)
 *
 * Returns:
 *   1 = new view (key was set, caller should increment MongoDB)
 *   0 = duplicate (key already existed, skip increment)
 *
 * Using SET NX (set-if-not-exists) + EX (expiry) in a single atomic
 * operation — no race condition possible.
 */
const DEDUP_VIEW_SCRIPT = `
  local key = KEYS[1]
  local ttl = tonumber(ARGV[1])
  local result = redis.call("SET", key, "1", "NX", "EX", ttl)
  if result then
    return 1
  end
  return 0
`;

const VIEW_TTL_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * Returns true if this is a NEW view (should increment the counter).
 * Returns false if the user already viewed this video within 24 hours.
 *
 * On Redis failure, returns true (fail-open) so views still count
 * even if Redis is down — slightly inflated views is better than
 * completely broken view counts.
 */
export async function recordView(
  videoId: string,
  userId: string,
): Promise<boolean> {
  try {
    const redis = getRedis();
    const key = `view:${videoId}:${userId}`;

    const result = await redis.eval(
      DEDUP_VIEW_SCRIPT,
      1,
      key,
      VIEW_TTL_SECONDS.toString(),
    );

    return result === 1;
  } catch (error) {
    console.error('[viewCounter] Redis error, failing open:', error);
    return true;
  }
}
