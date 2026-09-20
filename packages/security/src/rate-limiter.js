"use strict";
/**
 * Multi-Tiered Rate Limiter with Exponential Backoff
 * Meets security requirements for auth, public, and authenticated routes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = exports.InMemoryRateLimiter = void 0;
/**
 * In-memory sliding window rate limiter with account + IP dual-key tracking
 * and progressive exponential backoff for failed authentication attempts.
 */
class InMemoryRateLimiter {
    requests = new Map();
    authFailures = new Map();
    /**
     * Cleans up expired entries periodically to prevent memory growth.
     */
    cleanup(now, windowMs) {
        for (const [key, record] of this.requests.entries()) {
            record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
            if (record.timestamps.length === 0) {
                this.requests.delete(key);
            }
        }
        for (const [key, record] of this.authFailures.entries()) {
            if (now > record.lockedUntil && now - record.lastFailureTime > windowMs * 2) {
                this.authFailures.delete(key);
            }
        }
    }
    /**
     * Standard sliding-window rate limit check.
     */
    check(key, options) {
        const now = Date.now();
        this.cleanup(now, options.windowMs);
        const fullKey = `${options.keyPrefix ?? 'rate'}:${key}`;
        const record = this.requests.get(fullKey) ?? { timestamps: [] };
        // Filter to timestamps within current sliding window
        record.timestamps = record.timestamps.filter((ts) => now - ts < options.windowMs);
        if (record.timestamps.length >= options.maxRequests) {
            const oldest = record.timestamps[0];
            const resetTimeMs = oldest + options.windowMs;
            const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));
            return {
                allowed: false,
                remaining: 0,
                resetTimeMs,
                retryAfterSeconds,
            };
        }
        // Record this request
        record.timestamps.push(now);
        this.requests.set(fullKey, record);
        const remaining = options.maxRequests - record.timestamps.length;
        const resetTimeMs = now + options.windowMs;
        return {
            allowed: true,
            remaining,
            resetTimeMs,
            retryAfterSeconds: 0,
        };
    }
    /**
     * Checks whether an authentication request is currently throttled by
     * exponential backoff or cooldown.
     */
    checkAuthAttempt(ip, accountIdentifier, options) {
        const now = Date.now();
        this.cleanup(now, options.windowMs);
        // Check IP sliding window first
        const ipCheck = this.check(`ip:${ip}`, options);
        if (!ipCheck.allowed) {
            return ipCheck;
        }
        // Check account identifier if provided (e.g., lowercase email)
        if (accountIdentifier) {
            const normalizedAccount = accountIdentifier.trim().toLowerCase();
            const failureKey = `auth_fail:acc:${normalizedAccount}`;
            const failRecord = this.authFailures.get(failureKey);
            if (failRecord && failRecord.lockedUntil > now) {
                const retryAfterSeconds = Math.max(1, Math.ceil((failRecord.lockedUntil - now) / 1000));
                return {
                    allowed: false,
                    remaining: 0,
                    resetTimeMs: failRecord.lockedUntil,
                    retryAfterSeconds,
                    currentBackoffMs: failRecord.lockedUntil - now,
                };
            }
        }
        // Also check IP failure record
        const ipFailureKey = `auth_fail:ip:${ip}`;
        const ipFailRecord = this.authFailures.get(ipFailureKey);
        if (ipFailRecord && ipFailRecord.lockedUntil > now) {
            const retryAfterSeconds = Math.max(1, Math.ceil((ipFailRecord.lockedUntil - now) / 1000));
            return {
                allowed: false,
                remaining: 0,
                resetTimeMs: ipFailRecord.lockedUntil,
                retryAfterSeconds,
                currentBackoffMs: ipFailRecord.lockedUntil - now,
            };
        }
        return {
            allowed: true,
            remaining: ipCheck.remaining,
            resetTimeMs: ipCheck.resetTimeMs,
            retryAfterSeconds: 0,
        };
    }
    /**
     * Records a failed authentication attempt and calculates progressive exponential backoff.
     * delay = baseBackoff * 2^(failedAttempts - 1)
     */
    recordAuthFailure(ip, accountIdentifier, options) {
        const now = Date.now();
        const updateRecord = (key) => {
            const existing = this.authFailures.get(key) ?? {
                failedAttempts: 0,
                lastFailureTime: now,
                lockedUntil: 0,
            };
            existing.failedAttempts += 1;
            existing.lastFailureTime = now;
            let backoffMs;
            if (existing.failedAttempts >= options.maxFailedAttemptsBeforeCooldown) {
                backoffMs = options.cooldownPeriodMs;
            }
            else {
                // Exponential backoff calculation
                const calculatedBackoff = options.baseBackoffMs * Math.pow(2, existing.failedAttempts - 1);
                backoffMs = Math.min(calculatedBackoff, options.maxBackoffMs);
            }
            existing.lockedUntil = now + backoffMs;
            this.authFailures.set(key, existing);
            return {
                backoffMs,
                lockedUntil: existing.lockedUntil,
                failedAttempts: existing.failedAttempts,
            };
        };
        // Update IP failure record
        const ipResult = updateRecord(`auth_fail:ip:${ip}`);
        // Update account failure record if account provided
        if (accountIdentifier) {
            const normalizedAccount = accountIdentifier.trim().toLowerCase();
            updateRecord(`auth_fail:acc:${normalizedAccount}`);
        }
        return ipResult;
    }
    /**
     * Resets failed attempt counter on successful login.
     */
    resetAuthSuccess(ip, accountIdentifier) {
        this.authFailures.delete(`auth_fail:ip:${ip}`);
        if (accountIdentifier) {
            const normalizedAccount = accountIdentifier.trim().toLowerCase();
            this.authFailures.delete(`auth_fail:acc:${normalizedAccount}`);
        }
    }
    /**
     * Clears all tracking records (primarily for testing).
     */
    clear() {
        this.requests.clear();
        this.authFailures.clear();
    }
}
exports.InMemoryRateLimiter = InMemoryRateLimiter;
exports.RateLimiter = InMemoryRateLimiter;
//# sourceMappingURL=rate-limiter.js.map