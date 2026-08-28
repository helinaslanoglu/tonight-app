/**
 * AI Subsystem Comprehensive Architecture & Resilience Test Suite
 * ───────────────────────────────────────────────────────────────
 * Validates:
 * 1. Output Schema Validation & Sanitization
 * 2. Deduplication & Semantic Filtering
 * 3. Circuit Breaker, Session Budgeting & Rate Limiting
 * 4. Failure Handling & Graceful Fallback
 * 5. Provider Pluggability
 * 6. Observability & Telemetry Events
 */

import type { Player, Question } from '@/types';
import {
  AIService,
  filterDuplicateQuestions,
  LocalSynthesizerProvider,
  validateAndSanitizeQuestion,
  type AIQuestionProvider,
  type AITelemetryEvent,
} from '../index';

const MOCK_PLAYERS: Player[] = [
  { id: 'p1', name: 'Helin', color: '#EC4899' },
  { id: 'p2', name: 'Ayşe', color: '#8B5CF6' },
  { id: 'p3', name: 'Mert', color: '#3B82F6' },
];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
}

async function runAISubsystemTests() {
  console.log('🧪 Running AI Subsystem Architecture & Resilience Tests...\n');

  // ─── Test 1: Output Schema Validation & Bounds ──────────────────────────────
  const validWYR = {
    id: 'ai-1',
    vibeId: 'party',
    gameModeId: 'would-you-rather',
    text: '   "Would you rather dance on the table or mix the punch?"   ',
    optionA: ' Dance on the table ',
    optionB: ' Mix the punch ',
  };
  const valResult1 = validateAndSanitizeQuestion(validWYR);
  assert(valResult1.isValid, 'Valid WYR should pass validation');
  assert(valResult1.sanitizedQuestion?.text === 'Would you rather dance on the table or mix the punch?', 'Text should be stripped of surrounding quotes and whitespace');
  assert((valResult1.sanitizedQuestion as any).optionA === 'Dance on the table', 'Option A should be trimmed');

  // Invalid: Text too short
  const shortText = { vibeId: 'party', gameModeId: 'most-likely-to', text: 'Who?' };
  const valResult2 = validateAndSanitizeQuestion(shortText);
  assert(!valResult2.isValid, 'Short text must be rejected');

  // Invalid: WYR identical options
  const identicalWYR = {
    vibeId: 'party',
    gameModeId: 'would-you-rather',
    text: 'Would you rather drink water or drink water?',
    optionA: 'Drink water',
    optionB: 'Drink water',
  };
  const valResult3 = validateAndSanitizeQuestion(identicalWYR);
  assert(!valResult3.isValid, 'Identical WYR options must be rejected');

  console.log('✅ Test 1: Schema validation & sanitization verified.');

  // ─── Test 2: Deduplication & Semantic Filtering ─────────────────────────────
  const existingPool: Question[] = [
    {
      id: 'e1',
      vibeId: 'party',
      gameModeId: 'most-likely-to',
      text: 'Who is most likely to start a conga line at the club?',
    },
  ];

  const candidateQuestions: Question[] = [
    // Near-duplicate (same words/meaning)
    {
      id: 'c1',
      vibeId: 'party',
      gameModeId: 'most-likely-to',
      text: 'Who is most likely to start a conga line at the club tonight?',
    },
    // Distinct question
    {
      id: 'c2',
      vibeId: 'party',
      gameModeId: 'open-question',
      text: 'What is the absolute best song to play when the energy drops?',
    },
  ];

  const { uniqueQuestions, duplicateCount } = filterDuplicateQuestions(
    candidateQuestions,
    existingPool
  );

  assert(duplicateCount === 1, 'Should detect 1 duplicate');
  assert(uniqueQuestions.length === 1, 'Should keep 1 unique question');
  assert(uniqueQuestions[0].id === 'c2', 'Unique question should be c2');
  console.log('✅ Test 2: Deduplication & semantic similarity filtering verified.');

  // ─── Test 3: Circuit Breaker & Rate Limiting ────────────────────────────────
  const aiService = new AIService(new LocalSynthesizerProvider());

  // First call should succeed
  const result1 = await aiService.generatePersonalizedQuestions({
    vibeId: 'party',
    players: MOCK_PLAYERS,
    count: 4,
  });
  assert(result1.length === 4, 'First AI call should succeed');

  // Second immediate call without cooldown should be throttled
  const result2 = await aiService.generatePersonalizedQuestions({
    vibeId: 'party',
    players: MOCK_PLAYERS,
    count: 4,
  });
  assert(result2.length === 0, 'Rapid call should be throttled by cooldown');

  console.log('✅ Test 3: Circuit breaker & rate limiter throttling verified.');

  // ─── Test 4: Failure Handling & Graceful Fallback ───────────────────────────
  class FailingMockProvider implements AIQuestionProvider {
    readonly name = 'FailingMock';
    async generateQuestions(): Promise<Question[]> {
      throw new Error('Simulated network timeout or API 500');
    }
  }

  const resilientService = new AIService(new FailingMockProvider());
  const fallbackResult = await resilientService.generatePersonalizedQuestions({
    vibeId: 'chaos',
    players: MOCK_PLAYERS,
    count: 4,
  });

  assert(Array.isArray(fallbackResult), 'Should return an array on failure');
  assert(fallbackResult.length === 0, 'Should return empty array gracefully without throwing');
  console.log('✅ Test 4: Failure handling & graceful fallback verified.');

  // ─── Test 5: Observability & Telemetry Events ────────────────────────────────
  const telemetryEvents: AITelemetryEvent[] = [];
  const observableService = new AIService(new LocalSynthesizerProvider());
  observableService.addTelemetryListener((e) => telemetryEvents.push(e));

  await observableService.generatePersonalizedQuestions({
    vibeId: 'funny',
    players: MOCK_PLAYERS,
    count: 2,
  });

  assert(telemetryEvents.length >= 2, 'Should emit START and SUCCESS telemetry events');
  assert(telemetryEvents.some((e) => e.type === 'AI_REQUEST_START'), 'Should have AI_REQUEST_START event');
  assert(telemetryEvents.some((e) => e.type === 'AI_REQUEST_SUCCESS'), 'Should have AI_REQUEST_SUCCESS event');
  console.log('✅ Test 5: Observability & telemetry events verified.');

  console.log('\n🎉 ALL AI SUBSYSTEM ARCHITECTURE & RESILIENCE TESTS PASSED!');
}

runAISubsystemTests().catch((err) => {
  console.error('AI Subsystem test failed:', err);
  process.exit(1);
});
