"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TesseractOCRProvider = void 0;
const tesseract_js_1 = __importDefault(require("tesseract.js"));
/**
 * Tesseract implementation of OCRProvider.
 * Uses Tesseract.js for client-side OCR of scanned documents.
 * Note: For production use with PDFs, consider using a server-side OCR service
 * or adding pdf-parse for text-based PDF extraction.
 */
class TesseractOCRProvider {
    async extract(fileBuffer, _mimeType) {
        try {
            // Convert buffer to base64 for Tesseract
            const base64 = fileBuffer.toString('base64');
            // Perform OCR using the direct API
            const result = await tesseract_js_1.default.recognize(base64, 'eng');
            // Extract page information (Tesseract doesn't natively handle multi-page PDFs well,
            // so we'll treat the entire document as one page for simplicity)
            const pages = [
                {
                    pageNumber: 1,
                    text: result.data.text,
                    confidence: result.data.confidence / 100, // Tesseract returns 0-100
                },
            ];
            return {
                text: result.data.text,
                pageCount: 1,
                pages,
                overallConfidence: result.data.confidence / 100,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Tesseract OCR failed: ${error.message}`);
            }
            throw new Error('Unknown error during Tesseract OCR');
        }
    }
    getProviderName() {
        return 'tesseract';
    }
}
exports.TesseractOCRProvider = TesseractOCRProvider;
//# sourceMappingURL=tesseract-ocr-provider.js.map