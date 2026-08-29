import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { VIBES } from '@/data';
import {
  usePlayers,
  useSelectedVibe,
  useSessionType,
  useSetPlayers,
  useSetSessionType,
} from '@/store';
import { getVibeColor, theme } from '@/theme';
import type { Player, SessionType } from '@/types';
import { generatePlayerId, haptic } from '@/utils';

const PLAYER_COUNT_OPTIONS = [2, 3, 4, 5, 6] as const;
type PlayerCount = (typeof PLAYER_COUNT_OPTIONS)[number];

const AVATAR_COLORS = [
  '#EC4899', // Pink
  '#8B5CF6', // Violet
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
];

export default function GameSetupScreen() {
  const router = useRouter();
  const selectedVibeId = useSelectedVibe();
  const currentSessionType = useSessionType();
  const existingPlayers = usePlayers();
  const setPlayers = useSetPlayers();
  const setSessionType = useSetSessionType();

  const [sessionType, setLocalSessionType] = useState<SessionType>(
    currentSessionType || 'group'
  );

  const activeVibe = VIBES.find((v) => v.id === selectedVibeId);
  const vibeColor = selectedVibeId ? getVibeColor(selectedVibeId) : theme.colors.accent;

  // Determine initial count from existing players (defaults to 4)
  const initialCount = (
    existingPlayers.length >= 2 && existingPlayers.length <= 6
      ? existingPlayers.length
      : 4
  ) as PlayerCount;

  const [playerCount, setPlayerCount] = useState<PlayerCount>(initialCount);

  // Local state for names, initialized from existing Zustand players or friendly defaults
  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    if (existingPlayers.length >= 2) {
      return Array.from({ length: 6 }, (_, i) => existingPlayers[i]?.name || '');
    }
    return ['Alex', 'Sam', 'Taylor', 'Jordan', '', ''];
  });

  const [touched, setTouched] = useState<boolean[]>(() => Array(6).fill(false));

  const handleNameChange = (text: string, index: number) => {
    setPlayerNames((prev) => {
      const updated = [...prev];
      updated[index] = text;
      return updated;
    });
  };

  const handleBlur = (index: number) => {
    setTouched((prev) => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
  };

  // Active slice of names based on current player count
  const activeNames = playerNames.slice(0, playerCount);

  // Validation logic
  const validationErrors = useMemo(() => {
    return activeNames.map((name, index) => {
      const trimmed = name.trim();
      if (touched[index] && trimmed.length === 0) {
        return 'Name is required';
      }
      if (trimmed.length > 20) {
        return 'Max 20 characters';
      }
      // Check for duplicate names
      const duplicateCount = activeNames.filter(
        (n) => n.trim().toLowerCase() === trimmed.toLowerCase() && trimmed.length > 0
      ).length;
      if (duplicateCount > 1) {
        return 'Name must be unique';
      }
      return undefined;
    });
  }, [activeNames, touched]);

  // Overall form validity
  const isFormValid = useMemo(() => {
    const allFilled = activeNames.every(
      (name) => name.trim().length > 0 && name.trim().length <= 20
    );
    const uniqueNames =
      new Set(activeNames.map((n) => n.trim().toLowerCase())).size === activeNames.length;
    return allFilled && uniqueNames;
  }, [activeNames]);

  const handleContinue = () => {
    if (!isFormValid) return;

    // Create stable player objects with unique IDs
    const playersToSave: Player[] = activeNames.map((name, index) => {
      const existing = existingPlayers[index];
      return {
        id: existing?.id || generatePlayerId('player'),
        name: name.trim(),
        color: AVATAR_COLORS[index % AVATAR_COLORS.length],
      };
    });

    setPlayers(playersToSave);
    setSessionType(sessionType);
    router.push('/game-mode');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScreenContainer scrollable avoidKeyboard contentStyle={styles.container}>
        {/* Top Navigation & Vibe Badge */}
        <View style={styles.navBar}>
          <IconButton
            variant="surface"
            size="sm"
            onPress={() => router.back()}
            accessibilityLabel="Go back to vibe selection"
          >
            <AppText style={styles.backArrow}>←</AppText>
          </IconButton>

          {activeVibe ? (
            <Badge
              label={`${activeVibe.emoji} ${activeVibe.label}`}
              color={theme.colors.surfaceElevated}
              textColor={vibeColor}
            />
          ) : null}
        </View>

        {/* Screen Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <AppText variant="heading" style={styles.title}>
            Who&apos;s playing?
          </AppText>
          <AppText variant="body" color="secondary" style={styles.subtitle}>
            Add everyone joining tonight and pick your session style.
          </AppText>
        </Animated.View>

        {/* Session Type Switcher */}
        <Animated.View entering={FadeIn.duration(420)} style={styles.sessionTypeSection}>
          <AppText variant="overline" color="secondary" style={styles.sectionLabel}>
            SESSION TYPE
          </AppText>
          <View style={styles.sessionTypeGrid}>
            <Pressable
              onPress={() => {
                haptic.selection().catch(() => {});
                setLocalSessionType('group');
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: sessionType === 'group' }}
              accessibilityLabel="Group Session. Pass the phone so everyone answers secretly."
              style={({ pressed }) => [
                styles.sessionTypeCard,
                sessionType === 'group'
                  ? [styles.sessionTypeCardSelected, { borderColor: vibeColor }]
                  : styles.sessionTypeCardUnselected,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.sessionTypeHeader}>
                <AppText style={styles.sessionTypeIcon}>👥</AppText>
                <AppText
                  variant="label"
                  style={[
                    styles.sessionTypeTitle,
                    sessionType === 'group' && { color: vibeColor },
                  ]}
                >
                  Group Session
                </AppText>
              </View>
              <AppText variant="caption" color="secondary" style={styles.sessionTypeDesc}>
                Pass the phone. Everyone answers secretly &amp; privately.
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => {
                haptic.selection().catch(() => {});
                setLocalSessionType('standard');
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: sessionType === 'standard' }}
              accessibilityLabel="Standard Game. Quick party play where the group answers together."
              style={({ pressed }) => [
                styles.sessionTypeCard,
                sessionType === 'standard'
                  ? [styles.sessionTypeCardSelected, { borderColor: vibeColor }]
                  : styles.sessionTypeCardUnselected,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.sessionTypeHeader}>
                <AppText style={styles.sessionTypeIcon}>⚡</AppText>
                <AppText
                  variant="label"
                  style={[
                    styles.sessionTypeTitle,
                    sessionType === 'standard' && { color: vibeColor },
                  ]}
                >
                  Standard Game
                </AppText>
              </View>
              <AppText variant="caption" color="secondary" style={styles.sessionTypeDesc}>
                Quick party game. Group discusses and answers together.
              </AppText>
            </Pressable>
          </View>
        </Animated.View>

        {/* Player Count Selector */}
        <Animated.View entering={FadeIn.duration(450)} style={styles.countSection}>
          <AppText variant="overline" color="secondary" style={styles.sectionLabel}>
            NUMBER OF PLAYERS
          </AppText>
          <View style={styles.pillRow}>
            {PLAYER_COUNT_OPTIONS.map((count) => {
              const isSelected = playerCount === count;
              return (
                <Pressable
                  key={count}
                  onPress={() => {
                    haptic.selection().catch(() => {});
                    setPlayerCount(count);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${count} players`}
                  accessibilityHint="Selects number of players to join the game"
                  style={({ pressed }) => [
                    styles.countPill,
                    isSelected ? styles.countPillSelected : styles.countPillUnselected,
                    pressed && styles.countPillPressed,
                  ]}
                >
                  <AppText
                    variant="label"
                    style={[
                      styles.countPillText,
                      isSelected && styles.countPillTextSelected,
                    ]}
                  >
                    {count === 6 ? '6+' : count}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Dynamic Player Name Inputs */}
        <View style={styles.inputsList}>
          {Array.from({ length: playerCount }).map((_, index) => {
            const error = validationErrors[index];
            const playerColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

            return (
              <Animated.View
                key={index}
                entering={FadeIn.duration(350)}
                style={styles.inputItem}
              >
                <AppTextInput
                  label={`Player ${index + 1}`}
                  placeholder={`Enter name for Player ${index + 1}`}
                  value={playerNames[index] || ''}
                  onChangeText={(text) => handleNameChange(text, index)}
                  onBlur={() => handleBlur(index)}
                  error={error}
                  maxLength={20}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType={index === playerCount - 1 ? 'done' : 'next'}
                  leftIcon={
                    <View style={[styles.avatarDot, { backgroundColor: playerColor }]} />
                  }
                />
              </Animated.View>
            );
          })}
        </View>

        {/* Bottom CTA Button */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.bottomArea}>
          <AppButton
            size="lg"
            fullWidth
            disabled={!isFormValid}
            onPress={handleContinue}
            style={isFormValid ? styles.startButtonActive : undefined}
          >
            CHOOSE GAME MODE
          </AppButton>
        </Animated.View>
      </ScreenContainer>
    </TouchableWithoutFeedback>
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
  backArrow: {
    fontSize: 18,
    lineHeight: 20,
    color: theme.colors.text.primary,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size['3xl'],
  },
  subtitle: {
    marginTop: theme.spacing.xs,
  },
  sessionTypeSection: {
    marginBottom: theme.spacing.lg,
  },
  sessionTypeGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sessionTypeCard: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    justifyContent: 'flex-start',
  },
  sessionTypeCardUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  sessionTypeCardSelected: {
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.shadow.glow,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  sessionTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  sessionTypeIcon: {
    fontSize: 18,
  },
  sessionTypeTitle: {
    fontWeight: theme.typography.weight.bold,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  sessionTypeDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  countSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    marginBottom: theme.spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  countPill: {
    flex: 1,
    height: theme.touchTarget.md,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  countPillUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  countPillSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
    ...theme.shadow.glow,
  },
  countPillPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
  countPillText: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weight.bold,
  },
  countPillTextSelected: {
    color: theme.colors.accentForeground,
  },
  inputsList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  inputItem: {
    width: '100%',
  },
  avatarDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bottomArea: {
    marginTop: 'auto',
    paddingTop: theme.spacing.sm,
  },
  startButtonActive: {
    ...theme.shadow.glow,
  },
});
