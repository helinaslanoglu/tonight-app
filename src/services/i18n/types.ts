/**
 * i18n & Localization Type Definitions
 * ──────────────────────────────────────
 * Defines strongly-typed translation keys and language models for the Tonight app.
 */

import type { LanguageDefinition, LanguageId } from '@/types';

export type TranslationKey =
  // Common Navigation & Actions
  | 'common.back'
  | 'common.exit'
  | 'common.home'
  | 'common.playAgain'
  | 'common.changeMode'
  | 'common.continue'
  | 'common.nextQuestion'
  | 'common.finishGame'
  | 'common.ready'
  | 'common.cancel'
  | 'common.exitGamePrompt'
  | 'common.exitGameMessage'
  | 'common.keepPlaying'
  | 'common.exitConfirm'
  // Setup Screen
  | 'setup.headerTitle'
  | 'setup.headerSubtitle'
  | 'setup.sessionTypeLabel'
  | 'setup.languageLabel'
  | 'setup.playerCountLabel'
  | 'setup.playerInputPlaceholder'
  | 'setup.chooseModeCta'
  | 'setup.nameRequired'
  | 'setup.maxCharacters'
  | 'setup.uniqueNameRequired'
  // Session Types
  | 'sessionType.group.title'
  | 'sessionType.group.badge'
  | 'sessionType.group.desc'
  | 'sessionType.passPhone.title'
  | 'sessionType.passPhone.badge'
  | 'sessionType.passPhone.desc'
  | 'sessionType.standard.title'
  | 'sessionType.standard.desc'
  // Game Modes
  | 'gameMode.wyr.label'
  | 'gameMode.mlt.label'
  | 'gameMode.hotTake.label'
  | 'gameMode.whoKnows.label'
  | 'gameMode.open.label'
  // Group Session
  | 'group.turnBanner'
  | 'group.submitAndPass'
  | 'group.finishSession'
  | 'group.resultsTitle'
  | 'group.resultsSubtitle'
  | 'group.mostSelectedTag'
  | 'group.votesCount'
  | 'group.whoSelectedWhom'
  | 'group.votedFor'
  | 'group.noSelections'
  | 'group.wyrSplits'
  // Pass The Phone
  | 'passPhone.secretTurnBanner'
  | 'passPhone.chooseTargetPrompt'
  | 'passPhone.handoverTitle'
  | 'passPhone.handoverSubtitle'
  | 'passPhone.readyButton'
  | 'passPhone.actionTitle'
  | 'passPhone.actionSubtitle'
  | 'passPhone.takeShotButton'
  | 'passPhone.showQuestionButton'
  | 'passPhone.questionWasBadge'
  | 'passPhone.selectorRevealed'
  | 'passPhone.nextRound'
  | 'passPhone.viewResults'
  | 'passPhone.resultsTitle'
  | 'passPhone.resultsSubtitle'
  | 'passPhone.partyToll'
  | 'passPhone.shotsTaken'
  | 'passPhone.shotsSubtitle'
  | 'passPhone.noShotsSubtitle'
  | 'passPhone.mostTargeted'
  | 'passPhone.targetedTimes'
  | 'passPhone.topSelector'
  | 'passPhone.passedTimes'
  | 'passPhone.passedPhoneTo'
  | 'passPhone.didNotTarget'
  // Standard Game Recap
  | 'recap.badge'
  | 'recap.title'
  | 'recap.subtitle'
  | 'recap.chemistryTag'
  | 'recap.archetypesHeader';

export type TranslationMap = Record<TranslationKey, string>;

export type { LanguageDefinition, LanguageId };
