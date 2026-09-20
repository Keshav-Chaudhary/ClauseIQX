/**
 * Redis-backed sliding-window rate limiter.
 * Uses sorted sets for sliding window and simple keys for auth tracking.
 */
import type { RateLimiterInterface, RateLimiterOptions, AuthRateLimiterOptions, RateLimitResult } from './rate-limiter';
export declare class RedisRateLimiter implements RateLimiterInterface {
    private redis;
    constructor(redisUrl: string);
    /**
     * Helper to check if a pipeline result contains an error.
     * ioredis pipeline.exec() returns [error, result][] for each command.
     */
    private hasPipelineError;
    check(key: string, options: RateLimiterOptions): Promise<RateLimitResult>;
    checkAuthAttempt(ip: string, accountIdentifier: string | undefined, options: AuthRateLimiterOptions): Promise<RateLimitResult>;
    recordAuthFailure(ip: string, accountIdentifier: string | undefined, options: AuthRateLimiterOptions): Promise<{
        backoffMs: number;
        lockedUntil: number;
        failedAttempts: number;
    }>;
    resetAuthSuccess(ip: string, accountIdentifier: string | undefined): Promise<void>;
    clear(): Promise<void>;
}
//# sourceMappingURL=redis-rate-limiter.d.ts.map