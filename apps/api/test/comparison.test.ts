import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { dataStore } from '../src/services/store';
import { sessionStore } from '@clauseiqx/security';
import { ComparisonChange, ComparisonChangeCitation } from '@clauseiqx/shared-types';
import { globalRateLimiter } from '../src/middleware/rate-limit';

const app = createApp();

describe('Phase 6: Contract Comparison & Dual-Source Grounding (06_Implementation_Plan.md §8)', () => {
  let userAToken: string;
  let userBToken: string;
  let projectAId: string;
  let docAId: string;
  let docBId: string;

  beforeEach(async () => {
    dataStore.clear();
    sessionStore.clear();
    globalRateLimiter.clear();

    // User A & Project A
    const resA = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'lawyer@clauseiqx.internal', password: 'Password123!', displayName: 'Reviewer' });
    userAToken = resA.body.token;

    const projA = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Lease Renewal Comparison' });
    projectAId = projA.body.project.id;

    // Document A (Original Lease)
    const docAText = `
Section 1. Rent and Fees
Base Rent shall be $10,000 per month. Late payment fee is 2%.

Section 2. Term and Termination
The initial term is 1 year. Either party may terminate with 30 days notice.

Section 3. Removed Clause in Amendment
Landlord shall provide free parking spaces for 10 vehicles.
`;
    const resDocA = await request(app)
      .post(`/api/v1/projects/${projectAId}/documents`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        filename: 'lease_2025.pdf',
        mediaType: 'application/pdf',
        contentBase64: Buffer.from(`%PDF-1.4\n${docAText}\n%%EOF`).toString('base64'),
      });
    docAId = resDocA.body.document.id;

    // Document B (Amended Lease: Rent increased to $12,000, 60 days notice, parking removed, indemnity added)
    const docBText = `
Section 1. Rent and Fees
Base Rent shall be $12,000 per month. Late payment fee is 2%.

Section 2. Term and Termination
The initial term is 1 year. Either party may terminate with 60 days notice.

Section 4. Added Indemnification
Tenant shall indemnify and hold harmless Landlord against all claims and damages.
`;
    const resDocB = await request(app)
      .post(`/api/v1/projects/${projectAId}/documents`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        filename: 'lease_2026_amendment.pdf',
        mediaType: 'application/pdf',
        contentBase64: Buffer.from(`%PDF-1.4\n${docBText}\n%%EOF`).toString('base64'),
      });
    docBId = resDocB.body.document.id;

    // User B (Cross-tenant)
    const resB = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'stranger@clauseiqx.internal', password: 'Password123!', displayName: 'Stranger' });
    userBToken = resB.body.token;
  });

  describe('Two-Document Diff & Materiality Classification', () => {
    it('accurately detects modified, added, and removed clauses with dual-source citations', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/comparisons`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          documentAId: docAId,
          documentBId: docBId,
        });

      expect(res.status).toBe(201);
      expect(res.body.comparison).toBeDefined();
      expect(res.body.comparison.status).toBe('completed');
      expect(res.body.changes.length).toBeGreaterThanOrEqual(3);

      type ChangeWithCitations = ComparisonChange & { citations: ComparisonChangeCitation[] };
      const changes: ChangeWithCitations[] = res.body.changes;

      // 1. Check for modified rent (Material change)
      const rentChange = changes.find((c) => c.title.includes('Rent'));
      expect(rentChange).toBeDefined();
      expect(rentChange?.change_type).toBe('modified');
      expect(rentChange?.materiality).toBe('material');
      expect(rentChange?.citations).toHaveLength(2); // Cites side A and side B
      const sides = rentChange?.citations.map((cit) => cit.source_side);
      expect(sides).toContain('a');
      expect(sides).toContain('b');

      // 2. Check for removed parking clause
      const removedChange = changes.find((c) => c.change_type === 'removed');
      expect(removedChange).toBeDefined();
      expect(removedChange?.citations.some((c) => c.source_side === 'a')).toBe(true);

      // 3. Check for added indemnification clause
      const addedChange = changes.find((c) => c.change_type === 'added');
      expect(addedChange).toBeDefined();
      expect(addedChange?.citations.some((c) => c.source_side === 'b')).toBe(true);
    });

    it('rejects comparison when document_a_id equals document_b_id (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/comparisons`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          documentAId: docAId,
          documentBId: docAId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/distinct documents/i);
    });
  });

  describe('Server-Side Authorization & Cross-Tenant Negative Tests', () => {
    let comparisonId: string;

    beforeEach(async () => {
      const compRes = await request(app)
        .post(`/api/v1/projects/${projectAId}/comparisons`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          documentAId: docAId,
          documentBId: docBId,
        });
      comparisonId = compRes.body.comparison.id;
    });

    it('BLOCKS User B from triggering comparison between User A documents (returns 404)', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/comparisons`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          documentAId: docAId,
          documentBId: docBId,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User B from viewing User A comparisons list (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectAId}/comparisons`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User B from viewing User A comparison details (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectAId}/comparisons/${comparisonId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });
  });
});
