import { ApiError } from '@clauseiqx/shared-types';
export declare class AppSecurityException extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly userMessage: string;
    constructor(statusCode: number, code: string, userMessage: string);
}
/**
 * Creates a non-enumerating 404 error when a resource does not exist OR
 * the user lacks permission to access it.
 * This prevents timing and existence probing attacks across tenants.
 */
export declare function createNotFoundOrForbiddenError(resourceType: string, requestId: string): {
    statusCode: number;
    payload: ApiError;
};
export declare function createUnauthorizedError(requestId: string): {
    statusCode: number;
    payload: ApiError;
};
export declare function createValidationError(message: string, requestId: string): {
    statusCode: number;
    payload: ApiError;
};
export declare function createRateLimitError(retryAfterSeconds: number, requestId: string): {
    statusCode: number;
    payload: ApiError;
    retryAfterSeconds: number;
};
/**
 * Sanitizes error messages sent to external clients to ensure
 * internal filesystem paths, SQL syntax, or server specifics never leak.
 */
export declare function sanitizeErrorMessage(rawMessage: string): string;
//# sourceMappingURL=non-enumerating-errors.d.ts.map