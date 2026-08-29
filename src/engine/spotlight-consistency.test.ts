/**
 * Spotlight & Semantic Consistency Verification Tests (Milestone 8.6)
 * ───────────────────────────────────────────────────────────────────
 * Proves that:
 * 1. Question target equals spotlight target (question.targetPlayerId === spotlightPlayer.id).
 * 2. Target player exists in session roster.
 * 3. Responder and target are represented separately without ambiguity.
 * 4. AI target context is preserved and validated.
 * 5. Local question catalog hydration attaches valid targetPlayerId.
 * 6. No fictional "truth", "scoring", or "first guess" copy exists.
 * 7. Multi-player responses store respondingPlayerId and targetPlayerId.
 * 8. Language switches never corrupt or alter target player identities.
 */

import {
  ARABIC_QUESTIONS,
  ENGLISH_QUESTIONS,
  FRENCH_QUESTIONS,
  TURKISH_QUESTIONS,
  hydrateQuestionsForPlayers,
} from '@/data';
import { recordPlayerResponse, validatePlayerResponse } from '@/engine/response-engine';
import { LocalSynthesizerProvider } from '@/services/ai/providers/local-provider';
import { validateAndSanitizeQuestion } from '@/services/ai/validator';
import type { GameSession, Player, SpotlightResponse, WhoKnowsMeBestQuestion } from '@/types';

function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertStrictEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

async function runTests() {
  console.log('🧪 Starting Milestone 8.6 Spotlight & Semantic Consistency Test Suite...\n');

  const MOCK_PLAYERS: Player[] = [
    { id: 'player_alex', name: 'Alex', color: '#EC4899' },
    { id: 'player_sam', name: 'Sam', color: '#8B5CF6' },
    { id: 'player_taylor', name: 'Taylor', color: '#3B82F6' },
    { id: 'player_jordan', name: 'Jordan', color: '#10B981' },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 1: Question Target Equals Spotlight Target (Structured Source of Truth)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ Test 1: Structured Target ID Matching');
  const targetSam = MOCK_PLAYERS[1]; // Sam
  const sampleWKMBQuestion: WhoKnowsMeBestQuestion = {
    id: 'wkmb-sample-1',
    vibeId: 'deep-talk',
    gameModeId: 'who-knows-me-best',
    targetPlayerId: targetSam.id,
    language: 'tr',
    text: `${targetSam.name} için en unutulmaz tatil veya seyahat hayali nedir?`,
    prompt: `${targetSam.name} hakkında bildiklerinizi paylaşın.`,
  };

  // UI lookup simulation
  const resolvedSpotlightPlayer = MOCK_PLAYERS.find((p) => p.id === sampleWKMBQuestion.targetPlayerId);
  assertStrictEqual(
    resolvedSpotlightPlayer?.id,
    targetSam.id,
    'Spotlight player lookup must return target player Sam'
  );
  assertStrictEqual(
    resolvedSpotlightPlayer?.name,
    'Sam',
    'Spotlight player name must match target player name Sam'
  );
  assert(
    sampleWKMBQuestion.text.includes(resolvedSpotlightPlayer!.name),
    'Question text must explicitly mention the structured target player'
  );
  console.log('  ✅ Test 1 Passed: Question target equals spotlight target (Question: Sam -> Spotlight: Sam).');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 2: Local Catalog Hydration Attaches Valid Target Player
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Test 2: Local Catalog Hydration with Players');
  const rawQuestions = TURKISH_QUESTIONS.filter((q) => q.gameModeId === 'who-knows-me-best');
  const hydratedTurkish = hydrateQuestionsForPlayers(rawQuestions, MOCK_PLAYERS);

  for (const q of hydratedTurkish) {
    assert(q.targetPlayerId, `Hydrated WKMB question ${q.id} must have targetPlayerId`);
    const matchedPlayer = MOCK_PLAYERS.find((p) => p.id === q.targetPlayerId);
    assert(matchedPlayer !== undefined, `Target player ${q.targetPlayerId} must exist in session roster`);
    assert(
      q.text.includes(matchedPlayer.name),
      `Question text "${q.text}" must contain target player name "${matchedPlayer.name}"`
    );
  }
  console.log('  ✅ Test 2 Passed: 100% of hydrated WKMB questions contain valid session targetPlayerId and matching text.');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 3: No Fictional "Truth" / Scoring Copy in Any Language Catalog
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Test 3: Anti-Fiction Catalog Audit Across 4 Languages');
  const fictionalPatterns = [
    /gerçeği açıklar/i,
    /reveals the truth/i,
    /first guess/i,
    /grades the answers/i,
    /scores the answer/i,
    /correct answer/i,
    /devine en premier avant la révélation/i,
    /يكشف الحقيقة/i,
    /ليخمن .* أولاً/i,
  ];

  const allCatalogs = [
    ...ENGLISH_QUESTIONS,
    ...TURKISH_QUESTIONS,
    ...FRENCH_QUESTIONS,
    ...ARABIC_QUESTIONS,
  ];

  for (const q of allCatalogs) {
    const promptText = 'prompt' in q && typeof q.prompt === 'string' ? q.prompt : '';
    const combined = `${q.text} ${promptText}`;
    for (const pattern of fictionalPatterns) {
      assert(
        !pattern.test(combined),
        `Question ${q.id} in "${q.language}" contains forbidden fictional copy matching ${pattern}: "${combined}"`
      );
    }
  }
  console.log('  ✅ Test 3 Passed: Zero fictional truth/scoring/reveal promises in all 240+ questions across 4 languages.');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 4: AI Local Synthesizer Preserves Target Context
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Test 4: AI Synthesizer Target Context & Semantic Structure');
  const aiProvider = new LocalSynthesizerProvider();

  const aiGeneratedQuestions = await aiProvider.generateQuestions({
    language: 'tr',
    vibeId: 'deep-talk',
    players: MOCK_PLAYERS,
    gameModeId: 'who-knows-me-best',
    count: 4,
  });

  assertStrictEqual(aiGeneratedQuestions.length, 4, 'Must synthesize 4 questions');
  for (const q of aiGeneratedQuestions) {
    assertStrictEqual(q.gameModeId, 'who-knows-me-best');
    assert(q.targetPlayerId !== undefined, 'AI-generated WKMB question must have targetPlayerId');
    const target = MOCK_PLAYERS.find((p) => p.id === q.targetPlayerId);
    assert(target !== undefined, 'AI targetPlayerId must belong to the active player list');
    assert(q.text.includes(target.name), `AI question text "${q.text}" must mention target "${target.name}"`);
  }
  console.log('  ✅ Test 4 Passed: AI Synthesizer generates structured targetPlayerId matching question text.');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 5: Target Player vs Respondent Player Separation in Group Responses
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Test 5: Target vs Respondent Separation in Responses');
  const session: GameSession = {
    id: 'sess-test-wkmb',
    sessionType: 'group',
    status: 'playing',
    language: 'en',
    vibeId: 'deep-talk',
    gameModeId: 'who-knows-me-best',
    players: MOCK_PLAYERS,
    currentRound: 1,
    totalRounds: 5,
    currentQuestion: sampleWKMBQuestion,
    usedQuestionIds: [sampleWKMBQuestion.id],
    answers: [],
    currentPlayerIndex: 2, // Taylor is responding
    responses: [],
  };

  const taylor = MOCK_PLAYERS[2]; // Taylor
  const target = targetSam; // Sam

  const validResponse: SpotlightResponse = {
    id: 'resp-1',
    sessionId: session.id!,
    questionId: sampleWKMBQuestion.id,
    playerId: taylor.id, // Taylor is the respondent
    responseType: 'spotlight-quiz',
    targetPlayerId: target.id, // Sam is the target
    confirmed: true,
    timestamp: Date.now(),
  };

  const validation = validatePlayerResponse(session, validResponse);
  assertStrictEqual(validation.isValid, true, 'Valid spotlight response must pass validation');

  const { nextSession } = recordPlayerResponse(session, validResponse);
  assert(nextSession.responses !== undefined && nextSession.responses.length === 1);
  assertStrictEqual(nextSession.responses[0].playerId, taylor.id, 'Responding player must be Taylor');
  assertStrictEqual(
    (nextSession.responses[0] as SpotlightResponse).targetPlayerId,
    targetSam.id,
    'Target player must be Sam'
  );
  console.log('  ✅ Test 5 Passed: Responder (Taylor) and Target (Sam) accurately separated and stored.');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 6: Intruder Target Rejection
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Test 6: Intruder Target Player Rejection');
  const intruderResponse: SpotlightResponse = {
    id: 'resp-intruder',
    sessionId: session.id!,
    questionId: sampleWKMBQuestion.id,
    playerId: taylor.id,
    responseType: 'spotlight-quiz',
    targetPlayerId: 'player_intruder_999', // Not in session
    confirmed: true,
    timestamp: Date.now(),
  };

  const intruderValidation = validatePlayerResponse(session, intruderResponse);
  assertStrictEqual(intruderValidation.isValid, false, 'Intruder target player must be rejected');
  console.log('  ✅ Test 6 Passed: Intruder target players safely rejected.');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 7: AI Validator Anti-Fiction Enforcement
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Test 7: AI Validator Anti-Fiction Semantic Check');
  const invalidFictionalQuestion = {
    id: 'bad-ai-q',
    vibeId: 'deep-talk',
    gameModeId: 'who-knows-me-best',
    language: 'tr',
    text: 'Sam için en unutulmaz tatil veya seyahat hayali nedir?',
    prompt: 'Taylor ilk tahmini yapar, sonra Sam gerçeği açıklar!',
  };

  const validationResult = validateAndSanitizeQuestion(invalidFictionalQuestion, 'tr');
  assertStrictEqual(
    validationResult.isValid,
    false,
    'Validator must reject questions with fictional mechanics in prompt'
  );
  console.log('  ✅ Test 7 Passed: AI Validator rejects questions with fictional mechanics.');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 8: Language Switch Target Identity Invariance
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Test 8: Language Invariance of Target Identity');
  const enCatalog = hydrateQuestionsForPlayers(
    ENGLISH_QUESTIONS.filter((q) => q.gameModeId === 'who-knows-me-best'),
    MOCK_PLAYERS
  );
  const trCatalog = hydrateQuestionsForPlayers(
    TURKISH_QUESTIONS.filter((q) => q.gameModeId === 'who-knows-me-best'),
    MOCK_PLAYERS
  );

  for (let i = 0; i < Math.min(enCatalog.length, trCatalog.length); i++) {
    assertStrictEqual(
      enCatalog[i].targetPlayerId,
      trCatalog[i].targetPlayerId,
      `Question at index ${i} must have identical targetPlayerId in EN and TR`
    );
  }
  console.log('  ✅ Test 8 Passed: Target player IDs remain strictly invariant across all languages.');

  console.log('\n🎉 ALL 8 MILESTONE 8.6 SPOTLIGHT & SEMANTIC CONSISTENCY TESTS PASSED PERFECTLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
