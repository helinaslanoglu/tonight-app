/**
 * Remote Gateway AI Provider
 * ───────────────────────────
 * Securely calls a dedicated backend proxy / serverless API endpoint.
 *
 * Security Guarantee:
 * - NO third-party AI keys (OpenAI / Gemini secrets) exist in the mobile bundle.
 * - The backend proxy performs prompt engineering, rate limiting, and model invocation.
 * - Client enforces strict AbortController timeouts to prevent UI stalling.
 */

import type { Question } from '@/types';
import type { AIGenerationParams, AIQuestionProvider } from '../types';

export class RemoteGatewayProvider implements AIQuestionProvider {
  readonly name = 'RemoteGateway';
  private readonly gatewayUrl: string;
  private readonly timeoutMs: number;

  constructor(gatewayUrl: string, timeoutMs = 3500) {
    this.gatewayUrl = gatewayUrl;
    this.timeoutMs = timeoutMs;
  }

  async generateQuestions(params: AIGenerationParams, signal?: AbortSignal): Promise<Question[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    // If external signal fires, abort local controller too
    signal?.addEventListener('abort', () => controller.abort());

    try {
      const response = await fetch(this.gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vibeId: params.vibeId,
          players: params.players.map((p) => ({ id: p.id, name: p.name })),
          count: params.count ?? 6,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Remote AI Gateway returned status ${response.status}`);
      }

      const data = (await response.json()) as { questions: Question[] };
      return Array.isArray(data?.questions) ? data.questions : [];
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }
}
