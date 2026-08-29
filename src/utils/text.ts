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
 * Format: `${vibeId}:${gameModeId}:${normalizedText}`
 *
 * This key ensures that questions with identical text in the same vibe & mode
 * are recognized as the same question, regardless of their generated runtime ID.
 */
export function getQuestionIdentity(q: {
  vibeId?: string;
  gameModeId?: string;
  text: string;
}): string {
  const vibe = q.vibeId || 'all';
  const mode = q.gameModeId || 'all';
  const cleanText = normalizeQuestionText(q.text);
  return `${vibe}:${mode}:${cleanText}`;
}
