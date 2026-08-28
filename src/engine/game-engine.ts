/**
 * Tonight Game Engine — Domain & Business Logic Layer
 * ───────────────────────────────────────────────────
 * Pure domain functions for question selection, session transitions,
 * round progression, and answer validation.
 *
 * This module has ZERO UI dependencies and can be tested purely with unit tests.
 */

import type { GameSession, Player, Question, RoundAnswer, VibeId } from '@/types';
import { generateSessionId } from '@/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_TOTAL_ROUNDS = 10;
export const MIN_PLAYERS_REQUIRED = 2;

// ─── Pure Question Selection ──────────────────────────────────────────────────

/**
 * Pure function to pick the next unused question for the selected vibe.
 *
 * Algorithm:
 * 1. Filter question pool by the given `vibeId`.
 * 2. Exclude any question IDs in `usedQuestionIds`.
 * 3. If matching unused questions exist, pick one uniformly at random.
 * 4. Graceful fallback: If the current vibe's pool is exhausted, try unused
 *    questions from other vibes. If the entire database is exhausted, reset pool.
 */
export function selectNextQuestion(
  pool: Question[],
  usedQuestionIds: string[],
  vibeId: VibeId
): Question | null {
  if (!pool || pool.length === 0) return null;

  const usedSet = new Set(usedQuestionIds);

  // 1. Unused questions for this vibe
  const vibeUnused = pool.filter((q) => q.vibeId === vibeId && !usedSet.has(q.id));
  if (vibeUnused.length > 0) {
    const randomIndex = Math.floor(Math.random() * vibeUnused.length);
    return vibeUnused[randomIndex];
  }

  // 2. Unused questions across any vibe (graceful fallback)
  const anyUnused = pool.filter((q) => !usedSet.has(q.id));
  if (anyUnused.length > 0) {
    const randomIndex = Math.floor(Math.random() * anyUnused.length);
    return anyUnused[randomIndex];
  }

  // 3. Complete exhaustion fallback: pick any question from the selected vibe
  const allVibeQuestions = pool.filter((q) => q.vibeId === vibeId);
  if (allVibeQuestions.length > 0) {
    const randomIndex = Math.floor(Math.random() * allVibeQuestions.length);
    return allVibeQuestions[randomIndex];
  }

  // 4. Ultimate fallback
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
  totalRounds?: number;
  questionPool: Question[];
}

/**
 * Starts a fresh game session with round 1 and the first question.
 */
export function startNewSession({
  vibeId,
  players,
  totalRounds = DEFAULT_TOTAL_ROUNDS,
  questionPool,
}: StartSessionParams): GameSession {
  if (!vibeId || players.length < MIN_PLAYERS_REQUIRED) {
    throw new Error('Cannot start session without a valid vibe and minimum 2 players');
  }

  const initialQuestion = selectNextQuestion(questionPool, [], vibeId);
  const usedIds = initialQuestion ? [initialQuestion.id] : [];

  return {
    id: generateSessionId(),
    status: 'playing',
    vibeId,
    gameModeId: initialQuestion?.gameModeId || null,
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
    ? selectNextQuestion(questionPool, session.usedQuestionIds, session.vibeId)
    : null;

  const nextUsedIds = nextQuestion
    ? [...session.usedQuestionIds, nextQuestion.id]
    : session.usedQuestionIds;

  return {
    ...session,
    currentRound: nextRoundNumber,
    gameModeId: nextQuestion?.gameModeId || session.gameModeId,
    currentQuestion: nextQuestion,
    usedQuestionIds: nextUsedIds,
    answers: updatedAnswers,
  };
}

/**
 * Creates a fresh replay session with the same vibe and players.
 */
export function replaySession(session: GameSession, questionPool: Question[]): GameSession {
  if (!session.vibeId || session.players.length < MIN_PLAYERS_REQUIRED) {
    throw new Error('Cannot replay session without existing vibe and players');
  }

  return startNewSession({
    vibeId: session.vibeId,
    players: session.players,
    totalRounds: session.totalRounds,
    questionPool,
  });
}
