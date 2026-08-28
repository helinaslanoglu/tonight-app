/**
 * Core domain types for the Tonight app.
 * Milestone 1: minimal type definitions only.
 * Game logic, question content, and scoring are NOT implemented yet.
 */

// ─── Vibe ─────────────────────────────────────────────────────────────────────

/** The mood/theme selected at the start of a session. */
export type VibeId =
  | 'funny'
  | 'party'
  | 'date'
  | 'deep-talk'
  | 'chaos'
  | 'chill';

export interface Vibe {
  id: VibeId;
  label: string;
  emoji: string;
  description: string;
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  /** Optional avatar color for placeholder UI */
  color?: string;
}

// ─── Game Mode ────────────────────────────────────────────────────────────────

/**
 * Game mode defines the rule set used during a session.
 * Concrete modes will be added in later milestones.
 */
export type GameModeId = 'classic' | 'truth-or-dare' | 'hot-seat' | 'rapid-fire';

export interface GameMode {
  id: GameModeId;
  label: string;
  description: string;
  /** Minimum number of players required */
  minPlayers: number;
}

// ─── Question (placeholder shape only) ───────────────────────────────────────

/**
 * Minimal question shape. Content will be loaded from data layer in later milestones.
 */
export interface Question {
  id: string;
  text: string;
  vibeId: VibeId;
  gameModeId: GameModeId;
}

// ─── Session ──────────────────────────────────────────────────────────────────

/** Lifecycle state of a game session. */
export type SessionStatus = 'idle' | 'setup' | 'playing' | 'finished';

export interface GameSession {
  id: string | null;
  status: SessionStatus;
  vibeId: VibeId | null;
  gameModeId: GameModeId | null;
  players: Player[];
  currentQuestionIndex: number;
}
