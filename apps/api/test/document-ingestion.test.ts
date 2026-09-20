import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { dataStore } from '../src/services/store';
import { sessionStore } from '@clauseiqx/security';
import { globalRateLimiter } from '../src/middleware/rate-limit';

const app = createApp();

describe('Phase 2 & 3: Secure Document Ingestion & RAG (06_Implementation_Plan.md §4 & §5)', () => {
  let userAToken: string;
  let userBToken: string;
  let projectAId: string;
  let projectBId: string;

  beforeEach(async () => {
    dataStore.clear();
    sessionStore.clear();
    globalRateLimiter.clear();

    // Create User A and Project A
    const resA = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'usera@clauseiqx.internal', password: 'Password123!', displayName: 'User A' });
    userAToken = resA.body.token;

    const projA = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Commercial Lease Review' });
    projectAId = projA.body.project.id;

    // Create User B and Project B
    const resB = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'userb@clauseiqx.internal', password: 'Password123!', displayName: 'User B' });
    userBToken = resB.body.token;

    const projB = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'Employment Agreement' });
    projectBId = projB.body.project.id;
  });

  describe('Happy Path Ingestion & Extraction', () => {
    it('successfully ingests, scans, extracts, and chunks a valid legal contract', async () => {
      const contractText = `
Section 1. Definitions and Term
This Commercial Lease Agreement is entered into on January 1, 2026.
The initial term shall be three (3) years.

Section 2. Rent and Payment Terms
Tenant agrees to pay Base Rent of $5,000 per month on the first day of each calendar month.
Late payments will incur a five percent (5%) fee after five days.

Section 3. Termination and Default
Landlord may terminate this lease upon thirty (30) days written notice in the event of uncured material default.

Section 4. Governing Law and Dispute Resolution
This agreement shall be governed by the laws of the State of California.
`;
      const validPdfBuffer = Buffer.concat([
        Buffer.from('%PDF-1.4\n'),
        Buffer.from(contractText, 'utf-8'),
        Buffer.from('\n%%EOF'),
      ]);

      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          filename: 'lease_agreement.pdf',
          mediaType: 'application/pdf',
          contentBase64: validPdfBuffer.toString('base64'),
        });

      expect(res.status).toBe(201);
      expect(res.body.document).toBeDefined();
      expect(res.body.document.status).toBe('READY');
      expect(res.body.document.scan_status).toBe('CLEAN');
      expect(res.body.document.filename).toBe('lease_agreement.pdf');
      expect(res.body.version).toBeDefined();
      expect(res.body.chunks_count).toBeGreaterThan(0);

      const docId = res.body.document.id;

      // Verify chunks retrieval endpoint
      const chunksRes = await request(app)
        .get(`/api/v1/projects/${projectAId}/documents/${docId}/chunks`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(chunksRes.status).toBe(200);
      expect(chunksRes.body.chunks.length).toBeGreaterThan(0);
      expect(chunksRes.body.chunks[0].section_title).toBeDefined();
      expect(chunksRes.body.chunks[0].char_start).toBeDefined();
      expect(chunksRes.body.chunks[0].char_end).toBeDefined();
    });
  });

  describe('Adversarial Test Fixtures (06_Implementation_Plan.md §4 & 02_TRD.md §5)', () => {
    it('REJECTS disallowed file extension (.exe, .sh, .py, .html)', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          filename: 'exploit.exe',
          mediaType: 'application/octet-stream',
          contentBase64: Buffer.from('MZ_malicious_code').toString('base64'),
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/File extension '\.exe' is not permitted/);
    });

    it('REJECTS executable renamed as PDF via magic byte inspection (MZ Windows executable)', async () => {
      // Starts with MZ (Windows PE executable header) but declared as PDF
      const fakePdf = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00This is an executable');
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          filename: 'trojan_disguised.pdf',
          mediaType: 'application/pdf',
          contentBase64: fakePdf.toString('base64'),
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/executable/i);
    });

    it('REJECTS Linux ELF executable renamed as PDF', async () => {
      const fakeElf = Buffer.from('\x7fELF\x02\x01\x01\x00malicious_binary');
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          filename: 'rootkit.pdf',
          mediaType: 'application/pdf',
          contentBase64: fakeElf.toString('base64'),
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/executable/i);
    });

    it('REJECTS oversized file exceeding maximum size limit', async () => {
      // 26MB dummy buffer (over 25MB limit)
      const oversizedBuffer = Buffer.alloc(26 * 1024 * 1024);
      oversizedBuffer.write('%PDF-1.4\n');

      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          filename: 'oversized.pdf',
          mediaType: 'application/pdf',
          contentBase64: oversizedBuffer.toString('base64'),
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/exceeds the limit/i);
    });

    it('REJECTS malicious embedded virus signature (EICAR) and leaves 0 partial processing', async () => {
      const eicarPayload = Buffer.concat([
        Buffer.from('%PDF-1.4\n'),
        Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'),
        Buffer.from('\n%%EOF'),
      ]);

      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          filename: 'eicar_test.pdf',
          mediaType: 'application/pdf',
          contentBase64: eicarPayload.toString('base64'),
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Security scan detected threat/);

      // Verify no active document is listed for project
      const listRes = await request(app)
        .get(`/api/v1/projects/${projectAId}/documents`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(listRes.body.documents).toHaveLength(0);
    });

    it('REJECTS HTML / script payload embedded in text upload', async () => {
      const scriptPayload = '<script>alert("XSS Attack!"); document.location="https://attacker.com";</script>';
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          filename: 'payload.txt',
          mediaType: 'text/plain',
          contentBase64: Buffer.from(scriptPayload).toString('base64'),
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/HTML or script/i);
    });
  });

  describe('Server-Side Authorization & Cross-Tenant Negative Tests (IDOR)', () => {
    let documentAId: string;

    beforeEach(async () => {
      // Upload a valid doc for User A
      const validPdf = Buffer.from('%PDF-1.4\nStandard NDA terms\n%%EOF');
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          filename: 'confidential_nda.pdf',
          mediaType: 'application/pdf',
          contentBase64: validPdf.toString('base64'),
        });
      documentAId = res.body.document.id;
    });

    it('BLOCKS User B from uploading to User A project (returns non-enumerating 404)', async () => {
      const validPdf = Buffer.from('%PDF-1.4\nUser B file\n%%EOF');
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          filename: 'unauthorized_upload.pdf',
          mediaType: 'application/pdf',
          contentBase64: validPdf.toString('base64'),
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User B from viewing User A document list (returns non-enumerating 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectAId}/documents`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User A from viewing User B document list (returns non-enumerating 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectBId}/documents`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User B from viewing User A document metadata (returns non-enumerating 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectAId}/documents/${documentAId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User B from viewing User A document chunks (returns non-enumerating 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectAId}/documents/${documentAId}/chunks`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User B from deleting User A document (returns non-enumerating 404)', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${projectAId}/documents/${documentAId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');

      // Verify User A document is still intact
      const checkRes = await request(app)
        .get(`/api/v1/projects/${projectAId}/documents/${documentAId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(checkRes.status).toBe(200);
    });

    it('ALLOWS User A to soft-delete document; prevents subsequent access (returns 404)', async () => {
      const deleteRes = await request(app)
        .delete(`/api/v1/projects/${projectAId}/documents/${documentAId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Accessing deleted document now returns 404
      const getRes = await request(app)
        .get(`/api/v1/projects/${projectAId}/documents/${documentAId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(getRes.status).toBe(404);

      // Deleted document is omitted from active document list
      const listRes = await request(app)
        .get(`/api/v1/projects/${projectAId}/documents`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(listRes.body.documents).toHaveLength(0);

      // Subsequent delete call is idempotent (returns 404 non-enumerating or 200)
      const repeatDelete = await request(app)
        .delete(`/api/v1/projects/${projectAId}/documents/${documentAId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(repeatDelete.status).toBe(404);
    });
  });
});
