/**
 * AI Circuit Breaker & Rate Controller
 * ────────────────────────────────────
 * Controls cost, throttles request bursts, and trips open on repeated failures
 * to ensure client performance and prevent cascading retries.
 */

export interface CircuitBreakerOptions {
  cooldownMs?: number; // Minimum gap between AI requests
  maxConsecutiveFailures?: number; // Failures before opening circuit
  resetTimeoutMs?: number; // Duration to remain open before attempting half-open
  maxCallsPerSession?: number; // Hard budget per session
}

export class AICircuitBreaker {
  private consecutiveFailures = 0;
  private lastRequestTime = 0;
  private circuitOpenedAt = 0;
  private sessionCallCount = 0;

  private readonly cooldownMs: number;
  private readonly maxConsecutiveFailures: number;
  private readonly resetTimeoutMs: number;
  private readonly maxCallsPerSession: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.cooldownMs = options.cooldownMs ?? 10_000; // 10s cooldown
    this.maxConsecutiveFailures = options.maxConsecutiveFailures ?? 2;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 60_000; // 60s open
    this.maxCallsPerSession = options.maxCallsPerSession ?? 2; // max 2 calls per game
  }

  /**
   * Checks if an AI request is permitted right now.
   */
  canExecute(): { allowed: boolean; reason?: string } {
    const now = Date.now();

    // 1. Check session budget
    if (this.sessionCallCount >= this.maxCallsPerSession) {
      return { allowed: false, reason: 'Session AI budget exceeded' };
    }

    // 2. Check if circuit is open
    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      if (now - this.circuitOpenedAt < this.resetTimeoutMs) {
        return { allowed: false, reason: 'Circuit breaker is OPEN due to repeated failures' };
      }
      // Half-open attempt permitted
    }

    // 3. Check cooldown
    if (now - this.lastRequestTime < this.cooldownMs) {
      return { allowed: false, reason: 'Request throttled by cooldown rate limiter' };
    }

    return { allowed: true };
  }

  /**
   * Marks request initiation.
   */
  recordRequestStart(): void {
    this.lastRequestTime = Date.now();
    this.sessionCallCount++;
  }

  /**
   * Records a successful response, resetting consecutive failure count.
   */
  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.circuitOpenedAt = 0;
  }

  /**
   * Records a failure, tripping the circuit if threshold exceeded.
   */
  recordFailure(): void {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      this.circuitOpenedAt = Date.now();
    }
  }

  /**
   * Resets session budget for a new game session.
   */
  resetSessionBudget(): void {
    this.sessionCallCount = 0;
  }

  /**
   * Full reset for testing or debugging.
   */
  reset(): void {
    this.consecutiveFailures = 0;
    this.lastRequestTime = 0;
    this.circuitOpenedAt = 0;
    this.sessionCallCount = 0;
  }
}
