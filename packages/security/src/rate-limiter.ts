/**
 * Multi-Tiered Rate Limiter with Exponential Backoff
 * Meets security requirements for auth, public, and authenticated routes.
 */

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export interface AuthRateLimiterOptions extends RateLimiterOptions {
  baseBackoffMs: number; // e.g. 1000ms
  maxBackoffMs: number;  // e.g. 60000ms
  maxFailedAttemptsBeforeCooldown: number; // e.g. 5
  cooldownPeriodMs: number; // e.g. 900000ms (15 min)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds: number;
  currentBackoffMs?: number;
}

interface RequestRecord {
  timestamps: number[];
}

interface AuthFailureRecord {
  failedAttempts: number;
  lastFailureTime: number;
  lockedUntil: number;
}

export interface RateLimiterInterface {
  check(key: string, options: RateLimiterOptions): RateLimitResult | Promise<RateLimitResult>;
  checkAuthAttempt(
    ip: string,
    accountIdentifier: string | undefined,
    options: AuthRateLimiterOptions
  ): RateLimitResult | Promise<RateLimitResult>;
  recordAuthFailure(
    ip: string,
    accountIdentifier: string | undefined,
    options: AuthRateLimiterOptions
  ): { backoffMs: number; lockedUntil: number; failedAttempts: number } | Promise<{ backoffMs: number; lockedUntil: number; failedAttempts: number }>;
  resetAuthSuccess(ip: string, accountIdentifier: string | undefined): void | Promise<void>;
  clear(): void | Promise<void>;
}

/**
 * In-memory sliding window rate limiter with account + IP dual-key tracking
 * and progressive exponential backoff for failed authentication attempts.
 */
export class InMemoryRateLimiter implements RateLimiterInterface {
  private requests = new Map<string, RequestRecord>();
  private authFailures = new Map<string, AuthFailureRecord>();

  /**
   * Cleans up expired entries periodically to prevent memory growth.
   */
  private cleanup(now: number, windowMs: number): void {
    for (const [key, record] of this.requests.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        this.requests.delete(key);
      }
    }

    for (const [key, record] of this.authFailures.entries()) {
      if (now > record.lockedUntil && now - record.lastFailureTime > windowMs * 2) {
        this.authFailures.delete(key);
      }
    }
  }

  /**
   * Standard sliding-window rate limit check.
   */
  check(key: string, options: RateLimiterOptions): RateLimitResult {
    const now = Date.now();
    this.cleanup(now, options.windowMs);

    const fullKey = `${options.keyPrefix ?? 'rate'}:${key}`;
    const record = this.requests.get(fullKey) ?? { timestamps: [] };

    // Filter to timestamps within current sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < options.windowMs);

    if (record.timestamps.length >= options.maxRequests) {
      const oldest = record.timestamps[0];
      const resetTimeMs = oldest + options.windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

      return {
        allowed: false,
        remaining: 0,
        resetTimeMs,
        retryAfterSeconds,
      };
    }

    // Record this request
    record.timestamps.push(now);
    this.requests.set(fullKey, record);

    const remaining = options.maxRequests - record.timestamps.length;
    const resetTimeMs = now + options.windowMs;

    return {
      allowed: true,
      remaining,
      resetTimeMs,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Checks whether an authentication request is currently throttled by
   * exponential backoff or cooldown.
   */
  checkAuthAttempt(
    ip: string,
    accountIdentifier: string | undefined,
    options: AuthRateLimiterOptions
  ): RateLimitResult {
    const now = Date.now();
    this.cleanup(now, options.windowMs);

    // Check IP sliding window first
    const ipCheck = this.check(`ip:${ip}`, options);
    if (!ipCheck.allowed) {
      return ipCheck;
    }

    // Check account identifier if provided (e.g., lowercase email)
    if (accountIdentifier) {
      const normalizedAccount = accountIdentifier.trim().toLowerCase();
      const failureKey = `auth_fail:acc:${normalizedAccount}`;
      const failRecord = this.authFailures.get(failureKey);

      if (failRecord && failRecord.lockedUntil > now) {
        const retryAfterSeconds = Math.max(1, Math.ceil((failRecord.lockedUntil - now) / 1000));
        return {
          allowed: false,
          remaining: 0,
          resetTimeMs: failRecord.lockedUntil,
          retryAfterSeconds,
          currentBackoffMs: failRecord.lockedUntil - now,
        };
      }
    }

    // Also check IP failure record
    const ipFailureKey = `auth_fail:ip:${ip}`;
    const ipFailRecord = this.authFailures.get(ipFailureKey);
    if (ipFailRecord && ipFailRecord.lockedUntil > now) {
      const retryAfterSeconds = Math.max(1, Math.ceil((ipFailRecord.lockedUntil - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetTimeMs: ipFailRecord.lockedUntil,
        retryAfterSeconds,
        currentBackoffMs: ipFailRecord.lockedUntil - now,
      };
    }

    return {
      allowed: true,
      remaining: ipCheck.remaining,
      resetTimeMs: ipCheck.resetTimeMs,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Records a failed authentication attempt and calculates progressive exponential backoff.
   * delay = baseBackoff * 2^(failedAttempts - 1)
   */
  recordAuthFailure(
    ip: string,
    accountIdentifier: string | undefined,
    options: AuthRateLimiterOptions
  ): { backoffMs: number; lockedUntil: number; failedAttempts: number } {
    const now = Date.now();

    const updateRecord = (key: string): { backoffMs: number; lockedUntil: number; failedAttempts: number } => {
      const existing = this.authFailures.get(key) ?? {
        failedAttempts: 0,
        lastFailureTime: now,
        lockedUntil: 0,
      };

      existing.failedAttempts += 1;
      existing.lastFailureTime = now;

      let backoffMs: number;
      if (existing.failedAttempts >= options.maxFailedAttemptsBeforeCooldown) {
        backoffMs = options.cooldownPeriodMs;
      } else {
        // Exponential backoff calculation
        const calculatedBackoff = options.baseBackoffMs * Math.pow(2, existing.failedAttempts - 1);
        backoffMs = Math.min(calculatedBackoff, options.maxBackoffMs);
      }

      existing.lockedUntil = now + backoffMs;
      this.authFailures.set(key, existing);

      return {
        backoffMs,
        lockedUntil: existing.lockedUntil,
        failedAttempts: existing.failedAttempts,
      };
    };

    // Update IP failure record
    const ipResult = updateRecord(`auth_fail:ip:${ip}`);

    // Update account failure record if account provided
    if (accountIdentifier) {
      const normalizedAccount = accountIdentifier.trim().toLowerCase();
      updateRecord(`auth_fail:acc:${normalizedAccount}`);
    }

    return ipResult;
  }

  /**
   * Resets failed attempt counter on successful login.
   */
  resetAuthSuccess(ip: string, accountIdentifier: string | undefined): void {
    this.authFailures.delete(`auth_fail:ip:${ip}`);
    if (accountIdentifier) {
      const normalizedAccount = accountIdentifier.trim().toLowerCase();
      this.authFailures.delete(`auth_fail:acc:${normalizedAccount}`);
    }
  }

  /**
   * Clears all tracking records (primarily for testing).
   */
  clear(): void {
    this.requests.clear();
    this.authFailures.clear();
  }
}

export const RateLimiter = InMemoryRateLimiter;
