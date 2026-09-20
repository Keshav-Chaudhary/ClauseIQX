import { Request, Response, NextFunction } from 'express';
import {
  RateLimiterInterface,
  RateLimiterOptions,
  AuthRateLimiterOptions,
  createRateLimitError,
  createRateLimiter,
} from '@clauseiqx/security';
import { loadConfig } from '../config';

const config = loadConfig();
export const globalRateLimiter: RateLimiterInterface = createRateLimiter(config.REDIS_URL);

export function getClientIp(req: Request): string {
  const forwarded = req.header('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// ==========================================
// Configurable Thresholds from Environment
// ==========================================

export function getPublicRateLimitOptions(): RateLimiterOptions {
  return {
    maxRequests: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX_REQUESTS || '60', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS || '60000', 10), // 1 minute
    keyPrefix: 'public',
  };
}

export function getAuthRateLimitOptions(): AuthRateLimiterOptions {
  return {
    maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || '5', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000', 10), // 15 minutes
    baseBackoffMs: parseInt(process.env.RATE_LIMIT_AUTH_BASE_BACKOFF_MS || '1000', 10), // 1 second base
    maxBackoffMs: parseInt(process.env.RATE_LIMIT_AUTH_MAX_BACKOFF_MS || '60000', 10), // 1 minute max
    maxFailedAttemptsBeforeCooldown: parseInt(
      process.env.RATE_LIMIT_AUTH_MAX_FAILED_BEFORE_COOLDOWN || '5',
      10
    ),
    cooldownPeriodMs: parseInt(process.env.RATE_LIMIT_AUTH_COOLDOWN_MS || '900000', 10), // 15 min cooldown
    keyPrefix: 'auth',
  };
}

export function getAuthenticatedRateLimitOptions(): RateLimiterOptions {
  return {
    maxRequests: parseInt(process.env.RATE_LIMIT_AUTHENTICATED_MAX_REQUESTS || '300', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_AUTHENTICATED_WINDOW_MS || '60000', 10), // 1 minute
    keyPrefix: 'user',
  };
}

// ==========================================
// Middleware Functions
// ==========================================

export async function publicRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ip = getClientIp(req);
    const options = getPublicRateLimitOptions();
    const result = await Promise.resolve(globalRateLimiter.check(`ip:${ip}`, options));

    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTimeMs / 1000));

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfterSeconds);
      const err = createRateLimitError(result.retryAfterSeconds, req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

export async function authRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ip = getClientIp(req);
    const accountIdentifier = req.body?.email || req.body?.username;
    const options = getAuthRateLimitOptions();

    const result = await Promise.resolve(globalRateLimiter.checkAuthAttempt(ip, accountIdentifier, options));

    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTimeMs / 1000));

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfterSeconds);
      const err = createRateLimitError(result.retryAfterSeconds, req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

export async function authenticatedRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // If user is authenticated, key by user ID, otherwise fallback to IP
    const userKey = (req as unknown as { user?: { id: string } }).user?.id || `ip:${getClientIp(req)}`;
    const options = getAuthenticatedRateLimitOptions();
    const result = await Promise.resolve(globalRateLimiter.check(userKey, options));

    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTimeMs / 1000));

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfterSeconds);
      const err = createRateLimitError(result.retryAfterSeconds, req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Controller helper to record a failed login attempt for exponential backoff.
 */
export async function recordAuthFailure(req: Request): Promise<{
  backoffMs: number;
  lockedUntil: number;
  failedAttempts: number;
}> {
  const ip = getClientIp(req);
  const accountIdentifier = req.body?.email || req.body?.username;
  const options = getAuthRateLimitOptions();
  return Promise.resolve(globalRateLimiter.recordAuthFailure(ip, accountIdentifier, options));
}

/**
 * Controller helper to reset failed login attempts upon successful login.
 */
export async function recordAuthSuccess(req: Request): Promise<void> {
  const ip = getClientIp(req);
  const accountIdentifier = req.body?.email || req.body?.username;
  await Promise.resolve(globalRateLimiter.resetAuthSuccess(ip, accountIdentifier));
}
