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
  language?: LanguageId;
  /** Explicit structured target player ID when the question targets a specific participant */
  targetPlayerId?: string;
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
  /** Explicit structured target player ID for the spotlight participant */
  targetPlayerId?: string;
  prompt?: string;
  optionA?: string;
  optionB?: string;
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
  selectedOption?: 'A' | 'B';
  confirmed?: boolean;
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
 * Session type determines HOW the entire gameplay loop collects and orchestrates responses:
 * - 'standard': Single collective answer/vote per round.
 * - 'group': Everyone answers independently via pass-the-phone.
 * - 'pass-the-phone': Party game loop where active selector targets a player, and target takes an action or reveals question.
 */
export type SessionType = 'standard' | 'group' | 'pass-the-phone';

/** Lifecycle state of a game session. */
export type SessionStatus = 'idle' | 'setup' | 'playing' | 'completed';

// ─── Pass The Phone State Machine Domain Types ────────────────────────────────

export type PassPhonePhase =
  | 'SELECTING_TARGET'    // Active selector reads question and selects target player
  | 'PASSING_PHONE'       // Device is handed to target; question is strictly hidden
  | 'TARGET_ACTION'       // Target sees action choice (e.g. TAKE THE SHOT vs SHOW QUESTION)
  | 'REVEALING_QUESTION'  // Question & selector are revealed
  | 'ROUND_COMPLETE'      // Round finished; ready for next round
  | 'SESSION_COMPLETE';   // All rounds finished; results ready

export type RevealAction =
  | 'take-shot'
  | 'show-question'
  | 'take-sip'
  | 'do-dare'
  | 'skip';

export interface PassPhoneRoundRecord {
  roundNumber: number;
  questionId: string;
  questionText: string;
  selectorPlayerId: string;
  targetPlayerId: string;
  action: RevealAction;
  timestamp: number;
}

export interface PassPhoneState {
  phase: PassPhonePhase;
  activeSelectorPlayerId: string;
  selectedTargetPlayerId?: string;
  selectedAction?: RevealAction;
  shotsCount: number;
  roundHistory: PassPhoneRoundRecord[];
}

// ─── Language & Localization ──────────────────────────────────────────────────

export type LanguageId = 'en' | 'tr' | 'fr' | 'ar';

export interface LanguageDefinition {
  id: LanguageId;
  label: string;
  nativeLabel: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

export interface GameSession {
  id: string | null;
  sessionType: SessionType;
  language: LanguageId;
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
  /** Pass The Phone session state machine */
  passPhoneState?: PassPhoneState;
}

// ─── Pass The Phone Results Model ─────────────────────────────────────────────

export interface PassPhoneResult {
  sessionId: string;
  vibeId: VibeId;
  totalRounds: number;
  totalShots: number;
  players: Player[];
  mostTargetedPlayer: { playerId: string; name: string; count: number } | null;
  mostFrequentSelector: { playerId: string; name: string; count: number } | null;
  actionDistribution: Record<RevealAction, number>;
  /** Relationship matrix: fromSelectorId -> toTargetId -> count */
  relationshipMatrix: Record<string, Record<string, number>>;
  rounds: PassPhoneRoundRecord[];
  completedAt: string;
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
