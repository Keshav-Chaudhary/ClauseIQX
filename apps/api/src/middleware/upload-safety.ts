import {
  validateUploadedFile,
  computeSha256,
  generateSecureKey,
  createValidationError,
} from '@clauseiqx/security';
import { ObjectStorage } from '@clauseiqx/ai';

export interface ProcessedUpload {
  storageObjectKey: string;
  filename: string;
  mediaType: string;
  byteSize: number;
  sha256: string;
}

export interface UploadSafetyOptions {
  maxSizeBytes?: number;
  allowedExtensions?: string[];
  quarantinePrefix?: string;
}

const DEFAULT_MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg']);

/**
 * Validates file safety and persists it to isolated private object storage.
 * - Validates file type, size, and magic bytes content (not just extension).
 * - Rejects any executable or malicious code payload.
 * - Stores outside web root in private storage with unguessable keys.
 * - Files stored with non-executable disposition.
 */
export async function processSafeUpload(
  fileBuffer: Buffer,
  declaredFilename: string,
  declaredMimeType: string,
  storage: ObjectStorage,
  options: UploadSafetyOptions = {},
  requestId = 'upload-request'
): Promise<{ success: true; upload: ProcessedUpload } | { success: false; statusCode: number; error: unknown }> {
  const maxBytes = options.maxSizeBytes || DEFAULT_MAX_SIZE_BYTES;

  // 1. Sanitize filename and extract extension
  const safeFilename = declaredFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const ext = safeFilename.split('.').pop()?.toLowerCase() || '';

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    const err = createValidationError(
      `File extension '.${ext}' is not permitted. Only PDF, DOCX, TXT, PNG, and JPG are accepted.`,
      requestId
    );
    return { success: false, statusCode: err.statusCode, error: err.payload };
  }

  // 2. Validate magic bytes, content, and file size (rejects executables/scripts)
  const validation = validateUploadedFile(declaredMimeType, fileBuffer, maxBytes);
  if (!validation.isValid) {
    const err = createValidationError(
      validation.error || 'The uploaded file failed security validation.',
      requestId
    );
    return { success: false, statusCode: err.statusCode, error: err.payload };
  }

  // 3. Compute SHA-256 integrity hash
  const sha256 = computeSha256(fileBuffer);

  // 4. Generate isolated, non-guessable storage key outside web root
  const prefix = options.quarantinePrefix || 'quarantine';
  const storageObjectKey = `${prefix}/${generateSecureKey('doc')}.${ext}`;

  // 5. Store in private object storage (never in public/web directory)
  await storage.put(storageObjectKey, fileBuffer, validation.detectedMimeType || declaredMimeType);

  return {
    success: true,
    upload: {
      storageObjectKey,
      filename: safeFilename,
      mediaType: validation.detectedMimeType || declaredMimeType,
      byteSize: fileBuffer.length,
      sha256,
    },
  };
}
