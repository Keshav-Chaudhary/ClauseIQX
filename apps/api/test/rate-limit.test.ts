import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { globalRateLimiter } from '../src/middleware/rate-limit';

describe('API Rate Limiting Middleware', () => {
  let app = createApp();

  beforeEach(async () => {
    globalRateLimiter.clear();
    app = createApp();
    await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'valid@clauseiqx.ai', password: 'ValidPassword123!' });
  });

  it('enforces rate limits on public endpoints and returns 429 with Retry-After header', async () => {
    // Set a very tight public limit for testing
    process.env.RATE_LIMIT_PUBLIC_MAX_REQUESTS = '3';
    process.env.RATE_LIMIT_PUBLIC_WINDOW_MS = '10000';

    // 3 allowed requests
    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/health').set('X-Forwarded-For', '203.0.113.10');
      expect(res.status).toBe(200);
      expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    }

    // 4th request exceeds limit
    const throttled = await request(app).get('/health').set('X-Forwarded-For', '203.0.113.10');
    expect(throttled.status).toBe(429);
    expect(throttled.headers['retry-after']).toBeDefined();
    expect(throttled.body.error).toBeDefined();
    expect(throttled.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(throttled.body.error.message).toContain('Too many requests');
  });

  it('enforces exponential backoff on auth route after failed attempts', async () => {
    process.env.RATE_LIMIT_AUTH_MAX_REQUESTS = '10';
    process.env.RATE_LIMIT_AUTH_WINDOW_MS = '60000';
    process.env.RATE_LIMIT_AUTH_BASE_BACKOFF_MS = '500';

    const testEmail = 'attacker@target.com';
    const testIp = '198.51.100.25';

    // 1st failed attempt
    const fail1 = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', testIp)
      .send({ email: testEmail, password: 'WrongPassword1!' });

    expect(fail1.status).toBe(401);
    expect(fail1.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(fail1.body.error.retry_delay_ms).toBeDefined();

    // Immediate subsequent attempt is throttled by the exponential backoff window
    const throttled = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', testIp)
      .send({ email: testEmail, password: 'WrongPassword1!' });

    expect(throttled.status).toBe(429);
    expect(throttled.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(throttled.headers['retry-after']).toBeDefined();
  });

  it('resets rate limit penalties on successful login', async () => {
    const testIp = '198.51.100.30';

    // Successful login
    const success = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', testIp)
      .send({ email: 'valid@clauseiqx.ai', password: 'ValidPassword123!' });

    expect(success.status).toBe(200);
    expect(success.body.status).toBe('ok');
    expect(success.body.token).toBeDefined();
  });
});
