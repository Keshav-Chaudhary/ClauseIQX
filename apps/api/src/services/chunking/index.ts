/**
 * Document chunking orchestrator.
 * Normalizes and chunks extracted legal document text into structured chunks
 * with section titles, page mapping, and character offsets (02_TRD.md §6.2).
 *
 * Sub-modules:
 *  - section-detector: identifies legal section headings
 *  - paragraph-splitter: splits text into paragraph blocks
 *  - page-estimator: maps character offsets to page numbers
 */

import * as crypto from 'crypto';
import { DocumentChunk } from '@clauseiqx/shared-types';
import { detectSectionHeading } from './section-detector';
import { estimatePageRange } from './page-estimator';

export { detectSectionHeading } from './section-detector';
export { splitIntoParagraphs } from './paragraph-splitter';
export { estimatePageRange } from './page-estimator';
export type { PageEstimate } from './page-estimator';

export interface ChunkingOptions {
  maxChunkChars?: number;
  overlapChars?: number;
}

const DEFAULT_MAX_CHUNK_CHARS = 800;
const DEFAULT_OVERLAP_CHARS = 100;

/**
 * Normalizes and chunks extracted legal document text into structured chunks
 * with section titles, page mapping, and character offsets (02_TRD.md §6.2).
 */
export function chunkDocumentText(
  documentVersionId: string,
  fullText: string,
  pages: Array<{ pageNumber: number; text: string; confidence: number }> = [],
  options: ChunkingOptions = {}
): DocumentChunk[] {
  const maxChars = options.maxChunkChars || DEFAULT_MAX_CHUNK_CHARS;
  const overlap = options.overlapChars || DEFAULT_OVERLAP_CHARS;

  const chunks: DocumentChunk[] = [];
  const now = new Date().toISOString();

  // If text is empty or whitespace
  if (!fullText || !fullText.trim()) {
    return [];
  }

  // Split into paragraphs / logical blocks
  const rawParagraphs = fullText.split(/\n\s*\n+/);
  let globalCharOffset = 0;
  let currentChunkText = '';
  let currentSectionTitle = 'Preamble / General Provisions';
  let chunkStartOffset = 0;
  let chunkIndex = 0;

  for (const para of rawParagraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) {
      globalCharOffset += para.length + 2;
      continue;
    }

    // Check if paragraph looks like a section header
    const headingMatch = detectSectionHeading(trimmedPara);
    if (headingMatch) {
      if (currentChunkText.trim().length > 0) {
        const chunkEndOffset = chunkStartOffset + currentChunkText.length;
        const pageInfo = estimatePageRange(chunkStartOffset, chunkEndOffset, pages, fullText.length);

        chunks.push({
          id: crypto.randomUUID(),
          document_version_id: documentVersionId,
          chunk_index: chunkIndex++,
          text_content: currentChunkText.trim(),
          page_start: pageInfo.pageStart,
          page_end: pageInfo.pageEnd,
          section_title: currentSectionTitle,
          char_start: chunkStartOffset,
          char_end: chunkEndOffset,
          extraction_confidence: pageInfo.confidence,
          metadata: {
            section: currentSectionTitle,
          },
          created_at: now,
        });

        currentChunkText = '';
        chunkStartOffset = globalCharOffset;
      }
      currentSectionTitle = headingMatch;
    }

    if (currentChunkText.length + trimmedPara.length > maxChars && currentChunkText.length > 0) {
      // Flush current chunk
      const chunkEndOffset = chunkStartOffset + currentChunkText.length;
      const pageInfo = estimatePageRange(chunkStartOffset, chunkEndOffset, pages, fullText.length);

      chunks.push({
        id: crypto.randomUUID(),
        document_version_id: documentVersionId,
        chunk_index: chunkIndex++,
        text_content: currentChunkText.trim(),
        page_start: pageInfo.pageStart,
        page_end: pageInfo.pageEnd,
        section_title: currentSectionTitle,
        char_start: chunkStartOffset,
        char_end: chunkEndOffset,
        extraction_confidence: pageInfo.confidence,
        metadata: {
          section: currentSectionTitle,
          paragraphCount: 1,
        },
        created_at: now,
      });

      // Maintain slight overlap for context preservation
      const overlapText = currentChunkText.slice(-overlap);
      chunkStartOffset = chunkEndOffset - overlapText.length;
      currentChunkText = overlapText + '\n\n' + trimmedPara;
    } else {
      if (currentChunkText.length === 0) {
        chunkStartOffset = globalCharOffset;
        currentChunkText = trimmedPara;
      } else {
        currentChunkText += '\n\n' + trimmedPara;
      }
    }

    globalCharOffset += para.length + 2;
  }

  // Flush any remaining text
  if (currentChunkText.trim().length > 0) {
    const chunkEndOffset = chunkStartOffset + currentChunkText.length;
    const pageInfo = estimatePageRange(chunkStartOffset, chunkEndOffset, pages, fullText.length);

    chunks.push({
      id: crypto.randomUUID(),
      document_version_id: documentVersionId,
      chunk_index: chunkIndex++,
      text_content: currentChunkText.trim(),
      page_start: pageInfo.pageStart,
      page_end: pageInfo.pageEnd,
      section_title: currentSectionTitle,
      char_start: chunkStartOffset,
      char_end: chunkEndOffset,
      extraction_confidence: pageInfo.confidence,
      metadata: {
        section: currentSectionTitle,
      },
      created_at: now,
    });
  }

  return chunks;
}
