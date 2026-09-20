/**
 * MIME type & magic bytes validation
 * Enforces TRD §4.4 and PRD FR-5 / FR-6
 */
export interface ValidationResult {
    isValid: boolean;
    detectedMimeType?: string;
    error?: string;
}
export declare function detectMagicBytesMime(buffer: Buffer): string | null;
export declare function validateUploadedFile(declaredMimeType: string, buffer: Buffer, maxSizeBytes?: number): ValidationResult;
//# sourceMappingURL=mime-validation.d.ts.map