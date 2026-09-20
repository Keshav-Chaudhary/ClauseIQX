/**
 * Structured JSON Logger for ClauseIQX
 * Complies with 02_TRD.md §15 and PRD FR-36:
 * Excludes raw document text, prompts, model responses, passwords, and secrets.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  context?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const REDACTED_KEYS = new Set([
  'password',
  'secret',
  'token',
  'authorization',
  'cookie',
  'prompt',
  'systemprompt',
  'userprompt',
  'text_content',
  'document_text',
  'rawtext',
  'chunk_text',
  'apikey',
  'api_key',
  'llm_api_key',
]);

export function redactSensitiveObject(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveObject(item, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (REDACTED_KEYS.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('secret')) {
      result[key] = '[REDACTED_SENSITIVE_DATA]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveObject(value, depth + 1);
    } else {
      result[key] = value;
    }
  }

  return result;
}

export class StructuredLogger {
  private contextName: string;

  constructor(contextName = 'Application') {
    this.contextName = contextName;
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.contextName,
    };

    if (meta) {
      const sanitizedMeta = redactSensitiveObject(meta) as Record<string, unknown>;
      if (sanitizedMeta.requestId && typeof sanitizedMeta.requestId === 'string') {
        entry.requestId = sanitizedMeta.requestId;
        delete sanitizedMeta.requestId;
      }
      entry.metadata = sanitizedMeta;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        // In production, stacks can be excluded or kept for internal debugging
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      };
    }

    const output = JSON.stringify(entry);
    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>, error?: Error): void {
    this.write('error', message, meta, error);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') {
      this.write('debug', message, meta);
    }
  }
}

export const defaultLogger = new StructuredLogger('ClauseIQX');
