import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { LanguageButton } from '@/components/ui/LanguageButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { GAME_MODES, VIBES } from '@/data';
import { isRTL, t } from '@/services/i18n';
import {
  useLanguage,
  usePlayers,
  useSelectedGameMode,
  useSelectedVibe,
  useSetGameMode,
  useStartGame,
} from '@/store';
import { getVibeColor, theme } from '@/theme';
import type { GameModeId } from '@/types';
import { haptic } from '@/utils';

export default function GameModeScreen() {
  const router = useRouter();
  const selectedVibeId = useSelectedVibe();
  const players = usePlayers();
  const currentModeId = useSelectedGameMode();
  const activeLanguage = useLanguage();
  const setGameMode = useSetGameMode();
  const startGame = useStartGame();
  const rtl = isRTL(activeLanguage);

  const [selectedMode, setSelectedMode] = useState<GameModeId | 'all'>(currentModeId || 'all');
  const [isStarting, setIsStarting] = useState(false);

  const activeVibe = VIBES.find((v) => v.id === selectedVibeId);
  const vibeColor = selectedVibeId ? getVibeColor(selectedVibeId) : theme.colors.accent;

  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    setGameMode(selectedMode);
    await startGame();
    router.push('/game');
  };

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      {/* Navigation Top Bar with Back & Language Selector Buttons */}
      <View style={[styles.navBar, rtl && styles.navBarRTL]}>
        <IconButton
          variant="surface"
          size="sm"
          onPress={() => router.back()}
          accessibilityLabel="Go back to player setup"
        >
          <AppText style={styles.backArrow}>{rtl ? '→' : '←'}</AppText>
        </IconButton>

        <View style={[styles.navRightGroup, rtl && styles.rowRTL]}>
          {activeVibe && (
            <Badge
              label={`${activeVibe.emoji} ${activeVibe.label}`}
              color={theme.colors.surfaceElevated}
              textColor={vibeColor}
            />
          )}
          <LanguageButton />
        </View>
      </View>

      {/* Hero Header */}
      <Animated.View entering={FadeIn.duration(350)} style={styles.header}>
        <AppText variant="heading" style={[styles.title, rtl && styles.textRTL]}>
          {t('gameMode.headerTitle', activeLanguage)}
        </AppText>
        <AppText variant="body" color="secondary" style={[styles.subtitle, rtl && styles.textRTL]}>
          {t('gameMode.headerSubtitle', activeLanguage, { count: players.length })}
        </AppText>
      </Animated.View>

      {/* Mode Choices Grid / List */}
      <Animated.View entering={FadeIn.duration(450)} style={styles.modeList}>
        {/* 1. MIX ALL MODES (Surprise Me) */}
        <Pressable
          onPress={() => {
            haptic.selection().catch(() => {});
            setSelectedMode('all');
          }}
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedMode === 'all' }}
          accessibilityLabel="Mix all modes. Automatic shuffle of all compatible game modes."
          style={({ pressed }) => [
            styles.modeCard,
            selectedMode === 'all' ? [styles.modeCardSelected, { borderColor: vibeColor }] : styles.modeCardUnselected,
            pressed && styles.modeCardPressed,
          ]}
        >
          <View style={[styles.cardHeaderRow, rtl && styles.rowRTL]}>
            <View style={styles.emojiCircle}>
              <AppText style={styles.modeEmoji}>🎲</AppText>
            </View>
            <View style={styles.modeTextContainer}>
              <View style={[styles.titleWithBadge, rtl && styles.rowRTL]}>
                <AppText variant="label" style={[styles.modeTitle, rtl && styles.textRTL]}>
                  {t('gameMode.allModes.label', activeLanguage)}
                </AppText>
                <Badge label="RECOMMENDED" size="sm" color={theme.colors.accentMuted} textColor={theme.colors.accent} />
              </View>
              <AppText variant="caption" color="secondary" numberOfLines={2} style={rtl && styles.textRTL}>
                {t('gameMode.allModes.desc', activeLanguage)}
              </AppText>
            </View>
          </View>
        </Pressable>

        {/* 2. SPECIFIC GAME MODES */}
        {GAME_MODES.map((mode) => {
          const isCompatible = selectedVibeId ? mode.supportedVibes.includes(selectedVibeId) : true;
          const hasEnoughPlayers = players.length >= mode.minPlayers;
          const isEnabled = isCompatible && hasEnoughPlayers;
          const isSelected = selectedMode === mode.id;

          let disabledReason = '';
          if (!hasEnoughPlayers) {
            disabledReason = `Min ${mode.minPlayers} players`;
          } else if (!isCompatible) {
            disabledReason = 'Not for this vibe';
          }

          return (
            <Pressable
              key={mode.id}
              disabled={!isEnabled}
              onPress={() => {
                if (!isEnabled) return;
                haptic.selection().catch(() => {});
                setSelectedMode(mode.id);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled: !isEnabled }}
              accessibilityLabel={`${mode.label}. ${mode.tagline}`}
              style={({ pressed }) => [
                styles.modeCard,
                isSelected
                  ? [styles.modeCardSelected, { borderColor: vibeColor }]
                  : styles.modeCardUnselected,
                !isEnabled && styles.modeCardDisabled,
                pressed && isEnabled && styles.modeCardPressed,
              ]}
            >
              <View style={[styles.cardHeaderRow, rtl && styles.rowRTL]}>
                <View style={styles.emojiCircle}>
                  <AppText style={styles.modeEmoji}>{mode.emoji}</AppText>
                </View>
                <View style={styles.modeTextContainer}>
                  <View style={[styles.titleWithBadge, rtl && styles.rowRTL]}>
                    <AppText
                      variant="label"
                      style={[styles.modeTitle, !isEnabled && styles.disabledText, rtl && styles.textRTL]}
                    >
                      {mode.label}
                    </AppText>
                    {disabledReason ? (
                      <Badge label={disabledReason} size="sm" color={theme.colors.surface} textColor={theme.colors.text.tertiary} />
                    ) : null}
                  </View>
                  <AppText
                    variant="caption"
                    color={isEnabled ? 'secondary' : 'tertiary'}
                    numberOfLines={2}
                    style={rtl && styles.textRTL}
                  >
                    {mode.tagline}
                  </AppText>
                </View>
              </View>
            </Pressable>
          );
        })}
      </Animated.View>

      {/* Bottom CTA */}
      <Animated.View entering={FadeIn.duration(500)} style={styles.bottomArea}>
        <AppButton
          size="lg"
          fullWidth
          loading={isStarting}
          onPress={handleStart}
          style={styles.primaryCta}
        >
          {t('gameMode.startCta', activeLanguage)}
        </AppButton>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.xl,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  navBarRTL: {
    flexDirection: 'row-reverse',
  },
  navRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  textRTL: {
    textAlign: 'right',
  },
  backArrow: {
    fontSize: 18,
    lineHeight: 20,
    color: theme.colors.text.primary,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.size['3xl'],
    color: theme.colors.text.primary,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
  },
  modeList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  modeCard: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
  },
  modeCardUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  modeCardSelected: {
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.shadow.glow,
  },
  modeCardDisabled: {
    opacity: 0.45,
  },
  modeCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeEmoji: {
    fontSize: 22,
  },
  modeTextContainer: {
    flex: 1,
    gap: 2,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  modeTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.md,
  },
  disabledText: {
    color: theme.colors.text.tertiary,
  },
  bottomArea: {
    marginTop: 'auto',
  },
  primaryCta: {
    ...theme.shadow.glow,
  },
});
