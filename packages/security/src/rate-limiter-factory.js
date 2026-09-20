"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimiter = createRateLimiter;
const rate_limiter_1 = require("./rate-limiter");
const redis_rate_limiter_1 = require("./redis-rate-limiter");
/**
 * Creates a rate limiter instance based on the provided Redis URL.
 * Falls back to in-memory implementation when no Redis URL is given.
 */
function createRateLimiter(redisUrl) {
    if (redisUrl) {
        return new redis_rate_limiter_1.RedisRateLimiter(redisUrl);
    }
    return new rate_limiter_1.InMemoryRateLimiter();
}
//# sourceMappingURL=rate-limiter-factory.js.map