import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { dataStore } from '../src/services/store';
import { sessionStore } from '@clauseiqx/security';
import { globalRateLimiter } from '../src/middleware/rate-limit';

describe('Projects API & Server-Side Authorization (Phase 1 & TRD §4)', () => {
  let app = createApp();
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let _userBId: string;

  beforeEach(async () => {
    dataStore.clear();
    sessionStore.clear();
    globalRateLimiter.clear();
    app = createApp();

    // Setup User A (Tenant A)
    const userARes = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'userA@tenant-a.com', password: 'PasswordA123!' });
    userAToken = userARes.body.token;
    userAId = userARes.body.user.id;

    // Setup User B (Tenant B)
    const userBRes = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'userB@tenant-b.com', password: 'PasswordB123!' });
    userBToken = userBRes.body.token;
    _userBId = userBRes.body.user.id;
  });

  describe('POST /api/v1/projects (Project Creation)', () => {
    it('creates project and defaults jurisdiction to "unknown" when skipped by user', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Commercial Lease Agreement 2026',
          // jurisdictionCode intentionally omitted
          documentType: 'lease',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');
      expect(res.body.project).toBeDefined();
      expect(res.body.project.name).toBe('Commercial Lease Agreement 2026');
      expect(res.body.project.owner_user_id).toBe(userAId);
      // PRD FR-30: Never guess jurisdiction, store 'unknown'
      expect(res.body.project.jurisdiction_code).toBe('unknown');
      expect(res.body.project.document_type).toBe('lease');
    });

    it('stores explicit jurisdiction when provided by user', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'California Employment Contract',
          jurisdictionCode: 'US-CA',
        });

      expect(res.status).toBe(201);
      expect(res.body.project.jurisdiction_code).toBe('US-CA');
    });

    it('rejects unauthenticated project creation with 401', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .send({ name: 'Unauthenticated Project' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/projects (List Projects)', () => {
    it('returns only projects belonging to the authenticated tenant', async () => {
      // User A creates 2 projects
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Project A-1' });

      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Project A-2' });

      // User B creates 1 project
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ name: 'Project B-1' });

      // User A lists projects -> sees only A-1 and A-2
      const listA = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(listA.status).toBe(200);
      expect(listA.body.projects).toHaveLength(2);
      expect(listA.body.projects.map((p: { name: string }) => p.name)).toEqual(['Project A-2', 'Project A-1']);

      // User B lists projects -> sees only B-1
      const listB = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(listB.status).toBe(200);
      expect(listB.body.projects).toHaveLength(1);
      expect(listB.body.projects[0].name).toBe('Project B-1');
    });
  });

  describe('Server-Side Authorization & Cross-Tenant Negative Tests (IDOR Protection)', () => {
    let projectAId: string;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'User A Sensitive Contract', jurisdictionCode: 'US-NY' });

      projectAId = createRes.body.project.id;
    });

    it('allows User A to access their own project', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.project.id).toBe(projectAId);
      expect(res.body.role).toBe('owner');
    });

    it('BLOCKS User B from viewing User A project with 404 non-enumerating error (Cross-Tenant Negative Test)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userBToken}`); // User B attempting cross-tenant access

      // TRD §4.2: Prefer 404 over 403 so existence is not leaked
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
      expect(res.body.error.message).toContain('project was not found');
    });

    it('BLOCKS User B from updating User A project with 404 (Direct Object Reference Attack)', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ name: 'Hacked Project Name' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');

      // Verify User A project was not modified
      const checkA = await request(app)
        .get(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(checkA.body.project.name).toBe('User A Sensitive Contract');
    });

    it('BLOCKS User B from deleting User A project with 404 (Direct Object Reference Attack)', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);

      // Verify User A project still exists and is not deleted
      const checkA = await request(app)
        .get(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(checkA.status).toBe(200);
    });
  });

  describe('Project Deletion & Access Invariants', () => {
    it('prevents any path of access to a deleted project (returns 404)', async () => {
      const createRes = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Project To Delete' });

      const projectId = createRes.body.project.id;

      // Delete the project
      const delRes = await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.message).toContain('deleted successfully');

      // Subsequent GET by owner returns 404
      const getRes = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(getRes.status).toBe(404);

      // Subsequent PATCH by owner returns 404
      const patchRes = await request(app)
        .patch(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'New Name' });
      expect(patchRes.status).toBe(404);

      // Excluded from project listing
      const listRes = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(listRes.body.projects).toHaveLength(0);

      // Verify audit event was generated
      const auditEvents = dataStore.getAuditEventsForProject(projectId);
      expect(auditEvents.some((e) => e.event_type === 'project.deleted')).toBe(true);
    });
  });
});
