"use strict";
/**
 * MIME type & magic bytes validation
 * Enforces TRD §4.4 and PRD FR-5 / FR-6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectMagicBytesMime = detectMagicBytesMime;
exports.validateUploadedFile = validateUploadedFile;
const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'text/plain',
    'image/png',
    'image/jpeg',
]);
function detectMagicBytesMime(buffer) {
    if (!buffer || buffer.length === 0) {
        return null;
    }
    // Check for malicious executable binaries first (MZ / PE header)
    if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
        return 'application/x-dosexec';
    }
    // Check for Linux ELF executable header (\x7FELF)
    if (buffer.length >= 4 &&
        buffer[0] === 0x7f &&
        buffer[1] === 0x45 &&
        buffer[2] === 0x4c &&
        buffer[3] === 0x46) {
        return 'application/x-executable';
    }
    // PDF: %PDF-
    if (buffer.length >= 5 &&
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46 &&
        buffer[4] === 0x2d) {
        return 'application/pdf';
    }
    // PNG: \x89PNG\r\n\x1a\n
    if (buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a) {
        return 'image/png';
    }
    // JPEG: \xFF\xD8\xFF
    if (buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff) {
        return 'image/jpeg';
    }
    // DOCX / ZIP: PK\x03\x04
    if (buffer.length >= 4 &&
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        buffer[2] === 0x03 &&
        buffer[3] === 0x04) {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    // Text/plain check: valid ASCII / UTF-8 without non-printable control characters
    let isText = true;
    const sampleLength = Math.min(buffer.length, 1024);
    for (let i = 0; i < sampleLength; i++) {
        const byte = buffer[i];
        // Check for null bytes or control codes (except \t, \n, \r)
        if (byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)) {
            isText = false;
            break;
        }
    }
    if (isText) {
        const textSample = buffer.subarray(0, 2048).toString('utf-8').toLowerCase();
        // Check for HTML or embedded script payloads
        if (textSample.includes('<script') ||
            textSample.includes('<html') ||
            textSample.includes('<!doctype html') ||
            textSample.includes('javascript:')) {
            return 'text/html';
        }
        return 'text/plain';
    }
    return 'application/octet-stream';
}
function validateUploadedFile(declaredMimeType, buffer, maxSizeBytes = 25 * 1024 * 1024 // 25MB default limit
) {
    if (!buffer || buffer.length === 0) {
        return {
            isValid: false,
            error: 'The uploaded file is empty.',
        };
    }
    if (buffer.length > maxSizeBytes) {
        return {
            isValid: false,
            error: `File size exceeds the limit of ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`,
        };
    }
    const detected = detectMagicBytesMime(buffer);
    // Reject executables and scripts immediately
    if (detected === 'application/x-dosexec' ||
        detected === 'application/x-executable') {
        return {
            isValid: false,
            detectedMimeType: detected,
            error: 'Executable files are prohibited for security reasons.',
        };
    }
    if (detected === 'text/html') {
        return {
            isValid: false,
            detectedMimeType: detected,
            error: 'HTML or script payloads are prohibited for security reasons.',
        };
    }
    if (!detected || !ALLOWED_MIME_TYPES.has(detected)) {
        return {
            isValid: false,
            detectedMimeType: detected ?? 'unknown',
            error: 'Unsupported file format. Please upload PDF, DOCX, TXT, PNG, or JPG.',
        };
    }
    // If declared type mismatches detected type (e.g., .exe renamed to .pdf)
    if (declaredMimeType &&
        declaredMimeType !== detected &&
        // Allow general text MIME variations
        !(declaredMimeType.startsWith('text/') && detected === 'text/plain')) {
        return {
            isValid: false,
            detectedMimeType: detected,
            error: 'File contents do not match declared file extension or MIME type.',
        };
    }
    return {
        isValid: true,
        detectedMimeType: detected,
    };
}
//# sourceMappingURL=mime-validation.js.map