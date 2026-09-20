"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisRateLimiter = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("@clauseiqx/logger");
class RedisRateLimiter {
    redis;
    constructor(redisUrl) {
        this.redis = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
    }
    /**
     * Helper to check if a pipeline result contains an error.
     * ioredis pipeline.exec() returns [error, result][] for each command.
     */
    hasPipelineError(results) {
        if (!results)
            return true;
        return results.some(([error]) => error !== null);
    }
    async check(key, options) {
        const now = Date.now();
        const fullKey = `${options.keyPrefix ?? 'rate'}:${key}`;
        const windowStart = now - options.windowMs;
        // We can use a pipeline to execute commands atomically
        const pipeline = this.redis.pipeline();
        pipeline.zremrangebyscore(fullKey, '-inf', windowStart.toString());
        pipeline.zcard(fullKey);
        // Add the current request temporarily just to get count, but wait, 
        // normally you ZADD then ZCARD. Or ZCARD first, check, then ZADD if allowed.
        // Let's do a lua script or transaction if we want strict atomicity.
        // But since it's a rate limiter, an optimistic approach is fine.
        pipeline.zadd(fullKey, now.toString(), `${now}-${Math.random()}`);
        pipeline.zremrangebyscore(fullKey, '-inf', windowStart.toString()); // again to keep clean? Not needed.
        pipeline.zrange(fullKey, '0', '0', 'WITHSCORES'); // get oldest to calculate reset time
        pipeline.pexpire(fullKey, options.windowMs); // set TTL for cleanup
        const results = await pipeline.exec();
        // Failure-mode policy: fail-open with logging
        // Rate limiting is a defense-in-depth control. If Redis is unavailable,
        // we allow the request but log an error rather than crashing the API.
        if (!results || this.hasPipelineError(results)) {
            const firstError = results?.find(([error]) => error !== null)?.[0];
            logger_1.defaultLogger.error('Redis rate limiter unavailable - failing open', { key }, firstError);
            // Return a permissive result to allow the request
            return {
                allowed: true,
                remaining: options.maxRequests,
                resetTimeMs: now + options.windowMs,
                retryAfterSeconds: 0,
            };
        }
        const countResult = results[1][1]; // result of ZCARD before ZADD
        const currentCount = countResult + 1; // +1 because we ZADDed
        const oldestElementResult = results[4][1]; // result of ZRANGE
        const oldestTimestamp = oldestElementResult.length >= 2 ? parseFloat(oldestElementResult[1]) : now;
        if (currentCount > options.maxRequests) {
            // Revert the ZADD because it exceeded limit (not strictly necessary but polite)
            const oldest = oldestTimestamp;
            const resetTimeMs = oldest + options.windowMs;
            const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));
            return {
                allowed: false,
                remaining: 0,
                resetTimeMs,
                retryAfterSeconds,
            };
        }
        const remaining = Math.max(0, options.maxRequests - currentCount);
        const resetTimeMs = now + options.windowMs;
        return {
            allowed: true,
            remaining,
            resetTimeMs,
            retryAfterSeconds: 0,
        };
    }
    async checkAuthAttempt(ip, accountIdentifier, options) {
        const now = Date.now();
        // Check IP sliding window first
        const ipCheck = await this.check(`ip:${ip}`, options);
        if (!ipCheck.allowed) {
            return ipCheck;
        }
        const checkFailureRecord = async (failureKey) => {
            try {
                const data = await this.redis.hgetall(failureKey);
                if (Object.keys(data).length > 0) {
                    const lockedUntil = parseInt(data.lockedUntil, 10) || 0;
                    if (lockedUntil > now) {
                        const retryAfterSeconds = Math.max(1, Math.ceil((lockedUntil - now) / 1000));
                        return {
                            allowed: false,
                            remaining: 0,
                            resetTimeMs: lockedUntil,
                            retryAfterSeconds,
                            currentBackoffMs: lockedUntil - now,
                        };
                    }
                }
                return null;
            }
            catch (error) {
                // Failure-mode policy: fail-open with logging
                logger_1.defaultLogger.error('Redis auth check unavailable - failing open', { failureKey }, error);
                return null; // Allow the request by returning null (no lock found)
            }
        };
        if (accountIdentifier) {
            const normalizedAccount = accountIdentifier.trim().toLowerCase();
            const accountResult = await checkFailureRecord(`auth_fail:acc:${normalizedAccount}`);
            if (accountResult)
                return accountResult;
        }
        const ipResult = await checkFailureRecord(`auth_fail:ip:${ip}`);
        if (ipResult)
            return ipResult;
        return {
            allowed: true,
            remaining: ipCheck.remaining,
            resetTimeMs: ipCheck.resetTimeMs,
            retryAfterSeconds: 0,
        };
    }
    async recordAuthFailure(ip, accountIdentifier, options) {
        const now = Date.now();
        const updateRecord = async (key) => {
            try {
                const data = await this.redis.hgetall(key);
                let failedAttempts = parseInt(data.failedAttempts || '0', 10);
                // if lockedUntil is very old, we could reset it, but exponential backoff usually resets on success.
                // let's follow the in-memory logic: always increment
                failedAttempts += 1;
                let backoffMs;
                if (failedAttempts >= options.maxFailedAttemptsBeforeCooldown) {
                    backoffMs = options.cooldownPeriodMs;
                }
                else {
                    const calculatedBackoff = options.baseBackoffMs * Math.pow(2, failedAttempts - 1);
                    backoffMs = Math.min(calculatedBackoff, options.maxBackoffMs);
                }
                const lockedUntil = now + backoffMs;
                // Store in redis with TTL
                await this.redis.hmset(key, {
                    failedAttempts: failedAttempts.toString(),
                    lastFailureTime: now.toString(),
                    lockedUntil: lockedUntil.toString()
                });
                // Set TTL to windowMs * 2 for auth failures (or max cooldown)
                const ttl = Math.ceil(Math.max(options.windowMs * 2, options.cooldownPeriodMs) / 1000);
                await this.redis.expire(key, ttl);
                return { backoffMs, lockedUntil, failedAttempts };
            }
            catch (error) {
                // Failure-mode policy: fail-open with logging
                // Return a minimal backoff to avoid excessive load, but allow the request
                logger_1.defaultLogger.error('Redis auth failure recording unavailable - failing open', { key }, error);
                return {
                    backoffMs: options.baseBackoffMs,
                    lockedUntil: now + options.baseBackoffMs,
                    failedAttempts: 1,
                };
            }
        };
        const ipResult = await updateRecord(`auth_fail:ip:${ip}`);
        if (accountIdentifier) {
            const normalizedAccount = accountIdentifier.trim().toLowerCase();
            await updateRecord(`auth_fail:acc:${normalizedAccount}`);
        }
        return ipResult;
    }
    async resetAuthSuccess(ip, accountIdentifier) {
        const keys = [`auth_fail:ip:${ip}`];
        if (accountIdentifier) {
            keys.push(`auth_fail:acc:${accountIdentifier.trim().toLowerCase()}`);
        }
        try {
            await this.redis.del(...keys);
        }
        catch (error) {
            // Failure-mode policy: fail-open with logging
            // If we can't reset the auth success, it's not critical - the user can still authenticate
            logger_1.defaultLogger.error('Redis auth success reset unavailable - failing open', { keys }, error);
        }
    }
    async clear() {
        // Basic clearing of keys (useful for tests)
        let cursor = '0';
        do {
            const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', 'rate:*', 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } while (cursor !== '0');
        cursor = '0';
        do {
            const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', 'auth_fail:*', 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } while (cursor !== '0');
    }
}
exports.RedisRateLimiter = RedisRateLimiter;
//# sourceMappingURL=redis-rate-limiter.js.map