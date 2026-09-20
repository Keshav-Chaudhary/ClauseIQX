export interface SessionInfo {
    token: string;
    userId: string;
    createdAt: number;
    expiresAt: number;
    lastRotatedAt: number;
}
/**
 * Pluggable session store interface.
 * Follows the same abstraction pattern as ObjectStorage/LLMProvider.
 */
export interface SessionStoreInterface {
    createSession(userId: string, ttlMs?: number): string | Promise<string>;
    rotateSession(oldToken: string | undefined, userId: string, ttlMs?: number): string | Promise<string>;
    validateSession(token: string): Promise<{
        userId: string;
    } | null> | {
        userId: string;
    } | null;
    revokeSession(token: string): boolean | Promise<boolean>;
    clear(): void | Promise<void>;
}
/**
 * In-memory secure session store supporting rotation and revocation.
 * Used as the default / test implementation.
 */
export declare class InMemorySessionStore implements SessionStoreInterface {
    private sessions;
    createSession(userId: string, ttlMs?: number): string;
    /**
     * Session rotation on login (PRD FR-29 and TRD §4.1).
     * Revokes the old session token and issues a completely new one for the user.
     */
    rotateSession(oldToken: string | undefined, userId: string, ttlMs?: number): string;
    validateSession(token: string): {
        userId: string;
    } | null;
    revokeSession(token: string): boolean;
    clear(): void;
}
/**
 * Global session store instance.
 * Backwards-compatible: defaults to in-memory.
 * Use createSessionStore() from session-store-factory to get Redis-backed store.
 */
export declare const sessionStore: SessionStoreInterface;
/**
 * Hashes password using PBKDF2 with crypto salt.
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verifies password against stored salt and hash using timing-safe comparison.
 */
export declare function verifyPassword(password: string, storedHash: string): Promise<boolean>;
//# sourceMappingURL=auth.d.ts.map