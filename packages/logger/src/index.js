"use strict";
/**
 * Structured JSON Logger for ClauseIQX
 * Complies with 02_TRD.md §15 and PRD FR-36:
 * Excludes raw document text, prompts, model responses, passwords, and secrets.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = exports.StructuredLogger = void 0;
exports.redactSensitiveObject = redactSensitiveObject;
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
function redactSensitiveObject(obj, depth = 0) {
    if (depth > 5 || obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => redactSensitiveObject(item, depth + 1));
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (REDACTED_KEYS.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('secret')) {
            result[key] = '[REDACTED_SENSITIVE_DATA]';
        }
        else if (typeof value === 'object' && value !== null) {
            result[key] = redactSensitiveObject(value, depth + 1);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
class StructuredLogger {
    contextName;
    constructor(contextName = 'Application') {
        this.contextName = contextName;
    }
    write(level, message, meta, error) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: this.contextName,
        };
        if (meta) {
            const sanitizedMeta = redactSensitiveObject(meta);
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
        }
        else if (level === 'warn') {
            console.warn(output);
        }
        else {
            console.log(output);
        }
    }
    info(message, meta) {
        this.write('info', message, meta);
    }
    warn(message, meta) {
        this.write('warn', message, meta);
    }
    error(message, meta, error) {
        this.write('error', message, meta, error);
    }
    debug(message, meta) {
        if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') {
            this.write('debug', message, meta);
        }
    }
}
exports.StructuredLogger = StructuredLogger;
exports.defaultLogger = new StructuredLogger('ClauseIQX');
//# sourceMappingURL=index.js.map