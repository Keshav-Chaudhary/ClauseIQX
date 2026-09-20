import { z } from 'zod';
import { LLMProvider, LLMPromptPayload, StructuredAnswer } from './interfaces';
/**
 * OpenAI implementation of LLMProvider.
 * Uses OpenAI API for structured text generation and classification.
 */
export declare class OpenAILLMProvider implements LLMProvider {
    private client;
    private model;
    constructor(apiKey?: string, model?: string);
    generateStructured<T>(prompt: LLMPromptPayload, schema: z.ZodType<T>): Promise<StructuredAnswer<T>>;
    streamStructured<T>(prompt: LLMPromptPayload, schema: z.ZodType<T>, onChunk: (partialText: string) => void): Promise<StructuredAnswer<T>>;
    classify(input: string, categories: string[]): Promise<{
        category: string;
        confidence: number;
    }>;
    getModelName(): string;
}
//# sourceMappingURL=openai-llm-provider.d.ts.map