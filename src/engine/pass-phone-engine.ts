/**
 * Pass The Phone Engine — Domain Layer
 * ────────────────────────────────────
 * Pure domain state machine and aggregation engine for the "Pass The Phone"
 * party game session type.
 *
 * Invariants:
 * 1. Target player cannot know the question text or the selector identity before choosing an action.
 * 2. Self-targeting is strictly forbidden.
 * 3. 100% pure TypeScript: Zero React / Zustand / UI / Haptics dependencies.
 */

import type {
  GameSession,
  PassPhoneResult,
  PassPhoneRoundRecord,
  PassPhoneState,
  Player,
  Question,
  RevealAction,
} from '@/types';

// ─── Initialization ───────────────────────────────────────────────────────────

/**
 * Initializes a clean Pass The Phone state machine.
 */
export function initPassPhoneState(players: Player[]): PassPhoneState {
  const initialSelectorId = players[0]?.id || 'p1';
  return {
    phase: 'SELECTING_TARGET',
    activeSelectorPlayerId: initialSelectorId,
    shotsCount: 0,
    roundHistory: [],
  };
}

// ─── Target Filtering & Validation ────────────────────────────────────────────

/**
 * Returns all valid target players for the current selector (excludes the selector).
 */
export function getValidTargetsForSelector(
  players: Player[],
  selectorPlayerId: string
): Player[] {
  return players.filter((p) => p.id !== selectorPlayerId);
}

/**
 * Validates target selection.
 */
export function validateTargetSelection(
  players: Player[],
  selectorPlayerId: string,
  targetPlayerId: string
): { isValid: boolean; reason?: string } {
  if (selectorPlayerId === targetPlayerId) {
    return { isValid: false, reason: 'Selector cannot select themselves' };
  }
  const targetExists = players.some((p) => p.id === targetPlayerId);
  if (!targetExists) {
    return { isValid: false, reason: `Target player ${targetPlayerId} not found in session` };
  }
  return { isValid: true };
}

// ─── Phase Transitions ────────────────────────────────────────────────────────

/**
 * Step 1: Selector picks a target. Transitions SELECTING_TARGET -> PASSING_PHONE.
 */
export function selectPassPhoneTarget(
  session: GameSession,
  targetPlayerId: string
): GameSession {
  if (!session.passPhoneState) {
    throw new Error('Session does not have active passPhoneState');
  }
  if (session.passPhoneState.phase !== 'SELECTING_TARGET') {
    throw new Error(
      `Cannot select target in phase "${session.passPhoneState.phase}". Expected "SELECTING_TARGET"`
    );
  }

  const validation = validateTargetSelection(
    session.players,
    session.passPhoneState.activeSelectorPlayerId,
    targetPlayerId
  );
  if (!validation.isValid) {
    throw new Error(`Invalid target selection: ${validation.reason}`);
  }

  const nextState: PassPhoneState = {
    ...session.passPhoneState,
    phase: 'PASSING_PHONE',
    selectedTargetPlayerId: targetPlayerId,
  };

  return {
    ...session,
    passPhoneState: nextState,
  };
}

/**
 * Step 2: Target confirms they received the phone. Transitions PASSING_PHONE -> TARGET_ACTION.
 */
export function confirmPassPhoneHandover(session: GameSession): GameSession {
  if (!session.passPhoneState) {
    throw new Error('Session does not have active passPhoneState');
  }
  if (session.passPhoneState.phase !== 'PASSING_PHONE') {
    throw new Error(
      `Cannot confirm handover in phase "${session.passPhoneState.phase}". Expected "PASSING_PHONE"`
    );
  }

  const nextState: PassPhoneState = {
    ...session.passPhoneState,
    phase: 'TARGET_ACTION',
  };

  return {
    ...session,
    passPhoneState: nextState,
  };
}

/**
 * Step 3: Target commits an action (e.g. TAKE THE SHOT or SHOW QUESTION).
 */
export function commitPassPhoneAction(
  session: GameSession,
  action: RevealAction
): { nextSession: GameSession; isRoundComplete: boolean } {
  if (!session.passPhoneState) {
    throw new Error('Session does not have active passPhoneState');
  }
  if (session.passPhoneState.phase !== 'TARGET_ACTION') {
    throw new Error(
      `Cannot commit action in phase "${session.passPhoneState.phase}". Expected "TARGET_ACTION"`
    );
  }

  const { selectedTargetPlayerId, shotsCount } = session.passPhoneState;

  if (!selectedTargetPlayerId) {
    throw new Error('No target player recorded in passPhoneState');
  }

  const nextShotsCount = action === 'take-shot' ? shotsCount + 1 : shotsCount;

  const nextState: PassPhoneState = {
    ...session.passPhoneState,
    phase: 'REVEALING_QUESTION',
    selectedAction: action,
    shotsCount: nextShotsCount,
  };

  return {
    nextSession: { ...session, passPhoneState: nextState },
    isRoundComplete: false,
  };
}

/**
 * Step 4: User finishes viewing reveal. Transitions REVEALING_QUESTION -> ROUND_COMPLETE.
 */
export function acknowledgePassPhoneReveal(session: GameSession): GameSession {
  if (!session.passPhoneState) {
    throw new Error('Session does not have active passPhoneState');
  }
  if (session.passPhoneState.phase !== 'REVEALING_QUESTION') {
    throw new Error(
      `Cannot acknowledge reveal in phase "${session.passPhoneState.phase}". Expected "REVEALING_QUESTION"`
    );
  }

  const { activeSelectorPlayerId, selectedTargetPlayerId, selectedAction, roundHistory } =
    session.passPhoneState;

  const roundRecord: PassPhoneRoundRecord = {
    roundNumber: session.currentRound,
    questionId: session.currentQuestion?.id || 'unknown-q',
    questionText: session.currentQuestion?.text || '',
    selectorPlayerId: activeSelectorPlayerId,
    targetPlayerId: selectedTargetPlayerId || '',
    action: selectedAction || 'show-question',
    timestamp: Date.now(),
  };

  const nextState: PassPhoneState = {
    ...session.passPhoneState,
    phase: 'ROUND_COMPLETE',
    roundHistory: [...roundHistory, roundRecord],
  };

  return {
    ...session,
    passPhoneState: nextState,
  };
}

/**
 * Step 5: Advances Pass The Phone session to the next round with a new question and selector.
 */
export function advancePassPhoneRound(
  session: GameSession,
  nextQuestion: Question | null
): GameSession {
  if (!session.passPhoneState) {
    throw new Error('Session does not have active passPhoneState');
  }

  const players = session.players;
  const currentSelectorIdx = players.findIndex(
    (p) => p.id === session.passPhoneState?.activeSelectorPlayerId
  );
  const nextSelectorIdx = (currentSelectorIdx + 1) % players.length;
  const nextSelector = players[nextSelectorIdx] || players[0];

  const nextRoundNumber = session.currentRound + 1;
  const isSessionFinished = session.currentRound >= session.totalRounds;

  const nextState: PassPhoneState = {
    ...session.passPhoneState,
    phase: isSessionFinished ? 'SESSION_COMPLETE' : 'SELECTING_TARGET',
    activeSelectorPlayerId: nextSelector.id,
    selectedTargetPlayerId: undefined,
    selectedAction: undefined,
  };

  const nextUsedIds = nextQuestion
    ? [...session.usedQuestionIds, nextQuestion.id]
    : session.usedQuestionIds;

  return {
    ...session,
    status: isSessionFinished ? 'completed' : 'playing',
    currentRound: isSessionFinished ? session.currentRound : nextRoundNumber,
    currentQuestion: nextQuestion,
    usedQuestionIds: nextUsedIds,
    passPhoneState: nextState,
  };
}

// ─── Results Aggregation ──────────────────────────────────────────────────────

/**
 * Pure deterministic calculation of Pass The Phone structured results.
 */
export function aggregatePassPhoneResult(session: GameSession): PassPhoneResult {
  const players = session.players || [];
  const passPhoneState = session.passPhoneState;
  const rounds = passPhoneState?.roundHistory || [];
  const sessionId = session.id || 'local-pass-phone';
  const vibeId = session.vibeId || 'party';

  // 1. Action distribution & shot counting
  const actionDistribution: Record<RevealAction, number> = {
    'take-shot': 0,
    'show-question': 0,
    'take-sip': 0,
    'do-dare': 0,
    skip: 0,
  };

  let totalShots = 0;
  for (const r of rounds) {
    actionDistribution[r.action] = (actionDistribution[r.action] || 0) + 1;
    if (r.action === 'take-shot') {
      totalShots += 1;
    }
  }

  // 2. Target counts & Selector counts
  const targetCounts: Record<string, number> = {};
  const selectorCounts: Record<string, number> = {};
  const relationshipMatrix: Record<string, Record<string, number>> = {};

  for (const p of players) {
    targetCounts[p.id] = 0;
    selectorCounts[p.id] = 0;
    relationshipMatrix[p.id] = {};
    for (const target of players) {
      relationshipMatrix[p.id][target.id] = 0;
    }
  }

  for (const r of rounds) {
    const fromId = r.selectorPlayerId;
    const toId = r.targetPlayerId;

    if (targetCounts[toId] !== undefined) {
      targetCounts[toId] += 1;
    }
    if (selectorCounts[fromId] !== undefined) {
      selectorCounts[fromId] += 1;
    }
    if (relationshipMatrix[fromId] && relationshipMatrix[fromId][toId] !== undefined) {
      relationshipMatrix[fromId][toId] += 1;
    }
  }

  // 3. Most targeted player (with deterministic tie representation)
  const sortedTargets = Object.entries(targetCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  let mostTargetedPlayer: PassPhoneResult['mostTargetedPlayer'] = null;
  if (sortedTargets.length > 0) {
    const topId = sortedTargets[0][0];
    const topPlayer = players.find((p) => p.id === topId);
    mostTargetedPlayer = {
      playerId: topId,
      name: topPlayer?.name || 'Unknown',
      count: sortedTargets[0][1],
    };
  }

  // 4. Most frequent selector
  const sortedSelectors = Object.entries(selectorCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  let mostFrequentSelector: PassPhoneResult['mostFrequentSelector'] = null;
  if (sortedSelectors.length > 0) {
    const topId = sortedSelectors[0][0];
    const topPlayer = players.find((p) => p.id === topId);
    mostFrequentSelector = {
      playerId: topId,
      name: topPlayer?.name || 'Unknown',
      count: sortedSelectors[0][1],
    };
  }

  return {
    sessionId,
    vibeId,
    totalRounds: rounds.length,
    totalShots,
    players,
    mostTargetedPlayer,
    mostFrequentSelector,
    actionDistribution,
    relationshipMatrix,
    rounds,
    completedAt: new Date().toISOString(),
  };
}
