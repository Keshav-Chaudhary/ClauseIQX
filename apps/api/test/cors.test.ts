import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('CORS configuration', () => {
  const app = createApp();

  it('allows requests from configured origins', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:3000');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('rejects requests from disallowed origins', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://malicious.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
