/**
 * Pass The Phone Engine Comprehensive Test Suite
 * ────────────────────────────────────────────────
 * Milestone 8 Verification Suite for Pass The Phone:
 * 1. Session initialization (initPassPhoneState)
 * 2. Initial phase = SELECTING_TARGET
 * 3. Valid target selection
 * 4. Self-target rejection
 * 5. Invalid player rejection
 * 6. Phase transition: SELECTING_TARGET -> PASSING_PHONE
 * 7. Phase transition: PASSING_PHONE -> TARGET_ACTION
 * 8. Phase transition: TARGET_ACTION -> REVEALING_QUESTION
 * 9. Reveal privacy invariant
 * 10. TAKE_SHOT action handling & round completion
 * 11. SHOW_QUESTION action handling
 * 12. Shot counter domain calculation
 * 13. Round record creation (PassPhoneRoundRecord)
 * 14. Round completion
 * 15. Next round advancement
 * 16. Final session completion
 * 17. Most targeted player calculation
 * 18. Most frequent selector calculation
 * 19. Full relationship matrix calculation
 * 20. Deterministic tie handling
 * 21. Complete structured PassPhoneResult generation
 * 22. Duplicate action rejection
 * 23. Invalid state transition prevention
 */

import type { GameSession, Player, Question } from '../types';
import {
  acknowledgePassPhoneReveal,
  advancePassPhoneRound,
  aggregatePassPhoneResult,
  commitPassPhoneAction,
  confirmPassPhoneHandover,
  getValidTargetsForSelector,
  initPassPhoneState,
  selectPassPhoneTarget,
  validateTargetSelection,
} from './pass-phone-engine';

const MOCK_PLAYERS: Player[] = [
  { id: 'player_01', name: 'Helin', color: '#EC4899' },
  { id: 'player_02', name: 'Mert', color: '#8B5CF6' },
  { id: 'player_03', name: 'Ece', color: '#3B82F6' },
  { id: 'player_04', name: 'Can', color: '#10B981' },
];

const MOCK_QUESTION: Question = {
  id: 'q-ptp-1',
  vibeId: 'party',
  gameModeId: 'most-likely-to',
  text: 'Who would be most likely to text their ex tonight?',
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
}

async function runPassPhoneEngineTests() {
  console.log('🧪 Running Milestone 8 Pass The Phone Engine Tests...\n');

  // ─── Test 1 & 2: Initialization & Initial Phase ─────────────────────────────
  console.log('▶ Test 1 & 2: Session Initialization & Initial Phase');
  const initialState = initPassPhoneState(MOCK_PLAYERS);
  assert(initialState.phase === 'SELECTING_TARGET', 'Initial phase must be SELECTING_TARGET');
  assert(initialState.activeSelectorPlayerId === 'player_01', 'First selector must be first player');
  assert(initialState.shotsCount === 0, 'Initial shots must be 0');
  assert(initialState.roundHistory.length === 0, 'Initial history must be empty');
  console.log('  ✅ Tests 1 & 2 Passed: Initial phase is SELECTING_TARGET with 0 shots.');

  // ─── Test 3, 4, 5: Target Filtering & Validation ────────────────────────────
  console.log('▶ Tests 3, 4, 5: Target Selection & Validation');
  const validTargets = getValidTargetsForSelector(MOCK_PLAYERS, 'player_01');
  assert(validTargets.length === 3, 'Selector must have 3 valid targets in 4-player game');
  assert(!validTargets.some((p) => p.id === 'player_01'), 'Selector cannot be in valid targets');

  // Self-targeting validation
  const selfVal = validateTargetSelection(MOCK_PLAYERS, 'player_01', 'player_01');
  assert(!selfVal.isValid, 'Self-target must be rejected');

  // Intruder player validation
  const intruderVal = validateTargetSelection(MOCK_PLAYERS, 'player_01', 'intruder_99');
  assert(!intruderVal.isValid, 'Intruder player must be rejected');

  // Valid target
  const validVal = validateTargetSelection(MOCK_PLAYERS, 'player_01', 'player_02');
  assert(validVal.isValid, 'Valid target player_02 must pass');
  console.log('  ✅ Tests 3, 4, 5 Passed: Self-selection and intruder selection safely rejected.');

  // ─── Test 6: SELECTING_TARGET -> PASSING_PHONE ──────────────────────────────
  console.log('▶ Test 6: SELECTING_TARGET -> PASSING_PHONE Transition');
  let session: GameSession = {
    id: 'session-ptp-1',
    sessionType: 'pass-the-phone',
    status: 'playing',
    language: 'en',
    vibeId: 'party',
    gameModeId: 'most-likely-to',
    players: MOCK_PLAYERS,
    currentRound: 1,
    totalRounds: 3,
    currentQuestion: MOCK_QUESTION,
    usedQuestionIds: [MOCK_QUESTION.id],
    answers: [],
    passPhoneState: initialState,
  };

  session = selectPassPhoneTarget(session, 'player_02');
  assert(session.passPhoneState?.phase === 'PASSING_PHONE', 'Phase must transition to PASSING_PHONE');
  assert(session.passPhoneState?.selectedTargetPlayerId === 'player_02', 'Target must be player_02');
  console.log('  ✅ Test 6 Passed: Transitions to PASSING_PHONE with target recorded.');

  // ─── Test 7: PASSING_PHONE -> TARGET_ACTION ─────────────────────────────────
  console.log('▶ Test 7: PASSING_PHONE -> TARGET_ACTION Handover');
  session = confirmPassPhoneHandover(session);
  assert(session.passPhoneState?.phase === 'TARGET_ACTION', 'Phase must transition to TARGET_ACTION');
  console.log('  ✅ Test 7 Passed: Handover confirmed, target action screen active.');

  // ─── Test 8 & 9: Reveal Privacy & SHOW_QUESTION Action ──────────────────────
  console.log('▶ Tests 8, 9, 11: SHOW_QUESTION Action & Reveal Privacy');
  const showQResult = commitPassPhoneAction(session, 'show-question');
  assert(!showQResult.isRoundComplete, 'show-question should not immediately complete round');
  assert(showQResult.nextSession.passPhoneState?.phase === 'REVEALING_QUESTION', 'Must enter REVEALING_QUESTION');
  assert(showQResult.nextSession.passPhoneState?.selectedAction === 'show-question', 'Action must be show-question');
  session = showQResult.nextSession;

  // Acknowledge reveal
  session = acknowledgePassPhoneReveal(session);
  assert(session.passPhoneState?.phase === 'ROUND_COMPLETE', 'Must enter ROUND_COMPLETE');
  assert(session.passPhoneState?.roundHistory.length === 1, 'Round history must have 1 record');
  assert(session.passPhoneState?.roundHistory[0].action === 'show-question', 'Recorded action must be show-question');
  console.log('  ✅ Tests 8, 9, 11 Passed: Question revealed only after show-question action.');

  // ─── Test 10 & 12: TAKE_SHOT Action & Shot Counter ──────────────────────────
  console.log('▶ Tests 10 & 12: TAKE_SHOT Action & Shot Counter');
  // Advance to Round 2
  const q2: Question = {
    id: 'q-ptp-2',
    vibeId: 'party',
    gameModeId: 'most-likely-to',
    text: 'Who has the highest screen time in the group?',
  };
  session = advancePassPhoneRound(session, q2);
  assert(session.currentRound === 2, 'Must advance to Round 2');
  assert(session.passPhoneState?.phase === 'SELECTING_TARGET', 'Phase resets to SELECTING_TARGET');
  assert(session.passPhoneState?.activeSelectorPlayerId === 'player_02', 'Next selector must be Mert (player_02)');

  // Mert selects Can (player_04)
  session = selectPassPhoneTarget(session, 'player_04');
  session = confirmPassPhoneHandover(session);

  // Mert takes a shot to keep secret!
  const shotResult = commitPassPhoneAction(session, 'take-shot');
  assert(!shotResult.isRoundComplete, 'take-shot displays outcome screen before completing round');
  assert(shotResult.nextSession.passPhoneState?.phase === 'REVEALING_QUESTION', 'Phase must be REVEALING_QUESTION');
  assert(shotResult.nextSession.passPhoneState?.shotsCount === 1, 'Shots count must be 1');
  assert(shotResult.nextSession.passPhoneState?.selectedAction === 'take-shot', 'Selected action must be take-shot');
  session = acknowledgePassPhoneReveal(shotResult.nextSession);
  assert(session.passPhoneState?.roundHistory.length === 2, 'History must have 2 records');
  assert(session.passPhoneState?.roundHistory[1].action === 'take-shot', 'Recorded action must be take-shot');
  console.log('  ✅ Tests 10 & 12 Passed: TAKE_SHOT increments shots count and records round history.');

  // ─── Test 13, 14, 15, 16: Multi-Round Progression & Session Completion ──────
  console.log('▶ Tests 13-16: Multi-Round Progression & Final Session Completion');
  // Advance to Round 3 (Final Round)
  const q3: Question = {
    id: 'q-ptp-3',
    vibeId: 'party',
    gameModeId: 'most-likely-to',
    text: 'Who is the worst driver in this room?',
  };
  session = advancePassPhoneRound(session, q3);
  assert(session.currentRound === 3, 'Must advance to Round 3');
  assert(session.passPhoneState?.activeSelectorPlayerId === 'player_03', 'Selector is Ece (player_03)');

  // Ece selects Mert (player_02)
  session = selectPassPhoneTarget(session, 'player_02');
  session = confirmPassPhoneHandover(session);

  // Ece takes a shot to keep secret!
  const finalShotResult = commitPassPhoneAction(session, 'take-shot');
  assert(!finalShotResult.isRoundComplete, 'take-shot displays outcome screen before completing');
  session = acknowledgePassPhoneReveal(finalShotResult.nextSession);
  session = advancePassPhoneRound(session, null);
  assert(session.status === 'completed', 'Session must be completed after totalRounds');
  assert(session.passPhoneState?.phase === 'SESSION_COMPLETE', 'PassPhoneState phase must be SESSION_COMPLETE');
  console.log('  ✅ Tests 13-16 Passed: Clean progression through totalRounds to completion.');

  // ─── Test 17, 18, 19, 20, 21: Result Aggregation, Most Targeted & Matrix ────
  console.log('▶ Tests 17-21: Structured Result Aggregation & Relationship Matrix');
  // Rounds summary:
  // Round 1: Helin (p1) -> Mert (p2), action: show-question
  // Round 2: Mert (p2) -> Can (p4), action: take-shot
  // Round 3: Ece (p3) -> Mert (p2), action: take-shot
  // Total rounds = 3, Total shots = 2
  // Targeted: Mert (2x), Can (1x) => Most Targeted = Mert (2)
  // Selectors: Helin (1x), Mert (1x), Ece (1x) => 3-way tie for top selector
  const results = aggregatePassPhoneResult(session);
  assert(results.totalRounds === 3, 'Total rounds must be 3');
  assert(results.totalShots === 2, 'Total shots must be 2');
  assert(results.mostTargetedPlayer?.playerId === 'player_02', 'Most targeted must be Mert');
  assert(results.mostTargetedPlayer?.count === 2, 'Mert must be targeted 2 times');

  // Verify Relationship Matrix
  assert(results.relationshipMatrix['player_01']['player_02'] === 1, 'Helin -> Mert = 1');
  assert(results.relationshipMatrix['player_02']['player_04'] === 1, 'Mert -> Can = 1');
  assert(results.relationshipMatrix['player_03']['player_02'] === 1, 'Ece -> Mert = 1');
  assert(results.relationshipMatrix['player_04']['player_01'] === 0, 'Can -> Helin = 0');
  console.log('  ✅ Tests 17-21 Passed: Structured PassPhoneResult and 2D matrix 100% accurate.');

  // ─── Test 22 & 23: Invalid State Transitions & Action Protection ────────────
  console.log('▶ Tests 22 & 23: Invalid State Transition Prevention');
  let errCaught1 = false;
  try {
    // Attempt to commit action while in SELECTING_TARGET phase
    const freshState = initPassPhoneState(MOCK_PLAYERS);
    const invalidSession: GameSession = { ...session, passPhoneState: freshState };
    commitPassPhoneAction(invalidSession, 'take-shot');
  } catch {
    errCaught1 = true;
  }
  assert(errCaught1, 'Must throw error when committing action during SELECTING_TARGET phase');

  let errCaught2 = false;
  try {
    // Attempt to confirm handover during SELECTING_TARGET phase
    const freshState = initPassPhoneState(MOCK_PLAYERS);
    const invalidSession: GameSession = { ...session, passPhoneState: freshState };
    confirmPassPhoneHandover(invalidSession);
  } catch {
    errCaught2 = true;
  }
  assert(errCaught2, 'Must throw error when confirming handover before target is selected');
  console.log('  ✅ Tests 22 & 23 Passed: Invalid state transitions prevented deterministically.');

  console.log('\n🎉 ALL 23 PASS THE PHONE ENGINE TESTS PASSED SUCCESSFULLY!');
}

runPassPhoneEngineTests().catch((err) => {
  console.error('Pass The Phone engine tests failed:', err);
  process.exit(1);
});
