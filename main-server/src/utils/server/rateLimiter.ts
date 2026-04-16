import { NextFunction, Request, Response } from "express";
import { getRedis } from "../redis/client";

/**
 * Sliding window rate limiter using Redis sorted sets.
 *
 * How it works:
 *   - Each request adds a timestamped entry to a sorted set
 *   - Old entries (outside the window) are pruned
 *   - If count > maxRequests, request is rejected with 429
 *   - TTL on the key auto-cleans idle keys
 *
 * Lua script makes it atomic — no race between ZREMRANGEBYSCORE + ZCARD + ZADD.
 *
 * Fail-open: if Redis is down, requests pass through.
 */

const SLIDING_WINDOW_SCRIPT = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local windowMs = tonumber(ARGV[2])
  local maxReqs = tonumber(ARGV[3])

  -- Remove entries older than the window
  redis.call("ZREMRANGEBYSCORE", key, 0, now - windowMs)

  -- Count remaining entries
  local count = redis.call("ZCARD", key)

  if count >= maxReqs then
    return 0
  end

  -- Add current request
  redis.call("ZADD", key, now, now .. "-" .. math.random(1000000))

  -- Set TTL so idle keys get cleaned up
  redis.call("PEXPIRE", key, windowMs)

  return 1
`;

interface RateLimitOptions {
  windowMs: number;     // time window in milliseconds
  maxRequests: number;  // max requests per window
  keyPrefix: string;    // prefix for the Redis key
  useUserId?: boolean;  // include userId in the key (for auth routes)
  bodyField?: string;   // include a request body field in the key (e.g. "identifier" for signin)
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyPrefix, useUserId = false, bodyField } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const redis = getRedis();

      // Build the key: prefix:IP[:userId][:bodyField]
      // - Public routes (signup): IP only
      // - Signin: IP + identifier (so shared WiFi doesn't block different users)
      // - Auth routes: IP + userId
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      let key = `rl:${keyPrefix}:${ip}`;
      if (useUserId && req.userId) {
        key += `:${req.userId}`;
      }
      if (bodyField && req.body?.[bodyField]) {
        key += `:${req.body[bodyField]}`;
      }

      const now = Date.now();
      const allowed = await redis.eval(
        SLIDING_WINDOW_SCRIPT,
        1,
        key,
        now.toString(),
        windowMs.toString(),
        maxRequests.toString(),
      );

      if (allowed === 0) {
        return res.status(429).json({
          success: false,
          msg: "Too many requests. Please try again later.",
        });
      }

      next();
    } catch (error) {
      // Fail-open: if Redis is down, let the request through
      console.error("[rateLimit] Redis error, failing open:", error);
      next();
    }
  };
}
