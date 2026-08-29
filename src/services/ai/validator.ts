/**
 * AI Output Validator & Sanitizer
 * ────────────────────────────────
 * Guarantees that no malformed, empty, or semantically incompatible AI-generated
 * question enters the game engine or playable question pool.
 *
 * Invariants Enforced:
 * 1. Structural Validation (length, types, non-null).
 * 2. Semantic Mode Compatibility (e.g. MLT must ask a player-selection question,
 *    WYR must contain two distinct options).
 */

import type { LanguageId, Question, WouldYouRatherQuestion } from '@/types';
import type { AIValidationResult } from './types';

const MIN_QUESTION_LENGTH = 10;
const MAX_QUESTION_LENGTH = 250;
const MIN_OPTION_LENGTH = 2;
const MAX_OPTION_LENGTH = 100;

/**
 * Validates that text adheres to the expected language script.
 */
export function validateLanguageScript(
  text: string,
  expectedLanguage?: LanguageId
): { isValid: boolean; reason?: string } {
  if (!expectedLanguage) return { isValid: true };

  const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);

  if (expectedLanguage === 'ar') {
    if (!hasArabicChars) {
      return { isValid: false, reason: 'Expected Arabic text, but no Arabic script detected' };
    }
  } else {
    // Non-Arabic language (en, tr, fr) must not be predominantly Arabic script
    if (hasArabicChars) {
      return {
        isValid: false,
        reason: `Mismatched script: Found Arabic script when expecting "${expectedLanguage}"`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Sanitizes a string by stripping leading/trailing whitespace and surrounding quotation marks.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/^["'`]|["'`]$/g, '') // remove surrounding quotes
    .trim();
}

/**
 * Validates and sanitizes a raw question object from any AI source.
 */
export function validateAndSanitizeQuestion(
  raw: unknown,
  expectedLanguage?: LanguageId
): AIValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { isValid: false, reason: 'Payload is not an object' };
  }

  const q = raw as Record<string, unknown>;

  // 1. Validate and sanitize text
  const cleanText = sanitizeString(q.text);
  if (cleanText.length < MIN_QUESTION_LENGTH) {
    return { isValid: false, reason: `Question text too short (<${MIN_QUESTION_LENGTH} chars)` };
  }
  if (cleanText.length > MAX_QUESTION_LENGTH) {
    return { isValid: false, reason: `Question text too long (>${MAX_QUESTION_LENGTH} chars)` };
  }

  // Language script validation
  const langCheck = validateLanguageScript(cleanText, expectedLanguage);
  if (!langCheck.isValid) {
    return { isValid: false, reason: langCheck.reason };
  }

  // 2. Validate vibeId
  const validVibes = new Set(['party', 'funny', 'chaos', 'date', 'deep-talk', 'chill']);
  if (typeof q.vibeId !== 'string' || !validVibes.has(q.vibeId)) {
    return { isValid: false, reason: `Invalid vibeId: ${String(q.vibeId)}` };
  }

  // 3. Validate mode-specific fields & semantic compatibility
  const mode = q.gameModeId;
  const id =
    typeof q.id === 'string' && q.id.length > 0
      ? q.id
      : `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // ─── Would You Rather ────────────────────────────────────────────────────────
  if (mode === 'would-you-rather') {
    const cleanOptionA = sanitizeString(q.optionA);
    const cleanOptionB = sanitizeString(q.optionB);

    if (cleanOptionA.length < MIN_OPTION_LENGTH || cleanOptionA.length > MAX_OPTION_LENGTH) {
      return { isValid: false, reason: 'Option A length out of bounds' };
    }
    if (cleanOptionB.length < MIN_OPTION_LENGTH || cleanOptionB.length > MAX_OPTION_LENGTH) {
      return { isValid: false, reason: 'Option B length out of bounds' };
    }
    if (cleanOptionA.toLowerCase() === cleanOptionB.toLowerCase()) {
      return { isValid: false, reason: 'Option A and Option B cannot be identical' };
    }

    const qLang = (q.language as LanguageId) || expectedLanguage || 'en';

    const sanitizedWYR: WouldYouRatherQuestion = {
      id,
      vibeId: q.vibeId as Question['vibeId'],
      gameModeId: 'would-you-rather',
      language: qLang,
      text: cleanText,
      optionA: cleanOptionA,
      optionB: cleanOptionB,
    };

    return { isValid: true, sanitizedQuestion: sanitizedWYR };
  }

  const qLang = (q.language as LanguageId) || expectedLanguage || 'en';

  // ─── Most Likely To ──────────────────────────────────────────────────────────
  if (mode === 'most-likely-to') {
    // Semantic validation: MLT questions MUST prompt for player selection (supports en, tr, fr, ar)
    const hasPlayerSelectionIntent =
      /\b(who|most likely|who would|who is|who in|between|kim|qui|quel|quelle)\b/i.test(cleanText) ||
      /(من|أيهما)/.test(cleanText);
    if (!hasPlayerSelectionIntent) {
      return {
        isValid: false,
        reason: 'Most Likely To questions must prompt for player selection (e.g. starting with "Who is most likely to...")',
      };
    }

    return {
      isValid: true,
      sanitizedQuestion: {
        id,
        vibeId: q.vibeId as Question['vibeId'],
        gameModeId: 'most-likely-to',
        language: qLang,
        text: cleanText,
      },
    };
  }

  // ─── Open Question ───────────────────────────────────────────────────────────
  if (mode === 'open-question') {
    const cleanPrompt = typeof q.prompt === 'string' ? sanitizeString(q.prompt) : undefined;
    return {
      isValid: true,
      sanitizedQuestion: {
        id,
        vibeId: q.vibeId as Question['vibeId'],
        gameModeId: 'open-question',
        language: qLang,
        text: cleanText,
        prompt: cleanPrompt && cleanPrompt.length > 0 ? cleanPrompt : undefined,
      },
    };
  }

  // ─── Hot Take ────────────────────────────────────────────────────────────────
  if (mode === 'hot-take') {
    const cleanAgree = typeof q.agreeLabel === 'string' ? sanitizeString(q.agreeLabel) : undefined;
    const cleanDisagree =
      typeof q.disagreeLabel === 'string' ? sanitizeString(q.disagreeLabel) : undefined;
    return {
      isValid: true,
      sanitizedQuestion: {
        id,
        vibeId: q.vibeId as Question['vibeId'],
        gameModeId: 'hot-take',
        language: qLang,
        text: cleanText,
        agreeLabel: cleanAgree && cleanAgree.length > 0 ? cleanAgree : 'AGREE',
        disagreeLabel: cleanDisagree && cleanDisagree.length > 0 ? cleanDisagree : 'DISAGREE',
      },
    };
  }

  // ─── Who Knows Me Best ───────────────────────────────────────────────────────
  if (mode === 'who-knows-me-best') {
    const cleanPrompt = typeof q.prompt === 'string' ? sanitizeString(q.prompt) : undefined;
    return {
      isValid: true,
      sanitizedQuestion: {
        id,
        vibeId: q.vibeId as Question['vibeId'],
        gameModeId: 'who-knows-me-best',
        language: qLang,
        text: cleanText,
        prompt: cleanPrompt && cleanPrompt.length > 0 ? cleanPrompt : undefined,
      },
    };
  }

  return { isValid: false, reason: `Unsupported gameModeId: ${String(mode)}` };
}
