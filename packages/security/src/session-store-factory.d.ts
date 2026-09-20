/**
 * Factory for creating the appropriate session store implementation.
 * Returns Redis-backed store when REDIS_URL is provided, otherwise in-memory.
 */
import { SessionStoreInterface } from './auth';
/**
 * Creates a session store instance based on the provided Redis URL.
 * Falls back to in-memory implementation when no Redis URL is given.
 */
export declare function createSessionStore(redisUrl?: string): SessionStoreInterface;
//# sourceMappingURL=session-store-factory.d.ts.map