"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLLMProvider = createLLMProvider;
exports.createEmbeddingProvider = createEmbeddingProvider;
exports.createOCRProvider = createOCRProvider;
const mocks_1 = require("./mocks");
const openai_llm_provider_1 = require("./openai-llm-provider");
const openai_embedding_provider_1 = require("./openai-embedding-provider");
const tesseract_ocr_provider_1 = require("./tesseract-ocr-provider");
/**
 * Factory functions to create provider instances based on configuration.
 * Allows switching between mock and real implementations via environment variables.
 */
function createLLMProvider(provider) {
    switch (provider.toLowerCase()) {
        case 'openai':
            return new openai_llm_provider_1.OpenAILLMProvider();
        case 'mock':
        default:
            return new mocks_1.MockLLMProvider();
    }
}
function createEmbeddingProvider(provider) {
    switch (provider.toLowerCase()) {
        case 'openai':
            return new openai_embedding_provider_1.OpenAIEmbeddingProvider();
        case 'mock':
        default:
            return new mocks_1.MockEmbeddingProvider();
    }
}
function createOCRProvider(provider) {
    switch (provider.toLowerCase()) {
        case 'tesseract':
            return new tesseract_ocr_provider_1.TesseractOCRProvider();
        case 'mock':
        default:
            return new mocks_1.MockOCRProvider();
    }
}
//# sourceMappingURL=provider-factory.js.map