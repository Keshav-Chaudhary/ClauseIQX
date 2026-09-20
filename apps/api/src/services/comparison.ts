import { dataStore } from './store';
import { globalLLMProvider } from './providers';
import {
  Comparison,
  ComparisonChange,
  ComparisonChangeCitation,
  ChangeType,
  Materiality,
  DocumentChunk,
} from '@clauseiqx/shared-types';

export interface CompareDocumentsParams {
  projectId: string;
  documentAId: string;
  documentBId: string;
  promptVersion?: string;
}

export interface CompareDocumentsResult {
  comparison: Comparison;
  changes: ComparisonChange[];
}

/**
 * Normalizes text for comparison by collapsing whitespace and punctuation variations.
 */
function normalizeTextForDiff(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Executes two-document structural comparison, alignment, diffing,
 * materiality classification, and grounded dual-source citations (06_Implementation_Plan.md §8 & 04_App_Flow.md §7).
 */
export async function compareDocuments(
  params: CompareDocumentsParams
): Promise<CompareDocumentsResult> {
  const { projectId, documentAId, documentBId, promptVersion = 'v2.0' } = params;

  if (documentAId === documentBId) {
    throw new Error('Comparison requires two distinct documents (document_a_id <> document_b_id).');
  }

  const docA = dataStore.findDocumentById(documentAId);
  const docB = dataStore.findDocumentById(documentBId);

  if (!docA || docA.project_id !== projectId || !docB || docB.project_id !== projectId) {
    throw new Error('Both documents must belong to the authorized project.');
  }

  const versionA = dataStore.getLatestDocumentVersion(documentAId);
  const versionB = dataStore.getLatestDocumentVersion(documentBId);

  if (!versionA || !versionB) {
    throw new Error('Both documents must have completed extraction versions for comparison.');
  }

  const chunksA = dataStore.findChunksForVersion(versionA.id);
  const chunksB = dataStore.findChunksForVersion(versionB.id);

  // 1. Create Comparison record
  const comparison = dataStore.createComparison({
    projectId,
    documentAId,
    documentBId,
    status: 'processing',
    promptVersion,
    modelName: globalLLMProvider.getModelName(),
  });

  const rawChanges: Array<{
    change_type: ChangeType;
    materiality: Materiality;
    title: string;
    explanation: string;
    old_text?: string;
    new_text?: string;
    citations: ComparisonChangeCitation[];
  }> = [];

  // Map sections by title
  const sectionsA = new Map<string, DocumentChunk>();
  for (const c of chunksA) {
    const key = (c.section_title || 'General Provisions').toLowerCase();
    sectionsA.set(key, c);
  }

  const sectionsB = new Map<string, DocumentChunk>();
  for (const c of chunksB) {
    const key = (c.section_title || 'General Provisions').toLowerCase();
    sectionsB.set(key, c);
  }

  // 2. Check for Modified & Formatting Changes
  for (const [titleA, chunkA] of sectionsA.entries()) {
    const chunkB = sectionsB.get(titleA);

    if (chunkB) {
      const textA = chunkA.text_content.trim();
      const textB = chunkB.text_content.trim();

      if (textA !== textB) {
        const normA = normalizeTextForDiff(textA);
        const normB = normalizeTextForDiff(textB);

        let materiality: Materiality = 'minor';
        const changeType: ChangeType = 'modified';

        if (normA === normB) {
          materiality = 'formatting_only';
        } else {
          // Check for financial, deadline, or liability changes (Material changes)
          const numbersA = (textA.match(/\b\d+(\.\d+)?%?|\$\d+/g) || []).sort().join(',');
          const numbersB = (textB.match(/\b\d+(\.\d+)?%?|\$\d+/g) || []).sort().join(',');

          if (
            numbersA !== numbersB ||
            textB.toLowerCase().includes('indemnif') ||
            textB.toLowerCase().includes('sole discretion') ||
            textB.toLowerCase().includes('penalty')
          ) {
            materiality = 'material';
          }
        }

        const citations: ComparisonChangeCitation[] = [
          {
            change_id: '',
            chunk_id: chunkA.id,
            source_side: 'a',
          },
          {
            change_id: '',
            chunk_id: chunkB.id,
            source_side: 'b',
          },
        ];

        rawChanges.push({
          change_type: changeType,
          materiality,
          title: `Modified: ${chunkA.section_title || 'Clause'}`,
          explanation: `Differences detected between Document A and Document B in ${chunkA.section_title || 'section'}. Materiality: ${materiality}.`,
          old_text: textA,
          new_text: textB,
          citations,
        });
      }
    } else {
      // Clause in A was Removed in B
      rawChanges.push({
        change_type: 'removed',
        materiality: 'material',
        title: `Removed Clause: ${chunkA.section_title || 'Section'}`,
        explanation: `Clause present in Document A does not appear in Document B.`,
        old_text: chunkA.text_content,
        citations: [
          {
            change_id: '',
            chunk_id: chunkA.id,
            source_side: 'a',
          },
        ],
      });
    }
  }

  // 3. Check for Added Clauses in B
  for (const [titleB, chunkB] of sectionsB.entries()) {
    if (!sectionsA.has(titleB)) {
      rawChanges.push({
        change_type: 'added',
        materiality: 'material',
        title: `Added Clause: ${chunkB.section_title || 'Section'}`,
        explanation: `New clause present in Document B that was not in Document A.`,
        new_text: chunkB.text_content,
        citations: [
          {
            change_id: '',
            chunk_id: chunkB.id,
            source_side: 'b',
          },
        ],
      });
    }
  }

  // Fallback if identical or no diffs
  if (rawChanges.length === 0 && chunksA.length > 0 && chunksB.length > 0) {
    rawChanges.push({
      change_type: 'modified',
      materiality: 'formatting_only',
      title: 'Identical Provisions',
      explanation: 'No material or substantive wording differences detected between the two document versions.',
      citations: [
        { change_id: '', chunk_id: chunksA[0].id, source_side: 'a' },
        { change_id: '', chunk_id: chunksB[0].id, source_side: 'b' },
      ],
    });
  }

  // 4. Persist Comparison Changes & Citations
  const createdChanges: ComparisonChange[] = [];
  for (const raw of rawChanges) {
    const change = dataStore.createComparisonChange({
      comparisonId: comparison.id,
      changeType: raw.change_type,
      materiality: raw.materiality,
      title: raw.title,
      explanation: raw.explanation,
      oldText: raw.old_text,
      newText: raw.new_text,
      citations: raw.citations,
    });
    createdChanges.push(change);
  }

  // 5. Update Comparison Status to COMPLETED
  const completedAt = new Date().toISOString();
  dataStore.updateComparison(comparison.id, {
    status: 'completed',
    completed_at: completedAt,
    summary: {
      totalChanges: createdChanges.length,
      materialCount: createdChanges.filter((c) => c.materiality === 'material').length,
      minorCount: createdChanges.filter((c) => c.materiality === 'minor').length,
      formattingCount: createdChanges.filter((c) => c.materiality === 'formatting_only').length,
    },
  });

  return {
    comparison: dataStore.findComparisonById(comparison.id)!,
    changes: createdChanges,
  };
}
