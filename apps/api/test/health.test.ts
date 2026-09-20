import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('API Gateway & Health Endpoints', () => {
  const app = createApp();

  it('GET /health returns 200 with service indicators and request ID', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.request_id).toBeDefined();
    expect(response.body.services).toBeDefined();
    expect(response.body.services.ai_provider.status).toBe('healthy');
    expect(response.body.services.storage.status).toBe('healthy');
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/v1/health returns 200 with matching schema', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.services.api.status).toBe('healthy');
  });

  it('GET unknown route returns non-enumerating 404 matching TRD §7 error envelope', async () => {
    const response = await request(app).get('/api/v1/non-existent-endpoint');

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect(response.body.error.message).toBeDefined();
    expect(response.body.error.request_id).toBeDefined();
  });

  it('GET /api/docs.json returns OpenAPI 3.0 specification', async () => {
    const response = await request(app).get('/api/docs.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.info.title).toBe('ClauseIQX API');
  });
});
