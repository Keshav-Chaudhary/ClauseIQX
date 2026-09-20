import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  hashPassword,
  verifyPassword,
  sessionStore,
  createValidationError,
} from '@clauseiqx/security';
import { dataStore } from '../services/store';
import {
  authRateLimitMiddleware,
  recordAuthFailure,
  recordAuthSuccess,
} from '../middleware/rate-limit';
import { validateRequest } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

// ==========================================
// 1. SIGNUP
// ==========================================

const signupSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  displayName: z.string().min(1).max(100).optional(),
}).strict();

authRouter.post(
  '/signup',
  authRateLimitMiddleware,
  validateRequest({ body: signupSchema }),
  async (req: Request, res: Response) => {
    const { email, password, displayName } = req.body;
    const existing = dataStore.findUserByEmail(email);

    if (existing) {
      const err = createValidationError('An account with this email already exists.', req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = dataStore.createUser(email, passwordHash, displayName);
    const token = await Promise.resolve(sessionStore.createSession(user.id));

    dataStore.createAuditEvent('user.signup', {
      actorUserId: user.id,
      requestId: req.requestId,
      resourceType: 'user',
      resourceId: user.id,
    });

    res.status(201).json({
      status: 'ok',
      user,
      token,
    });
  }
);

// ==========================================
// 2. LOGIN (Session rotation + Exponential Backoff)
// ==========================================

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
}).strict();

authRouter.post(
  '/login',
  authRateLimitMiddleware,
  validateRequest({ body: loginSchema }),
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const userRecord = dataStore.findUserByEmail(email);

    let isValid = false;
    if (userRecord) {
      isValid = await verifyPassword(password, userRecord.password_hash);
    }

    if (!isValid || !userRecord) {
      const failureInfo = await recordAuthFailure(req);
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
          request_id: req.requestId,
          retry_delay_ms: failureInfo.backoffMs,
        },
      });
      return;
    }

    // Reset failure penalty upon successful login
    await recordAuthSuccess(req);

    // Extract current token if present, and rotate to a new session token
    const oldAuthHeader = req.header('Authorization');
    const oldToken = oldAuthHeader?.startsWith('Bearer ') ? oldAuthHeader.substring(7).trim() : undefined;
    const newToken = await Promise.resolve(sessionStore.rotateSession(oldToken, userRecord.id));

    const safeUser = dataStore.findUserById(userRecord.id)!;

    dataStore.createAuditEvent('user.login', {
      actorUserId: safeUser.id,
      requestId: req.requestId,
      resourceType: 'user',
      resourceId: safeUser.id,
    });

    res.status(200).json({
      status: 'ok',
      user: safeUser,
      token: newToken,
    });
  }
);

// ==========================================
// 3. LOGOUT
// ==========================================

authRouter.post('/logout', async (req: Request, res: Response) => {
  const authHeader = req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    await Promise.resolve(sessionStore.revokeSession(token));
  }

  res.status(200).json({
    status: 'ok',
    message: 'Logged out successfully.',
  });
});

// ==========================================
// 4. CURRENT USER PROFILE (/me)
// ==========================================

authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    user: req.user,
  });
});
