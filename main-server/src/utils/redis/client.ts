import Redis from 'ioredis';
import { envs } from '../../configs';

let redis: Redis | null = null;

export const getRedis = (): Redis => {
  if (!redis) {
    redis = new Redis(envs.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        // exponential backoff: 200ms, 400ms, 800ms… capped at 5s
        return Math.min(times * 200, 5000);
      },
    });

    redis.on('connect', () => console.log('[redis] connected'));
    redis.on('error', (err) => console.error('[redis] error:', err.message));
  }

  return redis;
};
