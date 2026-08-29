/**
 * Group Session Response & Aggregation Engine
 * ───────────────────────────────────────────
 * Pure domain functions for multi-player response validation,
 * turn progression, duplicate submission prevention, and deterministic group aggregation.
 *
 * Invariants:
 * 1. ONE SESSION + ONE QUESTION + ONE PLAYER = EXACTLY ONE RESPONSE.
 * 2. Strict privacy: Aggregator computes observable facts; individual responses are decoupled from UI state.
 * 3. 100% pure TypeScript: Zero React / Zustand / UI dependencies.
 */

import type {
  ChoiceBreakdown,
  ChoiceResponse,
  GameSession,
  GroupResult,
  Player,
  PlayerResponse,
  PlayerSelectionResponse,
  PlayerSelectionStats,
  SpotlightResponse,
  StanceBreakdown,
  StanceResponse,
} from '@/types';
import { resolveInteractionType } from './interaction-resolver';

// ─── Response Validation ──────────────────────────────────────────────────────

export interface ResponseValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates an incoming individual player response against the active session state.
 */
export function validatePlayerResponse(
  session: GameSession,
  response: PlayerResponse
): ResponseValidationResult {
  // 1. Session must be in playing state
  if (session.status !== 'playing') {
    return { isValid: false, reason: 'Session is not active' };
  }

  // 2. Session ID match
  if (!session.id || response.sessionId !== session.id) {
    return { isValid: false, reason: 'Response sessionId does not match active session' };
  }

  // 3. Question match
  if (!session.currentQuestion || response.questionId !== session.currentQuestion.id) {
    return { isValid: false, reason: 'Response questionId does not match current question' };
  }

  // 4. Answering player must belong to the session
  const answeringPlayer = session.players.find((p) => p.id === response.playerId);
  if (!answeringPlayer) {
    return { isValid: false, reason: `Player ${response.playerId} does not belong to session` };
  }

  // 5. Duplicate submission check: (sessionId + questionId + playerId) must be unique
  const existingResponses = session.responses || [];
  const alreadyAnswered = existingResponses.some(
    (r) =>
      r.sessionId === response.sessionId &&
      r.questionId === response.questionId &&
      r.playerId === response.playerId
  );
  if (alreadyAnswered) {
    return {
      isValid: false,
      reason: `Player ${response.playerId} has already submitted a response for question ${response.questionId}`,
    };
  }

  // 6. Interaction type contract validation
  const expectedInteractionType = resolveInteractionType(session.currentQuestion);
  if (response.responseType !== expectedInteractionType) {
    return {
      isValid: false,
      reason: `Response type "${response.responseType}" does not match question interaction type "${expectedInteractionType}"`,
    };
  }

  // 7. Value validations per response subtype
  switch (response.responseType) {
    case 'choice': {
      const choice = (response as ChoiceResponse).selectedOption;
      if (choice !== 'A' && choice !== 'B') {
        return { isValid: false, reason: 'Choice response must be either "A" or "B"' };
      }
      break;
    }
    case 'player-select': {
      const selectedId = (response as PlayerSelectionResponse).selectedPlayerId;
      if (!selectedId || typeof selectedId !== 'string') {
        return { isValid: false, reason: 'Player-select response requires a selectedPlayerId' };
      }
      const targetPlayerExists = session.players.some((p) => p.id === selectedId);
      if (!targetPlayerExists) {
        return {
          isValid: false,
          reason: `Selected player ${selectedId} does not exist in the session roster`,
        };
      }
      break;
    }
    case 'stance': {
      const stance = (response as StanceResponse).selectedStance;
      if (stance !== 'agree' && stance !== 'disagree') {
        return { isValid: false, reason: 'Stance response must be either "agree" or "disagree"' };
      }
      break;
    }
    case 'spotlight-quiz': {
      const targetId = (response as SpotlightResponse).targetPlayerId;
      if (targetId) {
        const targetPlayerExists = session.players.some((p) => p.id === targetId);
        if (!targetPlayerExists) {
          return {
            isValid: false,
            reason: `Target player ${targetId} does not exist in the session roster`,
          };
        }
      }
      break;
    }
    case 'discussion':
    default:
      break;
  }

  return { isValid: true };
}

// ─── Response Recording & Turn Progression ───────────────────────────────────

export interface RecordResponseResult {
  nextSession: GameSession;
  isQuestionComplete: boolean;
}

/**
 * Records a validated player response into the session state and advances turn.
 */
export function recordPlayerResponse(
  session: GameSession,
  response: PlayerResponse
): RecordResponseResult {
  const validation = validatePlayerResponse(session, response);
  if (!validation.isValid) {
    throw new Error(`Invalid Player Response: ${validation.reason}`);
  }

  const currentResponses = session.responses || [];
  const updatedResponses = [...currentResponses, response];

  const totalPlayers = session.players.length;
  const currentIdx = session.currentPlayerIndex ?? 0;

  // Check how many players have answered this current question
  const responsesForThisQuestion = updatedResponses.filter(
    (r) => r.questionId === session.currentQuestion?.id
  );

  const isQuestionComplete = responsesForThisQuestion.length >= totalPlayers;

  const nextSession: GameSession = {
    ...session,
    responses: updatedResponses,
    currentPlayerIndex: isQuestionComplete ? 0 : (currentIdx + 1) % totalPlayers,
  };

  return {
    nextSession,
    isQuestionComplete,
  };
}

// ─── Group Aggregation & Pattern Calculation ──────────────────────────────────

/**
 * Pure deterministic aggregation function that calculates observable facts,
 * individual selection patterns, relationship matrices, and choice distributions.
 */
export function aggregateGroupResult(session: GameSession): GroupResult {
  const players: Player[] = session.players || [];
  const responses: PlayerResponse[] = session.responses || [];
  const sessionId = session.id || 'local-session';
  const vibeId = session.vibeId || 'party';
  const gameModeId = session.gameModeId || 'all';

  // 1. Initialize player stats and relationship matrix
  const playerStats: Record<string, PlayerSelectionStats> = {};
  const relationshipMatrix: Record<string, Record<string, number>> = {};

  for (const p of players) {
    playerStats[p.id] = {
      playerId: p.id,
      playerName: p.name,
      playerColor: p.color,
      timesSelected: 0,
      selectionPercentage: 0,
      selectedBy: {},
      selectionsMade: {},
    };

    relationshipMatrix[p.id] = {};
    for (const target of players) {
      relationshipMatrix[p.id][target.id] = 0;
    }
  }

  // 2. Process player selection responses (e.g. Most Likely To)
  const playerSelectResponses = responses.filter(
    (r): r is PlayerSelectionResponse => r.responseType === 'player-select'
  );

  for (const r of playerSelectResponses) {
    const fromId = r.playerId;
    const toId = r.selectedPlayerId;

    if (playerStats[toId]) {
      playerStats[toId].timesSelected += 1;
      playerStats[toId].selectedBy[fromId] = (playerStats[toId].selectedBy[fromId] || 0) + 1;
    }

    if (playerStats[fromId]) {
      playerStats[fromId].selectionsMade[toId] =
        (playerStats[fromId].selectionsMade[toId] || 0) + 1;
    }

    if (relationshipMatrix[fromId] && relationshipMatrix[fromId][toId] !== undefined) {
      relationshipMatrix[fromId][toId] += 1;
    }
  }

  // Compute selection percentages
  const totalSelections = playerSelectResponses.length;
  if (totalSelections > 0) {
    for (const p of players) {
      playerStats[p.id].selectionPercentage = Math.round(
        (playerStats[p.id].timesSelected / totalSelections) * 100
      );
    }
  }

  // 3. Top selected players (sorted descending)
  const topSelectedPlayers = Object.values(playerStats)
    .filter((s) => s.timesSelected > 0)
    .sort((a, b) => b.timesSelected - a.timesSelected)
    .map((s) => ({
      playerId: s.playerId,
      name: s.playerName,
      count: s.timesSelected,
    }));

  // 4. Choice breakdowns (Would You Rather)
  const choiceResponses = responses.filter(
    (r): r is ChoiceResponse => r.responseType === 'choice'
  );
  const choiceMapByQuestion: Record<string, ChoiceBreakdown> = {};

  for (const r of choiceResponses) {
    if (!choiceMapByQuestion[r.questionId]) {
      choiceMapByQuestion[r.questionId] = {
        questionId: r.questionId,
        questionText: '',
        optionACount: 0,
        optionBCount: 0,
        playerChoices: {},
      };
    }
    choiceMapByQuestion[r.questionId].playerChoices[r.playerId] = r.selectedOption;
    if (r.selectedOption === 'A') {
      choiceMapByQuestion[r.questionId].optionACount += 1;
    } else {
      choiceMapByQuestion[r.questionId].optionBCount += 1;
    }
  }

  // 5. Stance breakdowns (Hot Take)
  const stanceResponses = responses.filter(
    (r): r is StanceResponse => r.responseType === 'stance'
  );
  const stanceMapByQuestion: Record<string, StanceBreakdown> = {};

  for (const r of stanceResponses) {
    if (!stanceMapByQuestion[r.questionId]) {
      stanceMapByQuestion[r.questionId] = {
        questionId: r.questionId,
        questionText: '',
        agreeCount: 0,
        disagreeCount: 0,
        playerStances: {},
      };
    }
    stanceMapByQuestion[r.questionId].playerStances[r.playerId] = r.selectedStance;
    if (r.selectedStance === 'agree') {
      stanceMapByQuestion[r.questionId].agreeCount += 1;
    } else {
      stanceMapByQuestion[r.questionId].disagreeCount += 1;
    }
  }

  const uniqueQuestionIds = new Set(responses.map((r) => r.questionId));

  return {
    sessionId,
    vibeId,
    gameModeId,
    totalQuestions: uniqueQuestionIds.size,
    totalExpectedResponses: (session.totalRounds || 10) * players.length,
    totalCollectedResponses: responses.length,
    players,
    playerStats,
    topSelectedPlayers,
    choiceBreakdowns: Object.values(choiceMapByQuestion),
    stanceBreakdowns: Object.values(stanceMapByQuestion),
    relationshipMatrix,
    completedAt: new Date().toISOString(),
  };
}
