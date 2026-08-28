/**
 * Game Engine Domain Logic Automated Test Suite
 * Validates question selection, round progression, replay, and validation edge cases.
 */

import { QUESTIONS } from '../data/questions';
import {
  advanceSessionRound,
  DEFAULT_TOTAL_ROUNDS,
  replaySession,
  selectNextQuestion,
  startNewSession,
  validateAnswerForQuestion,
} from './game-engine';
import type { Player, Question, VibeId } from '../types';

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

console.log('🧪 Running Game Engine Domain Test Suite...\n');

// ─── Test 1: Question Pool Availability ──────────────────────────────────────
assert(QUESTIONS.length >= 30, 'Question pool should have at least 30 questions');
console.log(`✅ Test 1: Question pool loaded (${QUESTIONS.length} questions total).`);

// ─── Test 2: Random Question Selection by Vibe ──────────────────────────────
const vibes: VibeId[] = ['party', 'funny', 'date', 'deep-talk', 'chaos', 'chill'];
for (const vibe of vibes) {
  const q = selectNextQuestion(QUESTIONS, [], vibe);
  assert(q !== null, `Question selection for vibe ${vibe} returned null`);
  assert(q?.vibeId === vibe, `Question vibe ${q?.vibeId} does not match requested ${vibe}`);
}
console.log('✅ Test 2: Vibe question selection verified across all 6 vibes.');

// ─── Test 3: Duplicate Prevention During Session ────────────────────────────
const usedIds: string[] = [];
for (let i = 0; i < 5; i++) {
  const nextQ = selectNextQuestion(QUESTIONS, usedIds, 'party');
  assert(nextQ !== null, `Question ${i + 1} returned null`);
  assert(!usedIds.includes(nextQ!.id), `Duplicate question selected: ${nextQ!.id}`);
  usedIds.push(nextQ!.id);
}
assert(usedIds.length === 5, 'Should have picked 5 unique question IDs');
console.log('✅ Test 3: Duplicate prevention verified across 5 consecutive rounds.');

// ─── Test 4: Pool Exhaustion Graceful Fallback ───────────────────────────────
const smallPool: Question[] = [
  { id: 'q1', text: 'Text 1', vibeId: 'party', gameModeId: 'open-question' },
];
const q1 = selectNextQuestion(smallPool, [], 'party');
assert(q1?.id === 'q1', 'First pick should be q1');
const qFallback = selectNextQuestion(smallPool, ['q1'], 'party');
assert(qFallback !== null, 'Exhausted pool should gracefully return fallback question');
console.log('✅ Test 4: Pool exhaustion graceful fallback verified.');

// ─── Test 5: Session Creation ───────────────────────────────────────────────
const session = startNewSession({
  vibeId: 'party',
  players: MOCK_PLAYERS,
  totalRounds: DEFAULT_TOTAL_ROUNDS,
  questionPool: QUESTIONS,
});

assert(session.status === 'playing', 'New session should be playing');
assert(session.currentRound === 1, 'New session should start at round 1');
assert(session.totalRounds === 10, 'Total rounds should default to 10');
assert(session.players.length === 3, 'Players count should match');
assert(session.currentQuestion !== null, 'Initial question should be populated');
assert(session.usedQuestionIds.length === 1, 'usedQuestionIds should contain 1 question');
console.log('✅ Test 5: Session creation verified.');

// ─── Test 6: Round Progression Loop ─────────────────────────────────────────
let currentSession = session;
for (let round = 1; round < DEFAULT_TOTAL_ROUNDS; round++) {
  currentSession = advanceSessionRound(
    currentSession,
    {
      round: currentSession.currentRound,
      questionId: currentSession.currentQuestion!.id,
      gameModeId: currentSession.currentQuestion!.gameModeId,
      timestamp: Date.now(),
    },
    QUESTIONS
  );

  assert(currentSession.currentRound === round + 1, `Round should be ${round + 1}`);
  assert(currentSession.status === 'playing', 'Session should still be playing');
}
assert(currentSession.currentRound === 10, 'Should reach round 10');
console.log('✅ Test 6: Round progression from round 1 to 10 verified.');

// ─── Test 7: Session Completion ─────────────────────────────────────────────
const completedSession = advanceSessionRound(
  currentSession,
  {
    round: 10,
    questionId: currentSession.currentQuestion!.id,
    gameModeId: currentSession.currentQuestion!.gameModeId,
    timestamp: Date.now(),
  },
  QUESTIONS
);
assert(completedSession.status === 'completed', 'Session should be completed after final round');
assert(completedSession.answers.length === 10, 'All 10 answers should be recorded');
console.log('✅ Test 7: Session completion after final round verified.');

// ─── Test 8: Replay Session ─────────────────────────────────────────────────
const replayedSession = replaySession(completedSession, QUESTIONS);
assert(replayedSession.status === 'playing', 'Replayed session should be playing');
assert(replayedSession.currentRound === 1, 'Replayed session should reset to round 1');
assert(replayedSession.vibeId === 'party', 'Replayed session should preserve vibe');
assert(replayedSession.players.length === 3, 'Replayed session should preserve players');
assert(replayedSession.id !== completedSession.id, 'Replayed session should have a new ID');
assert(replayedSession.usedQuestionIds.length === 1, 'Replayed session should reset usedQuestionIds');
console.log('✅ Test 8: Replay session verified (preserves vibe & players, resets rounds & IDs).');

// ─── Test 9: Answer Validation ──────────────────────────────────────────────
const wyrQ: Question = {
  id: 'wyr-1',
  vibeId: 'party',
  gameModeId: 'would-you-rather',
  text: 'Test WYR',
  optionA: 'Opt A',
  optionB: 'Opt B',
};
const mltQ: Question = {
  id: 'mlt-1',
  vibeId: 'party',
  gameModeId: 'most-likely-to',
  text: 'Test MLT',
};
const openQ: Question = {
  id: 'open-1',
  vibeId: 'party',
  gameModeId: 'open-question',
  text: 'Test Open',
};

assert(!validateAnswerForQuestion(wyrQ, {}), 'WYR should be invalid without option');
assert(validateAnswerForQuestion(wyrQ, { selectedOption: 'A' }), 'WYR should be valid with Option A');
assert(validateAnswerForQuestion(wyrQ, { selectedOption: 'B' }), 'WYR should be valid with Option B');

assert(!validateAnswerForQuestion(mltQ, {}), 'MLT should be invalid without selected player');
assert(validateAnswerForQuestion(mltQ, { selectedPlayerId: 'p1' }), 'MLT should be valid with player');

assert(validateAnswerForQuestion(openQ, {}), 'Open Question is always valid');
console.log('✅ Test 9: Interaction validation rules verified across all 3 game modes.');

// ─── Test 10: Invalid State Guards ──────────────────────────────────────────
let threwInvalidPlayer = false;
try {
  startNewSession({
    vibeId: 'party',
    players: [{ id: 'p1', name: 'Helin' }], // only 1 player
    totalRounds: 10,
    questionPool: QUESTIONS,
  });
} catch {
  threwInvalidPlayer = true;
}
assert(threwInvalidPlayer, 'startNewSession should throw if less than 2 players');
console.log('✅ Test 10: Guard against insufficient players verified.');

console.log('\n🎉 ALL 10 DOMAIN ENGINE TESTS PASSED SUCCESSFULLY!');
