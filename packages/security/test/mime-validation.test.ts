import { describe, it, expect } from 'vitest';
import {
  detectMagicBytesMime,
  validateUploadedFile,
} from '../src/mime-validation';

describe('MIME & Magic Bytes Validation (TRD §4.4)', () => {
  it('detects PDF magic bytes correctly', () => {
    const pdfBuffer = Buffer.from('%PDF-1.7\nSample content');
    expect(detectMagicBytesMime(pdfBuffer)).toBe('application/pdf');

    const validation = validateUploadedFile('application/pdf', pdfBuffer);
    expect(validation.isValid).toBe(true);
    expect(validation.detectedMimeType).toBe('application/pdf');
  });

  it('detects PNG magic bytes correctly', () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect(detectMagicBytesMime(pngHeader)).toBe('image/png');

    const validation = validateUploadedFile('image/png', pngHeader);
    expect(validation.isValid).toBe(true);
  });

  it('detects JPEG magic bytes correctly', () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(detectMagicBytesMime(jpegHeader)).toBe('image/jpeg');

    const validation = validateUploadedFile('image/jpeg', jpegHeader);
    expect(validation.isValid).toBe(true);
  });

  it('detects DOCX / PK-Zip container magic bytes correctly', () => {
    const docxHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    expect(detectMagicBytesMime(docxHeader)).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  });

  it('detects plain text files correctly', () => {
    const textBuffer = Buffer.from('This is a plain text legal agreement with standard words.\nSection 1.');
    expect(detectMagicBytesMime(textBuffer)).toBe('text/plain');

    const validation = validateUploadedFile('text/plain', textBuffer);
    expect(validation.isValid).toBe(true);
  });

  it('REJECTS Windows executable renamed with a .pdf extension (MZ header attack)', () => {
    // MZ header simulating malware.exe renamed to contract.pdf
    const maliciousExeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
    expect(detectMagicBytesMime(maliciousExeBuffer)).toBe('application/x-dosexec');

    const validation = validateUploadedFile('application/pdf', maliciousExeBuffer);
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain('Executable files are prohibited');
  });

  it('REJECTS Linux ELF executable renamed as a document', () => {
    const elfBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01]);
    expect(detectMagicBytesMime(elfBuffer)).toBe('application/x-executable');

    const validation = validateUploadedFile('application/pdf', elfBuffer);
    expect(validation.isValid).toBe(false);
  });

  it('REJECTS oversized files exceeding size limit', () => {
    const fakeFile = Buffer.alloc(100);
    const validation = validateUploadedFile('text/plain', fakeFile, 50); // limit 50 bytes
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain('exceeds the limit');
  });

  it('REJECTS empty files', () => {
    const emptyFile = Buffer.alloc(0);
    const validation = validateUploadedFile('text/plain', emptyFile);
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain('empty');
  });
});
