import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter, AuthRateLimiterOptions } from '../src/rate-limiter';

describe('RateLimiter Core & Exponential Backoff', () => {
  let limiter: RateLimiter;

  const authOptions: AuthRateLimiterOptions = {
    maxRequests: 5,
    windowMs: 60000,
    baseBackoffMs: 1000,
    maxBackoffMs: 16000,
    maxFailedAttemptsBeforeCooldown: 5,
    cooldownPeriodMs: 900000, // 15 min
    keyPrefix: 'auth_test',
  };

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  it('allows requests within max limit and calculates remaining allowance', () => {
    const res1 = limiter.check('client-1', { maxRequests: 3, windowMs: 10000 });
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = limiter.check('client-1', { maxRequests: 3, windowMs: 10000 });
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = limiter.check('client-1', { maxRequests: 3, windowMs: 10000 });
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);

    // 4th request exceeds limit
    const res4 = limiter.check('client-1', { maxRequests: 3, windowMs: 10000 });
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it('calculates exponential backoff progressively on authentication failures', () => {
    const ip = '192.168.1.50';
    const email = 'user@clauseiqx.ai';

    // Failure 1: base delay (1000ms)
    const fail1 = limiter.recordAuthFailure(ip, email, authOptions);
    expect(fail1.failedAttempts).toBe(1);
    expect(fail1.backoffMs).toBe(1000);

    // Attempt immediately after fail 1 should be throttled by backoff
    const check1 = limiter.checkAuthAttempt(ip, email, authOptions);
    expect(check1.allowed).toBe(false);
    expect(check1.retryAfterSeconds).toBeGreaterThanOrEqual(1);

    // Failure 2: 1000 * 2^1 = 2000ms
    const fail2 = limiter.recordAuthFailure(ip, email, authOptions);
    expect(fail2.failedAttempts).toBe(2);
    expect(fail2.backoffMs).toBe(2000);

    // Failure 3: 1000 * 2^2 = 4000ms
    const fail3 = limiter.recordAuthFailure(ip, email, authOptions);
    expect(fail3.failedAttempts).toBe(3);
    expect(fail3.backoffMs).toBe(4000);

    // Failure 4: 1000 * 2^3 = 8000ms
    const fail4 = limiter.recordAuthFailure(ip, email, authOptions);
    expect(fail4.failedAttempts).toBe(4);
    expect(fail4.backoffMs).toBe(8000);

    // Failure 5: Reaches maxFailedAttemptsBeforeCooldown -> cooldown period (900000ms)
    const fail5 = limiter.recordAuthFailure(ip, email, authOptions);
    expect(fail5.failedAttempts).toBe(5);
    expect(fail5.backoffMs).toBe(900000);
  });

  it('resets failed attempt tracking on successful authentication', () => {
    const ip = '10.0.0.5';
    const email = 'client@domain.com';

    limiter.recordAuthFailure(ip, email, authOptions);
    limiter.recordAuthFailure(ip, email, authOptions);

    // Throttled
    expect(limiter.checkAuthAttempt(ip, email, authOptions).allowed).toBe(false);

    // User succeeds
    limiter.resetAuthSuccess(ip, email);

    // Throttling lifted
    expect(limiter.checkAuthAttempt(ip, email, authOptions).allowed).toBe(true);
  });

  it('tracks failures independently across different accounts on the same IP', () => {
    const ip = '10.0.0.1';
    const emailA = 'alice@example.com';
    const emailB = 'bob@example.com';

    limiter.recordAuthFailure(ip, emailA, authOptions);

    // Alice is throttled
    const checkAlice = limiter.checkAuthAttempt(ip, emailA, authOptions);
    expect(checkAlice.allowed).toBe(false);

    // Bob can still attempt (until IP overall limit is reached)
    limiter.resetAuthSuccess(ip, undefined); // reset IP lock for this test
    const checkBob = limiter.checkAuthAttempt(ip, emailB, authOptions);
    expect(checkBob.allowed).toBe(true);
  });
});
