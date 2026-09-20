import OpenAI from 'openai';
import { z } from 'zod';
import {
  LLMProvider,
  LLMPromptPayload,
  StructuredAnswer,
} from './interfaces';
import { formatUntrustedEvidenceForPrompt } from '@clauseiqx/security';

/**
 * OpenAI implementation of LLMProvider.
 * Uses OpenAI API for structured text generation and classification.
 */
export class OpenAILLMProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.LLM_API_KEY;
    if (!key) {
      throw new Error('OpenAI API key is required. Set LLM_API_KEY environment variable or pass apiKey parameter.');
    }
    
    this.client = new OpenAI({ apiKey: key });
    this.model = model || process.env.LLM_MODEL || 'gpt-4o-mini';
  }

  async generateStructured<T>(
    prompt: LLMPromptPayload,
    schema: z.ZodType<T>
  ): Promise<StructuredAnswer<T>> {
    const { systemPrompt, userPrompt, evidence, maxTokens, temperature } = prompt;

    // Build the full prompt with evidence context
    let fullUserPrompt = userPrompt;
    if (evidence && evidence.length > 0) {
      const evidenceText = formatUntrustedEvidenceForPrompt(evidence);
      fullUserPrompt = `${evidenceText}\n\nBased on the above evidence, ${userPrompt}`;
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullUserPrompt },
        ],
        max_tokens: maxTokens || 2000,
        temperature: temperature || 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from OpenAI API');
      }

      // Parse the structured response
      const parsed = JSON.parse(content);
      
      // Validate against schema if data is present
      let validatedData: T | undefined;
      if (parsed.data) {
        validatedData = schema.parse(parsed.data);
      }

      return {
        answer: parsed.answer || content,
        data: validatedData,
        claims: parsed.claims || [],
        limitations: parsed.limitations || [],
        needs_professional_review: parsed.needs_professional_review || false,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI LLM generation failed: ${error.message}`);
      }
      throw new Error('Unknown error during OpenAI LLM generation');
    }
  }

  async streamStructured<T>(
    prompt: LLMPromptPayload,
    schema: z.ZodType<T>,
    onChunk: (partialText: string) => void
  ): Promise<StructuredAnswer<T>> {
    const { systemPrompt, userPrompt, evidence, maxTokens, temperature } = prompt;

    // Build the full prompt with evidence context
    let fullUserPrompt = userPrompt;
    if (evidence && evidence.length > 0) {
      const evidenceText = formatUntrustedEvidenceForPrompt(evidence);
      fullUserPrompt = `${evidenceText}\n\nBased on the above evidence, ${userPrompt}`;
    }

    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullUserPrompt },
        ],
        max_tokens: maxTokens || 2000,
        temperature: temperature || 0.3,
        stream: true,
      });

      let fullContent = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullContent += content;
          onChunk(fullContent);
        }
      }

      // Parse the final response
      const parsed = JSON.parse(fullContent);
      
      // Validate against schema if data is present
      let validatedData: T | undefined;
      if (parsed.data) {
        validatedData = schema.parse(parsed.data);
      }

      return {
        answer: parsed.answer || fullContent,
        data: validatedData,
        claims: parsed.claims || [],
        limitations: parsed.limitations || [],
        needs_professional_review: parsed.needs_professional_review || false,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI LLM streaming failed: ${error.message}`);
      }
      throw new Error('Unknown error during OpenAI LLM streaming');
    }
  }

  async classify(
    input: string,
    categories: string[]
  ): Promise<{ category: string; confidence: number }> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a classifier. Given an input, classify it into one of these categories: ${categories.join(', ')}. Respond with JSON: {"category": "category_name", "confidence": 0.0-1.0}`,
          },
          { role: 'user', content: input },
        ],
        max_tokens: 100,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from OpenAI API');
      }

      const parsed = JSON.parse(content);
      return {
        category: parsed.category || categories[0],
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI classification failed: ${error.message}`);
      }
      throw new Error('Unknown error during OpenAI classification');
    }
  }

  getModelName(): string {
    return this.model;
  }
}
