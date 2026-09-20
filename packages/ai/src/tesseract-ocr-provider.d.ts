import { OCRProvider, OCRExtractResult } from './interfaces';
/**
 * Tesseract implementation of OCRProvider.
 * Uses Tesseract.js for client-side OCR of scanned documents.
 * Note: For production use with PDFs, consider using a server-side OCR service
 * or adding pdf-parse for text-based PDF extraction.
 */
export declare class TesseractOCRProvider implements OCRProvider {
    extract(fileBuffer: Buffer, _mimeType: string): Promise<OCRExtractResult>;
    getProviderName(): string;
}
//# sourceMappingURL=tesseract-ocr-provider.d.ts.map