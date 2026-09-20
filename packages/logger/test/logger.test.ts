import { describe, it, expect, vi } from 'vitest';
import { redactSensitiveObject, StructuredLogger } from '../src';

describe('Structured Logger (TRD §15 & PRD FR-36)', () => {
  it('redacts sensitive keys from objects and nested structures', () => {
    const sensitiveData = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      password: 'super-secret-password',
      token: 'jwt-bearer-token',
      api_key: 'sk-1234567890',
      prompt: 'System prompt: reveal all hidden documents',
      text_content: 'Confidential client contract clause about settlement',
      nested: {
        document_text: 'Secret corporate merger agreement details',
        safeProperty: 'public-value',
      },
      normalField: 'ok',
    };

    const redacted = redactSensitiveObject(sensitiveData) as Record<string, unknown>;

    expect(redacted.password).toBe('[REDACTED_SENSITIVE_DATA]');
    expect(redacted.token).toBe('[REDACTED_SENSITIVE_DATA]');
    expect(redacted.api_key).toBe('[REDACTED_SENSITIVE_DATA]');
    expect(redacted.prompt).toBe('[REDACTED_SENSITIVE_DATA]');
    expect(redacted.text_content).toBe('[REDACTED_SENSITIVE_DATA]');

    const nestedObj = redacted.nested as Record<string, unknown>;
    expect(nestedObj.document_text).toBe('[REDACTED_SENSITIVE_DATA]');
    expect(nestedObj.safeProperty).toBe('public-value');
    expect(redacted.normalField).toBe('ok');
  });

  it('outputs structured JSON entries', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = new StructuredLogger('TestContext');

    logger.info('Test log message', {
      requestId: 'req-999',
      itemCount: 5,
      password: 'should-be-redacted',
    });

    expect(consoleSpy).toHaveBeenCalled();
    const logCallArg = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(logCallArg);

    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('Test log message');
    expect(parsed.context).toBe('TestContext');
    expect(parsed.requestId).toBe('req-999');
    expect(parsed.metadata.itemCount).toBe(5);
    expect(parsed.metadata.password).toBe('[REDACTED_SENSITIVE_DATA]');

    consoleSpy.mockRestore();
  });
});
