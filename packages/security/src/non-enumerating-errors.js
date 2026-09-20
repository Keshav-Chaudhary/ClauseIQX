"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSecurityException = void 0;
exports.createNotFoundOrForbiddenError = createNotFoundOrForbiddenError;
exports.createUnauthorizedError = createUnauthorizedError;
exports.createValidationError = createValidationError;
exports.createRateLimitError = createRateLimitError;
exports.sanitizeErrorMessage = sanitizeErrorMessage;
class AppSecurityException extends Error {
    statusCode;
    code;
    userMessage;
    constructor(statusCode, code, userMessage) {
        super(userMessage);
        this.name = 'AppSecurityException';
        this.statusCode = statusCode;
        this.code = code;
        this.userMessage = userMessage;
    }
}
exports.AppSecurityException = AppSecurityException;
/**
 * Creates a non-enumerating 404 error when a resource does not exist OR
 * the user lacks permission to access it.
 * This prevents timing and existence probing attacks across tenants.
 */
function createNotFoundOrForbiddenError(resourceType, requestId) {
    return {
        statusCode: 404,
        payload: {
            error: {
                code: 'RESOURCE_NOT_FOUND',
                message: `The requested ${resourceType.toLowerCase()} was not found.`,
                request_id: requestId,
            },
        },
    };
}
function createUnauthorizedError(requestId) {
    return {
        statusCode: 401,
        payload: {
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication is required to access this resource.',
                request_id: requestId,
            },
        },
    };
}
function createValidationError(message, requestId) {
    return {
        statusCode: 400,
        payload: {
            error: {
                code: 'VALIDATION_FAILED',
                message: sanitizeErrorMessage(message),
                request_id: requestId,
            },
        },
    };
}
function createRateLimitError(retryAfterSeconds, requestId) {
    return {
        statusCode: 429,
        retryAfterSeconds,
        payload: {
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: `Too many requests. Please retry in ${retryAfterSeconds} second${retryAfterSeconds === 1 ? '' : 's'}.`,
                request_id: requestId,
            },
        },
    };
}
/**
 * Sanitizes error messages sent to external clients to ensure
 * internal filesystem paths, SQL syntax, or server specifics never leak.
 */
function sanitizeErrorMessage(rawMessage) {
    if (!rawMessage) {
        return 'An unexpected error occurred.';
    }
    // Detect and scrub filesystem paths (Windows C:\ or Unix /home/, /var/)
    if (/[a-zA-Z]:\\[^ \t\r\n]+/.test(rawMessage) || /\/(home|var|etc|usr|tmp|app|node_modules)\/[^ \t\r\n]+/.test(rawMessage)) {
        return 'A system resource error occurred.';
    }
    // Detect and scrub raw SQL syntax or database errors
    if (/select\s+|insert\s+into|update\s+|delete\s+from|drop\s+table/i.test(rawMessage) ||
        /syntax\s+error\s+at\s+or\s+near|relation\s+"[^"]+"\s+does\s+not\s+exist|column\s+"[^"]+"\s+does\s+not\s+exist/i.test(rawMessage)) {
        return 'A database operation error occurred.';
    }
    // Detect stack trace indicators
    if (/at\s+[a-zA-Z0-9_.]+\s+\([^)]+\)/.test(rawMessage) || /Error:\s+/.test(rawMessage)) {
        return 'An internal processing error occurred.';
    }
    return rawMessage;
}
//# sourceMappingURL=non-enumerating-errors.js.map