import { RateLimiterInterface } from './rate-limiter';
/**
 * Creates a rate limiter instance based on the provided Redis URL.
 * Falls back to in-memory implementation when no Redis URL is given.
 */
export declare function createRateLimiter(redisUrl?: string): RateLimiterInterface;
//# sourceMappingURL=rate-limiter-factory.d.ts.map