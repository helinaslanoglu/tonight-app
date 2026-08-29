/**
 * Tonight AI Orchestration Service
 * ────────────────────────────────
 * Comprehensive, resilient orchestrator that coordinates:
 *   1. Pluggable Providers (Local Synthesizer vs Remote Backend Gateway)
 *   2. Rate Limiting & Circuit Breaking (Session budgeting, Cooldown)
 *   3. Strict Schema Validation & Sanitization
 *   4. Deduplication & Semantic Filtering
 *   5. Observability & Telemetry Events
 */

import type { Question } from '@/types';
import { AICircuitBreaker } from './circuit-breaker';
import { filterDuplicateQuestions } from './deduplicator';
import { LocalSynthesizerProvider } from './providers/local-provider';
import { RemoteGatewayProvider } from './providers/remote-provider';
import type {
  AIGenerationParams,
  AIQuestionProvider,
  AITelemetryEvent,
  AITelemetryHandler,
} from './types';
import { validateAndSanitizeQuestion } from './validator';

export class AIService {
  private provider: AIQuestionProvider;
  private readonly circuitBreaker: AICircuitBreaker;
  private readonly telemetryListeners: Set<AITelemetryHandler> = new Set();
  private readonly telemetryHistory: AITelemetryEvent[] = [];

  constructor(customProvider?: AIQuestionProvider) {
    // Determine provider: Remote Gateway if configured, else Local Synthesizer
    if (customProvider) {
      this.provider = customProvider;
    } else {
      const gatewayUrl = process.env.EXPO_PUBLIC_AI_GATEWAY_URL;
      this.provider = gatewayUrl
        ? new RemoteGatewayProvider(gatewayUrl)
        : new LocalSynthesizerProvider();
    }

    this.circuitBreaker = new AICircuitBreaker();
  }

  /**
   * Pluggable provider setter (for testing or runtime switching).
   */
  setProvider(provider: AIQuestionProvider): void {
    this.provider = provider;
  }

  /**
   * Attaches a telemetry listener for observability and debugging.
   */
  addTelemetryListener(handler: AITelemetryHandler): () => void {
    this.telemetryListeners.add(handler);
    return () => this.telemetryListeners.delete(handler);
  }

  /**
   * Retrieves recent telemetry history.
   */
  getTelemetryHistory(): AITelemetryEvent[] {
    return [...this.telemetryHistory];
  }

  private emitTelemetry(event: AITelemetryEvent): void {
    this.telemetryHistory.push(event);
    if (this.telemetryHistory.length > 50) {
      this.telemetryHistory.shift();
    }
    for (const listener of this.telemetryListeners) {
      try {
        listener(event);
      } catch {
        // Telemetry errors must never crash the app
      }
    }
  }

  /**
   * Resets session state (budget and circuit counters) for a new game.
   */
  resetSession(): void {
    this.circuitBreaker.resetSessionBudget();
  }

  /**
   * Generates, validates, and deduplicates personalized questions.
   * NEVER throws an error to calling UI/Store code.
   */
  async generatePersonalizedQuestions(params: AIGenerationParams): Promise<Question[]> {
    const startTime = Date.now();

    // 1. Check Rate Limiter & Circuit Breaker
    const check = this.circuitBreaker.canExecute();
    if (!check.allowed) {
      this.emitTelemetry({
        type: 'AI_CIRCUIT_OPEN',
        timestamp: startTime,
        vibeId: params.vibeId,
        playerCount: params.players.length,
        error: check.reason,
      });
      return [];
    }

    this.circuitBreaker.recordRequestStart();
    this.emitTelemetry({
      type: 'AI_REQUEST_START',
      timestamp: startTime,
      vibeId: params.vibeId,
      playerCount: params.players.length,
    });

    try {
      // 2. Fetch raw questions from active provider
      const rawQuestions = await this.provider.generateQuestions(params);

      // 3. Schema Validation & Sanitization Pipeline
      const validatedQuestions: Question[] = [];
      for (const raw of rawQuestions) {
        const validation = validateAndSanitizeQuestion(raw, params.language);
        if (validation.isValid && validation.sanitizedQuestion) {
          validatedQuestions.push(validation.sanitizedQuestion);
        } else {
          this.emitTelemetry({
            type: 'AI_VALIDATION_FAILED',
            timestamp: Date.now(),
            details: { reason: validation.reason, raw },
          });
        }
      }

      // 4. Deduplication & Semantic Filtering
      const existingPool = params.existingQuestions || [];
      const { uniqueQuestions, duplicateCount } = filterDuplicateQuestions(
        validatedQuestions,
        existingPool
      );

      if (duplicateCount > 0) {
        this.emitTelemetry({
          type: 'AI_DUPLICATE_DISCARDED',
          timestamp: Date.now(),
          count: duplicateCount,
        });
      }

      // 5. Record Success & Emit Telemetry
      this.circuitBreaker.recordSuccess();
      const durationMs = Date.now() - startTime;

      this.emitTelemetry({
        type: 'AI_REQUEST_SUCCESS',
        timestamp: Date.now(),
        vibeId: params.vibeId,
        playerCount: params.players.length,
        durationMs,
        count: uniqueQuestions.length,
      });

      return uniqueQuestions;
    } catch (err) {
      // 6. Record Failure & Emit Telemetry (Graceful Fallback)
      this.circuitBreaker.recordFailure();
      const durationMs = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);

      this.emitTelemetry({
        type: 'AI_REQUEST_FAILED',
        timestamp: Date.now(),
        vibeId: params.vibeId,
        playerCount: params.players.length,
        durationMs,
        error: errorMessage,
      });

      return [];
    }
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const defaultAIService = new AIService();

export async function generatePersonalizedQuestions(
  params: AIGenerationParams
): Promise<Question[]> {
  return defaultAIService.generatePersonalizedQuestions(params);
}
