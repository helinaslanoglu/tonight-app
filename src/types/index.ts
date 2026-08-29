/**
 * Core domain types for the Tonight app.
 * Strongly typed models for Vibes, Players, Game Modes, Questions, Sessions,
 * and Multi-Player Group Responses.
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

// ─── Round Answers (Standard Mode Summary) ────────────────────────────────────

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

// ─── Individual Player Responses (Group Session Mode) ─────────────────────────

export type ResponseType =
  | 'choice'
  | 'player-select'
  | 'stance'
  | 'spotlight-quiz'
  | 'discussion';

export interface BasePlayerResponse {
  id: string;
  sessionId: string;
  questionId: string;
  playerId: string;
  responseType: ResponseType;
  timestamp: number;
}

export interface ChoiceResponse extends BasePlayerResponse {
  responseType: 'choice';
  selectedOption: 'A' | 'B';
}

export interface PlayerSelectionResponse extends BasePlayerResponse {
  responseType: 'player-select';
  selectedPlayerId: string;
}

export interface StanceResponse extends BasePlayerResponse {
  responseType: 'stance';
  selectedStance: 'agree' | 'disagree';
}

export interface SpotlightResponse extends BasePlayerResponse {
  responseType: 'spotlight-quiz';
  targetPlayerId?: string;
}

export interface DiscussionResponse extends BasePlayerResponse {
  responseType: 'discussion';
  confirmed?: boolean;
}

/**
 * Strongly-typed discriminated union for all individual player responses in Group Session.
 */
export type PlayerResponse =
  | ChoiceResponse
  | PlayerSelectionResponse
  | StanceResponse
  | SpotlightResponse
  | DiscussionResponse;

// ─── Session Types ────────────────────────────────────────────────────────────

/**
 * Session type determines HOW the session collects responses:
 * - 'standard': Single collective answer/vote per round.
 * - 'group': Pass-the-phone sequential individual responses from every player.
 */
export type SessionType = 'standard' | 'group';

/** Lifecycle state of a game session. */
export type SessionStatus = 'idle' | 'setup' | 'playing' | 'completed';

export interface GameSession {
  id: string | null;
  sessionType: SessionType;
  status: SessionStatus;
  vibeId: VibeId | null;
  gameModeId: GameModeId | 'all' | null;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  currentQuestion: Question | null;
  usedQuestionIds: string[];
  /** Summary / legacy answers */
  answers: RoundAnswer[];
  /** Group Session turn state: active answering player index (0 to players.length - 1) */
  currentPlayerIndex?: number;
  /** Group Session raw response store: all individual player responses */
  responses?: PlayerResponse[];
}

// ─── Game Result / Summary / Insights (Standard Mode) ─────────────────────────

export interface PlayerInsight {
  playerId: string;
  playerName: string;
  playerColor?: string;
  badge: string;
  title: string;
  roastOrCompliment: string;
  voteCount: number;
}

export interface SessionRecap {
  synergyTitle: string;
  synergySubtitle: string;
  vibeSummary: string;
  playerInsights: PlayerInsight[];
  highlightQuestionText?: string;
}

export interface GameResult {
  sessionId: string;
  vibeId: VibeId;
  gameModeId: GameModeId | 'all';
  totalRounds: number;
  roundsCompleted: number;
  playerCount: number;
  players: Player[];
  completedAt: string; // ISO timestamp
  recap?: SessionRecap;
}

// ─── Group Session Aggregated Results (Deterministic Facts) ───────────────────

export interface PlayerSelectionStats {
  playerId: string;
  playerName: string;
  playerColor?: string;
  timesSelected: number;
  selectionPercentage: number;
  /** Map of fromPlayerId -> count of times they selected this player */
  selectedBy: Record<string, number>;
  /** Map of toPlayerId -> count of times this player selected them */
  selectionsMade: Record<string, number>;
}

export interface ChoiceBreakdown {
  questionId: string;
  questionText: string;
  optionACount: number;
  optionBCount: number;
  playerChoices: Record<string, 'A' | 'B'>;
}

export interface StanceBreakdown {
  questionId: string;
  questionText: string;
  agreeCount: number;
  disagreeCount: number;
  playerStances: Record<string, 'agree' | 'disagree'>;
}

export interface GroupResult {
  sessionId: string;
  vibeId: VibeId;
  gameModeId: GameModeId | 'all';
  totalQuestions: number;
  totalExpectedResponses: number;
  totalCollectedResponses: number;
  players: Player[];
  playerStats: Record<string, PlayerSelectionStats>;
  topSelectedPlayers: { playerId: string; name: string; count: number }[];
  choiceBreakdowns: ChoiceBreakdown[];
  stanceBreakdowns: StanceBreakdown[];
  /** Full relationship matrix: fromPlayerId -> toPlayerId -> count */
  relationshipMatrix: Record<string, Record<string, number>>;
  completedAt: string;
}
