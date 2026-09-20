import { dataStore } from './store';
import { globalEmbeddingProvider } from './providers';
import { DocumentChunk } from '@clauseiqx/shared-types';

export interface RetrievedChunk {
  chunk: DocumentChunk;
  documentId: string;
  score: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
}

/**
 * Calculates cosine similarity between two unit-length or arbitrary vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'what', 'this', 'that', 'with', 'from',
  'have', 'has', 'had', 'was', 'were', 'will', 'shall', 'can', 'could',
  'should', 'would', 'any', 'all', 'such', 'into', 'each', 'other',
  'how', 'why', 'who', 'whom', 'which', 'where', 'when', 'does', 'been',
  'about', 'above', 'below', 'under', 'over', 'both', 'some', 'these', 'those',
]);

/**
 * Computes BM25-like keyword matching score for a query against chunk text and section title.
 */
function keywordRelevanceScore(query: string, chunk: DocumentChunk): number {
  const queryTerms = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
  if (queryTerms.length === 0) return 0;

  const contentWords = new Set(
    `${chunk.text_content} ${chunk.section_title || ''}`.toLowerCase().split(/\W+/)
  );

  let matchCount = 0;
  for (const term of queryTerms) {
    if (contentWords.has(term)) {
      matchCount += 1;
    }
  }

  // Exact phrase match bonus
  if (chunk.text_content.toLowerCase().includes(query.toLowerCase().trim())) {
    matchCount += 3;
  }

  return Math.min(1.0, matchCount / (queryTerms.length + 2));
}

/**
 * Executes hybrid retrieval (Semantic Vector Search + Keyword Matching)
 * strictly scoped to the project (and optionally document) to ensure tenant isolation (02_TRD.md §6.3).
 */
export async function retrieveHybridChunks(params: {
  projectId: string;
  documentId?: string;
  query: string;
  topK?: number;
  minScoreThreshold?: number;
}): Promise<RetrievedChunk[]> {
  const topK = params.topK || 5;
  const minScore = params.minScoreThreshold ?? 0.15;

  // 1. Fetch documents belonging ONLY to this project (tenant isolation boundary)
  const projectDocs = dataStore.findDocumentsForProject(params.projectId);
  const targetDocs = params.documentId
    ? projectDocs.filter((d) => d.id === params.documentId)
    : projectDocs;

  if (targetDocs.length === 0) {
    return [];
  }

  // 2. Gather all chunks for the latest version of each document
  const candidateChunks: Array<{ chunk: DocumentChunk; documentId: string }> = [];
  for (const doc of targetDocs) {
    const version = dataStore.getLatestDocumentVersion(doc.id);
    if (!version) continue;
    const chunks = dataStore.findChunksForVersion(version.id);
    for (const c of chunks) {
      candidateChunks.push({ chunk: c, documentId: doc.id });
    }
  }

  if (candidateChunks.length === 0) {
    return [];
  }

  // 3. Generate query embedding
  const [queryEmbedding] = await globalEmbeddingProvider.embed([params.query]);

  // 4. Score each candidate chunk
  const scoredChunks: RetrievedChunk[] = [];

  for (const item of candidateChunks) {
    // Semantic similarity
    const embeddings = dataStore.findEmbeddingsForChunk(item.chunk.id);
    const chunkEmb = embeddings.length > 0 ? embeddings[0].embedding : null;
    const semanticScore = chunkEmb ? Math.max(0, cosineSimilarity(queryEmbedding, chunkEmb)) : 0;
    const kwScore = keywordRelevanceScore(params.query, item.chunk);

    // Evidence sufficiency filter: if zero keyword overlap, exclude chunk
    if (kwScore === 0) {
      continue;
    }

    // Hybrid combination: 60% semantic, 40% keyword
    const hybridScore = chunkEmb ? 0.6 * semanticScore + 0.4 * kwScore : kwScore;

    if (hybridScore >= minScore) {
      scoredChunks.push({
        chunk: item.chunk,
        documentId: item.documentId,
        score: Number(hybridScore.toFixed(4)),
        matchType: chunkEmb ? 'hybrid' : 'keyword',
      });
    }
  }

  // 5. Rank and return topK
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK);
}
