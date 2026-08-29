import { create } from 'zustand';

import { defaultContentProvider } from '@/data';
import {
  acknowledgePassPhoneReveal,
  advancePassPhoneRound,
  advanceSessionRound,
  commitPassPhoneAction,
  confirmPassPhoneHandover,
  DEFAULT_TOTAL_ROUNDS,
  initPassPhoneState,
  recordPlayerResponse,
  replaySession,
  selectNextQuestion,
  selectPassPhoneTarget,
  startNewSession,
} from '@/engine';
import type {
  GameModeId,
  GameSession,
  LanguageId,
  PassPhonePhase,
  PassPhoneRoundRecord,
  PassPhoneState,
  Player,
  PlayerResponse,
  Question,
  RevealAction,
  RoundAnswer,
  SessionStatus,
  SessionType,
  VibeId,
} from '@/types';
import { generateResponseId, getQuestionIdentity } from '@/utils';

// ─── Initial State ────────────────────────────────────────────────────────────

const INITIAL_SESSION: GameSession = {
  id: null,
  sessionType: 'standard',
  language: 'en',
  status: 'idle',
  vibeId: null,
  gameModeId: 'all',
  players: [],
  currentRound: 0,
  totalRounds: DEFAULT_TOTAL_ROUNDS,
  currentQuestion: null,
  usedQuestionIds: [],
  answers: [],
  currentPlayerIndex: 0,
  responses: [],
  passPhoneState: undefined,
};

// ─── Store Interface ──────────────────────────────────────────────────────────

interface GameState {
  session: GameSession;
  questionPool: Question[];
  /** App-scoped sliding window of seen question identities to prevent cross-session repeats */
  seenQuestionIdentities: string[];
}

interface GameActions {
  /** Set session type ('standard' for single vote vs 'group' for secret polling vs 'pass-the-phone' for target challenge) */
  setSessionType: (sessionType: SessionType) => void;

  /** Set session language ('en' | 'tr' | 'fr' | 'ar') */
  setLanguage: (language: LanguageId) => void;

  /** Set the chosen vibe before starting a session */
  setVibe: (vibeId: VibeId) => void;

  /** Replace the full player roster */
  setPlayers: (players: Player[]) => void;

  /** Set game mode ('all' for shuffle/surprise or specific GameModeId) */
  setGameMode: (gameModeId: GameModeId | 'all') => void;

  /** Transition session status */
  setSessionStatus: (status: SessionStatus) => void;

  /** Starts the game loop: initializes session, loads questions, sets round 1 */
  startGame: () => Promise<void>;

  /** Submits a summary answer (Standard mode) and advances to the next question */
  submitAnswerAndAdvance: (partialAnswer?: Partial<RoundAnswer>) => Promise<void>;

  /** Submits an individual player response (Group Session mode) with pass-the-phone turn handling */
  submitPlayerResponse: (
    responseInput:
      | { responseType: 'choice'; selectedOption: 'A' | 'B' }
      | { responseType: 'player-select'; selectedPlayerId: string }
      | { responseType: 'stance'; selectedStance: 'agree' | 'disagree' }
      | { responseType: 'spotlight-quiz'; targetPlayerId?: string; selectedOption?: 'A' | 'B'; confirmed?: boolean }
      | { responseType: 'discussion'; confirmed?: boolean }
  ) => Promise<{ isQuestionComplete: boolean }>;

  // ─── Pass The Phone State Machine Actions ──────────────────────────────────
  /** Step 1: Active selector picks target player */
  selectPassPhoneTarget: (targetPlayerId: string) => void;

  /** Step 2: Target confirms receipt of device */
  confirmPassPhoneHandover: () => void;

  /** Step 3: Target commits an action (take-shot or show-question) */
  commitPassPhoneAction: (action: RevealAction) => Promise<{ isRoundComplete: boolean }>;

  /** Step 4: Acknowledge reveal and advance to next round */
  acknowledgePassPhoneRevealAndAdvance: () => Promise<void>;

  /** Replays the game with the same vibe, players, and session type while avoiding seen questions */
  replayGame: () => Promise<void>;

  /** Resets session to initial idle state (preserves cross-session question history) */
  resetSession: () => void;

  /** Clears historical seen question memory */
  clearQuestionHistory: () => void;
}

// ─── Store Definition ─────────────────────────────────────────────────────────

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  session: INITIAL_SESSION,
  questionPool: [],
  seenQuestionIdentities: [],

  setSessionType: (sessionType) =>
    set((state) => ({
      session: { ...state.session, sessionType },
    })),

  setLanguage: (language) =>
    set((state) => ({
      session: { ...state.session, language },
    })),

  setVibe: (vibeId) =>
    set((state) => ({
      session: { ...state.session, vibeId },
    })),

  setPlayers: (players) =>
    set((state) => ({
      session: { ...state.session, players },
    })),

  setGameMode: (gameModeId) =>
    set((state) => ({
      session: { ...state.session, gameModeId },
    })),

  setSessionStatus: (status) =>
    set((state) => ({
      session: { ...state.session, status },
    })),

  startGame: async () => {
    const { session, seenQuestionIdentities } = get();
    if (!session.vibeId || session.players.length < 2) {
      return;
    }

    const selectedMode = session.gameModeId || 'all';
    const selectedSessionType = session.sessionType || 'standard';
    const language = session.language || 'en';

    // 1. Instant launch with static curated questions in requested language + cross-session history
    const staticQuestions = await defaultContentProvider.getQuestions({
      language,
      vibeId: session.vibeId,
      gameModeId: selectedMode !== 'all' ? selectedMode : undefined,
      players: session.players,
    });
    const newSession = startNewSession({
      vibeId: session.vibeId,
      players: session.players,
      gameModeId: selectedMode,
      totalRounds: session.totalRounds || DEFAULT_TOTAL_ROUNDS,
      questionPool: staticQuestions,
      seenIdentities: seenQuestionIdentities,
    });

    const populatedSession: GameSession = {
      ...newSession,
      language,
      sessionType: selectedSessionType,
      currentPlayerIndex: 0,
      responses: [],
      passPhoneState:
        selectedSessionType === 'pass-the-phone'
          ? initPassPhoneState(session.players)
          : undefined,
    };

    const updatedIdentities = populatedSession.currentQuestion
      ? [...seenQuestionIdentities, getQuestionIdentity(populatedSession.currentQuestion)]
      : seenQuestionIdentities;

    set({
      session: populatedSession,
      questionPool: staticQuestions,
      seenQuestionIdentities: updatedIdentities,
    });

    // 2. Asynchronous background AI question synthesis (Language & Mode-Aware)
    const vibeId = session.vibeId;
    const players = session.players;
    defaultContentProvider
      .getPersonalizedQuestions({
        language,
        vibeId,
        players,
        gameModeId: selectedMode,
        count: 8,
      })
      .then((aiQuestions) => {
        if (aiQuestions.length > 0) {
          set((state) => ({
            questionPool: [...state.questionPool, ...aiQuestions],
          }));
        }
      })
      .catch(() => {
        // Silent fallback: static pool continues without interruption
      });
  },

  submitAnswerAndAdvance: async (partialAnswer) => {
    const { session, questionPool, seenQuestionIdentities } = get();
    if (session.status !== 'playing' || !session.currentQuestion) {
      return;
    }

    const answer: RoundAnswer = {
      round: session.currentRound,
      questionId: session.currentQuestion.id,
      gameModeId: session.currentQuestion.gameModeId,
      selectedPlayerId: partialAnswer?.selectedPlayerId,
      targetPlayerId: partialAnswer?.targetPlayerId || session.currentQuestion.targetPlayerId,
      selectedOption: partialAnswer?.selectedOption,
      selectedStance: partialAnswer?.selectedStance,
      timestamp: Date.now(),
    };

    const pool =
      questionPool.length > 0
        ? questionPool
        : await defaultContentProvider.getQuestions({
            language: session.language || 'en',
            players: session.players,
          });
    const advancedSession = advanceSessionRound(
      session,
      answer,
      pool,
      seenQuestionIdentities
    );

    const nextIdentities = advancedSession.currentQuestion
      ? [...seenQuestionIdentities, getQuestionIdentity(advancedSession.currentQuestion)]
      : seenQuestionIdentities;

    set({
      session: advancedSession,
      seenQuestionIdentities: nextIdentities,
    });
  },

  submitPlayerResponse: async (responseInput) => {
    const { session, questionPool, seenQuestionIdentities } = get();
    if (session.status !== 'playing' || !session.currentQuestion || !session.id) {
      return { isQuestionComplete: false };
    }

    const currentIdx = session.currentPlayerIndex ?? 0;
    const answeringPlayer = session.players[currentIdx];
    if (!answeringPlayer) {
      return { isQuestionComplete: false };
    }

    const fullResponse = {
      id: generateResponseId(),
      sessionId: session.id,
      questionId: session.currentQuestion.id,
      playerId: answeringPlayer.id,
      targetPlayerId:
        responseInput.responseType === 'spotlight-quiz'
          ? responseInput.targetPlayerId || session.currentQuestion.targetPlayerId
          : undefined,
      timestamp: Date.now(),
      ...responseInput,
    } as PlayerResponse;

    const { nextSession, isQuestionComplete } = recordPlayerResponse(session, fullResponse);

    if (!isQuestionComplete) {
      // Advance to next player's turn for the current question
      set({ session: nextSession });
      return { isQuestionComplete: false };
    }

    // All players answered the current question! Advance to next round.
    const pool =
      questionPool.length > 0
        ? questionPool
        : await defaultContentProvider.getQuestions({
            language: session.language || 'en',
            players: session.players,
          });

    const summaryAnswer: RoundAnswer = {
      round: session.currentRound,
      questionId: session.currentQuestion.id,
      gameModeId: session.currentQuestion.gameModeId,
      selectedPlayerId:
        responseInput.responseType === 'player-select'
          ? responseInput.selectedPlayerId
          : undefined,
      selectedOption:
        responseInput.responseType === 'choice' ? responseInput.selectedOption : undefined,
      selectedStance:
        responseInput.responseType === 'stance' ? responseInput.selectedStance : undefined,
      timestamp: Date.now(),
    };

    const advancedSession = advanceSessionRound(
      nextSession,
      summaryAnswer,
      pool,
      seenQuestionIdentities
    );

    const finalSession: GameSession = {
      ...advancedSession,
      currentPlayerIndex: 0,
      responses: nextSession.responses, // preserve all individual responses
    };

    const nextIdentities = finalSession.currentQuestion
      ? [...seenQuestionIdentities, getQuestionIdentity(finalSession.currentQuestion)]
      : seenQuestionIdentities;

    set({
      session: finalSession,
      seenQuestionIdentities: nextIdentities,
    });

    return { isQuestionComplete: true };
  },

  // ─── Pass The Phone Action Implementations ─────────────────────────────────

  selectPassPhoneTarget: (targetPlayerId) => {
    const { session } = get();
    if (!session.passPhoneState || session.status !== 'playing') return;

    const nextSession = selectPassPhoneTarget(session, targetPlayerId);
    set({ session: nextSession });
  },

  confirmPassPhoneHandover: () => {
    const { session } = get();
    if (!session.passPhoneState || session.status !== 'playing') return;

    const nextSession = confirmPassPhoneHandover(session);
    set({ session: nextSession });
  },

  commitPassPhoneAction: async (action) => {
    const { session, questionPool, seenQuestionIdentities } = get();
    if (!session.passPhoneState || session.status !== 'playing') {
      return { isRoundComplete: false };
    }

    const { nextSession, isRoundComplete } = commitPassPhoneAction(session, action);

    if (!isRoundComplete) {
      // Transitioned to REVEALING_QUESTION
      set({ session: nextSession });
      return { isRoundComplete: false };
    }

    // 'take-shot' committed -> round completed immediately
    if (session.currentRound >= session.totalRounds) {
      // Game session complete
      const finalSession: GameSession = {
        ...nextSession,
        status: 'completed',
        passPhoneState: {
          ...nextSession.passPhoneState!,
          phase: 'SESSION_COMPLETE',
        },
      };
      set({ session: finalSession });
      return { isRoundComplete: true };
    }

    // Pick next question and advance round
    const pool =
      questionPool.length > 0 ? questionPool : await defaultContentProvider.getQuestions();
    const nextQuestion = session.vibeId
      ? selectNextQuestion(
          pool,
          nextSession.usedQuestionIds,
          session.vibeId,
          session.gameModeId || 'all',
          seenQuestionIdentities
        )
      : null;

    const advancedSession = advancePassPhoneRound(nextSession, nextQuestion);
    const nextIdentities = nextQuestion
      ? [...seenQuestionIdentities, getQuestionIdentity(nextQuestion)]
      : seenQuestionIdentities;

    set({
      session: advancedSession,
      seenQuestionIdentities: nextIdentities,
    });

    return { isRoundComplete: true };
  },

  acknowledgePassPhoneRevealAndAdvance: async () => {
    const { session, questionPool, seenQuestionIdentities } = get();
    if (!session.passPhoneState || session.status !== 'playing') return;

    const acknowledgedSession = acknowledgePassPhoneReveal(session);

    if (session.currentRound >= session.totalRounds) {
      const finalSession: GameSession = {
        ...acknowledgedSession,
        status: 'completed',
        passPhoneState: {
          ...acknowledgedSession.passPhoneState!,
          phase: 'SESSION_COMPLETE',
        },
      };
      set({ session: finalSession });
      return;
    }

    const pool =
      questionPool.length > 0 ? questionPool : await defaultContentProvider.getQuestions();
    const nextQuestion = session.vibeId
      ? selectNextQuestion(
          pool,
          acknowledgedSession.usedQuestionIds,
          session.vibeId,
          session.gameModeId || 'all',
          seenQuestionIdentities
        )
      : null;

    const advancedSession = advancePassPhoneRound(acknowledgedSession, nextQuestion);
    const nextIdentities = nextQuestion
      ? [...seenQuestionIdentities, getQuestionIdentity(nextQuestion)]
      : seenQuestionIdentities;

    set({
      session: advancedSession,
      seenQuestionIdentities: nextIdentities,
    });
  },

  replayGame: async () => {
    const { session, seenQuestionIdentities } = get();
    if (!session.vibeId || session.players.length < 2) {
      return;
    }

    const selectedMode = session.gameModeId || 'all';
    const selectedSessionType = session.sessionType || 'standard';
    const language = session.language || 'en';
    const staticQuestions = await defaultContentProvider.getQuestions({
      language,
      vibeId: session.vibeId,
      gameModeId: selectedMode !== 'all' ? selectedMode : undefined,
    });
    const replayedSession = replaySession(
      session,
      staticQuestions,
      session.usedQuestionIds,
      seenQuestionIdentities
    );

    const populatedSession: GameSession = {
      ...replayedSession,
      language,
      sessionType: selectedSessionType,
      currentPlayerIndex: 0,
      responses: [],
      passPhoneState:
        selectedSessionType === 'pass-the-phone'
          ? initPassPhoneState(session.players)
          : undefined,
    };

    const updatedIdentities = populatedSession.currentQuestion
      ? [...seenQuestionIdentities, getQuestionIdentity(populatedSession.currentQuestion)]
      : seenQuestionIdentities;

    set({
      session: populatedSession,
      questionPool: staticQuestions,
      seenQuestionIdentities: updatedIdentities,
    });

    // Background prefetch for new replay session (Language & Mode-Aware)
    const vibeId = session.vibeId;
    const players = session.players;
    defaultContentProvider
      .getPersonalizedQuestions({
        language,
        vibeId,
        players,
        gameModeId: selectedMode,
        count: 8,
      })
      .then((aiQuestions) => {
        if (aiQuestions.length > 0) {
          set((state) => ({
            questionPool: [...state.questionPool, ...aiQuestions],
          }));
        }
      })
      .catch(() => {});
  },

  resetSession: () =>
    set((state) => ({
      session: { ...INITIAL_SESSION },
      questionPool: [],
      // Preserve seenQuestionIdentities across navigation/restarts
      seenQuestionIdentities: state.seenQuestionIdentities,
    })),

  clearQuestionHistory: () =>
    set({ seenQuestionIdentities: [] }),
}));

// ─── Atomic Selector Hooks (100% stable references) ───────────────────────────

export const useGameSession = () => useGameStore((s) => s.session);
export const useLanguage = () => useGameStore((s) => s.session.language || 'en');
export const useSessionStatus = () => useGameStore((s) => s.session.status);
export const useSessionType = () => useGameStore((s) => s.session.sessionType);
export const useSelectedVibe = () => useGameStore((s) => s.session.vibeId);
export const useSelectedGameMode = () => useGameStore((s) => s.session.gameModeId);
export const usePlayers = () => useGameStore((s) => s.session.players);
export const useCurrentRound = () => useGameStore((s) => s.session.currentRound);
export const useTotalRounds = () => useGameStore((s) => s.session.totalRounds);
export const useCurrentQuestion = () => useGameStore((s) => s.session.currentQuestion);
export const useIsGameCompleted = () => useGameStore((s) => s.session.status === 'completed');
export const useSeenQuestionIdentities = () =>
  useGameStore((s) => s.seenQuestionIdentities);

// Group Session Selectors
export const useCurrentPlayerIndex = () =>
  useGameStore((s) => s.session.currentPlayerIndex ?? 0);
export const useCurrentAnsweringPlayer = () =>
  useGameStore((s) => s.session.players[s.session.currentPlayerIndex ?? 0] || null);
export const useGroupResponses = () =>
  useGameStore((s) => s.session.responses || []);

// Pass The Phone Selectors
export const usePassPhoneState = (): PassPhoneState | undefined =>
  useGameStore((s) => s.session.passPhoneState);
export const usePassPhonePhase = (): PassPhonePhase =>
  useGameStore((s) => s.session.passPhoneState?.phase || 'SELECTING_TARGET');
export const usePassPhoneSelector = (): Player =>
  useGameStore(
    (s) =>
      s.session.players.find(
        (p) => p.id === s.session.passPhoneState?.activeSelectorPlayerId
      ) || s.session.players[0]
  );
export const usePassPhoneTarget = (): Player | null =>
  useGameStore(
    (s) =>
      s.session.players.find(
        (p) => p.id === s.session.passPhoneState?.selectedTargetPlayerId
      ) || null
  );
export const usePassPhoneShots = (): number =>
  useGameStore((s) => s.session.passPhoneState?.shotsCount ?? 0);
export const usePassPhoneSelectedAction = () =>
  useGameStore((s) => s.session.passPhoneState?.selectedAction);
export const usePassPhoneRounds = (): PassPhoneRoundRecord[] =>
  useGameStore((s) => s.session.passPhoneState?.roundHistory || []);

// Action hooks with stable references
export const useSetSessionType = () => useGameStore((s) => s.setSessionType);
export const useSetLanguage = () => useGameStore((s) => s.setLanguage);
export const useSetVibe = () => useGameStore((s) => s.setVibe);
export const useSetPlayers = () => useGameStore((s) => s.setPlayers);
export const useSetGameMode = () => useGameStore((s) => s.setGameMode);
export const useStartGame = () => useGameStore((s) => s.startGame);
export const useAnswerAndAdvance = () => useGameStore((s) => s.submitAnswerAndAdvance);
export const useSubmitPlayerResponse = () => useGameStore((s) => s.submitPlayerResponse);
export const useSelectPassPhoneTarget = () => useGameStore((s) => s.selectPassPhoneTarget);
export const useConfirmPassPhoneHandover = () => useGameStore((s) => s.confirmPassPhoneHandover);
export const useCommitPassPhoneAction = () => useGameStore((s) => s.commitPassPhoneAction);
export const useAcknowledgePassPhoneReveal = () =>
  useGameStore((s) => s.acknowledgePassPhoneRevealAndAdvance);
export const useReplayGame = () => useGameStore((s) => s.replayGame);
export const useResetSession = () => useGameStore((s) => s.resetSession);
export const useClearQuestionHistory = () => useGameStore((s) => s.clearQuestionHistory);
