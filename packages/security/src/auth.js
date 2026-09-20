"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionStore = exports.InMemorySessionStore = void 0;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const crypto = __importStar(require("crypto"));
const DEFAULT_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
/**
 * In-memory secure session store supporting rotation and revocation.
 * Used as the default / test implementation.
 */
class InMemorySessionStore {
    sessions = new Map();
    createSession(userId, ttlMs = DEFAULT_SESSION_TTL_MS) {
        const token = crypto.randomBytes(32).toString('hex');
        const now = Date.now();
        this.sessions.set(token, {
            token,
            userId,
            createdAt: now,
            expiresAt: now + ttlMs,
            lastRotatedAt: now,
        });
        return token;
    }
    /**
     * Session rotation on login (PRD FR-29 and TRD §4.1).
     * Revokes the old session token and issues a completely new one for the user.
     */
    rotateSession(oldToken, userId, ttlMs = DEFAULT_SESSION_TTL_MS) {
        if (oldToken) {
            this.sessions.delete(oldToken);
        }
        return this.createSession(userId, ttlMs);
    }
    validateSession(token) {
        const session = this.sessions.get(token);
        if (!session) {
            return null;
        }
        if (Date.now() > session.expiresAt) {
            this.sessions.delete(token);
            return null;
        }
        return { userId: session.userId };
    }
    revokeSession(token) {
        return this.sessions.delete(token);
    }
    clear() {
        this.sessions.clear();
    }
}
exports.InMemorySessionStore = InMemorySessionStore;
/**
 * Global session store instance.
 * Backwards-compatible: defaults to in-memory.
 * Use createSessionStore() from session-store-factory to get Redis-backed store.
 */
exports.sessionStore = new InMemorySessionStore();
/**
 * Hashes password using PBKDF2 with crypto salt.
 */
async function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
            if (err)
                reject(err);
            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
}
/**
 * Verifies password against stored salt and hash using timing-safe comparison.
 */
async function verifyPassword(password, storedHash) {
    return new Promise((resolve) => {
        const parts = storedHash.split(':');
        if (parts.length !== 2) {
            resolve(false);
            return;
        }
        const [salt, key] = parts;
        crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
            if (err) {
                resolve(false);
                return;
            }
            const keyBuffer = Buffer.from(key, 'hex');
            if (keyBuffer.length !== derivedKey.length) {
                resolve(false);
                return;
            }
            resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
        });
    });
}
//# sourceMappingURL=auth.js.map