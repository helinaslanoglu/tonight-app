/**
 * Interaction Resolver — Domain Layer
 * ──────────────────────────────────
 * Authoritative single source of truth for resolving question interaction types
 * from the Question model and GameMode definitions.
 *
 * Invariant: 1 Question → 1 Valid Interaction Type.
 * ZERO React / UI dependencies (pure TypeScript).
 */

import { getGameModeById } from '@/data/game-modes';
import type {
  GameMode,
  GameModeId,
  GameModeInteractionType,
  Question,
} from '@/types';

/**
 * Maps a question's gameModeId to its canonical GameModeInteractionType.
 */
export function resolveInteractionType(question: Question | null | undefined): GameModeInteractionType {
  if (!question) {
    return 'discussion';
  }

  const mode = getGameModeById(question.gameModeId);
  if (mode) {
    return mode.interactionType;
  }

  // Fallback map based on discriminated union
  switch (question.gameModeId) {
    case 'would-you-rather':
      return 'choice';
    case 'most-likely-to':
      return 'player-select';
    case 'hot-take':
      return 'stance';
    case 'who-knows-me-best':
      return 'spotlight-quiz';
    case 'open-question':
    default:
      return 'discussion';
  }
}

/**
 * Resolves the canonical GameMode object for a given question.
 */
export function resolveGameMode(question: Question | null | undefined): GameMode | undefined {
  if (!question) return undefined;
  return getGameModeById(question.gameModeId);
}

/**
 * Checks whether a question matches an expected gameModeId.
 * Returns true if expectedMode is 'all' or matches question.gameModeId.
 */
export function isQuestionCompatibleWithMode(
  question: Question,
  expectedMode: GameModeId | 'all' = 'all'
): boolean {
  if (expectedMode === 'all') return true;
  return question.gameModeId === expectedMode;
}

/**
 * All supported interaction types list for validation.
 */
export const SUPPORTED_INTERACTION_TYPES: GameModeInteractionType[] = [
  'choice',
  'player-select',
  'stance',
  'spotlight-quiz',
  'discussion',
];
