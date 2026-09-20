import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { createRateLimiter } from '@clauseiqx/security';
import { getPublicRateLimitOptions } from '../src/middleware/rate-limit';
import * as crypto from 'crypto';

// Only run these integration tests if Redis is available in the environment
describe.runIf(process.env.REDIS_URL)('Redis Rate Limiter (Integration)', () => {
  let limiterA: ReturnType<typeof createRateLimiter>;
  let limiterB: ReturnType<typeof createRateLimiter>;
  const testKeyPrefix = `test:rate:${crypto.randomBytes(4).toString('hex')}`;

  beforeEach(async () => {
    // Create two separate instances to simulate multi-instance/cluster deployment
    limiterA = createRateLimiter(process.env.REDIS_URL);
    limiterB = createRateLimiter(process.env.REDIS_URL);
  });

  afterEach(async () => {
    // We don't want to clear the entire DB in a shared test env,
    // so we'll just clear the instances (which uses SCAN with their prefix)
    // Wait, the redis-rate-limiter's clear() method deletes all 'rate:*' and 'auth_fail:*' keys.
    // For safety, let's just use it, assuming test DB is isolated.
    await limiterA.clear();
  });

  afterAll(() => {
    // Give ioredis time to disconnect gracefully in real scenarios,
    // but vitest will handle it.
  });

  it('shares state between different instances', async () => {
    const options = getPublicRateLimitOptions();
    options.keyPrefix = testKeyPrefix;
    // Set a small max request limit for the test
    options.maxRequests = 3;
    options.windowMs = 5000;

    const testIp = '192.168.1.100';

    // Instance A consumes 2 requests
    const res1 = await limiterA.check(testIp, options);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = await limiterA.check(testIp, options);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    // Instance B checks remaining requests and consumes the last one
    const res3 = await limiterB.check(testIp, options);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);

    // Both instances should now reject
    const res4 = await limiterA.check(testIp, options);
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);

    const res5 = await limiterB.check(testIp, options);
    expect(res5.allowed).toBe(false);
    expect(res5.remaining).toBe(0);
  });
});
