import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { dataStore } from '../src/services/store';
import { sessionStore } from '@clauseiqx/security';
import { globalRateLimiter } from '../src/middleware/rate-limit';

const app = createApp();

describe('Phase 4: Document Analysis & Mandatory Citation Validation (06_Implementation_Plan.md §6)', () => {
  let userAToken: string;
  let userBToken: string;
  let projectAId: string;
  let documentAId: string;

  beforeEach(async () => {
    dataStore.clear();
    sessionStore.clear();
    globalRateLimiter.clear();

    // User A & Project A
    const resA = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'owner@clauseiqx.internal', password: 'Password123!', displayName: 'Doc Owner' });
    userAToken = resA.body.token;

    const projA = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Commercial SaaS Agreement' });
    projectAId = projA.body.project.id;

    // Ingest a comprehensive contract with clauses, dates, and review points
    const contractText = `
Section 1. Definitions and Term
This Master Services Agreement is entered into on March 15, 2026.
The initial term shall be two (2) years, renewing automatically for one (1) year terms unless either party gives 60 days written notice.

Section 2. Fees and Payment
Customer agrees to pay annual subscription fees of $25,000 within thirty (30) days of invoice.
Late payments will incur a 1.5% monthly interest penalty.

Section 3. Termination
Either party may terminate for convenience upon ninety (90) days prior written notice.
Provider may terminate immediately in the event of customer non-payment.

Section 4. Indemnification & Unilateral Discretion
Customer shall fully indemnify, defend, and hold harmless Provider against all claims.
Provider reserves sole discretion to modify features and discontinue support with no refund.

Section 5. Governing Law and Disputes
This Agreement is governed by Delaware law. Any disputes shall be resolved in New Castle County.
`;
    const docRes = await request(app)
      .post(`/api/v1/projects/${projectAId}/documents`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        filename: 'saas_agreement.pdf',
        mediaType: 'application/pdf',
        contentBase64: Buffer.from(`%PDF-1.4\n${contractText}\n%%EOF`).toString('base64'),
      });
    documentAId = docRes.body.document.id;

    // User B (cross-tenant)
    const resB = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'outsider@clauseiqx.internal', password: 'Password123!', displayName: 'Outsider' });
    userBToken = resB.body.token;
  });

  describe('Structured Analysis Generation & Citation Integrity', () => {
    it('generates summary analysis where every finding has valid source chunk citations', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents/${documentAId}/analyses`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ analysisType: 'summary' });

      expect(res.status).toBe(201);
      expect(res.body.analysis).toBeDefined();
      expect(res.body.analysis.status).toBe('ready');
      expect(res.body.citation_validation_passed).toBe(true);

      const findings = res.body.findings;
      expect(findings.length).toBeGreaterThan(0);

      // Verify citation invariant: Every finding has >=1 citation chunk
      for (const finding of findings) {
        expect(finding.citation_chunk_ids).toBeDefined();
        expect(finding.citation_chunk_ids.length).toBeGreaterThan(0);
        expect(finding.title).toBeDefined();
        expect(finding.explanation).toBeDefined();
      }
    });

    it('generates review_points using strictly "review_point" terminology (never "risk_flag" or "risk_level")', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents/${documentAId}/analyses`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ analysisType: 'review_points' });

      expect(res.status).toBe(201);
      expect(res.body.analysis.status).toBe('ready');

      const findings = res.body.findings;
      expect(findings.length).toBeGreaterThan(0);

      for (const finding of findings) {
        expect(finding.finding_type).toBe('review_point');
        // Schema check: does not contain forbidden risk words in key names
        expect(finding).not.toHaveProperty('risk_flag');
        expect(finding).not.toHaveProperty('risk_level');
        expect(finding).not.toHaveProperty('severity');
        expect(finding.citation_chunk_ids.length).toBeGreaterThan(0);
      }
    });

    it('generates key dates analysis with grounded timelines', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents/${documentAId}/analyses`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ analysisType: 'dates' });

      expect(res.status).toBe(201);
      expect(res.body.analysis.status).toBe('ready');
      const findings = res.body.findings;
      expect(findings.length).toBeGreaterThan(0);

      for (const finding of findings) {
        expect(finding.finding_type).toBe('date');
        expect(finding.citation_chunk_ids.length).toBeGreaterThan(0);
      }
    });

    it('produces distinct explanations and summaries for simple vs detailed reading-level settings (FR-9)', async () => {
      const resSimple = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents/${documentAId}/analyses`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ analysisType: 'summary', readingLevel: 'simple' });

      expect(resSimple.status).toBe(201);
      expect(resSimple.body.analysis.status).toBe('ready');
      expect(resSimple.body.analysis.result.readingLevel).toBe('simple');
      expect(resSimple.body.findings.length).toBeGreaterThan(0);

      const resDetailed = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents/${documentAId}/analyses`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ analysisType: 'summary', readingLevel: 'detailed' });

      expect(resDetailed.status).toBe(201);
      expect(resDetailed.body.analysis.status).toBe('ready');
      expect(resDetailed.body.analysis.result.readingLevel).toBe('detailed');
      expect(resDetailed.body.findings.length).toBeGreaterThan(0);

      // Verify that simple and detailed produce distinct outputs
      expect(resSimple.body.analysis.result.summary).not.toBe(resDetailed.body.analysis.result.summary);
      expect(resSimple.body.findings[0].explanation).not.toBe(resDetailed.body.findings[0].explanation);
      expect(resSimple.body.findings[0].explanation).toContain('Plain summary');
      expect(resDetailed.body.findings[0].explanation).toContain('Detailed legal provision');
    });

    it('serves real extracted dates and timelines through the UI-facing GET endpoint (FR-24)', async () => {
      // 1. Generate dates analysis
      const postRes = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents/${documentAId}/analyses`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ analysisType: 'dates' });

      expect(postRes.status).toBe(201);
      expect(postRes.body.findings.length).toBeGreaterThan(0);

      // 2. Fetch through UI-facing GET endpoint with query filters
      const getRes = await request(app)
        .get(`/api/v1/projects/${projectAId}/documents/${documentAId}/analyses?type=dates&include_findings=true`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.analyses).toBeDefined();
      expect(getRes.body.analyses.length).toBeGreaterThan(0);

      const datesAnalysis = getRes.body.analyses[0];
      expect(datesAnalysis.analysis_type).toBe('dates');
      expect(datesAnalysis.findings).toBeDefined();
      expect(datesAnalysis.findings.length).toBeGreaterThan(0);

      const firstDateFinding = datesAnalysis.findings[0];
      expect(firstDateFinding.finding_type).toBe('date');
      expect(firstDateFinding.citation_chunk_ids.length).toBeGreaterThan(0);
      expect(firstDateFinding.explanation).toBeDefined();
    });
  });

  describe('Mandatory Citation Validation Gate (06_Implementation_Plan.md §6)', () => {
    it('MARKS analysis incomplete (NEVER ready) when citation validation fails', async () => {
      // Force invalid citations using test flag
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents/${documentAId}/analyses`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          analysisType: 'clauses',
          forceIncompleteForTesting: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.citation_validation_passed).toBe(false);
      // Critical invariant: MUST BE 'incomplete', NEVER 'ready'
      expect(res.body.analysis.status).toBe('incomplete');
      expect(res.body.findings).toHaveLength(0);
    });
  });

  describe('Server-Side Authorization & Cross-Tenant Negative Tests', () => {
    let analysisId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents/${documentAId}/analyses`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ analysisType: 'summary' });
      analysisId = res.body.analysis.id;
    });

    it('BLOCKS User B from triggering analysis on User A document (returns 404)', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectAId}/documents/${documentAId}/analyses`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ analysisType: 'clauses' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User B from viewing User A analyses list (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectAId}/documents/${documentAId}/analyses`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('BLOCKS User B from viewing User A analysis details (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectAId}/documents/${documentAId}/analyses/${analysisId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });
  });
});
