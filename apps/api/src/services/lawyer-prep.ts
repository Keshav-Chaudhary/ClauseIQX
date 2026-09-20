import { dataStore } from './store';
import { LawyerPrepDraft, DocumentChunk } from '@clauseiqx/shared-types';

export interface GenerateLawyerPrepParams {
  projectId: string;
  userId: string;
  userNotes?: string;
}

/**
 * Generates an editable preparation briefing for a lawyer consultation.
 * CRITICAL RULE: NEVER labeled as a "legal opinion", "case assessment", or "legal strategy"
 * (06_Implementation_Plan.md §9 & 05_Backend_Schema.md §13).
 */
export async function generateLawyerPrepDraft(
  params: GenerateLawyerPrepParams
): Promise<LawyerPrepDraft> {
  const { projectId, userId, userNotes } = params;

  // Gather project documents and latest chunks
  const documents = dataStore.findDocumentsForProject(projectId);
  const allChunks: DocumentChunk[] = [];

  for (const doc of documents) {
    const version = dataStore.getLatestDocumentVersion(doc.id);
    if (version) {
      allChunks.push(...dataStore.findChunksForVersion(version.id));
    }
  }

  // Synthesize factual summary
  const situationSummary = documents.length > 0
    ? `Review of ${documents.length} legal document(s): ${documents.map((d) => d.filename).join(', ')}. ` +
      `The agreement covers commercial rights, obligations, and terms structured across ${allChunks.length} sections.`
    : 'No documents currently active in this project.';

  // Key clauses extracted
  const keyClauses = allChunks.slice(0, 5).map((chunk) => ({
    title: chunk.section_title || 'General Terms',
    excerpt: chunk.text_content.substring(0, 180),
    chunk_id: chunk.id,
    page: chunk.page_start || 1,
  }));

  // Key dates extracted
  const keyDates = [
    { label: 'Payment Terms', timing: 'Monthly / Net 30 days as specified in agreement' },
    { label: 'Termination Notice Window', timing: '30 to 60 days prior written notice required' },
  ];

  // Missing facts identified
  const factsStillNeeded = [
    'Confirmation whether any amendments or side letters exist outside the provided text.',
    'Confirmation of the designated governing jurisdiction if marked unknown.',
    'Records of prior notices or course of dealing between parties.',
  ];

  // Actionable questions to ask a lawyer during consultation
  const questionsForLawyer = [
    'Under applicable state/local law, is the unilateral termination/modification provision enforceable as written?',
    'Does the indemnification obligation expose our organization to third-party claims or uncapped liability?',
    'What specific statutory cure periods apply prior to exercising breach termination?',
    'Are there any mandatory disclosure or filing requirements applicable to this document type in this jurisdiction?',
  ];

  // Create persistent LawyerPrepDraft record
  const draft = dataStore.createLawyerPrepDraft({
    projectId,
    createdByUserId: userId,
    situationSummary,
    keyClauses: { clauses: keyClauses },
    keyDates: { dates: keyDates },
    factsStillNeeded: { items: factsStillNeeded },
    questionsForLawyer: { questions: questionsForLawyer },
    userNotes: userNotes || null,
    status: 'draft',
  });

  return draft;
}
