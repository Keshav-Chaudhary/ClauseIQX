"use strict";
/**
 * Factory for creating the appropriate session store implementation.
 * Returns Redis-backed store when REDIS_URL is provided, otherwise in-memory.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionStore = createSessionStore;
const auth_1 = require("./auth");
const redis_session_store_1 = require("./redis-session-store");
/**
 * Creates a session store instance based on the provided Redis URL.
 * Falls back to in-memory implementation when no Redis URL is given.
 */
function createSessionStore(redisUrl) {
    if (redisUrl) {
        return new redis_session_store_1.RedisSessionStore(redisUrl);
    }
    return new auth_1.InMemorySessionStore();
}
//# sourceMappingURL=session-store-factory.js.map