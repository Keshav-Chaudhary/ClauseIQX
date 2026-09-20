import * as crypto from 'crypto';

export interface SessionInfo {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  lastRotatedAt: number;
}

const DEFAULT_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Pluggable session store interface.
 * Follows the same abstraction pattern as ObjectStorage/LLMProvider.
 */
export interface SessionStoreInterface {
  createSession(userId: string, ttlMs?: number): string | Promise<string>;
  rotateSession(oldToken: string | undefined, userId: string, ttlMs?: number): string | Promise<string>;
  validateSession(token: string): Promise<{ userId: string } | null> | { userId: string } | null;
  revokeSession(token: string): boolean | Promise<boolean>;
  clear(): void | Promise<void>;
}

/**
 * In-memory secure session store supporting rotation and revocation.
 * Used as the default / test implementation.
 */
export class InMemorySessionStore implements SessionStoreInterface {
  private sessions = new Map<string, SessionInfo>();

  createSession(userId: string, ttlMs = DEFAULT_SESSION_TTL_MS): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    this.sessions.set(token, {
      token,
      userId,
      createdAt: now,
      expiresAt: now + ttlMs,
      lastRotatedAt: now,
    });
    return token;
  }

  /**
   * Session rotation on login (PRD FR-29 and TRD §4.1).
   * Revokes the old session token and issues a completely new one for the user.
   */
  rotateSession(oldToken: string | undefined, userId: string, ttlMs = DEFAULT_SESSION_TTL_MS): string {
    if (oldToken) {
      this.sessions.delete(oldToken);
    }
    return this.createSession(userId, ttlMs);
  }

  validateSession(token: string): { userId: string } | null {
    const session = this.sessions.get(token);
    if (!session) {
      return null;
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    return { userId: session.userId };
  }

  revokeSession(token: string): boolean {
    return this.sessions.delete(token);
  }

  clear(): void {
    this.sessions.clear();
  }
}

/**
 * Global session store instance.
 * Backwards-compatible: defaults to in-memory.
 * Use createSessionStore() from session-store-factory to get Redis-backed store.
 */
export const sessionStore: SessionStoreInterface = new InMemorySessionStore();

/**
 * Hashes password using PBKDF2 with crypto salt.
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verifies password against stored salt and hash using timing-safe comparison.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    const parts = storedHash.split(':');
    if (parts.length !== 2) {
      resolve(false);
      return;
    }

    const [salt, key] = parts;
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) {
        resolve(false);
        return;
      }
      const keyBuffer = Buffer.from(key, 'hex');
      if (keyBuffer.length !== derivedKey.length) {
        resolve(false);
        return;
      }
      resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
    });
  });
}
