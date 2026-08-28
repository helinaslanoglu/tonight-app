/**
 * AI Output Validator & Sanitizer
 * ────────────────────────────────
 * Guarantees that no malformed, empty, or unsafe AI-generated question enters
 * the game engine or UI.
 */

import type { Question, WouldYouRatherQuestion } from '@/types';
import type { AIValidationResult } from './types';

const MIN_QUESTION_LENGTH = 10;
const MAX_QUESTION_LENGTH = 250;
const MIN_OPTION_LENGTH = 2;
const MAX_OPTION_LENGTH = 100;

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
export function validateAndSanitizeQuestion(raw: unknown): AIValidationResult {
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

  // 2. Validate vibeId
  const validVibes = new Set(['party', 'funny', 'chaos', 'date', 'deep-talk', 'chill']);
  if (typeof q.vibeId !== 'string' || !validVibes.has(q.vibeId)) {
    return { isValid: false, reason: `Invalid vibeId: ${String(q.vibeId)}` };
  }

  // 3. Validate mode-specific fields
  const mode = q.gameModeId;
  const id = typeof q.id === 'string' && q.id.length > 0 ? q.id : `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

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

    const sanitizedWYR: WouldYouRatherQuestion = {
      id,
      vibeId: q.vibeId as Question['vibeId'],
      gameModeId: 'would-you-rather',
      text: cleanText,
      optionA: cleanOptionA,
      optionB: cleanOptionB,
    };

    return { isValid: true, sanitizedQuestion: sanitizedWYR };
  }

  if (mode === 'most-likely-to') {
    return {
      isValid: true,
      sanitizedQuestion: {
        id,
        vibeId: q.vibeId as Question['vibeId'],
        gameModeId: 'most-likely-to',
        text: cleanText,
      },
    };
  }

  if (mode === 'open-question') {
    const cleanPrompt = typeof q.prompt === 'string' ? sanitizeString(q.prompt) : undefined;
    return {
      isValid: true,
      sanitizedQuestion: {
        id,
        vibeId: q.vibeId as Question['vibeId'],
        gameModeId: 'open-question',
        text: cleanText,
        prompt: cleanPrompt && cleanPrompt.length > 0 ? cleanPrompt : undefined,
      },
    };
  }

  if (mode === 'hot-take') {
    const cleanAgree = typeof q.agreeLabel === 'string' ? sanitizeString(q.agreeLabel) : undefined;
    const cleanDisagree = typeof q.disagreeLabel === 'string' ? sanitizeString(q.disagreeLabel) : undefined;
    return {
      isValid: true,
      sanitizedQuestion: {
        id,
        vibeId: q.vibeId as Question['vibeId'],
        gameModeId: 'hot-take',
        text: cleanText,
        agreeLabel: cleanAgree && cleanAgree.length > 0 ? cleanAgree : 'AGREE',
        disagreeLabel: cleanDisagree && cleanDisagree.length > 0 ? cleanDisagree : 'DISAGREE',
      },
    };
  }

  if (mode === 'who-knows-me-best') {
    const cleanPrompt = typeof q.prompt === 'string' ? sanitizeString(q.prompt) : undefined;
    return {
      isValid: true,
      sanitizedQuestion: {
        id,
        vibeId: q.vibeId as Question['vibeId'],
        gameModeId: 'who-knows-me-best',
        text: cleanText,
        prompt: cleanPrompt && cleanPrompt.length > 0 ? cleanPrompt : undefined,
      },
    };
  }

  return { isValid: false, reason: `Unsupported gameModeId: ${String(mode)}` };
}
