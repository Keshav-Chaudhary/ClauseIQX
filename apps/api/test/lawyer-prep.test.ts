import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { dataStore } from '../src/services/store';
import { sessionStore } from '@clauseiqx/security';
import { globalRateLimiter } from '../src/middleware/rate-limit';

const app = createApp();

describe('Phase 7: Lawyer Preparation Briefing & Strict Copy Rules (06_Implementation_Plan.md §9)', () => {
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

Section 2. Royalty and Audit
Licensee pays 5% net sales royalty. Licensor may audit books annually.

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

  describe('Generation & Invariant Checks', () => {
    it('generates a lawyer preparation briefing with summary, clauses, dates, missing facts, and questions for lawyer', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/lawyer-prep`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ userNotes: 'Need lawyer to review audit rights' });

      expect(res.status).toBe(201);
      expect(res.body.draft).toBeDefined();

      const draft = res.body.draft;
      expect(draft.status).toBe('draft');
      expect(draft.situation_summary).toBeDefined();
      expect(draft.key_clauses).toBeDefined();
      expect(draft.key_dates).toBeDefined();
      expect(draft.facts_still_needed).toBeDefined();
      expect(draft.questions_for_lawyer).toBeDefined();
      expect(draft.user_notes).toBe('Need lawyer to review audit rights');

      // Strict PRD Copy Invariant: NEVER label output a "legal opinion", "case assessment", or "legal strategy"
      expect(draft).not.toHaveProperty('legal_opinion');
      expect(draft).not.toHaveProperty('case_assessment');
      expect(draft).not.toHaveProperty('legal_strategy');

      const responseString = JSON.stringify(draft).toLowerCase();
      expect(responseString).not.toContain('"legal_opinion"');
      expect(responseString).not.toContain('"case_assessment"');
      expect(responseString).not.toContain('"legal_strategy"');
    });

    it('allows user to edit draft fields and finalize status (PATCH)', async () => {
      const createRes = await request(app)
        .post(`/api/v1/projects/${projectAId}/lawyer-prep`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({});

      const draftId = createRes.body.draft.id;

      const patchRes = await request(app)
        .patch(`/api/v1/projects/${projectAId}/lawyer-prep/${draftId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          userNotes: 'Consultation scheduled for Monday at 10 AM with Attorney Smith.',
          status: 'finalized',
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.draft.status).toBe('finalized');
      expect(patchRes.body.draft.user_notes).toBe('Consultation scheduled for Monday at 10 AM with Attorney Smith.');
    });
  });

  describe('Server-Side Authorization & Cross-Tenant Negative Tests', () => {
    let draftId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/lawyer-prep`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({});
      draftId = res.body.draft.id;
    });

    it('BLOCKS User B from generating draft in User A project (returns 404)', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/lawyer-prep`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User B from viewing User A lawyer prep drafts list (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectAId}/lawyer-prep`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User B from viewing User A lawyer prep draft details (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectAId}/lawyer-prep/${draftId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User B from editing User A lawyer prep draft (returns 404)', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${projectAId}/lawyer-prep/${draftId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ userNotes: 'Malicious modification' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');

      // Verify draft was untouched
      const checkRes = await request(app)
        .get(`/api/v1/projects/${projectAId}/lawyer-prep/${draftId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(checkRes.body.draft.user_notes).not.toBe('Malicious modification');
    });
  });
});
