/**
 * Factory for creating the appropriate session store implementation.
 * Returns Redis-backed store when REDIS_URL is provided, otherwise in-memory.
 */

import { SessionStoreInterface, InMemorySessionStore } from './auth';
import { RedisSessionStore } from './redis-session-store';

/**
 * Creates a session store instance based on the provided Redis URL.
 * Falls back to in-memory implementation when no Redis URL is given.
 */
export function createSessionStore(redisUrl?: string): SessionStoreInterface {
  if (redisUrl) {
    return new RedisSessionStore(redisUrl);
  }
  return new InMemorySessionStore();
}
