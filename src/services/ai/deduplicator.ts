/**
 * AI Question Deduplicator
 * ────────────────────────
 * Discards questions that are identical or semantically near-duplicates
 * of existing questions in the session or static pool.
 */

import type { Question } from '@/types';

/**
 * Normalizes a text string into a token set for similarity comparison.
 */
export function normalizeTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

/**
 * Computes the Jaccard similarity coefficient between two strings (0.0 to 1.0).
 */
export function calculateSimilarity(textA: string, textB: string): number {
  const setA = normalizeTokens(textA);
  const setB = normalizeTokens(textB);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

const SIMILARITY_THRESHOLD = 0.75; // 75% word overlap is treated as a duplicate

/**
 * Filters out duplicate or near-duplicate AI questions against existing questions.
 */
export function filterDuplicateQuestions(
  candidates: Question[],
  existingPool: Question[]
): { uniqueQuestions: Question[]; duplicateCount: number } {
  const existingTexts = existingPool.map((q) => q.text);
  const uniqueQuestions: Question[] = [];
  let duplicateCount = 0;

  for (const candidate of candidates) {
    // Check against existing pool + previously accepted candidate questions
    const isDuplicate =
      existingTexts.some((t) => calculateSimilarity(t, candidate.text) >= SIMILARITY_THRESHOLD) ||
      uniqueQuestions.some((u) => calculateSimilarity(u.text, candidate.text) >= SIMILARITY_THRESHOLD);

    if (isDuplicate) {
      duplicateCount++;
    } else {
      uniqueQuestions.push(candidate);
      existingTexts.push(candidate.text);
    }
  }

  return { uniqueQuestions, duplicateCount };
}
