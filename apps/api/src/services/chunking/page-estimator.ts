/**
 * Page range estimation for document chunks.
 * Maps character offsets to approximate page numbers using
 * linear interpolation across OCR page segments (02_TRD.md §6.2).
 */

export interface PageEstimate {
  pageStart: number;
  pageEnd: number;
  confidence: number;
}

/**
 * Estimates which page range a chunk spans, given character offsets
 * and the array of OCR page results.
 */
export function estimatePageRange(
  charStart: number,
  charEnd: number,
  pages: Array<{ pageNumber: number; text: string; confidence: number }>,
  totalLength: number
): PageEstimate {
  if (pages.length <= 1) {
    return {
      pageStart: 1,
      pageEnd: 1,
      confidence: pages[0]?.confidence ?? 0.98,
    };
  }

  // Linear estimation if exact page text offsets aren't indexed
  const fractionStart = charStart / (totalLength || 1);
  const fractionEnd = charEnd / (totalLength || 1);

  const pageStart = Math.max(1, Math.min(pages.length, Math.floor(fractionStart * pages.length) + 1));
  const pageEnd = Math.max(pageStart, Math.min(pages.length, Math.floor(fractionEnd * pages.length) + 1));

  return {
    pageStart,
    pageEnd,
    confidence: 0.98,
  };
}
