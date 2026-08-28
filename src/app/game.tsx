import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { GAME_MODES, VIBES } from '@/data';
import { validateAnswerForQuestion } from '@/engine';
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
import type { WouldYouRatherQuestion } from '@/types';

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
  const [isAdvancing, setIsAdvancing] = useState(false);

  const activeVibe = VIBES.find((v) => v.id === selectedVibeId);
  const vibeColor = selectedVibeId ? getVibeColor(selectedVibeId) : theme.colors.accent;

  const currentMode = GAME_MODES.find((m) => m.id === currentQuestion?.gameModeId);

  // Validation
  const canAdvance = validateAnswerForQuestion(currentQuestion, {
    selectedOption,
    selectedPlayerId,
  });

  const handleNext = async () => {
    if (!canAdvance || isAdvancing) return;

    setIsAdvancing(true);
    await answerAndAdvance({
      selectedOption,
      selectedPlayerId,
    });
    setSelectedOption(undefined);
    setSelectedPlayerId(undefined);
    setIsAdvancing(false);
  };

  const handleReplay = async () => {
    setSelectedOption(undefined);
    setSelectedPlayerId(undefined);
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

  // ─── Completed Screen State ───────────────────────────────────────────────
  if (isCompleted) {
    return (
      <ScreenContainer scrollable contentStyle={styles.container}>
        <View style={styles.navBar}>
          <Badge label="FINISHED" color={theme.colors.accentMuted} textColor={theme.colors.accent} />
        </View>

        <Animated.View entering={FadeIn.duration(400)} style={styles.completedHeader}>
          <AppText variant="display" style={styles.completedTitle}>
            Tonight&apos;s over.
          </AppText>
          <AppText variant="body" color="secondary" style={styles.subtitle}>
            You crushed all {totalRounds} rounds of chaos.
          </AppText>
        </Animated.View>

        {/* Summary Card */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.summaryBox}>
          {activeVibe && (
            <AppCard variant="elevated" padding="md" style={[styles.summaryCard, { borderColor: vibeColor }]}>
              <View style={styles.summaryRow}>
                <AppText style={styles.summaryEmoji}>{activeVibe.emoji}</AppText>
                <View style={styles.summaryInfo}>
                  <AppText variant="overline" color="secondary">
                    VIBE PLAYED
                  </AppText>
                  <AppText variant="label" style={{ color: vibeColor }}>
                    {activeVibe.label}
                  </AppText>
                </View>
                <Badge label={`${totalRounds} ROUNDS`} size="sm" />
              </View>
            </AppCard>
          )}

          <AppCard variant="elevated" padding="lg" style={styles.playersSummaryCard}>
            <AppText variant="overline" color="secondary" style={styles.playersSummaryTitle}>
              PLAYERS ({players.length})
            </AppText>
            <View style={styles.playersWrap}>
              {players.map((p) => (
                <View key={p.id} style={styles.playerChip}>
                  <View style={[styles.playerChipDot, { backgroundColor: p.color || theme.colors.accent }]} />
                  <AppText variant="label" style={styles.playerChipName}>
                    {p.name}
                  </AppText>
                </View>
              ))}
            </View>
          </AppCard>
        </Animated.View>

        {/* Bottom Actions */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.bottomArea}>
          <AppButton size="lg" fullWidth onPress={handleReplay} style={styles.primaryCta}>
            PLAY AGAIN
          </AppButton>
          <AppButton
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => router.push('/vibes')}
            style={styles.secondaryCta}
          >
            CHANGE VIBE
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

      {/* Mode Identifier */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.modeRow}>
        <AppText variant="overline" color="secondary" style={styles.modeLabel}>
          {currentMode?.emoji} {currentMode?.label || 'PARTY QUESTION'}
        </AppText>
      </Animated.View>

      {/* Question Card */}
      {currentQuestion ? (
        <Animated.View key={currentQuestion.id} entering={FadeIn.duration(400)} style={styles.questionSection}>
          <AppCard variant="elevated" padding="xl" glow style={styles.questionCard}>
            <AppText variant="heading" style={styles.questionText}>
              {currentQuestion.text}
            </AppText>
          </AppCard>

          {/* Mode-Specific Interaction Area */}
          <View style={styles.interactionArea}>
            {/* 1. WOULD YOU RATHER */}
            {currentQuestion.gameModeId === 'would-you-rather' && (
              <View style={styles.wyrContainer}>
                <Pressable
                  onPress={() => setSelectedOption('A')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedOption === 'A' }}
                  accessibilityLabel={`Option A: ${(currentQuestion as WouldYouRatherQuestion).optionA}`}
                  style={[
                    styles.wyrOption,
                    selectedOption === 'A' ? styles.wyrOptionSelected : styles.wyrOptionUnselected,
                  ]}
                >
                  <AppText variant="overline" color="secondary" style={styles.optionTag}>
                    OPTION A
                  </AppText>
                  <AppText
                    variant="label"
                    style={[
                      styles.wyrOptionText,
                      selectedOption === 'A' && styles.wyrOptionTextSelected,
                    ]}
                  >
                    {(currentQuestion as WouldYouRatherQuestion).optionA}
                  </AppText>
                </Pressable>

                <View style={styles.vsBadge}>
                  <AppText variant="overline" style={styles.vsText}>
                    VS
                  </AppText>
                </View>

                <Pressable
                  onPress={() => setSelectedOption('B')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedOption === 'B' }}
                  accessibilityLabel={`Option B: ${(currentQuestion as WouldYouRatherQuestion).optionB}`}
                  style={[
                    styles.wyrOption,
                    selectedOption === 'B' ? styles.wyrOptionSelected : styles.wyrOptionUnselected,
                  ]}
                >
                  <AppText variant="overline" color="secondary" style={styles.optionTag}>
                    OPTION B
                  </AppText>
                  <AppText
                    variant="label"
                    style={[
                      styles.wyrOptionText,
                      selectedOption === 'B' && styles.wyrOptionTextSelected,
                    ]}
                  >
                    {(currentQuestion as WouldYouRatherQuestion).optionB}
                  </AppText>
                </Pressable>
              </View>
            )}

            {/* 2. MOST LIKELY TO */}
            {currentQuestion.gameModeId === 'most-likely-to' && (
              <View style={styles.mltContainer}>
                <AppText variant="caption" color="secondary" style={styles.interactionPrompt}>
                  Tap who in the room fits best:
                </AppText>
                <View style={styles.mltGrid}>
                  {players.map((player) => {
                    const isSelected = selectedPlayerId === player.id;
                    const pColor = player.color || theme.colors.accent;

                    return (
                      <Pressable
                        key={player.id}
                        onPress={() => setSelectedPlayerId(player.id)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`Vote for ${player.name}`}
                        style={[
                          styles.playerVoteCard,
                          isSelected
                            ? [styles.playerVoteCardSelected, { borderColor: pColor }]
                            : styles.playerVoteCardUnselected,
                        ]}
                      >
                        <View style={[styles.playerVoteAvatar, { backgroundColor: pColor }]}>
                          <AppText style={styles.playerVoteInitial}>
                            {player.name.charAt(0).toUpperCase()}
                          </AppText>
                        </View>
                        <AppText
                          variant="label"
                          numberOfLines={1}
                          style={[
                            styles.playerVoteName,
                            isSelected && { color: theme.colors.text.primary, fontWeight: '700' },
                          ]}
                        >
                          {player.name}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 3. OPEN QUESTION */}
            {currentQuestion.gameModeId === 'open-question' && (
              <View style={styles.openContainer}>
                <AppCard variant="default" padding="lg" style={styles.openPromptCard}>
                  <AppText variant="overline" color="accent" style={styles.openPromptTag}>
                    GROUP DISCUSSION
                  </AppText>
                  <AppText variant="body" color="secondary" style={styles.openPromptText}>
                    {currentQuestion.prompt || 'Everyone share your thoughts and debate the answers.'}
                  </AppText>
                </AppCard>
              </View>
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
    marginBottom: theme.spacing.md,
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
  interactionPrompt: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },

  // ─── WYR Styles ─────────────────────────────────────────────────────────────
  wyrContainer: {
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  wyrOption: {
    width: '100%',
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
  },
  wyrOptionUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  wyrOptionSelected: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.accent,
    ...theme.shadow.glow,
  },
  optionTag: {
    marginBottom: 4,
  },
  wyrOptionText: {
    color: theme.colors.text.secondary,
  },
  wyrOptionTextSelected: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weight.bold,
  },
  vsBadge: {
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  vsText: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },

  // ─── MLT Styles ─────────────────────────────────────────────────────────────
  mltContainer: {
    width: '100%',
  },
  mltGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  playerVoteCard: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
  },
  playerVoteCardUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  playerVoteCardSelected: {
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.shadow.glow,
  },
  playerVoteAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerVoteInitial: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: theme.typography.weight.bold,
  },
  playerVoteName: {
    color: theme.colors.text.secondary,
    flex: 1,
  },

  // ─── Open Prompt Styles ─────────────────────────────────────────────────────
  openContainer: {
    width: '100%',
  },
  openPromptCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  openPromptTag: {
    letterSpacing: 1.2,
  },
  openPromptText: {
    textAlign: 'center',
  },

  // ─── Bottom & Completion Styles ────────────────────────────────────────────
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
    fontSize: 44,
    lineHeight: 48,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
  },
  summaryBox: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  summaryCard: {
    borderWidth: 1.5,
    borderRadius: theme.radius.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  summaryEmoji: {
    fontSize: 32,
    lineHeight: 36,
  },
  summaryInfo: {
    flex: 1,
    gap: 2,
  },
  playersSummaryCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  playersSummaryTitle: {
    marginBottom: theme.spacing.sm,
  },
  playersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  playerChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  playerChipName: {
    color: theme.colors.text.primary,
  },
});
