/**
 * AI Subsystem Types & Interfaces
 * ────────────────────────────────
 * Defines the contract for AI question generation, validation, rate limiting,
 * provider adapters, and observability telemetry.
 */

import type { GameModeId, LanguageId, Player, Question, VibeId } from '@/types';

export interface AIGenerationParams {
  language?: LanguageId;
  vibeId: VibeId;
  players: Player[];
  gameModeId?: GameModeId | 'all';
  count?: number;
  existingQuestions?: Question[];
}

export interface AIValidationResult {
  isValid: boolean;
  sanitizedQuestion?: Question;
  reason?: string;
}

export interface AIProviderConfig {
  gatewayUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export type AITelemetryEventType =
  | 'AI_REQUEST_START'
  | 'AI_REQUEST_SUCCESS'
  | 'AI_REQUEST_FAILED'
  | 'AI_CIRCUIT_OPEN'
  | 'AI_VALIDATION_FAILED'
  | 'AI_DUPLICATE_DISCARDED';

export interface AITelemetryEvent {
  type: AITelemetryEventType;
  timestamp: number;
  vibeId?: VibeId;
  playerCount?: number;
  durationMs?: number;
  error?: string;
  count?: number;
  details?: Record<string, unknown>;
}

export type AITelemetryHandler = (event: AITelemetryEvent) => void;

/**
 * Pluggable AI Provider Adapter Interface.
 * Allows swapping Local Synthesizer with a Remote Backend Gateway or LLM Provider.
 */
export interface AIQuestionProvider {
  name: string;
  generateQuestions: (params: AIGenerationParams, signal?: AbortSignal) => Promise<Question[]>;
}
