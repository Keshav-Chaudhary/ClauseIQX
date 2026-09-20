import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RedisRateLimiter } from '../src/redis-rate-limiter';
import { defaultLogger } from '@clauseiqx/logger';

// Mock the logger to avoid console output during tests
vi.mock('@clauseiqx/logger', () => ({
  defaultLogger: {
    error: vi.fn(),
  },
}));

describe('RedisRateLimiter Failure Mode Tests', () => {
  let limiter: RedisRateLimiter;
  let mockRedis: {
    pipeline: ReturnType<typeof vi.fn>;
    hgetall: ReturnType<typeof vi.fn>;
    hmset: ReturnType<typeof vi.fn>;
    expire: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
    scan: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock Redis client that simulates failures
    mockRedis = {
      pipeline: vi.fn(),
      hgetall: vi.fn(),
      hmset: vi.fn(),
      expire: vi.fn(),
      del: vi.fn(),
      scan: vi.fn(),
    };

    // Create limiter with a mock Redis instance
    limiter = new RedisRateLimiter('redis://localhost:6379');
    // Replace the internal redis instance with our mock
    (limiter as { redis: typeof mockRedis }).redis = mockRedis;
  });

  describe('check() with Redis failures', () => {
    it('should fail-open when pipeline.exec() returns null', async () => {
      const mockPipeline = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zcard: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zrange: vi.fn().mockReturnThis(),
        pexpire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(null),
      };

      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const result = await limiter.check('test-key', {
        maxRequests: 10,
        windowMs: 60000,
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
      expect(defaultLogger.error).toHaveBeenCalledWith(
        'Redis rate limiter unavailable - failing open',
        { key: 'test-key' },
        undefined
      );
    });

    it('should fail-open when pipeline command returns an error', async () => {
      const mockPipeline = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zcard: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zrange: vi.fn().mockReturnThis(),
        pexpire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          [null, 1],           // zremrangebyscore success
          [new Error('Redis connection failed'), undefined], // zcard error
          [null, 1],           // zadd success
          [null, 1],           // zremrangebyscore success
          [null, ['timestamp', '1234567890']], // zrange success
          [null, 1],           // pexpire success
        ]),
      };

      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const result = await limiter.check('test-key', {
        maxRequests: 10,
        windowMs: 60000,
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
      expect(defaultLogger.error).toHaveBeenCalledWith(
        'Redis rate limiter unavailable - failing open',
        { key: 'test-key' },
        expect.any(Error)
      );
    });

    it('should fail-open when zrange result is undefined (original bug scenario)', async () => {
      const mockPipeline = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zcard: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zrange: vi.fn().mockReturnThis(),
        pexpire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          [null, 1],           // zremrangebyscore success
          [null, 0],           // zcard success
          [null, 1],           // zadd success
          [null, 1],           // zremrangebyscore success
          [new Error('Connection timeout'), undefined], // zrange error - this was causing the TypeError
          [null, 1],           // pexpire success
        ]),
      };

      mockRedis.pipeline.mockReturnValue(mockPipeline);

      // This should NOT throw a TypeError on undefined.length
      const result = await limiter.check('test-key', {
        maxRequests: 10,
        windowMs: 60000,
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
      expect(defaultLogger.error).toHaveBeenCalledWith(
        'Redis rate limiter unavailable - failing open',
        { key: 'test-key' },
        expect.any(Error)
      );
    });

    it('should work normally when all pipeline commands succeed', async () => {
      const mockPipeline = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zcard: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zrange: vi.fn().mockReturnThis(),
        pexpire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          [null, 1],           // zremrangebyscore success
          [null, 0],           // zcard success (0 requests in window)
          [null, 1],           // zadd success
          [null, 1],           // zremrangebyscore success
          [null, ['timestamp', '1234567890']], // zrange success
          [null, 1],           // pexpire success
        ]),
      };

      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const result = await limiter.check('test-key', {
        maxRequests: 10,
        windowMs: 60000,
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9); // 10 - 1 (current request)
      expect(defaultLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('checkAuthAttempt() with Redis failures', () => {
    it('should fail-open when hgetall fails', async () => {
      mockRedis.hgetall.mockRejectedValue(new Error('Redis connection failed'));

      // Mock the check() call to succeed (since it's called first)
      const mockPipeline = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zcard: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zrange: vi.fn().mockReturnThis(),
        pexpire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          [null, 1],
          [null, 0],
          [null, 1],
          [null, 1],
          [null, ['timestamp', '1234567890']],
          [null, 1],
        ]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const result = await limiter.checkAuthAttempt('192.168.1.1', 'user@example.com', {
        maxRequests: 5,
        windowMs: 60000,
        baseBackoffMs: 1000,
        maxBackoffMs: 60000,
        maxFailedAttemptsBeforeCooldown: 5,
        cooldownPeriodMs: 900000,
        keyPrefix: 'auth',
      });

      expect(result.allowed).toBe(true);
      expect(defaultLogger.error).toHaveBeenCalledWith(
        'Redis auth check unavailable - failing open',
        expect.any(Object),
        expect.any(Error)
      );
    });

    it('should fail-open when hgetall fails for IP-only check', async () => {
      mockRedis.hgetall.mockRejectedValue(new Error('Redis connection failed'));

      // Mock the check() call to succeed
      const mockPipeline = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zcard: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zrange: vi.fn().mockReturnThis(),
        pexpire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          [null, 1],
          [null, 0],
          [null, 1],
          [null, 1],
          [null, ['timestamp', '1234567890']],
          [null, 1],
        ]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const result = await limiter.checkAuthAttempt('192.168.1.1', undefined, {
        maxRequests: 5,
        windowMs: 60000,
        baseBackoffMs: 1000,
        maxBackoffMs: 60000,
        maxFailedAttemptsBeforeCooldown: 5,
        cooldownPeriodMs: 900000,
        keyPrefix: 'auth',
      });

      expect(result.allowed).toBe(true);
      expect(defaultLogger.error).toHaveBeenCalledWith(
        'Redis auth check unavailable - failing open',
        expect.any(Object),
        expect.any(Error)
      );
    });
  });

  describe('recordAuthFailure() with Redis failures', () => {
    it('should fail-open when hgetall fails', async () => {
      mockRedis.hgetall.mockRejectedValue(new Error('Redis connection failed'));

      const result = await limiter.recordAuthFailure('192.168.1.1', 'user@example.com', {
        maxRequests: 5,
        windowMs: 60000,
        baseBackoffMs: 1000,
        maxBackoffMs: 60000,
        maxFailedAttemptsBeforeCooldown: 5,
        cooldownPeriodMs: 900000,
        keyPrefix: 'auth',
      });

      expect(result.failedAttempts).toBe(1);
      expect(result.backoffMs).toBe(1000); // baseBackoffMs
      expect(result.lockedUntil).toBeGreaterThan(Date.now());
      expect(defaultLogger.error).toHaveBeenCalledWith(
        'Redis auth failure recording unavailable - failing open',
        expect.any(Object),
        expect.any(Error)
      );
    });

    it('should fail-open when hmset fails', async () => {
      mockRedis.hgetall.mockResolvedValue({});
      mockRedis.hmset.mockRejectedValue(new Error('Redis connection failed'));

      const result = await limiter.recordAuthFailure('192.168.1.1', 'user@example.com', {
        maxRequests: 5,
        windowMs: 60000,
        baseBackoffMs: 1000,
        maxBackoffMs: 60000,
        maxFailedAttemptsBeforeCooldown: 5,
        cooldownPeriodMs: 900000,
        keyPrefix: 'auth',
      });

      expect(result.failedAttempts).toBe(1);
      expect(result.backoffMs).toBe(1000);
      expect(defaultLogger.error).toHaveBeenCalledWith(
        'Redis auth failure recording unavailable - failing open',
        expect.any(Object),
        expect.any(Error)
      );
    });

    it('should fail-open when expire fails', async () => {
      mockRedis.hgetall.mockResolvedValue({});
      mockRedis.hmset.mockResolvedValue('OK');
      mockRedis.expire.mockRejectedValue(new Error('Redis connection failed'));

      const result = await limiter.recordAuthFailure('192.168.1.1', 'user@example.com', {
        maxRequests: 5,
        windowMs: 60000,
        baseBackoffMs: 1000,
        maxBackoffMs: 60000,
        maxFailedAttemptsBeforeCooldown: 5,
        cooldownPeriodMs: 900000,
        keyPrefix: 'auth',
      });

      expect(result.failedAttempts).toBe(1);
      expect(result.backoffMs).toBe(1000);
      expect(defaultLogger.error).toHaveBeenCalledWith(
        'Redis auth failure recording unavailable - failing open',
        expect.any(Object),
        expect.any(Error)
      );
    });
  });

  describe('resetAuthSuccess() with Redis failures', () => {
    it('should fail-open when del fails', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis connection failed'));

      // Should not throw
      await expect(
        limiter.resetAuthSuccess('192.168.1.1', 'user@example.com')
      ).resolves.not.toThrow();

      expect(defaultLogger.error).toHaveBeenCalledWith(
        'Redis auth success reset unavailable - failing open',
        expect.any(Object),
        expect.any(Error)
      );
    });

    it('should fail-open when del fails for IP-only reset', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis connection failed'));

      await expect(
        limiter.resetAuthSuccess('192.168.1.1', undefined)
      ).resolves.not.toThrow();

      expect(defaultLogger.error).toHaveBeenCalledWith(
        'Redis auth success reset unavailable - failing open',
        expect.any(Object),
        expect.any(Error)
      );
    });
  });

  describe('integration test with unreachable Redis', () => {
    it('should handle unreachable Redis without throwing TypeError', async () => {
      // Create a real RedisRateLimiter pointing to an unreachable port
      const unreachableLimiter = new RedisRateLimiter('redis://localhost:9999');
      
      // This should not throw a TypeError
      const result = await unreachableLimiter.check('test-key', {
        maxRequests: 10,
        windowMs: 60000,
      });

      // Should fail-open
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);

      // Clean up
      await (unreachableLimiter as { redis: { quit: () => Promise<void> } }).redis.quit();
    });
  });
});
