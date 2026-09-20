import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { dataStore } from '../src/services/store';
import { sessionStore } from '@clauseiqx/security';
import { globalRateLimiter } from '../src/middleware/rate-limit';

describe('Authentication Routes (/api/v1/auth)', () => {
  let app = createApp();

  beforeEach(() => {
    dataStore.clear();
    sessionStore.clear();
    globalRateLimiter.clear();
    app = createApp();
  });

  describe('POST /api/v1/auth/signup', () => {
    it('creates a new user account with strong password and returns session token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'priya.renter@example.com',
          password: 'StrongPassword123!',
          displayName: 'Priya Patel',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('priya.renter@example.com');
      expect(res.body.user.display_name).toBe('Priya Patel');
      expect(res.body.user.password_hash).toBeUndefined(); // Never leak password hash
      expect(res.body.token).toBeDefined();
    });

    it('rejects weak passwords (no uppercase or no digit) with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'user@example.com',
          password: 'weakpassword', // missing uppercase and digit
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_FAILED');
    });

    it('rejects duplicate email registrations with 400', async () => {
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'Password123!',
        });

      const res2 = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'Password123!',
        });

      expect(res2.status).toBe(400);
      expect(res2.body.error.message).toContain('already exists');
    });
  });

  describe('POST /api/v1/auth/login & Session Rotation', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'marcus.business@example.com',
          password: 'ValidPassword123!',
          displayName: 'Marcus Vance',
        });
    });

    it('logs in successfully and rotates session token', async () => {
      // First login
      const login1 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'marcus.business@example.com',
          password: 'ValidPassword123!',
        });

      expect(login1.status).toBe(200);
      const token1 = login1.body.token;
      expect(token1).toBeDefined();

      // Second login with token1 provided -> should rotate to token2 and invalidate token1
      const login2 = await request(app)
        .post('/api/v1/auth/login')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          email: 'marcus.business@example.com',
          password: 'ValidPassword123!',
        });

      expect(login2.status).toBe(200);
      const token2 = login2.body.token;
      expect(token2).not.toBe(token1);

      // Verify token1 is no longer valid
      const meWithOld = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token1}`);
      expect(meWithOld.status).toBe(401);

      // Verify token2 is valid
      const meWithNew = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token2}`);
      expect(meWithNew.status).toBe(200);
      expect(meWithNew.body.user.email).toBe('marcus.business@example.com');
    });

    it('rejects incorrect password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'marcus.business@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('revokes session token upon logout', async () => {
      const signup = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'dana.legal@example.org',
          password: 'StrongPassword123!',
        });

      const token = signup.body.token;

      // Confirm logged in
      const meBefore = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(meBefore.status).toBe(200);

      // Logout
      const logout = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      expect(logout.status).toBe(200);

      // Confirm session revoked
      const meAfter = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(meAfter.status).toBe(401);
    });
  });
});
