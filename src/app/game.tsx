import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  HotTakeInteraction,
  MostLikelyToInteraction,
  OpenQuestionInteraction,
  PassThePhoneOverlay,
  WhoKnowsMeBestInteraction,
  WouldYouRatherInteraction,
} from '@/components/game';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { GAME_MODES, VIBES } from '@/data';
import {
  aggregateGroupResult,
  aggregatePassPhoneResult,
  generateSessionRecap,
  getValidTargetsForSelector,
  resolveInteractionType,
} from '@/engine';
import { isRTL, t } from '@/services/i18n';
import {
  useAcknowledgePassPhoneReveal,
  useAnswerAndAdvance,
  useCommitPassPhoneAction,
  useConfirmPassPhoneHandover,
  useCurrentAnsweringPlayer,
  useCurrentPlayerIndex,
  useCurrentQuestion,
  useCurrentRound,
  useGameSession,
  useIsGameCompleted,
  useLanguage,
  usePassPhonePhase,
  usePassPhoneSelectedAction,
  usePassPhoneSelector,
  usePassPhoneTarget,
  usePlayers,
  useReplayGame,
  useResetSession,
  useSelectedVibe,
  useSelectPassPhoneTarget,
  useSessionType,
  useSubmitPlayerResponse,
  useTotalRounds,
} from '@/store';
import { getVibeColor, theme } from '@/theme';
import type {
  HotTakeQuestion,
  OpenQuestion,
  Player,
  WhoKnowsMeBestQuestion,
  WouldYouRatherQuestion,
} from '@/types';
import { haptic } from '@/utils';

export default function GameScreen() {
  const router = useRouter();
  const session = useGameSession();
  const language = useLanguage();
  const rtl = isRTL(language);
  const sessionType = useSessionType();
  const selectedVibeId = useSelectedVibe();
  const players = usePlayers();
  const currentRound = useCurrentRound();
  const totalRounds = useTotalRounds();
  const currentQuestion = useCurrentQuestion();
  const isCompleted = useIsGameCompleted();

  // Group Session state hooks
  const currentPlayerIndex = useCurrentPlayerIndex();
  const currentAnsweringPlayer = useCurrentAnsweringPlayer();

  // Pass The Phone state hooks
  const passPhonePhase = usePassPhonePhase();
  const passPhoneSelector = usePassPhoneSelector();
  const passPhoneTarget = usePassPhoneTarget();
  const passPhoneSelectedAction = usePassPhoneSelectedAction();

  // Actions
  const answerAndAdvance = useAnswerAndAdvance();
  const submitPlayerResponse = useSubmitPlayerResponse();
  const selectPassPhoneTarget = useSelectPassPhoneTarget();
  const confirmPassPhoneHandover = useConfirmPassPhoneHandover();
  const commitPassPhoneAction = useCommitPassPhoneAction();
  const acknowledgePassPhoneReveal = useAcknowledgePassPhoneReveal();
  const replayGame = useReplayGame();
  const resetSession = useResetSession();

  // Local selection state for current turn (Group & Standard modes)
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | undefined>(undefined);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>(undefined);
  const [selectedStance, setSelectedStance] = useState<'agree' | 'disagree' | undefined>(undefined);
  const [spotlightPlayerId, setSpotlightPlayerId] = useState<string | undefined>(undefined);

  // Local Pass The Phone privacy overlay state
  const [passPhoneOverlayVisible, setPassPhoneOverlayVisible] = useState(false);
  const [nextPlayerForOverlay, setNextPlayerForOverlay] = useState<Player | null>(null);

  // Transition state
  const [isAdvancing, setIsAdvancing] = useState(false);

  const activeVibe = VIBES.find((v) => v.id === selectedVibeId);
  const vibeColor = selectedVibeId ? getVibeColor(selectedVibeId) : theme.colors.accent;

  const currentMode = useMemo(() => {
    if (!currentQuestion) return null;
    return GAME_MODES.find((m) => m.id === currentQuestion.gameModeId) || null;
  }, [currentQuestion]);

  const interactionType = useMemo(() => {
    if (!currentQuestion) return 'choice';
    return resolveInteractionType(currentQuestion);
  }, [currentQuestion]);

  // Compute Standard Mode Recap
  const recap = useMemo(() => {
    if (!isCompleted || !session.answers || session.answers.length === 0) return null;
    return generateSessionRecap(session);
  }, [isCompleted, session]);

  // Compute Group Session Aggregated Results
  const groupResult = useMemo(() => {
    if (!isCompleted || sessionType !== 'group' || !session.responses || session.responses.length === 0) {
      return null;
    }
    return aggregateGroupResult(session);
  }, [isCompleted, sessionType, session]);

  // Compute Pass The Phone Aggregated Results
  const passPhoneResult = useMemo(() => {
    if (!isCompleted || sessionType !== 'pass-the-phone' || !session.passPhoneState) {
      return null;
    }
    return aggregatePassPhoneResult(session);
  }, [isCompleted, sessionType, session]);

  const resetLocalSelections = () => {
    setSelectedOption(undefined);
    setSelectedPlayerId(undefined);
    setSelectedStance(undefined);
    setSpotlightPlayerId(undefined);
  };

  // Redirect if no session exists
  useEffect(() => {
    if (!selectedVibeId || players.length < 2) {
      router.replace('/vibes');
    }
  }, [selectedVibeId, players, router]);

  // Check if player can advance
  const canAdvance = useMemo(() => {
    if (!currentQuestion) return false;
    switch (interactionType) {
      case 'choice':
        return selectedOption !== undefined;
      case 'player-select':
        return selectedPlayerId !== undefined;
      case 'stance':
        return selectedStance !== undefined;
      case 'spotlight-quiz':
        return spotlightPlayerId !== undefined;
      case 'discussion':
        return true;
      default:
        return false;
    }
  }, [currentQuestion, interactionType, selectedOption, selectedPlayerId, selectedStance, spotlightPlayerId]);

  // Handle Advance for Standard & Group Modes
  const handleNext = async () => {
    if (!canAdvance || isAdvancing) return;
    setIsAdvancing(true);

    try {
      if (sessionType === 'group') {
        // Group Session: submit response for the current player
        let res: { isQuestionComplete: boolean } = { isQuestionComplete: false };
        if (interactionType === 'choice' && selectedOption) {
          res = await submitPlayerResponse({ responseType: 'choice', selectedOption });
        } else if (interactionType === 'player-select' && selectedPlayerId) {
          res = await submitPlayerResponse({ responseType: 'player-select', selectedPlayerId });
        } else if (interactionType === 'stance' && selectedStance) {
          res = await submitPlayerResponse({ responseType: 'stance', selectedStance });
        } else if (interactionType === 'spotlight-quiz') {
          res = await submitPlayerResponse({ responseType: 'spotlight-quiz', targetPlayerId: spotlightPlayerId });
        } else {
          res = await submitPlayerResponse({ responseType: 'discussion', confirmed: true });
        }

        resetLocalSelections();

        // If next player must answer this same question, show privacy pass overlay
        if (!res.isQuestionComplete) {
          const nextIndex = (currentPlayerIndex + 1) % players.length;
          const nextPlayer = players[nextIndex];
          if (nextPlayer) {
            setNextPlayerForOverlay(nextPlayer);
            setPassPhoneOverlayVisible(true);
          }
        }
      } else {
        // Standard Session: submit collective summary answer
        await answerAndAdvance({
          selectedOption,
          selectedPlayerId,
          selectedStance,
          targetPlayerId: spotlightPlayerId,
        });
        resetLocalSelections();
      }
    } catch {
      // Fallback cleanly
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleReplay = async () => {
    resetLocalSelections();
    setIsAdvancing(false);
    await replayGame();
  };

  const handleExit = () => {
    Alert.alert(
      t('common.exitGamePrompt', language),
      t('common.exitGameMessage', language),
      [
        { text: t('common.keepPlaying', language), style: 'cancel' },
        {
          text: t('common.exitConfirm', language),
          style: 'destructive',
          onPress: () => {
            resetSession();
            router.replace('/');
          },
        },
      ]
    );
  };

  // ─── Guard: Empty State ───────────────────────────────────────────────────
  if (!selectedVibeId || players.length < 2 || session.status === 'idle') {
    return (
      <ScreenContainer contentStyle={styles.centerContainer}>
        <AppText variant="heading" style={styles.centerText}>
          {t('common.exit', language)}
        </AppText>
        <AppButton
          size="lg"
          fullWidth
          onPress={() => router.replace('/vibes')}
          style={styles.primaryCta}
        >
          {t('common.home', language)}
        </AppButton>
      </ScreenContainer>
    );
  }

  // ─── 1. Pass The Phone Completed Screen ───────────────────────────────────
  if (isCompleted && sessionType === 'pass-the-phone' && passPhoneResult) {
    return (
      <ScreenContainer scrollable contentStyle={styles.container}>
        <View style={[styles.navBar, rtl && styles.rowRTL]}>
          <Badge
            label={t('sessionType.passPhone.title', language).toUpperCase()}
            color={theme.colors.accentMuted}
            textColor={theme.colors.accent}
          />
          {activeVibe && (
            <Badge
              label={`${activeVibe.emoji} ${activeVibe.label}`}
              color={theme.colors.surfaceElevated}
              textColor={vibeColor}
            />
          )}
        </View>

        <Animated.View entering={FadeIn.duration(400)} style={styles.completedHeader}>
          <AppText variant="display" style={[styles.completedTitle, rtl && styles.textRTL]}>
            {t('passPhone.resultsTitle', language)}
          </AppText>
          <AppText variant="body" color="secondary" style={[styles.subtitle, rtl && styles.textRTL]}>
            {t('passPhone.resultsSubtitle', language, { rounds: passPhoneResult.totalRounds })}
          </AppText>
        </Animated.View>

        {/* Total Shots Taken Card */}
        <Animated.View entering={FadeIn.duration(450)} style={styles.summaryBox}>
          <AppCard variant="elevated" padding="lg" glow style={[styles.synergyCard, { borderColor: vibeColor }]}>
            <AppText variant="overline" style={[styles.synergyTag, { color: vibeColor }]}>
              {t('passPhone.partyToll', language)}
            </AppText>
            <AppText variant="display" style={styles.synergyTitle}>
              {t('passPhone.shotsTaken', language, { count: passPhoneResult.totalShots })}
            </AppText>
            <AppText variant="body" color="secondary" style={[styles.synergySubtitle, rtl && styles.textRTL]}>
              {passPhoneResult.totalShots > 0
                ? t('passPhone.shotsSubtitle', language, { count: passPhoneResult.totalShots })
                : t('passPhone.noShotsSubtitle', language)}
            </AppText>
          </AppCard>
        </Animated.View>

        {/* Most Targeted Player & Most Frequent Selector */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.summaryBox}>
          <View style={[styles.statsGrid, rtl && styles.rowRTL]}>
            {passPhoneResult.mostTargetedPlayer && (
              <AppCard variant="default" padding="md" style={styles.statCard}>
                <AppText variant="overline" color="secondary">
                  {t('passPhone.mostTargeted', language)}
                </AppText>
                <AppText variant="heading" style={styles.statHighlightName}>
                  🎯 {passPhoneResult.mostTargetedPlayer.name}
                </AppText>
                <AppText variant="caption" color="secondary">
                  {t('passPhone.targetedTimes', language, { count: passPhoneResult.mostTargetedPlayer.count })}
                </AppText>
              </AppCard>
            )}

            {passPhoneResult.mostFrequentSelector && (
              <AppCard variant="default" padding="md" style={styles.statCard}>
                <AppText variant="overline" color="secondary">
                  {t('passPhone.topSelector', language)}
                </AppText>
                <AppText variant="heading" style={styles.statHighlightName}>
                  🕵️ {passPhoneResult.mostFrequentSelector.name}
                </AppText>
                <AppText variant="caption" color="secondary">
                  {t('passPhone.passedTimes', language, { count: passPhoneResult.mostFrequentSelector.count })}
                </AppText>
              </AppCard>
            )}
          </View>
        </Animated.View>

        {/* Relationship Matrix Breakdown */}
        <Animated.View entering={FadeIn.duration(550)} style={styles.summaryBox}>
          <AppText
            variant="overline"
            color="secondary"
            style={[styles.sectionHeader, rtl && styles.textRTL]}
          >
            {t('group.whoSelectedWhom', language)}
          </AppText>
          <View style={styles.insightsList}>
            {players.map((p) => {
              const targetsMap = passPhoneResult.relationshipMatrix[p.id] || {};
              const targets = Object.entries(targetsMap).filter(([, count]) => count > 0);

              return (
                <AppCard
                  key={p.id}
                  variant="default"
                  padding="md"
                  style={[styles.playerInsightCard, { borderColor: `${p.color || theme.colors.accent}44` }]}
                >
                  <View style={[styles.insightHeaderRow, rtl && styles.rowRTL]}>
                    <View style={[styles.insightAvatar, { backgroundColor: p.color || theme.colors.accent }]}>
                      <AppText style={styles.avatarInitial}>{p.name.charAt(0).toUpperCase()}</AppText>
                    </View>
                    <View style={styles.insightNameBox}>
                      <AppText variant="label" style={[styles.playerName, rtl && styles.textRTL]}>
                        {p.name}
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.patternBox}>
                    <AppText
                      variant="caption"
                      color="secondary"
                      style={[styles.patternLabel, rtl && styles.textRTL]}
                    >
                      {t('passPhone.passedPhoneTo', language)}
                    </AppText>
                    {targets.length > 0 ? (
                      targets.map(([targetId, count]) => {
                        const targetPlayer = players.find((pl) => pl.id === targetId);
                        return (
                          <AppText
                            key={targetId}
                            variant="bodySmall"
                            style={[styles.patternRow, rtl && styles.textRTL]}
                          >
                            👉 <AppText style={{ fontWeight: '700' }}>{targetPlayer?.name || 'Unknown'}</AppText> ({count}x)
                          </AppText>
                        );
                      })
                    ) : (
                      <AppText
                        variant="caption"
                        color="secondary"
                        style={rtl && styles.textRTL}
                      >
                        {t('passPhone.didNotTarget', language)}
                      </AppText>
                    )}
                  </View>
                </AppCard>
              );
            })}
          </View>
        </Animated.View>

        {/* Bottom Actions */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.bottomArea}>
          <AppButton size="lg" fullWidth onPress={handleReplay} style={styles.primaryCta}>
            {t('common.playAgain', language)}
          </AppButton>
          <AppButton
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => router.push('/game-mode')}
            style={styles.secondaryCta}
          >
            {t('common.changeMode', language)}
          </AppButton>
          <AppButton
            variant="ghost"
            size="md"
            fullWidth
            onPress={() => {
              resetSession();
              router.replace('/');
            }}
          >
            {t('common.home', language)}
          </AppButton>
        </Animated.View>
      </ScreenContainer>
    );
  }

  // ─── 2. Group Session Completed Screen ────────────────────────────────────
  if (isCompleted && sessionType === 'group' && groupResult) {
    return (
      <ScreenContainer scrollable contentStyle={styles.container}>
        <View style={[styles.navBar, rtl && styles.rowRTL]}>
          <Badge
            label={t('sessionType.group.title', language).toUpperCase()}
            color={theme.colors.accentMuted}
            textColor={theme.colors.accent}
          />
          {activeVibe && (
            <Badge
              label={`${activeVibe.emoji} ${activeVibe.label}`}
              color={theme.colors.surfaceElevated}
              textColor={vibeColor}
            />
          )}
        </View>

        <Animated.View entering={FadeIn.duration(400)} style={styles.completedHeader}>
          <AppText variant="display" style={[styles.completedTitle, rtl && styles.textRTL]}>
            {t('group.resultsTitle', language)}
          </AppText>
          <AppText variant="body" color="secondary" style={[styles.subtitle, rtl && styles.textRTL]}>
            {t('group.resultsSubtitle', language, {
              count: groupResult.totalCollectedResponses,
              players: players.length,
            })}
          </AppText>
        </Animated.View>

        {/* Most Selected Players Card */}
        {groupResult.topSelectedPlayers.length > 0 && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.summaryBox}>
            <AppCard variant="elevated" padding="lg" glow style={[styles.synergyCard, { borderColor: vibeColor }]}>
              <AppText variant="overline" style={[styles.synergyTag, { color: vibeColor }]}>
                {t('group.mostSelectedTag', language)}
              </AppText>
              <AppText variant="heading" style={styles.synergyTitle}>
                👑 {groupResult.topSelectedPlayers[0].name}
              </AppText>
              <AppText variant="body" color="secondary" style={[styles.synergySubtitle, rtl && styles.textRTL]}>
                {t('group.votesCount', language, { count: groupResult.topSelectedPlayers[0].count })}
              </AppText>
            </AppCard>
          </Animated.View>
        )}

        {/* Individual Selection Patterns & Matrix */}
        <Animated.View entering={FadeIn.duration(550)} style={styles.summaryBox}>
          <AppText
            variant="overline"
            color="secondary"
            style={[styles.sectionHeader, rtl && styles.textRTL]}
          >
            {t('group.whoSelectedWhom', language)}
          </AppText>

          <View style={styles.insightsList}>
            {players.map((p) => {
              const stats = groupResult.playerStats[p.id];
              const selectionsMade = stats?.selectionsMade || {};
              const targets = Object.entries(selectionsMade).filter(([, count]) => count > 0);

              return (
                <AppCard
                  key={p.id}
                  variant="default"
                  padding="md"
                  style={[styles.playerInsightCard, { borderColor: `${p.color || theme.colors.accent}44` }]}
                >
                  <View style={[styles.insightHeaderRow, rtl && styles.rowRTL]}>
                    <View style={[styles.insightAvatar, { backgroundColor: p.color || theme.colors.accent }]}>
                      <AppText style={styles.avatarInitial}>{p.name.charAt(0).toUpperCase()}</AppText>
                    </View>
                    <View style={styles.insightNameBox}>
                      <AppText variant="label" style={[styles.playerName, rtl && styles.textRTL]}>
                        {p.name}
                      </AppText>
                      <AppText variant="caption" color="secondary" style={rtl && styles.textRTL}>
                        {stats?.timesSelected || 0} votes ({stats?.selectionPercentage || 0}%)
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.patternBox}>
                    <AppText
                      variant="caption"
                      color="secondary"
                      style={[styles.patternLabel, rtl && styles.textRTL]}
                    >
                      {t('group.votedFor', language)}
                    </AppText>
                    {targets.length > 0 ? (
                      targets.map(([targetId, count]) => {
                        const targetPlayer = players.find((pl) => pl.id === targetId);
                        return (
                          <AppText
                            key={targetId}
                            variant="bodySmall"
                            style={[styles.patternRow, rtl && styles.textRTL]}
                          >
                            👉 <AppText style={{ fontWeight: '700' }}>{targetPlayer?.name || 'Unknown'}</AppText> ({count}x)
                          </AppText>
                        );
                      })
                    ) : (
                      <AppText
                        variant="caption"
                        color="secondary"
                        style={rtl && styles.textRTL}
                      >
                        {t('group.noSelections', language)}
                      </AppText>
                    )}
                  </View>
                </AppCard>
              );
            })}
          </View>
        </Animated.View>

        {/* Choice & Stance Distributions */}
        {groupResult.choiceBreakdowns.length > 0 && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.summaryBox}>
            <AppText
              variant="overline"
              color="secondary"
              style={[styles.sectionHeader, rtl && styles.textRTL]}
            >
              {t('group.wyrSplits', language)}
            </AppText>
            {groupResult.choiceBreakdowns.map((cb, idx) => (
              <AppCard key={idx} variant="default" padding="sm" style={styles.distributionCard}>
                <AppText variant="label" style={[styles.distQuestionText, rtl && styles.textRTL]}>
                  {cb.questionText || `Question ${idx + 1}`}
                </AppText>
                <View style={[styles.distStatsRow, rtl && styles.rowRTL]}>
                  <Badge label={`Option A: ${cb.optionACount}`} color={theme.colors.surfaceElevated} />
                  <Badge label={`Option B: ${cb.optionBCount}`} color={theme.colors.surfaceElevated} />
                </View>
              </AppCard>
            ))}
          </Animated.View>
        )}

        {/* Bottom Actions */}
        <Animated.View entering={FadeIn.duration(650)} style={styles.bottomArea}>
          <AppButton size="lg" fullWidth onPress={handleReplay} style={styles.primaryCta}>
            {t('common.playAgain', language)}
          </AppButton>
          <AppButton
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => router.push('/game-mode')}
            style={styles.secondaryCta}
          >
            {t('common.changeMode', language)}
          </AppButton>
          <AppButton
            variant="ghost"
            size="md"
            fullWidth
            onPress={() => {
              resetSession();
              router.replace('/');
            }}
          >
            {t('common.home', language)}
          </AppButton>
        </Animated.View>
      </ScreenContainer>
    );
  }

  // ─── 3. Standard Game Completed Screen ────────────────────────────────────
  if (isCompleted && recap) {
    return (
      <ScreenContainer scrollable contentStyle={styles.container}>
        <View style={[styles.navBar, rtl && styles.rowRTL]}>
          <Badge
            label={t('recap.badge', language)}
            color={theme.colors.accentMuted}
            textColor={theme.colors.accent}
          />
          {activeVibe && (
            <Badge
              label={`${activeVibe.emoji} ${activeVibe.label}`}
              color={theme.colors.surfaceElevated}
              textColor={vibeColor}
            />
          )}
        </View>

        <Animated.View entering={FadeIn.duration(400)} style={styles.completedHeader}>
          <AppText variant="display" style={[styles.completedTitle, rtl && styles.textRTL]}>
            {t('recap.title', language)}
          </AppText>
          <AppText variant="body" color="secondary" style={[styles.subtitle, rtl && styles.textRTL]}>
            {t('recap.subtitle', language, { rounds: totalRounds })}
          </AppText>
        </Animated.View>

        {/* Group / Duo Synergy Card */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.summaryBox}>
          <AppCard variant="elevated" padding="lg" glow style={[styles.synergyCard, { borderColor: vibeColor }]}>
            <AppText variant="overline" style={[styles.synergyTag, { color: vibeColor }]}>
              {t('recap.chemistryTag', language)}
            </AppText>
            <AppText variant="heading" style={styles.synergyTitle}>
              {recap.synergyTitle}
            </AppText>
            <AppText variant="body" color="secondary" style={[styles.synergySubtitle, rtl && styles.textRTL]}>
              {recap.synergySubtitle}
            </AppText>
            <View style={styles.vibeSummaryPill}>
              <AppText variant="caption" style={styles.vibeSummaryText}>
                💡 {recap.vibeSummary}
              </AppText>
            </View>
          </AppCard>

          <AppText
            variant="overline"
            color="secondary"
            style={[styles.sectionHeader, rtl && styles.textRTL]}
          >
            {t('recap.archetypesHeader', language)}
          </AppText>

          <View style={styles.insightsList}>
            {recap.playerInsights.map((insight) => {
              const pColor = insight.playerColor || theme.colors.accent;
              return (
                <AppCard
                  key={insight.playerId}
                  variant="default"
                  padding="md"
                  style={[styles.playerInsightCard, { borderColor: `${pColor}44` }]}
                >
                  <View style={[styles.insightHeaderRow, rtl && styles.rowRTL]}>
                    <View style={[styles.insightAvatar, { backgroundColor: pColor }]}>
                      <AppText style={styles.avatarInitial}>
                        {insight.playerName.charAt(0).toUpperCase()}
                      </AppText>
                    </View>
                    <View style={styles.insightNameBox}>
                      <AppText variant="label" style={[styles.playerName, rtl && styles.textRTL]}>
                        {insight.playerName}
                      </AppText>
                      <AppText variant="caption" color="secondary" style={rtl && styles.textRTL}>
                        {insight.title}
                      </AppText>
                    </View>
                    <Badge label={insight.badge} color={theme.colors.surfaceElevated} textColor={pColor} />
                  </View>
                  <AppText variant="bodySmall" style={[styles.roastText, rtl && styles.textRTL]}>
                    &ldquo;{insight.roastOrCompliment}&rdquo;
                  </AppText>
                </AppCard>
              );
            })}
          </View>
        </Animated.View>

        {/* Bottom Actions */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.bottomArea}>
          <AppButton size="lg" fullWidth onPress={handleReplay} style={styles.primaryCta}>
            {t('common.playAgain', language)}
          </AppButton>
          <AppButton
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => router.push('/game-mode')}
            style={styles.secondaryCta}
          >
            {t('common.changeMode', language)}
          </AppButton>
          <AppButton
            variant="ghost"
            size="md"
            fullWidth
            onPress={() => {
              resetSession();
              router.replace('/');
            }}
          >
            {t('common.home', language)}
          </AppButton>
        </Animated.View>
      </ScreenContainer>
    );
  }

  // ─── 4. Pass The Phone Active Playing Loop ────────────────────────────────
  if (sessionType === 'pass-the-phone') {
    const validTargets = getValidTargetsForSelector(players, passPhoneSelector.id);
    const progressPercent = Math.min(100, Math.max(10, (currentRound / totalRounds) * 100));

    return (
      <ScreenContainer scrollable contentStyle={styles.container}>
        {/* Top Bar */}
        <View style={[styles.navBar, rtl && styles.rowRTL]}>
          <IconButton variant="surface" size="sm" onPress={handleExit} accessibilityLabel="Exit session">
            <AppText style={styles.exitIcon}>✕</AppText>
          </IconButton>
          {activeVibe && (
            <Badge label={`${activeVibe.emoji} ${activeVibe.label}`} color={theme.colors.surfaceElevated} textColor={vibeColor} />
          )}
          <Badge label={`${currentRound}/${totalRounds}`} color={theme.colors.accentMuted} textColor={theme.colors.accent} />
        </View>

        {/* Progress Track */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: vibeColor }]} />
        </View>

        {/* Phase 1: SELECTING_TARGET */}
        {passPhonePhase === 'SELECTING_TARGET' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.passPhoneContainer}>
            <View style={[styles.playerTurnBanner, rtl && styles.rowRTL]}>
              <View style={[styles.playerTurnDot, { backgroundColor: passPhoneSelector.color || vibeColor }]} />
              <AppText variant="label" style={styles.playerTurnText}>
                {t('passPhone.secretTurnBanner', language, { name: passPhoneSelector.name.toUpperCase() })}
              </AppText>
            </View>

            <AppCard variant="elevated" padding="xl" glow style={styles.questionCard}>
              <AppText variant="heading" style={[styles.questionText, rtl && styles.textRTL]}>
                {currentQuestion?.text}
              </AppText>
            </AppCard>

            <AppText
              variant="overline"
              color="secondary"
              style={[styles.targetSectionLabel, rtl && styles.textRTL]}
            >
              {t('passPhone.chooseTargetPrompt', language)}
            </AppText>

            <View style={styles.targetList}>
              {validTargets.map((target) => (
                <Pressable
                  key={target.id}
                  onPress={() => {
                    haptic.selection().catch(() => {});
                    selectPassPhoneTarget(target.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Target ${target.name}`}
                  style={({ pressed }) => [
                    styles.targetButton,
                    { borderColor: target.color || theme.colors.border },
                    rtl && styles.rowRTL,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={[styles.targetAvatar, { backgroundColor: target.color || theme.colors.accent }]}>
                    <AppText style={styles.avatarInitial}>{target.name.charAt(0).toUpperCase()}</AppText>
                  </View>
                  <AppText variant="label" style={[styles.targetName, rtl && styles.textRTL]}>
                    {target.name}
                  </AppText>
                  <AppText style={styles.targetArrow}>{rtl ? '←' : '→'}</AppText>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Phase 2: PASSING_PHONE */}
        {passPhonePhase === 'PASSING_PHONE' && passPhoneTarget && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.passPhoneMiddlePhase}>
            <View style={styles.passPhoneCard}>
              <AppText style={styles.hugeEmoji}>📱</AppText>
              <AppText variant="display" style={[styles.passPhoneTitle, rtl && styles.textRTL]}>
                {t('passPhone.handoverTitle', language, { target: passPhoneTarget.name })}
              </AppText>
              <AppText variant="body" color="secondary" style={[styles.passPhoneSubtext, rtl && styles.textRTL]}>
                {t('passPhone.handoverSubtitle', language)}
              </AppText>

              <AppButton
                size="lg"
                fullWidth
                onPress={() => {
                  haptic.impactMedium().catch(() => {});
                  confirmPassPhoneHandover();
                }}
                style={styles.primaryCta}
              >
                {t('passPhone.readyButton', language, { target: passPhoneTarget.name.toUpperCase() })}
              </AppButton>
            </View>
          </Animated.View>
        )}

        {/* Phase 3: TARGET_ACTION (Selector's Dilemma) */}
        {passPhonePhase === 'TARGET_ACTION' && passPhoneTarget && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.passPhoneMiddlePhase}>
            <View style={styles.passPhoneCard}>
              <AppText style={styles.hugeEmoji}>🥃</AppText>
              <AppText variant="display" style={[styles.passPhoneTitle, rtl && styles.textRTL]}>
                {t('passPhone.actionTitle', language)}
              </AppText>
              <AppText variant="body" color="secondary" style={[styles.passPhoneSubtext, rtl && styles.textRTL]}>
                {t('passPhone.actionSubtitle', language, { target: passPhoneTarget.name })}
              </AppText>

              <View style={styles.actionButtons}>
                <AppButton
                  size="lg"
                  fullWidth
                  onPress={() => {
                    haptic.impactHeavy().catch(() => {});
                    commitPassPhoneAction('take-shot');
                  }}
                  style={styles.shotButton}
                >
                  {t('passPhone.takeShotButton', language)}
                </AppButton>

                <AppButton
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onPress={() => {
                    haptic.impactMedium().catch(() => {});
                    commitPassPhoneAction('show-question');
                  }}
                  style={styles.revealButton}
                >
                  {t('passPhone.showQuestionButton', language)}
                </AppButton>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Phase 4: REVEALING_QUESTION or CONCEALED SHOT */}
        {passPhonePhase === 'REVEALING_QUESTION' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.passPhoneContainer}>
            {passPhoneSelectedAction === 'take-shot' ? (
              <View style={styles.passPhoneMiddlePhase}>
                <View style={styles.passPhoneCard}>
                  <AppText style={styles.hugeEmoji}>🥃</AppText>
                  <AppText variant="display" style={[styles.passPhoneTitle, rtl && styles.textRTL]}>
                    {t('passPhone.shotTakenCardTitle', language)}
                  </AppText>
                  <AppText variant="body" color="secondary" style={[styles.passPhoneSubtext, rtl && styles.textRTL]}>
                    {t('passPhone.shotTakenCardSubtitle', language, {
                      selector: passPhoneSelector.name,
                      target: passPhoneTarget?.name || '',
                    })}
                  </AppText>
                </View>
              </View>
            ) : (
              <>
                <Badge
                  label={t('passPhone.questionWasBadge', language)}
                  color={theme.colors.accentMuted}
                  textColor={theme.colors.accent}
                />

                <AppCard variant="elevated" padding="xl" glow style={[styles.questionCard, { marginTop: theme.spacing.md }]}>
                  <AppText variant="heading" style={[styles.questionText, rtl && styles.textRTL]}>
                    &ldquo;{currentQuestion?.text}&rdquo;
                  </AppText>
                </AppCard>

                <AppCard variant="default" padding="lg" style={styles.selectorRevealCard}>
                  <AppText variant="body" style={[styles.selectorRevealText, rtl && styles.textRTL]}>
                    {t('passPhone.selectorRevealed', language, {
                      selector: passPhoneSelector.name,
                      target: passPhoneTarget?.name || '',
                    })}
                  </AppText>
                </AppCard>
              </>
            )}

            <View style={styles.bottomArea}>
              <AppButton
                size="lg"
                fullWidth
                onPress={() => {
                  haptic.impactMedium().catch(() => {});
                  acknowledgePassPhoneReveal();
                }}
                style={styles.primaryCta}
              >
                {currentRound >= totalRounds
                  ? t('passPhone.viewResults', language)
                  : t('passPhone.nextRound', language)}
              </AppButton>
            </View>
          </Animated.View>
        )}
      </ScreenContainer>
    );
  }

  // ─── 5. Standard & Group Active Playing Loop ──────────────────────────────
  const isLastRound = currentRound >= totalRounds;
  const isLastPlayer = sessionType === 'group' && currentPlayerIndex >= players.length - 1;
  const progressPercent = Math.min(100, Math.max(10, (currentRound / totalRounds) * 100));
  const activePlayerColor = currentAnsweringPlayer?.color || vibeColor;

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      {/* Privacy Barrier Pass The Phone Overlay */}
      <PassThePhoneOverlay
        visible={passPhoneOverlayVisible}
        nextPlayerName={nextPlayerForOverlay?.name || 'Next Player'}
        nextPlayerColor={nextPlayerForOverlay?.color || vibeColor}
        onReady={() => {
          setPassPhoneOverlayVisible(false);
          setNextPlayerForOverlay(null);
        }}
      />

      {/* Top Navigation Bar */}
      <View style={[styles.navBar, rtl && styles.rowRTL]}>
        <IconButton
          variant="surface"
          size="sm"
          onPress={handleExit}
          accessibilityLabel="Exit game session"
        >
          <AppText style={styles.exitIcon}>✕</AppText>
        </IconButton>

        {activeVibe ? (
          <Badge
            label={`${activeVibe.emoji} ${activeVibe.label}`}
            color={theme.colors.surfaceElevated}
            textColor={vibeColor}
          />
        ) : null}

        <Badge
          label={`${currentRound} / ${totalRounds}`}
          color={theme.colors.accentMuted}
          textColor={theme.colors.accent}
        />
      </View>

      {/* Progress Track */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressPercent}%`, backgroundColor: vibeColor },
          ]}
        />
      </View>

      {/* Active Answering Player Banner (Group Session) */}
      {sessionType === 'group' && currentAnsweringPlayer && (
        <Animated.View entering={FadeIn.duration(250)} style={[styles.playerTurnBanner, rtl && styles.rowRTL]}>
          <View style={[styles.playerTurnDot, { backgroundColor: activePlayerColor }]} />
          <AppText variant="label" style={styles.playerTurnText}>
            {t('group.turnBanner', language, { name: currentAnsweringPlayer.name.toUpperCase() })}
          </AppText>
          <Badge
            label={`${currentPlayerIndex + 1}/${players.length}`}
            color={theme.colors.surfaceElevated}
            textColor={theme.colors.text.secondary}
          />
        </Animated.View>
      )}

      {/* Mode Identifier */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.modeRow}>
        <AppText variant="overline" color="secondary" style={styles.modeLabel}>
          {currentMode?.emoji} {currentMode?.label || 'PARTY QUESTION'}
        </AppText>
      </Animated.View>

      {/* Question Card & Interaction Area */}
      {currentQuestion ? (
        <Animated.View
          key={currentQuestion.id}
          entering={FadeInDown.duration(280)}
          style={styles.questionSection}
        >
          <AppCard variant="elevated" padding="xl" glow style={styles.questionCard}>
            <AppText variant="heading" style={[styles.questionText, rtl && styles.textRTL]}>
              {currentQuestion.text}
            </AppText>
          </AppCard>

          {/* Single Authoritative Interaction Area */}
          <View style={styles.interactionArea}>
            {interactionType === 'choice' && (
              <WouldYouRatherInteraction
                question={currentQuestion as WouldYouRatherQuestion}
                selectedOption={selectedOption}
                onSelectOption={(opt) => setSelectedOption(opt)}
              />
            )}

            {interactionType === 'player-select' && (
              <MostLikelyToInteraction
                players={players}
                selectedPlayerId={selectedPlayerId}
                onSelectPlayer={(id) => setSelectedPlayerId(id)}
              />
            )}

            {interactionType === 'stance' && (
              <HotTakeInteraction
                question={currentQuestion as HotTakeQuestion}
                selectedStance={selectedStance}
                onSelectStance={(stance) => setSelectedStance(stance)}
              />
            )}

            {interactionType === 'spotlight-quiz' && (
              <WhoKnowsMeBestInteraction
                question={currentQuestion as WhoKnowsMeBestQuestion}
                players={players}
                spotlightPlayerId={spotlightPlayerId}
                onSelectSpotlightPlayer={(id) => setSpotlightPlayerId(id)}
              />
            )}

            {interactionType === 'discussion' && (
              <OpenQuestionInteraction question={currentQuestion as OpenQuestion} />
            )}
          </View>
        </Animated.View>
      ) : null}

      {/* Bottom CTA Button */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.bottomArea}>
        <AppButton
          size="lg"
          fullWidth
          disabled={!canAdvance || isAdvancing}
          onPress={handleNext}
          style={canAdvance ? styles.primaryCta : undefined}
        >
          {sessionType === 'group'
            ? isLastRound && isLastPlayer
              ? t('group.finishSession', language)
              : isLastPlayer
              ? t('common.nextQuestion', language)
              : t('group.submitAndPass', language)
            : isLastRound
            ? t('common.finishGame', language)
            : t('common.nextQuestion', language)}
        </AppButton>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.xl,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  centerText: {
    textAlign: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  progressTrack: {
    height: 4,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 2,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  exitIcon: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weight.bold,
  },
  playerTurnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  playerTurnDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  playerTurnText: {
    fontSize: theme.typography.size.sm,
    letterSpacing: 1,
  },
  modeRow: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  modeLabel: {
    letterSpacing: 1.5,
  },
  questionSection: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  questionCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    textAlign: 'center',
    fontSize: theme.typography.size['2xl'],
    lineHeight: 32,
    color: theme.colors.text.primary,
  },
  textRTL: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  interactionArea: {
    width: '100%',
  },
  bottomArea: {
    marginTop: 'auto',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  primaryCta: {
    ...theme.shadow.glow,
  },
  secondaryCta: {
    marginTop: theme.spacing.xs,
  },
  completedHeader: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  completedTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size['4xl'],
  },
  subtitle: {
    marginTop: theme.spacing.xs,
  },
  summaryBox: {
    marginBottom: theme.spacing.xl,
  },
  synergyCard: {
    borderWidth: 1.5,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    textAlign: 'center',
  },
  synergyTag: {
    letterSpacing: 2,
    marginBottom: theme.spacing.xs,
  },
  synergyTitle: {
    fontSize: theme.typography.size['2xl'],
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  synergySubtitle: {
    textAlign: 'center',
    fontSize: theme.typography.size.sm,
  },
  vibeSummaryPill: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.radius.full,
  },
  vibeSummaryText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    letterSpacing: 1.5,
  },
  insightsList: {
    gap: theme.spacing.md,
  },
  playerInsightCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  insightAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weight.bold,
    fontSize: 18,
  },
  insightNameBox: {
    flex: 1,
  },
  playerName: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
  },
  roastText: {
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  patternBox: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 4,
  },
  patternLabel: {
    marginBottom: 2,
  },
  patternRow: {
    color: theme.colors.text.primary,
  },
  distributionCard: {
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  distQuestionText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.primary,
  },
  distStatsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  // Pass The Phone styles
  passPhoneContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  targetSectionLabel: {
    marginTop: theme.spacing.sm,
    letterSpacing: 1.5,
  },
  targetList: {
    gap: theme.spacing.sm,
  },
  targetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
  },
  targetAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  targetName: {
    flex: 1,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
  },
  targetArrow: {
    fontSize: 18,
    color: theme.colors.text.secondary,
  },
  passPhoneMiddlePhase: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 420,
  },
  passPhoneCard: {
    width: '100%',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    ...theme.shadow.glow,
  },
  hugeEmoji: {
    fontSize: 56,
    marginBottom: theme.spacing.md,
  },
  passPhoneTitle: {
    textAlign: 'center',
    color: theme.colors.text.primary,
    fontSize: theme.typography.size['3xl'],
    marginBottom: theme.spacing.sm,
  },
  passPhoneSubtext: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  actionButtons: {
    width: '100%',
    gap: theme.spacing.md,
  },
  shotButton: {
    backgroundColor: '#EF4444',
  },
  revealButton: {
    borderColor: theme.colors.accent,
  },
  selectorRevealCard: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceElevated,
    marginTop: theme.spacing.sm,
  },
  selectorRevealText: {
    fontSize: theme.typography.size.md,
    textAlign: 'center',
    color: theme.colors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: theme.radius.lg,
  },
  statHighlightName: {
    fontSize: theme.typography.size.lg,
    marginTop: 4,
    marginBottom: 2,
    color: theme.colors.text.primary,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
