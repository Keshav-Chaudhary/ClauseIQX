import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { globalRateLimiter } from '../src/middleware/rate-limit';

describe('Information Leakage & Error Sanitization (TRD §7)', () => {
  let app = createApp();

  beforeEach(() => {
    globalRateLimiter.clear();
    app = createApp();
  });

  it('sanitizes raw database errors and does not leak SQL syntax or table names', async () => {
    const res = await request(app).get('/api/v1/test/trigger-leak-error?type=db');

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');

    // Must NOT leak internal SQL or schema details
    expect(res.body.error.message).not.toContain('SELECT');
    expect(res.body.error.message).not.toContain('users');
    expect(res.body.error.message).not.toContain('relation');
    expect(res.body.error.message).toContain('database operation error');
    expect(res.body.error.stack).toBeUndefined();
  });

  it('sanitizes filesystem errors and does not leak internal server paths', async () => {
    const res = await request(app).get('/api/v1/test/trigger-leak-error?type=path');

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();

    // Must NOT leak Windows or Unix internal paths
    expect(res.body.error.message).not.toContain('C:\\Users');
    expect(res.body.error.message).not.toContain('secret.key');
    expect(res.body.error.message).toContain('system resource error');
    expect(res.body.error.stack).toBeUndefined();
  });

  it('never leaks stack traces in client response body', async () => {
    const res = await request(app).get('/api/v1/test/trigger-leak-error?type=generic');

    expect(res.status).toBe(500);
    expect(res.body.error.stack).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('    at ');
  });
});
