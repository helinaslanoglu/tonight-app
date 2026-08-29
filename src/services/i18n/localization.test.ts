/**
 * Multi-Language Content Architecture & i18n Test Suite (Milestone 8.5)
 * ───────────────────────────────────────────────────────────────────
 * Validates:
 * 1. Pure translation engine t() with interpolation & fallback.
 * 2. Direction helpers (RTL vs LTR).
 * 3. Localized Question Catalogs integrity & stable canonical identities.
 * 4. ContentProvider language filtering.
 * 5. AI Local Synthesizer multi-language generation & player name preservation.
 * 6. AI Output Validator language script enforcement.
 * 7. Cross-session deduplication across language switches.
 */

import { defaultContentProvider, getQuestionsByLanguage, QUESTIONS_BY_LANGUAGE } from '@/data';
import { getTextDirection, isRTL, LANGUAGES, t } from '@/services/i18n';
import { AIService } from '@/services/ai/ai-service';
import { LocalSynthesizerProvider } from '@/services/ai/providers/local-provider';
import { validateLanguageScript } from '@/services/ai/validator';
import { useGameStore } from '@/store/game-store';
import type { LanguageId, Player } from '@/types';
import { getQuestionIdentity } from '@/utils';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[AssertionFailed] ${message}`);
  }
}

async function runTestSuite() {
  console.log('--- Starting Milestone 8.5 Multi-Language Test Suite ---');
  let passedCount = 0;

  // ─── 1. Supported Languages Metadata ───────────────────────────────────────
  assert(LANGUAGES.length === 4, 'Must support exactly 4 initial languages (en, tr, fr, ar)');
  assert(LANGUAGES.some((l) => l.id === 'en' && l.direction === 'ltr'), 'en must be LTR');
  assert(LANGUAGES.some((l) => l.id === 'tr' && l.direction === 'ltr'), 'tr must be LTR');
  assert(LANGUAGES.some((l) => l.id === 'fr' && l.direction === 'ltr'), 'fr must be LTR');
  assert(LANGUAGES.some((l) => l.id === 'ar' && l.direction === 'rtl'), 'ar must be RTL');
  console.log('✓ 1. Language metadata and directions verified');
  passedCount++;

  // ─── 2. Direction Helpers ──────────────────────────────────────────────────
  assert(isRTL('ar') === true, 'isRTL("ar") must be true');
  assert(isRTL('en') === false, 'isRTL("en") must be false');
  assert(isRTL('tr') === false, 'isRTL("tr") must be false');
  assert(isRTL('fr') === false, 'isRTL("fr") must be false');
  assert(getTextDirection('ar') === 'rtl', 'getTextDirection("ar") must be "rtl"');
  assert(getTextDirection('en') === 'ltr', 'getTextDirection("en") must be "ltr"');
  console.log('✓ 2. Direction helpers (isRTL & getTextDirection) verified');
  passedCount++;

  // ─── 3. Pure Translation Engine t() ────────────────────────────────────────
  assert(t('common.playAgain', 'en') === 'PLAY AGAIN', 'en translation for common.playAgain');
  assert(t('common.playAgain', 'tr') === 'TEKRAR OYNA', 'tr translation for common.playAgain');
  assert(t('common.playAgain', 'fr') === 'REJOUER', 'fr translation for common.playAgain');
  assert(t('common.playAgain', 'ar') === 'العب مجدداً', 'ar translation for common.playAgain');
  console.log('✓ 3. Pure translation engine t() verified for all 4 languages');
  passedCount++;

  // ─── 4. Translation Interpolation ──────────────────────────────────────────
  const interpolatedEn = t('group.turnBanner', 'en', { name: 'ALEX' });
  assert(interpolatedEn === "ALEX'S TURN", `Expected "ALEX'S TURN", got "${interpolatedEn}"`);

  const interpolatedTr = t('group.turnBanner', 'tr', { name: 'MERT' });
  assert(interpolatedTr === 'MERT SIRASI', `Expected "MERT SIRASI", got "${interpolatedTr}"`);

  const interpolatedFr = t('group.turnBanner', 'fr', { name: 'CHLOE' });
  assert(interpolatedFr === 'AU TOUR DE CHLOE', `Expected "AU TOUR DE CHLOE", got "${interpolatedFr}"`);

  const interpolatedAr = t('group.turnBanner', 'ar', { name: 'سامي' });
  assert(interpolatedAr === 'دور سامي', `Expected "دور سامي", got "${interpolatedAr}"`);
  console.log('✓ 4. String parameter interpolation verified in all 4 languages');
  passedCount++;

  // ─── 5. Fallback Mechanism ─────────────────────────────────────────────────
  // Missing key or unsupported language should fallback deterministically to English
  const fallbackResult = t('common.exitConfirm', 'invalid-lang' as unknown as LanguageId);
  assert(fallbackResult === 'Exit', 'Must fallback to English when language is unsupported');
  console.log('✓ 5. Deterministic English fallback verified');
  passedCount++;

  // ─── 6. Localized Question Catalog Integrity ──────────────────────────────
  const enQuestions = getQuestionsByLanguage('en');
  const trQuestions = getQuestionsByLanguage('tr');
  const frQuestions = getQuestionsByLanguage('fr');
  const arQuestions = getQuestionsByLanguage('ar');

  assert(enQuestions.length > 0, 'English catalog must not be empty');
  assert(trQuestions.length === enQuestions.length, 'Turkish catalog must match English question count');
  assert(frQuestions.length === enQuestions.length, 'French catalog must match English question count');
  assert(arQuestions.length === enQuestions.length, 'Arabic catalog must match English question count');
  console.log(`✓ 6. Catalogs size parity verified: ${enQuestions.length} questions across all 4 languages`);
  passedCount++;

  // ─── 7. Stable Question Identity Across Languages ──────────────────────────
  const enIds = new Set(enQuestions.map((q) => q.id));
  const trIds = new Set(trQuestions.map((q) => q.id));
  const frIds = new Set(frQuestions.map((q) => q.id));
  const arIds = new Set(arQuestions.map((q) => q.id));

  for (const id of enIds) {
    assert(trIds.has(id), `Turkish catalog missing stable ID: ${id}`);
    assert(frIds.has(id), `French catalog missing stable ID: ${id}`);
    assert(arIds.has(id), `Arabic catalog missing stable ID: ${id}`);
  }
  console.log('✓ 7. Stable canonical question identities verified across all catalogs');
  passedCount++;

  // ─── 8. Question Metadata Consistency ──────────────────────────────────────
  for (let i = 0; i < enQuestions.length; i++) {
    const enQ = enQuestions[i];
    const trQ = trQuestions.find((q) => q.id === enQ.id)!;
    const frQ = frQuestions.find((q) => q.id === enQ.id)!;
    const arQ = arQuestions.find((q) => q.id === enQ.id)!;

    assert(trQ.gameModeId === enQ.gameModeId, `gameModeId mismatch on ${enQ.id}`);
    assert(frQ.gameModeId === enQ.gameModeId, `gameModeId mismatch on ${enQ.id}`);
    assert(arQ.gameModeId === enQ.gameModeId, `gameModeId mismatch on ${enQ.id}`);

    assert(trQ.vibeId === enQ.vibeId, `vibeId mismatch on ${enQ.id}`);
    assert(frQ.vibeId === enQ.vibeId, `vibeId mismatch on ${enQ.id}`);
    assert(arQ.vibeId === enQ.vibeId, `vibeId mismatch on ${enQ.id}`);
  }
  console.log('✓ 8. Mode and Vibe metadata consistency verified across languages');
  passedCount++;

  // ─── 9. Arabic Script Detection in Arabic Catalog ───────────────────────────
  const arabicRegex = /[\u0600-\u06FF]/;
  for (const q of arQuestions) {
    assert(arabicRegex.test(q.text), `Arabic question ${q.id} must contain Arabic script`);
  }
  console.log('✓ 9. Arabic script presence verified in 100% of Arabic catalog');
  passedCount++;

  // ─── 10. ContentProvider Language Filtering ────────────────────────────────
  const trFiltered = await defaultContentProvider.getQuestions({ language: 'tr', vibeId: 'party' });
  assert(trFiltered.length > 0, 'ContentProvider should return Turkish questions for party vibe');
  assert(trFiltered.every((q) => q.vibeId === 'party'), 'All returned questions must match party vibe');
  assert(trFiltered.every((q) => q.language === 'tr'), 'All returned questions must have language="tr"');
  console.log('✓ 10. ContentProvider localized querying verified');
  passedCount++;

  // ─── 11. AI Local Synthesizer Multi-Language Generation ────────────────────
  const localProvider = new LocalSynthesizerProvider();
  const mockPlayers: Player[] = [
    { id: 'p1', name: 'Helin' },
    { id: 'p2', name: 'Mert' },
  ];

  const trAI = await localProvider.generateQuestions({
    language: 'tr',
    vibeId: 'party',
    players: mockPlayers,
    gameModeId: 'would-you-rather',
    count: 4,
  });

  assert(trAI.length === 4, 'Synthesizer should generate 4 questions');
  assert(trAI.every((q) => q.language === 'tr'), 'AI questions must tag language="tr"');
  assert(
    trAI.some((q) => q.text.includes('Helin') && q.text.includes('Mert')),
    'Turkish AI question must preserve original untranslated player names'
  );
  console.log('✓ 11. AI Local Synthesizer Turkish generation with preserved player names verified');
  passedCount++;

  // ─── 12. AI Local Synthesizer Arabic Generation ────────────────────────────
  const arAI = await localProvider.generateQuestions({
    language: 'ar',
    vibeId: 'party',
    players: mockPlayers,
    gameModeId: 'would-you-rather',
    count: 2,
  });

  assert(arAI.length === 2, 'Synthesizer should generate 2 Arabic questions');
  assert(arAI.every((q) => q.language === 'ar'), 'AI questions must tag language="ar"');
  assert(
    arAI.every((q) => arabicRegex.test(q.text)),
    'Arabic AI question must contain Arabic script'
  );
  assert(
    arAI.some((q) => q.text.includes('Helin') && q.text.includes('Mert')),
    'Arabic AI question must embed original player names'
  );
  console.log('✓ 12. AI Local Synthesizer Arabic generation with embedded player names verified');
  passedCount++;

  // ─── 13. AI Output Validator Language Script Check ─────────────────────────
  const englishCheck = validateLanguageScript('Would you rather be rich or famous?', 'en');
  assert(englishCheck.isValid === true, 'English text should pass English script validation');

  const arabicMismatchCheck = validateLanguageScript('هل تفضل الذهاب مع علي؟', 'en');
  assert(arabicMismatchCheck.isValid === false, 'Arabic text must fail English script validation');

  const arabicValidCheck = validateLanguageScript('هل تفضل الذهاب في رحلة مع سامي؟', 'ar');
  assert(arabicValidCheck.isValid === true, 'Arabic text must pass Arabic script validation');

  const arabicMissingCheck = validateLanguageScript('Would you rather party with Alex?', 'ar');
  assert(arabicMissingCheck.isValid === false, 'English text must fail Arabic script validation');
  console.log('✓ 13. AI Validator language script detection verified');
  passedCount++;

  // ─── 14. AI Service Pipeline Validation Integration ───────────────────────
  const aiService = new AIService(localProvider);
  const validatedGenerated = await aiService.generatePersonalizedQuestions({
    language: 'fr',
    vibeId: 'date',
    players: mockPlayers,
    gameModeId: 'hot-take',
    count: 3,
  });

  assert(validatedGenerated.length === 3, 'AIService should pass validated French questions');
  assert(validatedGenerated.every((q) => q.language === 'fr'), 'All generated questions must have language="fr"');
  console.log('✓ 14. AIService pipeline French validation verified');
  passedCount++;

  // ─── 15. Cross-Session Deduplication Across Language Switches ──────────────
  const qEn = enQuestions[0];
  const qTr = trQuestions.find((q) => q.id === qEn.id)!;
  const identityEn = getQuestionIdentity(qEn);
  const identityTr = getQuestionIdentity(qTr);

  assert(
    identityEn === identityTr,
    `Question identities must match across languages: "${identityEn}" === "${identityTr}"`
  );
  console.log('✓ 15. Question identity is language-invariant for cross-session deduplication');
  passedCount++;

  // ─── 16. Store setLanguage Action ──────────────────────────────────────────
  useGameStore.getState().resetSession();
  assert(useGameStore.getState().session.language === 'en', 'Default store session language must be "en"');

  useGameStore.getState().setLanguage('tr');
  assert(useGameStore.getState().session.language === 'tr', 'setLanguage("tr") must update store language');

  useGameStore.getState().setLanguage('ar');
  assert(useGameStore.getState().session.language === 'ar', 'setLanguage("ar") must update store language');
  console.log('✓ 16. Zustand Store language lifecycle verified');
  passedCount++;

  // ─── 17. Pass The Phone Translations ───────────────────────────────────────
  assert(t('passPhone.takeShotButton', 'en') === '🥃 TAKE THE SHOT', 'en take shot');
  assert(t('passPhone.takeShotButton', 'tr') === '🥃 SHOT AT (SIR KALSIN)', 'tr take shot');
  assert(t('passPhone.takeShotButton', 'fr') === '🥃 BOIRE UN SHOT', 'fr take shot');
  assert(t('passPhone.takeShotButton', 'ar') === '🥃 اشرب جرعة (احتفظ بالسر)', 'ar take shot');
  console.log('✓ 17. Pass The Phone action buttons translated across all 4 languages');
  passedCount++;

  // ─── 18. Group Session Translations ────────────────────────────────────────
  assert(t('group.submitAndPass', 'en') === 'SUBMIT & PASS PHONE', 'en submit & pass');
  assert(t('group.submitAndPass', 'tr') === 'KAYDET VE TELEFONU PASLA', 'tr submit & pass');
  assert(t('group.submitAndPass', 'fr') === 'VALIDER ET PASSER LE TÉLÉPHONE', 'fr submit & pass');
  assert(t('group.submitAndPass', 'ar') === 'إرسال وتمرير الهاتف', 'ar submit & pass');
  console.log('✓ 18. Group Session turn actions translated across all 4 languages');
  passedCount++;

  // ─── 19. Session Type Switcher Titles ──────────────────────────────────────
  assert(t('sessionType.passPhone.title', 'en') === 'Pass The Phone', 'en pass phone title');
  assert(t('sessionType.passPhone.title', 'tr') === 'Telefonu Pasla', 'tr pass phone title');
  assert(t('sessionType.passPhone.title', 'fr') === 'Passe le Téléphone', 'fr pass phone title');
  assert(t('sessionType.passPhone.title', 'ar') === 'مرر الهاتف', 'ar pass phone title');
  console.log('✓ 19. Session Type cards translated across all 4 languages');
  passedCount++;

  // ─── 20. Would You Rather Option Non-Emptiness ─────────────────────────────
  for (const lang of ['en', 'tr', 'fr', 'ar'] as LanguageId[]) {
    const catalog = QUESTIONS_BY_LANGUAGE[lang];
    const wyrQuestions = catalog.filter((q) => q.gameModeId === 'would-you-rather');
    for (const q of wyrQuestions) {
      const wyr = q as { optionA: string; optionB: string };
      assert(Boolean(wyr.optionA && wyr.optionA.length > 0), `Option A missing in ${lang} on ${q.id}`);
      assert(Boolean(wyr.optionB && wyr.optionB.length > 0), `Option B missing in ${lang} on ${q.id}`);
    }
  }
  console.log('✓ 20. WYR option A & B completeness verified in all 4 languages');
  passedCount++;

  // ─── 21. Hot Take Agree / Disagree Label Non-Emptiness ─────────────────────
  for (const lang of ['en', 'tr', 'fr', 'ar'] as LanguageId[]) {
    const catalog = QUESTIONS_BY_LANGUAGE[lang];
    const htQuestions = catalog.filter((q) => q.gameModeId === 'hot-take');
    for (const q of htQuestions) {
      const ht = q as { agreeLabel?: string; disagreeLabel?: string };
      assert(!!ht.agreeLabel, `agreeLabel missing in ${lang} on ${q.id}`);
      assert(!!ht.disagreeLabel, `disagreeLabel missing in ${lang} on ${q.id}`);
    }
  }
  console.log('✓ 21. Hot Take agree & disagree labels verified in all 4 languages');
  passedCount++;

  console.log(`\n🎉 ALL ${passedCount}/21 MILESTONE 8.5 LOCALIZATION TESTS PASSED PERFECTLY!`);
}

runTestSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
