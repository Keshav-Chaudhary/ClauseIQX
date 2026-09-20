import { RateLimiterInterface, InMemoryRateLimiter } from './rate-limiter';
import { RedisRateLimiter } from './redis-rate-limiter';

/**
 * Creates a rate limiter instance based on the provided Redis URL.
 * Falls back to in-memory implementation when no Redis URL is given.
 */
export function createRateLimiter(redisUrl?: string): RateLimiterInterface {
  if (redisUrl) {
    return new RedisRateLimiter(redisUrl);
  }
  return new InMemoryRateLimiter();
}
