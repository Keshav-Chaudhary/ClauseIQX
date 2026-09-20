"use strict";
/**
 * Redis-backed session store implementation.
 * Uses ioredis to persist sessions with automatic TTL expiry.
 * Falls back gracefully — use session-store-factory to select implementation.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisSessionStore = void 0;
const crypto = __importStar(require("crypto"));
const ioredis_1 = __importDefault(require("ioredis"));
const DEFAULT_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const KEY_PREFIX = 'clauseiqx:session:';
class RedisSessionStore {
    redis;
    constructor(redisUrl) {
        this.redis = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
    }
    async createSession(userId, ttlMs = DEFAULT_SESSION_TTL_MS) {
        const token = crypto.randomBytes(32).toString('hex');
        const now = Date.now();
        const session = {
            token,
            userId,
            createdAt: now,
            expiresAt: now + ttlMs,
            lastRotatedAt: now,
        };
        const ttlSeconds = Math.ceil(ttlMs / 1000);
        await this.redis.set(`${KEY_PREFIX}${token}`, JSON.stringify(session), 'EX', ttlSeconds);
        return token;
    }
    async rotateSession(oldToken, userId, ttlMs = DEFAULT_SESSION_TTL_MS) {
        if (oldToken) {
            await this.redis.del(`${KEY_PREFIX}${oldToken}`);
        }
        return this.createSession(userId, ttlMs);
    }
    async validateSession(token) {
        const data = await this.redis.get(`${KEY_PREFIX}${token}`);
        if (!data) {
            return null;
        }
        const session = JSON.parse(data);
        if (Date.now() > session.expiresAt) {
            await this.redis.del(`${KEY_PREFIX}${token}`);
            return null;
        }
        return { userId: session.userId };
    }
    async revokeSession(token) {
        const deleted = await this.redis.del(`${KEY_PREFIX}${token}`);
        return deleted > 0;
    }
    async clear() {
        // Use SCAN to safely delete all session keys without blocking
        let cursor = '0';
        do {
            const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', `${KEY_PREFIX}*`, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } while (cursor !== '0');
    }
}
exports.RedisSessionStore = RedisSessionStore;
//# sourceMappingURL=redis-session-store.js.map