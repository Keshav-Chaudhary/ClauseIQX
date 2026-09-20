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
export declare function redactSensitiveObject(obj: unknown, depth?: number): unknown;
export declare class StructuredLogger {
    private contextName;
    constructor(contextName?: string);
    private write;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>, error?: Error): void;
    debug(message: string, meta?: Record<string, unknown>): void;
}
export declare const defaultLogger: StructuredLogger;
//# sourceMappingURL=index.d.ts.map