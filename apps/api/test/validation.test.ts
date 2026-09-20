import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { globalRateLimiter } from '../src/middleware/rate-limit';

describe('Strict Input Validation Middleware (Zod)', () => {
  let app = createApp();

  beforeEach(async () => {
    globalRateLimiter.clear();
    app = createApp();
    await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'valid@clauseiqx.ai', password: 'ValidPassword123!' });
  });

  it('rejects requests with missing required fields with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'valid@clauseiqx.ai' }); // missing password

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.message).toContain("Field 'password'");
  });

  it('rejects invalid email formats with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-a-valid-email', password: 'ValidPassword123!' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.message).toContain("Field 'email'");
  });

  it('rejects passwords shorter than schema length with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'valid@clauseiqx.ai', password: 'short' }); // < 8 chars

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.message).toContain("Field 'password'");
  });

  it('rejects unexpected / extra properties on strict schemas', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'valid@clauseiqx.ai',
        password: 'ValidPassword123!',
        unrecognizedField: 'malicious-injection',
        isAdmin: true,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.message).toContain('Unrecognized key(s)');
  });

  it('accepts strictly valid schema payloads', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'valid@clauseiqx.ai',
        password: 'ValidPassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
