/**
 * Redis-backed session store implementation.
 * Uses ioredis to persist sessions with automatic TTL expiry.
 * Falls back gracefully — use session-store-factory to select implementation.
 */

import * as crypto from 'crypto';
import type { SessionStoreInterface, SessionInfo } from './auth';
import Redis from 'ioredis';

const DEFAULT_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const KEY_PREFIX = 'clauseiqx:session:';

export class RedisSessionStore implements SessionStoreInterface {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  async createSession(userId: string, ttlMs = DEFAULT_SESSION_TTL_MS): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const session: SessionInfo = {
      token,
      userId,
      createdAt: now,
      expiresAt: now + ttlMs,
      lastRotatedAt: now,
    };

    const ttlSeconds = Math.ceil(ttlMs / 1000);
    await this.redis.set(
      `${KEY_PREFIX}${token}`,
      JSON.stringify(session),
      'EX',
      ttlSeconds
    );

    return token;
  }

  async rotateSession(oldToken: string | undefined, userId: string, ttlMs = DEFAULT_SESSION_TTL_MS): Promise<string> {
    if (oldToken) {
      await this.redis.del(`${KEY_PREFIX}${oldToken}`);
    }
    return this.createSession(userId, ttlMs);
  }

  async validateSession(token: string): Promise<{ userId: string } | null> {
    const data = await this.redis.get(`${KEY_PREFIX}${token}`);
    if (!data) {
      return null;
    }

    const session: SessionInfo = JSON.parse(data);
    if (Date.now() > session.expiresAt) {
      await this.redis.del(`${KEY_PREFIX}${token}`);
      return null;
    }

    return { userId: session.userId };
  }

  async revokeSession(token: string): Promise<boolean> {
    const deleted = await this.redis.del(`${KEY_PREFIX}${token}`);
    return deleted > 0;
  }

  async clear(): Promise<void> {
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
