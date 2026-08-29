import { create } from 'zustand';

import { defaultContentProvider } from '@/data';
import {
  advanceSessionRound,
  DEFAULT_TOTAL_ROUNDS,
  replaySession,
  startNewSession,
} from '@/engine';
import type {
  GameModeId,
  GameSession,
  Player,
  Question,
  RoundAnswer,
  SessionStatus,
  VibeId,
} from '@/types';
import { getQuestionIdentity } from '@/utils';

// ─── Initial State ────────────────────────────────────────────────────────────

const INITIAL_SESSION: GameSession = {
  id: null,
  status: 'idle',
  vibeId: null,
  gameModeId: 'all',
  players: [],
  currentRound: 0,
  totalRounds: DEFAULT_TOTAL_ROUNDS,
  currentQuestion: null,
  usedQuestionIds: [],
  answers: [],
};

// ─── Store Interface ──────────────────────────────────────────────────────────

interface GameState {
  session: GameSession;
  questionPool: Question[];
  /** App-scoped sliding window of seen question identities to prevent cross-session repeats */
  seenQuestionIdentities: string[];
}

interface GameActions {
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

  /** Submits an answer for the current round and advances to the next question */
  submitAnswerAndAdvance: (partialAnswer?: Partial<RoundAnswer>) => Promise<void>;

  /** Replays the game with the same vibe and players while avoiding seen questions */
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

    // 1. Instant launch with static curated questions + cross-session history
    const staticQuestions = await defaultContentProvider.getQuestions();
    const newSession = startNewSession({
      vibeId: session.vibeId,
      players: session.players,
      gameModeId: selectedMode,
      totalRounds: session.totalRounds || DEFAULT_TOTAL_ROUNDS,
      questionPool: staticQuestions,
      seenIdentities: seenQuestionIdentities,
    });

    const updatedIdentities = newSession.currentQuestion
      ? [...seenQuestionIdentities, getQuestionIdentity(newSession.currentQuestion)]
      : seenQuestionIdentities;

    set({
      session: newSession,
      questionPool: staticQuestions,
      seenQuestionIdentities: updatedIdentities,
    });

    // 2. Asynchronous background AI question synthesis (Mode-Aware)
    const vibeId = session.vibeId;
    const players = session.players;
    defaultContentProvider
      .getPersonalizedQuestions({
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
      targetPlayerId: partialAnswer?.targetPlayerId,
      selectedOption: partialAnswer?.selectedOption,
      selectedStance: partialAnswer?.selectedStance,
      timestamp: Date.now(),
    };

    const pool =
      questionPool.length > 0 ? questionPool : await defaultContentProvider.getQuestions();
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

  replayGame: async () => {
    const { session, seenQuestionIdentities } = get();
    if (!session.vibeId || session.players.length < 2) {
      return;
    }

    const selectedMode = session.gameModeId || 'all';
    const staticQuestions = await defaultContentProvider.getQuestions();
    const replayedSession = replaySession(
      session,
      staticQuestions,
      session.usedQuestionIds,
      seenQuestionIdentities
    );

    const updatedIdentities = replayedSession.currentQuestion
      ? [...seenQuestionIdentities, getQuestionIdentity(replayedSession.currentQuestion)]
      : seenQuestionIdentities;

    set({
      session: replayedSession,
      questionPool: staticQuestions,
      seenQuestionIdentities: updatedIdentities,
    });

    // Background prefetch for new replay session (Mode-Aware)
    const vibeId = session.vibeId;
    const players = session.players;
    defaultContentProvider
      .getPersonalizedQuestions({
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
export const useSessionStatus = () => useGameStore((s) => s.session.status);
export const useSelectedVibe = () => useGameStore((s) => s.session.vibeId);
export const useSelectedGameMode = () => useGameStore((s) => s.session.gameModeId);
export const usePlayers = () => useGameStore((s) => s.session.players);
export const useCurrentRound = () => useGameStore((s) => s.session.currentRound);
export const useTotalRounds = () => useGameStore((s) => s.session.totalRounds);
export const useCurrentQuestion = () => useGameStore((s) => s.session.currentQuestion);
export const useIsGameCompleted = () => useGameStore((s) => s.session.status === 'completed');
export const useSeenQuestionIdentities = () =>
  useGameStore((s) => s.seenQuestionIdentities);

// Action hooks with stable references
export const useSetVibe = () => useGameStore((s) => s.setVibe);
export const useSetPlayers = () => useGameStore((s) => s.setPlayers);
export const useSetGameMode = () => useGameStore((s) => s.setGameMode);
export const useStartGame = () => useGameStore((s) => s.startGame);
export const useAnswerAndAdvance = () => useGameStore((s) => s.submitAnswerAndAdvance);
export const useReplayGame = () => useGameStore((s) => s.replayGame);
export const useResetSession = () => useGameStore((s) => s.resetSession);
export const useClearQuestionHistory = () => useGameStore((s) => s.clearQuestionHistory);
