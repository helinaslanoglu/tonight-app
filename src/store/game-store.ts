import { create } from 'zustand';

import type {
  GameModeId,
  GameSession,
  Player,
  SessionStatus,
  VibeId,
} from '@/types';

// ─── State shape ──────────────────────────────────────────────────────────────

interface GameState {
  session: GameSession;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

interface GameActions {
  /** Set the chosen vibe before starting a session. */
  setVibe: (vibeId: VibeId) => void;

  /** Set the chosen game mode. */
  setGameMode: (gameModeId: GameModeId) => void;

  /** Replace the full player list. */
  setPlayers: (players: Player[]) => void;

  /** Add a single player to the current list. */
  addPlayer: (player: Player) => void;

  /** Remove a player by id. */
  removePlayer: (playerId: string) => void;

  /** Transition the session lifecycle status. */
  setSessionStatus: (status: SessionStatus) => void;

  /** Reset the session to its initial idle state. */
  resetSession: () => void;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_SESSION: GameSession = {
  id: null,
  status: 'idle',
  vibeId: null,
  gameModeId: null,
  players: [],
  currentQuestionIndex: 0,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState & GameActions>((set) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  session: INITIAL_SESSION,

  // ── Actions ────────────────────────────────────────────────────────────────
  setVibe: (vibeId) =>
    set((state) => ({
      session: { ...state.session, vibeId },
    })),

  setGameMode: (gameModeId) =>
    set((state) => ({
      session: { ...state.session, gameModeId },
    })),

  setPlayers: (players) =>
    set((state) => ({
      session: { ...state.session, players },
    })),

  addPlayer: (player) =>
    set((state) => ({
      session: {
        ...state.session,
        players: [...state.session.players, player],
      },
    })),

  removePlayer: (playerId) =>
    set((state) => ({
      session: {
        ...state.session,
        players: state.session.players.filter((p) => p.id !== playerId),
      },
    })),

  setSessionStatus: (status) =>
    set((state) => ({
      session: { ...state.session, status },
    })),

  resetSession: () =>
    set({ session: { ...INITIAL_SESSION, id: null } }),
}));

// ─── Atomic Selector Hooks (Performance Optimization) ─────────────────────────
// Using fine-grained selectors prevents full-tree re-renders when unrelated state slices change.

export const useGameSession = () => useGameStore((s) => s.session);
export const useSessionStatus = () => useGameStore((s) => s.session.status);
export const useSelectedVibe = () => useGameStore((s) => s.session.vibeId);
export const useSelectedGameMode = () => useGameStore((s) => s.session.gameModeId);
export const usePlayers = () => useGameStore((s) => s.session.players);
export const useCurrentQuestionIndex = () => useGameStore((s) => s.session.currentQuestionIndex);

/** Hook exposing only the action setters (stable identity, zero re-renders on state change). */
export const useGameActions = () =>
  useGameStore((s) => ({
    setVibe: s.setVibe,
    setGameMode: s.setGameMode,
    setPlayers: s.setPlayers,
    addPlayer: s.addPlayer,
    removePlayer: s.removePlayer,
    setSessionStatus: s.setSessionStatus,
    resetSession: s.resetSession,
  }));
