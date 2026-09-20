/**
 * Paragraph splitting utilities for legal document text.
 * Splits raw extracted text into logical paragraph blocks
 * for downstream chunking (02_TRD.md §6.2).
 */

/**
 * Splits full document text into trimmed, non-empty paragraph blocks.
 * Uses double-newline boundaries as paragraph delimiters.
 */
export function splitIntoParagraphs(fullText: string): string[] {
  return fullText.split(/\n\s*\n+/).filter((p) => p.trim().length > 0);
}
