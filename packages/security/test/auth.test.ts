import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  sessionStore,
} from '../src/auth';

describe('Authentication & Session Security (PRD FR-29 & TRD §4.1)', () => {
  beforeEach(() => {
    sessionStore.clear();
  });

  describe('Password Hashing & Verification', () => {
    it('hashes passwords with unique random salts', async () => {
      const password = 'SecurePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts
      expect(hash1).toContain(':');
    });

    it('verifies correct passwords and rejects incorrect passwords', async () => {
      const password = 'CorrectHorseBatteryStaple1!';
      const hash = await hashPassword(password);

      const isCorrect = await verifyPassword(password, hash);
      expect(isCorrect).toBe(true);

      const isWrong = await verifyPassword('WrongPassword1!', hash);
      expect(isWrong).toBe(false);
    });

    it('handles malformed hash strings safely without crashing', async () => {
      expect(await verifyPassword('test', 'malformed-hash-without-salt')).toBe(false);
    });
  });

  describe('Session Management & Session Rotation', () => {
    it('creates, validates, and revokes sessions', () => {
      const token = sessionStore.createSession('user-123');
      expect(token).toHaveLength(64); // 32 bytes in hex

      const validated = sessionStore.validateSession(token);
      expect(validated).not.toBeNull();
      expect(validated?.userId).toBe('user-123');

      // Revocation
      expect(sessionStore.revokeSession(token)).toBe(true);
      expect(sessionStore.validateSession(token)).toBeNull();
    });

    it('rotates sessions on login, invalidating the old session token (PRD FR-29)', () => {
      const oldToken = sessionStore.createSession('user-456');
      expect(sessionStore.validateSession(oldToken)).not.toBeNull();

      // Rotate session on new login
      const newToken = sessionStore.rotateSession(oldToken, 'user-456');
      expect(newToken).not.toBe(oldToken);

      // Old session is immediately invalid
      expect(sessionStore.validateSession(oldToken)).toBeNull();

      // New session is valid
      const newSession = sessionStore.validateSession(newToken);
      expect(newSession?.userId).toBe('user-456');
    });

    it('rejects expired sessions', () => {
      // Create session with negative TTL (already expired)
      const token = sessionStore.createSession('user-789', -1000);
      expect(sessionStore.validateSession(token)).toBeNull();
    });
  });
});
