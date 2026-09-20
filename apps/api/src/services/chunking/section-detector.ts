/**
 * Section heading detector for legal document chunking.
 * Identifies structural headings like "Section 1. Title", "Article 2: Title",
 * "Clause 3", numbered items, etc. (02_TRD.md §6.2)
 */

// Section heading detector pattern (supports "Section 1. Title", "Article 2: Title", "1. Title", etc.)
const SECTION_HEADING_REGEX =
  /^(?:Section|Article|Clause|\d+\.|\([a-z\d]+\))(?:\s+\d+[.:]?)?\s+([A-Za-z][^\n]{2,80})/im;

/**
 * Checks whether a paragraph looks like a legal section heading.
 * Returns the matched heading string if detected, or null otherwise.
 */
export function detectSectionHeading(paragraphText: string): string | null {
  const match = paragraphText.match(SECTION_HEADING_REGEX);
  return match ? match[0].trim() : null;
}
