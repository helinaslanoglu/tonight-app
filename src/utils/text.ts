/**
 * Text & Question Identity Utilities
 * ──────────────────────────────────
 * Deterministic string normalization and scoped question identity computation.
 * Ensures consistent question deduplication across sessions and AI syntheses.
 */

/**
 * Normalizes a question text string by:
 * - Converting to lowercase
 * - Stripping non-alphanumeric punctuation (except spaces)
 * - Collapsing multiple consecutive whitespace characters into a single space
 * - Trimming leading and trailing whitespace
 */
export function normalizeQuestionText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // Keep letters and numbers across Unicode
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes a scoped, deterministic question identity key.
 * - For canonical curated questions (e.g. "wyr-party-1"), returns the stable question ID across all languages.
 * - For runtime/AI questions, returns `${vibeId}:${gameModeId}:${normalizedText}` to catch identical text.
 */
export function getQuestionIdentity(q: {
  id?: string;
  vibeId?: string;
  gameModeId?: string;
  text: string;
}): string {
  if (q.id && /^(wyr|mlt|ht|wkmb|open)-/.test(q.id)) {
    return q.id;
  }
  const vibe = q.vibeId || 'all';
  const mode = q.gameModeId || 'all';
  const cleanText = normalizeQuestionText(q.text);
  return `${vibe}:${mode}:${cleanText}`;
}
