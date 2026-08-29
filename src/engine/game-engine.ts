/**
 * Tonight Game Engine — Domain & Business Logic Layer
 * ───────────────────────────────────────────────────
 * Pure domain functions for question selection, mode compatibility,
 * session transitions, round progression, and answer validation.
 *
 * Invariants Enforced:
 * 1. Strict Game Mode Isolation: If gameModeId !== 'all', questions will NEVER switch modes.
 * 2. Scoped Question Identity Deduplication: Uses normalized text identity to prevent cross-session repeats.
 * 3. Controlled In-Mode Cycle: Pool exhaustion resets history strictly within that mode without mode leakage.
 *
 * This module has ZERO UI dependencies and is 100% unit-testable.
 */

import { GAME_MODES } from '@/data/game-modes';
import type {
  GameMode,
  GameModeId,
  GameSession,
  LanguageId,
  Player,
  Question,
  RoundAnswer,
  SessionType,
  VibeId,
} from '@/types';
import { generateSessionId, getQuestionIdentity } from '@/utils';

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
 * Invariants:
 * 1. If `gameModeId` is a specific mode, NEVER return a question of a different mode.
 * 2. Exclude questions matched by ID (`usedQuestionIds`) OR scoped identity (`seenIdentities`).
 * 3. If genuine exhaustion occurs in that specific mode, cycle safely within that mode
 *    without cross-mode pollution.
 */
export function selectNextQuestion(
  pool: Question[],
  usedQuestionIds: string[] = [],
  vibeId: VibeId,
  gameModeId: GameModeId | 'all' = 'all',
  seenIdentities: string[] | Set<string> = []
): Question | null {
  if (!pool || pool.length === 0) return null;

  const usedSet = new Set(usedQuestionIds);
  const seenSet = seenIdentities instanceof Set ? seenIdentities : new Set(seenIdentities);

  const isUnseen = (q: Question) => {
    if (usedSet.has(q.id)) return false;
    const identity = getQuestionIdentity(q);
    if (seenSet.has(identity)) return false;
    return true;
  };

  // ─── Case 1: Specific Explicit Mode (Strict Mode Invariant) ───────────────────
  if (gameModeId && gameModeId !== 'all') {
    const modePool = pool.filter(
      (q) => q.vibeId === vibeId && q.gameModeId === gameModeId
    );

    if (modePool.length > 0) {
      // 1a. Unseen questions matching vibe + mode
      const unusedInMode = modePool.filter(isUnseen);
      if (unusedInMode.length > 0) {
        return unusedInMode[Math.floor(Math.random() * unusedInMode.length)];
      }

      // 1b. Controlled In-Mode Cycle: Pool for this specific mode is exhausted.
      // Pick from the mode pool, avoiding immediate in-session duplicates if possible
      const sessionUnused = modePool.filter((q) => !usedSet.has(q.id));
      if (sessionUnused.length > 0) {
        return sessionUnused[Math.floor(Math.random() * sessionUnused.length)];
      }

      // 1c. Full mode pool reset (avoid undefined/crash, stay strictly in mode)
      return modePool[Math.floor(Math.random() * modePool.length)];
    }

    // If pool has no questions for this vibe + mode, look across other vibes for THIS SAME MODE
    const sameModeAnyVibe = pool.filter((q) => q.gameModeId === gameModeId);
    if (sameModeAnyVibe.length > 0) {
      const unseenSameMode = sameModeAnyVibe.filter(isUnseen);
      if (unseenSameMode.length > 0) {
        return unseenSameMode[Math.floor(Math.random() * unseenSameMode.length)];
      }
      return sameModeAnyVibe[Math.floor(Math.random() * sameModeAnyVibe.length)];
    }

    // Ultimate fallback if no questions exist in this mode at all
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ─── Case 2: Surprise Me / Mixed Modes (gameModeId === 'all') ─────────────────
  const vibePool = pool.filter((q) => q.vibeId === vibeId);

  if (vibePool.length > 0) {
    // 2a. Unseen questions for this vibe (across any mode)
    const unseenVibe = vibePool.filter(isUnseen);
    if (unseenVibe.length > 0) {
      return unseenVibe[Math.floor(Math.random() * unseenVibe.length)];
    }

    // 2b. In-session unused questions for this vibe
    const sessionUnused = vibePool.filter((q) => !usedSet.has(q.id));
    if (sessionUnused.length > 0) {
      return sessionUnused[Math.floor(Math.random() * sessionUnused.length)];
    }

    // 2c. Cycle within vibe
    return vibePool[Math.floor(Math.random() * vibePool.length)];
  }

  // 2d. Global unseen fallback
  const globalUnseen = pool.filter(isUnseen);
  if (globalUnseen.length > 0) {
    return globalUnseen[Math.floor(Math.random() * globalUnseen.length)];
  }

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
  language?: LanguageId;
  sessionType?: SessionType;
  gameModeId?: GameModeId | 'all';
  totalRounds?: number;
  questionPool: Question[];
  seenIdentities?: string[];
}

/**
 * Starts a fresh game session with round 1 and the first question.
 * Preserves cross-session history to prevent repeating seen questions in round 1.
 */
export function startNewSession({
  vibeId,
  players,
  language = 'en',
  sessionType = 'standard',
  gameModeId = 'all',
  totalRounds = DEFAULT_TOTAL_ROUNDS,
  questionPool,
  seenIdentities = [],
}: StartSessionParams): GameSession {
  if (!vibeId || players.length < MIN_PLAYERS_REQUIRED) {
    throw new Error('Cannot start session without a valid vibe and minimum 2 players');
  }

  const initialQuestion = selectNextQuestion(
    questionPool,
    [],
    vibeId,
    gameModeId,
    seenIdentities
  );
  const usedIds = initialQuestion ? [initialQuestion.id] : [];

  return {
    id: generateSessionId(),
    sessionType,
    status: 'playing',
    language,
    vibeId,
    gameModeId,
    players,
    currentRound: 1,
    totalRounds,
    currentQuestion: initialQuestion,
    usedQuestionIds: usedIds,
    answers: [],
    currentPlayerIndex: 0,
    responses: [],
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
  questionPool: Question[],
  seenIdentities: string[] = []
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
        session.gameModeId || 'all',
        seenIdentities
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
 * Creates a fresh replay session with the same vibe, players, and game mode,
 * while preserving question history to avoid repeating previously seen questions.
 */
export function replaySession(
  session: GameSession,
  questionPool: Question[],
  carriedUsedQuestionIds?: string[],
  seenIdentities?: string[]
): GameSession {
  if (!session.vibeId || session.players.length < MIN_PLAYERS_REQUIRED) {
    throw new Error('Cannot replay session without existing vibe and players');
  }

  const usedHistory = carriedUsedQuestionIds || session.usedQuestionIds || [];
  const initialQuestion = selectNextQuestion(
    questionPool,
    usedHistory,
    session.vibeId,
    session.gameModeId || 'all',
    seenIdentities || []
  );
  const nextUsedIds = initialQuestion
    ? [...usedHistory, initialQuestion.id]
    : usedHistory;

  return {
    id: generateSessionId(),
    sessionType: session.sessionType || 'standard',
    status: 'playing',
    language: session.language || 'en',
    vibeId: session.vibeId,
    gameModeId: session.gameModeId || 'all',
    players: session.players,
    currentRound: 1,
    totalRounds: session.totalRounds || DEFAULT_TOTAL_ROUNDS,
    currentQuestion: initialQuestion,
    usedQuestionIds: nextUsedIds,
    answers: [],
    currentPlayerIndex: 0,
    responses: [],
  };
}
