/**
 * Redis-backed session store implementation.
 * Uses ioredis to persist sessions with automatic TTL expiry.
 * Falls back gracefully — use session-store-factory to select implementation.
 */
import type { SessionStoreInterface } from './auth';
export declare class RedisSessionStore implements SessionStoreInterface {
    private redis;
    constructor(redisUrl: string);
    createSession(userId: string, ttlMs?: number): Promise<string>;
    rotateSession(oldToken: string | undefined, userId: string, ttlMs?: number): Promise<string>;
    validateSession(token: string): Promise<{
        userId: string;
    } | null>;
    revokeSession(token: string): Promise<boolean>;
    clear(): Promise<void>;
}
//# sourceMappingURL=redis-session-store.d.ts.map