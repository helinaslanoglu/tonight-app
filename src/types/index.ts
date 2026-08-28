/**
 * Core domain types for the Tonight app.
 * Strongly typed models for Vibes, Players, Game Modes, Questions, and Sessions.
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
  /** Avatar accent color (hex) */
  color?: string;
}

// ─── Game Mode ────────────────────────────────────────────────────────────────

export type GameModeId =
  | 'would-you-rather'
  | 'most-likely-to'
  | 'open-question'
  | 'hot-take'
  | 'who-knows-me-best';

export type GameModeInteractionType =
  | 'choice'           // Would You Rather (Option A vs B)
  | 'player-select'    // Most Likely To (Pick a player)
  | 'discussion'       // Open Question (Prompt discussion)
  | 'stance'           // Hot Take (Agree vs Disagree)
  | 'spotlight-quiz';  // Who Knows Me Best (Spotlight player + guess)

export interface GameMode {
  id: GameModeId;
  label: string;
  tagline: string;
  description: string;
  emoji: string;
  minPlayers: number;
  supportedVibes: VibeId[];
  interactionType: GameModeInteractionType;
}

// ─── Question (Discriminated Union) ───────────────────────────────────────────

export interface BaseQuestion {
  id: string;
  text: string;
  vibeId: VibeId;
}

export interface WouldYouRatherQuestion extends BaseQuestion {
  gameModeId: 'would-you-rather';
  optionA: string;
  optionB: string;
}

export interface MostLikelyToQuestion extends BaseQuestion {
  gameModeId: 'most-likely-to';
}

export interface OpenQuestion extends BaseQuestion {
  gameModeId: 'open-question';
  prompt?: string;
}

export interface HotTakeQuestion extends BaseQuestion {
  gameModeId: 'hot-take';
  agreeLabel?: string;
  disagreeLabel?: string;
}

export interface WhoKnowsMeBestQuestion extends BaseQuestion {
  gameModeId: 'who-knows-me-best';
  prompt?: string;
}

export type Question =
  | WouldYouRatherQuestion
  | MostLikelyToQuestion
  | OpenQuestion
  | HotTakeQuestion
  | WhoKnowsMeBestQuestion;

// ─── Round Answers ────────────────────────────────────────────────────────────

export interface RoundAnswer {
  round: number;
  questionId: string;
  gameModeId: GameModeId;
  selectedPlayerId?: string;
  targetPlayerId?: string;
  selectedOption?: 'A' | 'B';
  selectedStance?: 'agree' | 'disagree';
  timestamp: number;
}

// ─── Session ──────────────────────────────────────────────────────────────────

/** Lifecycle state of a game session. */
export type SessionStatus = 'idle' | 'setup' | 'playing' | 'completed';

export interface GameSession {
  id: string | null;
  status: SessionStatus;
  vibeId: VibeId | null;
  gameModeId: GameModeId | 'all' | null;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  currentQuestion: Question | null;
  usedQuestionIds: string[];
  answers: RoundAnswer[];
}

// ─── Game Result / Summary ───────────────────────────────────────────────────

export interface GameResult {
  sessionId: string;
  vibeId: VibeId;
  gameModeId: GameModeId | 'all';
  totalRounds: number;
  roundsCompleted: number;
  playerCount: number;
  players: Player[];
  completedAt: string; // ISO timestamp
}
