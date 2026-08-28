/**
 * Tonight Game Engine — Domain & Business Logic Layer
 * ───────────────────────────────────────────────────
 * Pure domain functions for question selection, mode compatibility,
 * session transitions, round progression, and answer validation.
 *
 * This module has ZERO UI dependencies and is 100% unit-testable.
 */

import { GAME_MODES } from '@/data/game-modes';
import type {
  GameMode,
  GameModeId,
  GameSession,
  Player,
  Question,
  RoundAnswer,
  VibeId,
} from '@/types';
import { generateSessionId } from '@/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_TOTAL_ROUNDS = 10;
export const MIN_PLAYERS_REQUIRED = 2;

// ─── Mode Compatibility & Random Selection ────────────────────────────────────

/**
 * Returns game modes compatible with a given vibe and player count.
 */
export function getCompatibleGameModes(vibeId: VibeId, playerCount = 2): GameMode[] {
  return GAME_MODES.filter(
    (mode) => mode.supportedVibes.includes(vibeId) && playerCount >= mode.minPlayers
  );
}

/**
 * Selects a random compatible game mode for a vibe.
 * Optionally avoids repeating the immediate previous mode if multiple choices exist.
 */
export function selectRandomCompatibleGameMode(
  vibeId: VibeId,
  playerCount = 2,
  previousModeId?: GameModeId
): GameModeId {
  const compatible = getCompatibleGameModes(vibeId, playerCount);
  if (compatible.length === 0) {
    return 'open-question'; // Ultimate fallback
  }

  // Filter out previous mode if we have alternatives
  const choices =
    compatible.length > 1 && previousModeId
      ? compatible.filter((m) => m.id !== previousModeId)
      : compatible;

  const selected = choices[Math.floor(Math.random() * choices.length)];
  return selected ? selected.id : compatible[0].id;
}

// ─── Pure Question Selection ──────────────────────────────────────────────────

/**
 * Pure function to pick the next unused question for the selected vibe and game mode.
 *
 * Algorithm:
 * 1. Filter question pool by `vibeId` and `gameModeId` (if mode is specified and not 'all').
 * 2. Exclude any question IDs in `usedQuestionIds`.
 * 3. If matching unused questions exist, pick one uniformly at random.
 * 4. Graceful fallback: If specific mode pool is exhausted, try any unused question for that vibe.
 * 5. If vibe pool is exhausted, try unused questions across any vibe.
 * 6. If entire database is exhausted, cycle from the vibe's pool.
 */
export function selectNextQuestion(
  pool: Question[],
  usedQuestionIds: string[],
  vibeId: VibeId,
  gameModeId?: GameModeId | 'all'
): Question | null {
  if (!pool || pool.length === 0) return null;

  const usedSet = new Set(usedQuestionIds);

  // 1. Filter by vibe AND mode if specified
  const matchesMode = (q: Question) =>
    !gameModeId || gameModeId === 'all' || q.gameModeId === gameModeId;

  const exactUnused = pool.filter(
    (q) => q.vibeId === vibeId && matchesMode(q) && !usedSet.has(q.id)
  );
  if (exactUnused.length > 0) {
    return exactUnused[Math.floor(Math.random() * exactUnused.length)];
  }

  // 2. Unused questions for this vibe (any mode)
  const vibeUnused = pool.filter((q) => q.vibeId === vibeId && !usedSet.has(q.id));
  if (vibeUnused.length > 0) {
    return vibeUnused[Math.floor(Math.random() * vibeUnused.length)];
  }

  // 3. Unused questions across any vibe (graceful fallback)
  const anyUnused = pool.filter((q) => !usedSet.has(q.id));
  if (anyUnused.length > 0) {
    return anyUnused[Math.floor(Math.random() * anyUnused.length)];
  }

  // 4. Complete exhaustion fallback: pick any question from the selected vibe & mode
  const allVibeQuestions = pool.filter((q) => q.vibeId === vibeId);
  if (allVibeQuestions.length > 0) {
    return allVibeQuestions[Math.floor(Math.random() * allVibeQuestions.length)];
  }

  // 5. Ultimate fallback
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Pure Answer Validation ───────────────────────────────────────────────────

/**
 * Validates whether an interaction is complete for a given question type.
 */
export function validateAnswerForQuestion(
  question: Question | null,
  answer?: Partial<RoundAnswer>
): boolean {
  if (!question) return false;

  switch (question.gameModeId) {
    case 'would-you-rather':
      return answer?.selectedOption === 'A' || answer?.selectedOption === 'B';
    case 'most-likely-to':
      return typeof answer?.selectedPlayerId === 'string' && answer.selectedPlayerId.length > 0;
    case 'hot-take':
      return answer?.selectedStance === 'agree' || answer?.selectedStance === 'disagree';
    case 'who-knows-me-best':
      return true; // Spotlight discussion and reveal
    case 'open-question':
      return true; // Open discussion simply requires pressing Done/Next
    default:
      return true;
  }
}

// ─── Session Lifecycle Operations ─────────────────────────────────────────────

export interface StartSessionParams {
  vibeId: VibeId;
  players: Player[];
  gameModeId?: GameModeId | 'all';
  totalRounds?: number;
  questionPool: Question[];
}

/**
 * Starts a fresh game session with round 1 and the first question.
 */
export function startNewSession({
  vibeId,
  players,
  gameModeId = 'all',
  totalRounds = DEFAULT_TOTAL_ROUNDS,
  questionPool,
}: StartSessionParams): GameSession {
  if (!vibeId || players.length < MIN_PLAYERS_REQUIRED) {
    throw new Error('Cannot start session without a valid vibe and minimum 2 players');
  }

  const initialQuestion = selectNextQuestion(questionPool, [], vibeId, gameModeId);
  const usedIds = initialQuestion ? [initialQuestion.id] : [];

  return {
    id: generateSessionId(),
    status: 'playing',
    vibeId,
    gameModeId,
    players,
    currentRound: 1,
    totalRounds,
    currentQuestion: initialQuestion,
    usedQuestionIds: usedIds,
    answers: [],
  };
}

/**
 * Advances the session to the next round, recording the previous round's answer.
 * If the current round was the final round (`currentRound >= totalRounds`),
 * marks the session status as `'completed'`.
 */
export function advanceSessionRound(
  session: GameSession,
  answer: RoundAnswer | undefined,
  questionPool: Question[]
): GameSession {
  if (session.status !== 'playing') {
    return session;
  }

  const updatedAnswers = answer ? [...session.answers, answer] : session.answers;

  // Check if session is finished
  if (session.currentRound >= session.totalRounds) {
    return {
      ...session,
      status: 'completed',
      answers: updatedAnswers,
    };
  }

  // Next round
  const nextRoundNumber = session.currentRound + 1;
  const nextQuestion = session.vibeId
    ? selectNextQuestion(
        questionPool,
        session.usedQuestionIds,
        session.vibeId,
        session.gameModeId || 'all'
      )
    : null;

  const nextUsedIds = nextQuestion
    ? [...session.usedQuestionIds, nextQuestion.id]
    : session.usedQuestionIds;

  return {
    ...session,
    currentRound: nextRoundNumber,
    currentQuestion: nextQuestion,
    usedQuestionIds: nextUsedIds,
    answers: updatedAnswers,
  };
}

/**
 * Creates a fresh replay session with the same vibe, players, and game mode.
 */
export function replaySession(session: GameSession, questionPool: Question[]): GameSession {
  if (!session.vibeId || session.players.length < MIN_PLAYERS_REQUIRED) {
    throw new Error('Cannot replay session without existing vibe and players');
  }

  return startNewSession({
    vibeId: session.vibeId,
    players: session.players,
    gameModeId: session.gameModeId || 'all',
    totalRounds: session.totalRounds,
    questionPool,
  });
}
