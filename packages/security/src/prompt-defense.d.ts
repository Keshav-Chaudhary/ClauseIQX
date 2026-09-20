/**
 * Prompt Injection Defense System
 * Meets the requirements of 02_TRD.md §5
 */
export interface DocumentChunkEvidence {
    chunk_id: string;
    text: string;
    page_number?: number;
    section_title?: string;
}
/**
 * Coarse, best-effort pre-filter for known literal phrases and obvious
 * executable payloads. This is not a prompt-injection defense by itself:
 * rephrased instructions will bypass it. Structural untrusted-evidence
 * isolation below is the primary defense.
 */
export declare const ADVERSARIAL_PATTERNS: RegExp[];
/**
 * Checks for a known literal pattern as an optional pre-filter. Callers must
 * still treat every document as untrusted, regardless of this result.
 */
export declare function containsAdversarialInstruction(text: string): boolean;
/**
 * Wraps retrieved evidence chunks into strictly delimited, inert XML tags
 * explicitly instructing the LLM that this content is untrusted data and NOT instructions.
 */
export declare function formatUntrustedEvidenceForPrompt(chunks: DocumentChunkEvidence[]): string;
/**
 * Standard system prompt preamble that enforces legal-information boundaries
 * and prompt injection defense across all LLM tasks.
 */
export declare const STANDARD_LEGAL_SYSTEM_PROMPT: string;
/**
 * Sanitizes input text by removing control characters and excessive trailing spaces.
 */
export declare function sanitizePromptText(text: string): string;
export declare const wrapEvidenceInInertTags: typeof formatUntrustedEvidenceForPrompt;
//# sourceMappingURL=prompt-defense.d.ts.map