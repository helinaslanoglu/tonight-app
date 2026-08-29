import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  HotTakeInteraction,
  MostLikelyToInteraction,
  OpenQuestionInteraction,
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
import { generateSessionRecap, validateAnswerForQuestion } from '@/engine';
import {
  useAnswerAndAdvance,
  useCurrentQuestion,
  useCurrentRound,
  useGameSession,
  useIsGameCompleted,
  usePlayers,
  useReplayGame,
  useResetSession,
  useSelectedVibe,
  useTotalRounds,
} from '@/store';
import { getVibeColor, theme } from '@/theme';
import type {
  HotTakeQuestion,
  OpenQuestion,
  WhoKnowsMeBestQuestion,
  WouldYouRatherQuestion,
} from '@/types';
import { haptic } from '@/utils';

export default function GameScreen() {
  const router = useRouter();
  const session = useGameSession();
  const selectedVibeId = useSelectedVibe();
  const players = usePlayers();
  const currentRound = useCurrentRound();
  const totalRounds = useTotalRounds();
  const currentQuestion = useCurrentQuestion();
  const isCompleted = useIsGameCompleted();

  const answerAndAdvance = useAnswerAndAdvance();
  const replayGame = useReplayGame();
  const resetSession = useResetSession();

  // Local selection state for current round
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | undefined>(undefined);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>(undefined);
  const [selectedStance, setSelectedStance] = useState<'agree' | 'disagree' | undefined>(undefined);
  const [spotlightPlayerId, setSpotlightPlayerId] = useState<string | undefined>(undefined);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const activeVibe = VIBES.find((v) => v.id === selectedVibeId);
  const vibeColor = selectedVibeId ? getVibeColor(selectedVibeId) : theme.colors.accent;
  const currentMode = GAME_MODES.find((m) => m.id === currentQuestion?.gameModeId);

  // Generate Recap Insights when session is completed
  const recap = useMemo(() => {
    if (!isCompleted) return null;
    return generateSessionRecap(session);
  }, [isCompleted, session]);

  // Trigger celebration haptic on game completion
  useEffect(() => {
    if (isCompleted) {
      haptic.success().catch(() => {});
    }
  }, [isCompleted]);

  // Validation
  const canAdvance = validateAnswerForQuestion(currentQuestion, {
    selectedOption,
    selectedPlayerId,
    selectedStance,
  });

  const handleNext = async () => {
    if (!canAdvance || isAdvancing) return;

    haptic.impactMedium().catch(() => {});
    setIsAdvancing(true);
    await answerAndAdvance({
      selectedOption,
      selectedPlayerId,
      selectedStance,
      targetPlayerId: spotlightPlayerId,
    });

    // Reset interaction state for next round
    setSelectedOption(undefined);
    setSelectedPlayerId(undefined);
    setSelectedStance(undefined);
    setSpotlightPlayerId(undefined);
    setIsAdvancing(false);
  };

  const handleReplay = async () => {
    haptic.impactMedium().catch(() => {});
    setSelectedOption(undefined);
    setSelectedPlayerId(undefined);
    setSelectedStance(undefined);
    setSpotlightPlayerId(undefined);
    setIsAdvancing(false);
    await replayGame();
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Game?',
      'Are you sure you want to end tonight’s session?',
      [
        { text: 'Keep Playing', style: 'cancel' },
        {
          text: 'Exit',
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
          No Active Session
        </AppText>
        <AppText variant="body" color="secondary" style={styles.centerSubtext}>
          Please select a vibe and add players to start playing.
        </AppText>
        <AppButton
          size="lg"
          fullWidth
          onPress={() => router.replace('/vibes')}
          style={styles.primaryCta}
        >
          START NEW GAME
        </AppButton>
      </ScreenContainer>
    );
  }

  // ─── Completed Screen State (Rich Recap & Persona Insights) ───────────────
  if (isCompleted && recap) {
    return (
      <ScreenContainer scrollable contentStyle={styles.container}>
        <View style={styles.navBar}>
          <Badge label="NIGHT RECAP" color={theme.colors.accentMuted} textColor={theme.colors.accent} />
          {activeVibe && (
            <Badge
              label={`${activeVibe.emoji} ${activeVibe.label}`}
              color={theme.colors.surfaceElevated}
              textColor={vibeColor}
            />
          )}
        </View>

        <Animated.View entering={FadeIn.duration(400)} style={styles.completedHeader}>
          <AppText variant="display" style={styles.completedTitle}>
            Tonight&apos;s Verdict.
          </AppText>
          <AppText variant="body" color="secondary" style={styles.subtitle}>
            Based on all {totalRounds} rounds of unfiltered answers.
          </AppText>
        </Animated.View>

        {/* 1. Group / Duo Synergy Card */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.summaryBox}>
          <AppCard variant="elevated" padding="lg" glow style={[styles.synergyCard, { borderColor: vibeColor }]}>
            <AppText variant="overline" style={[styles.synergyTag, { color: vibeColor }]}>
              CHEMISTRY & SYNERGY
            </AppText>
            <AppText variant="heading" style={styles.synergyTitle}>
              {recap.synergyTitle}
            </AppText>
            <AppText variant="body" color="secondary" style={styles.synergySubtitle}>
              {recap.synergySubtitle}
            </AppText>
            <View style={styles.vibeSummaryPill}>
              <AppText variant="caption" style={styles.vibeSummaryText}>
                💡 {recap.vibeSummary}
              </AppText>
            </View>
          </AppCard>

          {/* 2. Player Persona Insights */}
          <AppText variant="overline" color="secondary" style={styles.sectionHeader}>
            PLAYER ARCHETYPES & ROASTS
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
                  <View style={styles.insightHeaderRow}>
                    <View style={[styles.insightAvatar, { backgroundColor: pColor }]}>
                      <AppText style={styles.avatarInitial}>
                        {insight.playerName.charAt(0).toUpperCase()}
                      </AppText>
                    </View>
                    <View style={styles.insightNameBox}>
                      <AppText variant="label" style={styles.playerName}>
                        {insight.playerName}
                      </AppText>
                      <AppText variant="caption" style={{ color: pColor, fontWeight: '700' }}>
                        {insight.badge}
                      </AppText>
                    </View>
                  </View>

                  <AppText variant="bodySmall" color="secondary" style={styles.roastText}>
                    &quot;{insight.roastOrCompliment}&quot;
                  </AppText>
                </AppCard>
              );
            })}
          </View>
        </Animated.View>

        {/* Bottom Actions */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.bottomArea}>
          <AppButton size="lg" fullWidth onPress={handleReplay} style={styles.primaryCta}>
            PLAY AGAIN (NEW QUESTIONS)
          </AppButton>
          <AppButton
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => router.push('/game-mode')}
            style={styles.secondaryCta}
          >
            CHANGE MODE
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
            HOME
          </AppButton>
        </Animated.View>
      </ScreenContainer>
    );
  }

  // ─── Active Playing State ─────────────────────────────────────────────────
  const isLastRound = currentRound >= totalRounds;
  const progressPercent = Math.min(100, Math.max(10, (currentRound / totalRounds) * 100));

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
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
            <AppText variant="heading" style={styles.questionText}>
              {currentQuestion.text}
            </AppText>
          </AppCard>

          {/* Mode-Specific Interaction Area */}
          <View style={styles.interactionArea}>
            {currentQuestion.gameModeId === 'would-you-rather' && (
              <WouldYouRatherInteraction
                question={currentQuestion as WouldYouRatherQuestion}
                selectedOption={selectedOption}
                onSelectOption={(opt) => setSelectedOption(opt)}
              />
            )}

            {currentQuestion.gameModeId === 'most-likely-to' && (
              <MostLikelyToInteraction
                players={players}
                selectedPlayerId={selectedPlayerId}
                onSelectPlayer={(id) => setSelectedPlayerId(id)}
              />
            )}

            {currentQuestion.gameModeId === 'hot-take' && (
              <HotTakeInteraction
                question={currentQuestion as HotTakeQuestion}
                selectedStance={selectedStance}
                onSelectStance={(stance) => setSelectedStance(stance)}
              />
            )}

            {currentQuestion.gameModeId === 'who-knows-me-best' && (
              <WhoKnowsMeBestInteraction
                question={currentQuestion as WhoKnowsMeBestQuestion}
                players={players}
                spotlightPlayerId={spotlightPlayerId}
                onSelectSpotlightPlayer={(id) => setSpotlightPlayerId(id)}
              />
            )}

            {currentQuestion.gameModeId === 'open-question' && (
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
          {isLastRound ? 'FINISH GAME' : 'NEXT QUESTION'}
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
  centerSubtext: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
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
  interactionArea: {
    width: '100%',
  },
  bottomArea: {
    marginTop: 'auto',
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  primaryCta: {
    ...theme.shadow.glow,
  },
  secondaryCta: {
    marginTop: theme.spacing.xs,
  },
  completedHeader: {
    marginBottom: theme.spacing.lg,
  },
  completedTitle: {
    color: theme.colors.text.primary,
    fontSize: 38,
    lineHeight: 44,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
  },
  summaryBox: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  synergyCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    gap: theme.spacing.xs,
  },
  synergyTag: {
    letterSpacing: 1.2,
  },
  synergyTitle: {
    fontSize: theme.typography.size.xl,
    color: theme.colors.text.primary,
  },
  synergySubtitle: {
    fontSize: theme.typography.size.sm,
    lineHeight: 20,
  },
  vibeSummaryPill: {
    backgroundColor: theme.colors.surfaceHighlight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.xs,
  },
  vibeSummaryText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
  },
  sectionHeader: {
    marginTop: theme.spacing.xs,
    letterSpacing: 1.5,
  },
  insightsList: {
    gap: theme.spacing.sm,
  },
  playerInsightCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  insightAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: theme.typography.weight.bold,
  },
  insightNameBox: {
    flex: 1,
  },
  playerName: {
    color: theme.colors.text.primary,
  },
  roastText: {
    fontStyle: 'italic',
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
});
