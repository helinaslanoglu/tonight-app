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
  generateSessionRecap,
  resolveInteractionType,
} from '@/engine';
import {
  useAnswerAndAdvance,
  useCurrentAnsweringPlayer,
  useCurrentPlayerIndex,
  useCurrentQuestion,
  useCurrentRound,
  useGameSession,
  useIsGameCompleted,
  usePlayers,
  useReplayGame,
  useResetSession,
  useSelectedVibe,
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
  const sessionType = useSessionType();
  const selectedVibeId = useSelectedVibe();
  const players = usePlayers();
  const currentRound = useCurrentRound();
  const totalRounds = useTotalRounds();
  const currentQuestion = useCurrentQuestion();
  const isCompleted = useIsGameCompleted();

  const currentPlayerIndex = useCurrentPlayerIndex();
  const currentAnsweringPlayer = useCurrentAnsweringPlayer();

  const answerAndAdvance = useAnswerAndAdvance();
  const submitPlayerResponse = useSubmitPlayerResponse();
  const replayGame = useReplayGame();
  const resetSession = useResetSession();

  // Local selection state for current turn
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | undefined>(undefined);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>(undefined);
  const [selectedStance, setSelectedStance] = useState<'agree' | 'disagree' | undefined>(undefined);
  const [spotlightPlayerId, setSpotlightPlayerId] = useState<string | undefined>(undefined);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Pass-the-phone privacy overlay state
  const [passPhoneOverlayVisible, setPassPhoneOverlayVisible] = useState(false);
  const [nextPlayerForOverlay, setNextPlayerForOverlay] = useState<Player | null>(null);

  const activeVibe = VIBES.find((v) => v.id === selectedVibeId);
  const vibeColor = selectedVibeId ? getVibeColor(selectedVibeId) : theme.colors.accent;
  const currentMode = GAME_MODES.find((m) => m.id === currentQuestion?.gameModeId);

  // Generate standard recap insights when standard session is completed
  const recap = useMemo(() => {
    if (!isCompleted || sessionType === 'group') return null;
    return generateSessionRecap(session);
  }, [isCompleted, sessionType, session]);

  // Generate Group Results facts when group session is completed
  const groupResult = useMemo(() => {
    if (!isCompleted || sessionType !== 'group') return null;
    return aggregateGroupResult(session);
  }, [isCompleted, sessionType, session]);

  // Trigger celebration haptic on game completion
  useEffect(() => {
    if (isCompleted) {
      haptic.success().catch(() => {});
    }
  }, [isCompleted]);

  // Validation based on interaction type
  const interactionType = resolveInteractionType(currentQuestion);
  const canAdvance = useMemo(() => {
    if (!currentQuestion) return false;
    switch (interactionType) {
      case 'choice':
        return selectedOption === 'A' || selectedOption === 'B';
      case 'player-select':
        return typeof selectedPlayerId === 'string' && selectedPlayerId.length > 0;
      case 'stance':
        return selectedStance === 'agree' || selectedStance === 'disagree';
      case 'spotlight-quiz':
      case 'discussion':
      default:
        return true;
    }
  }, [currentQuestion, interactionType, selectedOption, selectedPlayerId, selectedStance]);

  // ─── Turn Submission Handler (Standard vs Group) ───────────────────────────
  const handleNext = async () => {
    if (!canAdvance || isAdvancing) return;

    haptic.impactMedium().catch(() => {});
    setIsAdvancing(true);

    if (sessionType === 'group') {
      // 1. Group Session: Submit individual response
      let responsePayload: Parameters<typeof submitPlayerResponse>[0];

      if (interactionType === 'choice') {
        responsePayload = { responseType: 'choice', selectedOption: selectedOption! };
      } else if (interactionType === 'player-select') {
        responsePayload = { responseType: 'player-select', selectedPlayerId: selectedPlayerId! };
      } else if (interactionType === 'stance') {
        responsePayload = { responseType: 'stance', selectedStance: selectedStance! };
      } else if (interactionType === 'spotlight-quiz') {
        responsePayload = { responseType: 'spotlight-quiz', targetPlayerId: spotlightPlayerId };
      } else {
        responsePayload = { responseType: 'discussion', confirmed: true };
      }

      const totalP = players.length;
      const nextIdx = (currentPlayerIndex + 1) % totalP;
      const nextP = players[nextIdx];

      // Immediately hide previous answer state to protect privacy
      setSelectedOption(undefined);
      setSelectedPlayerId(undefined);
      setSelectedStance(undefined);
      setSpotlightPlayerId(undefined);

      const { isQuestionComplete } = await submitPlayerResponse(responsePayload);

      if (!isQuestionComplete || currentRound < totalRounds) {
        // Show privacy barrier before next player takes device
        setNextPlayerForOverlay(nextP);
        setPassPhoneOverlayVisible(true);
      }

      setIsAdvancing(false);
    } else {
      // 2. Standard Game: Submit group summary answer
      await answerAndAdvance({
        selectedOption,
        selectedPlayerId,
        selectedStance,
        targetPlayerId: spotlightPlayerId,
      });

      setSelectedOption(undefined);
      setSelectedPlayerId(undefined);
      setSelectedStance(undefined);
      setSpotlightPlayerId(undefined);
      setIsAdvancing(false);
    }
  };

  const handleReplay = async () => {
    haptic.impactMedium().catch(() => {});
    setSelectedOption(undefined);
    setSelectedPlayerId(undefined);
    setSelectedStance(undefined);
    setSpotlightPlayerId(undefined);
    setPassPhoneOverlayVisible(false);
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

  // ─── Group Session Completed Screen (Observable Facts & Group Perception) ─
  if (isCompleted && sessionType === 'group' && groupResult) {
    return (
      <ScreenContainer scrollable contentStyle={styles.container}>
        <View style={styles.navBar}>
          <Badge label="GROUP PERCEPTION" color={theme.colors.accentMuted} textColor={theme.colors.accent} />
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
            Group Results.
          </AppText>
          <AppText variant="body" color="secondary" style={styles.subtitle}>
            Collected {groupResult.totalCollectedResponses} private answers across {players.length} players.
          </AppText>
        </Animated.View>

        {/* 1. Most Selected Players Card */}
        {groupResult.topSelectedPlayers.length > 0 && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.summaryBox}>
            <AppCard variant="elevated" padding="lg" glow style={[styles.synergyCard, { borderColor: vibeColor }]}>
              <AppText variant="overline" style={[styles.synergyTag, { color: vibeColor }]}>
                MOST SELECTED BY GROUP
              </AppText>
              <AppText variant="heading" style={styles.synergyTitle}>
                👑 {groupResult.topSelectedPlayers[0].name}
              </AppText>
              <AppText variant="body" color="secondary" style={styles.synergySubtitle}>
                Received {groupResult.topSelectedPlayers[0].count} votes from the group.
              </AppText>
            </AppCard>
          </Animated.View>
        )}

        {/* 2. Individual Selection Patterns & Matrix */}
        <Animated.View entering={FadeIn.duration(550)} style={styles.summaryBox}>
          <AppText variant="overline" color="secondary" style={styles.sectionHeader}>
            WHO SELECTED WHOM
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
                  <View style={styles.insightHeaderRow}>
                    <View style={[styles.insightAvatar, { backgroundColor: p.color || theme.colors.accent }]}>
                      <AppText style={styles.avatarInitial}>
                        {p.name.charAt(0).toUpperCase()}
                      </AppText>
                    </View>
                    <View style={styles.insightNameBox}>
                      <AppText variant="label" style={styles.playerName}>
                        {p.name}
                      </AppText>
                      <AppText variant="caption" color="secondary">
                        Received {stats?.timesSelected || 0} votes ({stats?.selectionPercentage || 0}%)
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.patternBox}>
                    <AppText variant="caption" color="secondary" style={styles.patternLabel}>
                      Voted for:
                    </AppText>
                    {targets.length > 0 ? (
                      targets.map(([targetId, count]) => {
                        const targetPlayer = players.find((pl) => pl.id === targetId);
                        return (
                          <AppText key={targetId} variant="bodySmall" style={styles.patternRow}>
                            👉 <AppText style={{ fontWeight: '700' }}>{targetPlayer?.name || 'Unknown'}</AppText> ({count}x)
                          </AppText>
                        );
                      })
                    ) : (
                      <AppText variant="caption" color="secondary">
                        No direct player selections recorded.
                      </AppText>
                    )}
                  </View>
                </AppCard>
              );
            })}
          </View>
        </Animated.View>

        {/* 3. Choice & Stance Distributions */}
        {groupResult.choiceBreakdowns.length > 0 && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.summaryBox}>
            <AppText variant="overline" color="secondary" style={styles.sectionHeader}>
              WOULD YOU RATHER SPLITS
            </AppText>
            {groupResult.choiceBreakdowns.map((cb, idx) => (
              <AppCard key={idx} variant="default" padding="sm" style={styles.distributionCard}>
                <AppText variant="label" style={styles.distQuestionText}>
                  {cb.questionText || `Question ${idx + 1}`}
                </AppText>
                <View style={styles.distStatsRow}>
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

  // ─── Standard Game Completed Screen State (Persona Insights) ─────────────
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

      {/* Active Answering Player Banner (Group Session) */}
      {sessionType === 'group' && currentAnsweringPlayer && (
        <Animated.View entering={FadeIn.duration(250)} style={styles.playerTurnBanner}>
          <View style={[styles.playerTurnDot, { backgroundColor: activePlayerColor }]} />
          <AppText variant="label" style={styles.playerTurnText}>
            <AppText style={{ color: activePlayerColor, fontWeight: '800' }}>
              {currentAnsweringPlayer.name.toUpperCase()}
            </AppText>
            &apos;S TURN
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
            <AppText variant="heading" style={styles.questionText}>
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
              ? 'FINISH GROUP SESSION'
              : isLastPlayer
              ? 'NEXT QUESTION'
              : 'SUBMIT & PASS PHONE'
            : isLastRound
            ? 'FINISH GAME'
            : 'NEXT QUESTION'}
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
  patternBox: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    gap: 4,
  },
  patternLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  patternRow: {
    fontSize: 13,
    color: theme.colors.text.primary,
  },
  distributionCard: {
    borderRadius: theme.radius.md,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  distQuestionText: {
    fontSize: 13,
  },
  distStatsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
});
