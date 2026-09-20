import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { dataStore } from '../src/services/store';
import { sessionStore } from '@clauseiqx/security';
import { globalRateLimiter } from '../src/middleware/rate-limit';

const app = createApp();

describe('Phase 8: Export & Data Controls (06_Implementation_Plan.md §10)', () => {
  let userAToken: string;
  let userBToken: string;
  let projectAId: string;

  beforeEach(async () => {
    dataStore.clear();
    sessionStore.clear();
    globalRateLimiter.clear();

    // User A & Project A
    const resA = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'client@clauseiqx.internal', password: 'Password123!', displayName: 'Client A' });
    userAToken = resA.body.token;

    const projA = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Commercial IP License' });
    projectAId = projA.body.project.id;

    // Ingest sample contract
    const contractText = `
Section 1. Grant of License
Licensor grants Licensee an exclusive commercial license in North America.

Section 2. Key Deadlines and Milestones
The Effective Date is January 15, 2026.
Payment is due on February 1, 2026.
Annual review deadline is December 31, 2026.

Section 3. Termination for Cause
Either party may terminate immediately upon material breach with 30 days notice to cure.
`;
    await request(app)
      .post(`/api/v1/projects/${projectAId}/documents`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        filename: 'ip_license.pdf',
        mediaType: 'application/pdf',
        contentBase64: Buffer.from(`%PDF-1.4\n${contractText}\n%%EOF`).toString('base64'),
      });

    // User B (Cross-tenant)
    const resB = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'intruder@clauseiqx.internal', password: 'Password123!', displayName: 'Intruder' });
    userBToken = resB.body.token;
  });

  describe('Export Generation and Invariants', () => {
    it('generates a Markdown export with mandatory disclaimer, timestamp, and source references', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/exports`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          exportSourceType: 'summary',
          format: 'markdown',
        });

      expect(res.status).toBe(201);
      expect(res.body.export).toBeDefined();
      expect(res.body.download_url).toBeDefined();

      const exp = res.body.export;
      expect(exp.format).toBe('markdown');
      expect(exp.status).toBe('completed');
      expect(exp.expires_at).toBeDefined();

      // Download and inspect markdown content
      const downloadRes = await request(app)
        .get(`/api/v1/projects/${projectAId}/exports/${exp.id}/download`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(downloadRes.status).toBe(200);
      const text = downloadRes.text;

      // Invariant: Mandatory disclaimer
      expect(text).toContain('DISCLAIMER');
      expect(text).toContain('ClauseIQX provides automated informational analysis');

      // Invariant: Generation timestamp
      expect(text).toContain('Generated At:');

      // Invariant: Source reference
      expect(text).toContain('ip_license.pdf');
    });

    it('generates a PDF export artifact', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/exports`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          exportSourceType: 'summary',
          format: 'pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.export.format).toBe('pdf');

      const downloadRes = await request(app)
        .get(`/api/v1/projects/${projectAId}/exports/${res.body.export.id}/download`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(downloadRes.status).toBe(200);
      expect(downloadRes.headers['content-disposition']).toContain('.pdf');
      expect(downloadRes.body.length).toBeGreaterThan(0);
    });

    it('generates a DOCX export artifact', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/exports`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          exportSourceType: 'lawyer_prep',
          format: 'docx',
        });

      expect(res.status).toBe(201);
      expect(res.body.export.format).toBe('docx');

      const downloadRes = await request(app)
        .get(`/api/v1/projects/${projectAId}/exports/${res.body.export.id}/download`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(downloadRes.status).toBe(200);
      expect(downloadRes.headers['content-disposition']).toContain('.docx');
      const length = downloadRes.body?.length ?? downloadRes.text?.length ?? 0;
      expect(length).toBeGreaterThan(0);
    });

    it('generates an ICS calendar export for key dates', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/exports`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          exportSourceType: 'summary',
          format: 'ics',
        });

      expect(res.status).toBe(201);
      expect(res.body.export.format).toBe('ics');

      const downloadRes = await request(app)
        .get(`/api/v1/projects/${projectAId}/exports/${res.body.export.id}/download`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(downloadRes.status).toBe(200);
      expect(downloadRes.text).toContain('BEGIN:VCALENDAR');
      expect(downloadRes.text).toContain('BEGIN:VEVENT');
      expect(downloadRes.text).toContain('END:VCALENDAR');
    });

    it('rejects download when export link has expired (410 Gone)', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/exports`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          exportSourceType: 'summary',
          format: 'markdown',
        });

      const exportId = res.body.export.id;

      // Artificially expire the export in store
      const exp = dataStore.findExportById(exportId);
      if (exp) {
        exp.expires_at = new Date(Date.now() - 1000).toISOString();
      }

      const downloadRes = await request(app)
        .get(`/api/v1/projects/${projectAId}/exports/${exportId}/download`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(downloadRes.status).toBe(410);
      expect(downloadRes.body.error.message).toContain('expired');
    });
  });

  describe('Server-Side Authorization & Cross-Tenant Negative Tests', () => {
    let exportId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/exports`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          exportSourceType: 'summary',
          format: 'markdown',
        });
      exportId = res.body.export.id;
    });

    it('BLOCKS User B from generating export in User A project (returns 404)', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/exports`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          exportSourceType: 'summary',
          format: 'markdown',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User B from listing exports in User A project (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectAId}/exports`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User B from getting export details in User A project (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectAId}/exports/${exportId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User B from downloading User A export artifact (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectAId}/exports/${exportId}/download`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });
  });
});
