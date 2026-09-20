import { describe, expect, it } from 'vitest';
import {
  InMemorySessionStore,
  InMemoryRateLimiter,
  hashPassword,
  verifyPassword,
  createNotFoundOrForbiddenError,
  createUnauthorizedError,
  createValidationError,
  createRateLimitError,
  sanitizeErrorMessage,
} from '@clauseiqx/security';

describe('Multi-Tenant Isolation & Authentication Extended Suite', () => {
  describe('Session Store Security & Rotation Lifecycle', () => {
    it('generates high-entropy 64-character hex session tokens', () => {
      const store = new InMemorySessionStore();
      const token1 = store.createSession('usr-1');
      const token2 = store.createSession('usr-1');
      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    it('returns userId for active valid session', () => {
      const store = new InMemorySessionStore();
      const token = store.createSession('usr-tenant-alpha');
      const session = store.validateSession(token);
      expect(session?.userId).toBe('usr-tenant-alpha');
    });

    it('returns null for non-existent session token', () => {
      const store = new InMemorySessionStore();
      expect(store.validateSession('0000000000000000000000000000000000000000000000000000000000000000')).toBeNull();
    });

    it('enforces TTL expiration on sessions', async () => {
      const store = new InMemorySessionStore();
      const token = store.createSession('usr-expiring', 30); // 30ms TTL
      expect(store.validateSession(token)).not.toBeNull();

      await new Promise((resolve) => setTimeout(resolve, 40));
      expect(store.validateSession(token)).toBeNull();
    });

    it('rotates session token and revokes previous token atomically', () => {
      const store = new InMemorySessionStore();
      const initialToken = store.createSession('usr-tenant-beta');
      const newToken = store.rotateSession(initialToken, 'usr-tenant-beta');

      expect(newToken).not.toBe(initialToken);
      expect(store.validateSession(initialToken)).toBeNull();
      expect(store.validateSession(newToken)?.userId).toBe('usr-tenant-beta');
    });

    it('allows rotating with undefined old token by creating fresh session', () => {
      const store = new InMemorySessionStore();
      const newToken = store.rotateSession(undefined, 'usr-fresh');
      expect(store.validateSession(newToken)?.userId).toBe('usr-fresh');
    });

    it('revokes session immediately upon logout', () => {
      const store = new InMemorySessionStore();
      const token = store.createSession('usr-logout');
      const revoked = store.revokeSession(token);
      expect(revoked).toBe(true);
      expect(store.validateSession(token)).toBeNull();
    });

    it('returns false when revoking non-existent session', () => {
      const store = new InMemorySessionStore();
      expect(store.revokeSession('non-existent')).toBe(false);
    });

    it('clears all active sessions on store reset', () => {
      const store = new InMemorySessionStore();
      const t1 = store.createSession('u1');
      const t2 = store.createSession('u2');
      store.clear();
      expect(store.validateSession(t1)).toBeNull();
      expect(store.validateSession(t2)).toBeNull();
    });
  });

  describe('Progressive Rate Limiting & Auth Failure Backoff', () => {
    const authOptions = {
      windowMs: 60000,
      maxRequests: 10,
      baseBackoffMs: 200,
      maxBackoffMs: 5000,
      maxFailedAttemptsBeforeCooldown: 3,
      cooldownPeriodMs: 500,
    };

    it('permits initial authentication attempts within limits', () => {
      const limiter = new InMemoryRateLimiter();
      const result = limiter.checkAuthAttempt('10.0.0.1', 'user@domain.com', authOptions);
      expect(result.allowed).toBe(true);
    });

    it('records failed authentication attempts and computes progressive backoff', () => {
      const limiter = new InMemoryRateLimiter();
      const ip = '10.0.0.2';
      const acct = 'counsel@corp.com';

      const fail1 = limiter.recordAuthFailure(ip, acct, authOptions);
      expect(fail1.failedAttempts).toBe(1);
      expect(fail1.backoffMs).toBe(200);

      const fail2 = limiter.recordAuthFailure(ip, acct, authOptions);
      expect(fail2.failedAttempts).toBe(2);
      expect(fail2.backoffMs).toBe(400);

      const fail3 = limiter.recordAuthFailure(ip, acct, authOptions);
      expect(fail3.failedAttempts).toBe(3);
      expect(fail3.backoffMs).toBe(500); // Hits cooldownPeriodMs
      expect(fail3.lockedUntil).toBeGreaterThan(Date.now());
    });

    it('enforces lockout cooldown after exceeding maximum failed attempts', () => {
      const limiter = new InMemoryRateLimiter();
      const ip = '10.0.0.3';
      const acct = 'target@victim.com';

      limiter.recordAuthFailure(ip, acct, authOptions);
      limiter.recordAuthFailure(ip, acct, authOptions);
      limiter.recordAuthFailure(ip, acct, authOptions);

      // Subsequent attempt must be blocked
      const check = limiter.checkAuthAttempt(ip, acct, authOptions);
      expect(check.allowed).toBe(false);
      expect(check.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('resets failed attempt counter upon successful login', () => {
      const limiter = new InMemoryRateLimiter();
      const ip = '10.0.0.4';
      const acct = 'partner@law.com';

      limiter.recordAuthFailure(ip, acct, authOptions);
      limiter.recordAuthFailure(ip, acct, authOptions);

      limiter.resetAuthSuccess(ip, acct);

      const check = limiter.checkAuthAttempt(ip, acct, authOptions);
      expect(check.allowed).toBe(true);
    });

    it('isolates rate limiting between different client IP addresses', () => {
      const limiter = new InMemoryRateLimiter();
      const options = { windowMs: 10000, maxRequests: 2 };

      limiter.check('ip-alpha', options);
      limiter.check('ip-alpha', options);
      expect(limiter.check('ip-alpha', options).allowed).toBe(false);

      // Different IP must still be allowed
      expect(limiter.check('ip-beta', options).allowed).toBe(true);
    });
  });

  describe('Password Security & Cryptographic Salting', () => {
    it('produces unique hashes for identical passwords due to salt generation', async () => {
      const pwd = 'EqualPassword#2026';
      const hash1 = await hashPassword(pwd);
      const hash2 = await hashPassword(pwd);

      expect(hash1).not.toBe(hash2);
      expect(await verifyPassword(pwd, hash1)).toBe(true);
      expect(await verifyPassword(pwd, hash2)).toBe(true);
    });

    it('rejects passwords with subtle character case differences', async () => {
      const hash = await hashPassword('SecretLegalPass');
      expect(await verifyPassword('secretlegalpass', hash)).toBe(false);
      expect(await verifyPassword('SECRETLEGALPASS', hash)).toBe(false);
    });

    it('handles unicode and special legal symbol passwords securely', async () => {
      const unicodePwd = 'Clause§14.1¶Indemnity€99,000!';
      const hash = await hashPassword(unicodePwd);
      expect(await verifyPassword(unicodePwd, hash)).toBe(true);
    });
  });

  describe('Non-Enumerating Error Sanitization (02_TRD.md §7)', () => {
    const resourceTypes = [
      'Project',
      'Document',
      'Version',
      'Analysis',
      'Conversation',
      'Comparison',
      'Export',
      'Job',
    ];

    resourceTypes.forEach((resType) => {
      it(`returns non-enumerating 404 for unauthorized or non-existent ${resType}`, () => {
        const reqId = `req-test-${resType.toLowerCase()}`;
        const err = createNotFoundOrForbiddenError(resType, reqId);
        expect(err.statusCode).toBe(404);
        expect(err.payload.error.code).toBe('RESOURCE_NOT_FOUND');
        expect(err.payload.error.message).toContain(resType.toLowerCase());
        expect(err.payload.error.request_id).toBe(reqId);
      });
    });

    it('formats 401 unauthorized error with consistent envelope', () => {
      const err = createUnauthorizedError('req-unauth-1');
      expect(err.statusCode).toBe(401);
      expect(err.payload.error.code).toBe('UNAUTHORIZED');
      expect(err.payload.error.request_id).toBe('req-unauth-1');
    });

    it('formats 400 validation error with specific message and request ID', () => {
      const err = createValidationError('readingLevel must be simple or detailed', 'req-val-1');
      expect(err.statusCode).toBe(400);
      expect(err.payload.error.code).toBe('VALIDATION_FAILED');
      expect(err.payload.error.message).toContain('readingLevel');
      expect(err.payload.error.request_id).toBe('req-val-1');
    });

    it('formats 429 rate limit error with retry-after header', () => {
      const err = createRateLimitError(15, 'req-429-1');
      expect(err.statusCode).toBe(429);
      expect(err.retryAfterSeconds).toBe(15);
      expect(err.payload.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(err.payload.error.message).toContain('15 seconds');
    });

    it('sanitizes internal filesystem paths to prevent information leakage', () => {
      const leakedWin = sanitizeErrorMessage('Cannot open file at C:\\Users\\Polak\\internal\\secret.key');
      expect(leakedWin).toBe('A system resource error occurred.');

      const leakedUnix = sanitizeErrorMessage('Error reading /home/node/app/src/db.ts: permission denied');
      expect(leakedUnix).toBe('A system resource error occurred.');
    });

    it('sanitizes raw SQL queries and database error specifics', () => {
      const sqlErr = sanitizeErrorMessage('syntax error at or near "DROP TABLE users"');
      expect(sqlErr).toBe('A database operation error occurred.');
    });

    it('sanitizes unhandled stack traces', () => {
      const stackErr = sanitizeErrorMessage('Error: unhandled exception at process.emit (node:events:517:28)');
      expect(stackErr).toBe('An internal processing error occurred.');
    });
  });
});
