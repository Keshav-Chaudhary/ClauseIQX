/**
 * Multi-Tiered Rate Limiter with Exponential Backoff
 * Meets security requirements for auth, public, and authenticated routes.
 */
export interface RateLimiterOptions {
    windowMs: number;
    maxRequests: number;
    keyPrefix?: string;
}
export interface AuthRateLimiterOptions extends RateLimiterOptions {
    baseBackoffMs: number;
    maxBackoffMs: number;
    maxFailedAttemptsBeforeCooldown: number;
    cooldownPeriodMs: number;
}
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTimeMs: number;
    retryAfterSeconds: number;
    currentBackoffMs?: number;
}
export interface RateLimiterInterface {
    check(key: string, options: RateLimiterOptions): RateLimitResult | Promise<RateLimitResult>;
    checkAuthAttempt(ip: string, accountIdentifier: string | undefined, options: AuthRateLimiterOptions): RateLimitResult | Promise<RateLimitResult>;
    recordAuthFailure(ip: string, accountIdentifier: string | undefined, options: AuthRateLimiterOptions): {
        backoffMs: number;
        lockedUntil: number;
        failedAttempts: number;
    } | Promise<{
        backoffMs: number;
        lockedUntil: number;
        failedAttempts: number;
    }>;
    resetAuthSuccess(ip: string, accountIdentifier: string | undefined): void | Promise<void>;
    clear(): void | Promise<void>;
}
/**
 * In-memory sliding window rate limiter with account + IP dual-key tracking
 * and progressive exponential backoff for failed authentication attempts.
 */
export declare class InMemoryRateLimiter implements RateLimiterInterface {
    private requests;
    private authFailures;
    /**
     * Cleans up expired entries periodically to prevent memory growth.
     */
    private cleanup;
    /**
     * Standard sliding-window rate limit check.
     */
    check(key: string, options: RateLimiterOptions): RateLimitResult;
    /**
     * Checks whether an authentication request is currently throttled by
     * exponential backoff or cooldown.
     */
    checkAuthAttempt(ip: string, accountIdentifier: string | undefined, options: AuthRateLimiterOptions): RateLimitResult;
    /**
     * Records a failed authentication attempt and calculates progressive exponential backoff.
     * delay = baseBackoff * 2^(failedAttempts - 1)
     */
    recordAuthFailure(ip: string, accountIdentifier: string | undefined, options: AuthRateLimiterOptions): {
        backoffMs: number;
        lockedUntil: number;
        failedAttempts: number;
    };
    /**
     * Resets failed attempt counter on successful login.
     */
    resetAuthSuccess(ip: string, accountIdentifier: string | undefined): void;
    /**
     * Clears all tracking records (primarily for testing).
     */
    clear(): void;
}
export declare const RateLimiter: typeof InMemoryRateLimiter;
//# sourceMappingURL=rate-limiter.d.ts.map