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
import { isRTL, LANGUAGES, t } from '@/services/i18n';
import {
  useLanguage,
  usePlayers,
  useSelectedVibe,
  useSessionType,
  useSetLanguage,
  useSetPlayers,
  useSetSessionType,
} from '@/store';
import { getVibeColor, theme } from '@/theme';
import type { LanguageId, Player, SessionType } from '@/types';
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
  const activeLanguage = useLanguage();
  const existingPlayers = usePlayers();
  const setPlayers = useSetPlayers();
  const setSessionType = useSetSessionType();
  const setLanguage = useSetLanguage();

  const [sessionType, setLocalSessionType] = useState<SessionType>(
    currentSessionType || 'group'
  );

  const activeVibe = VIBES.find((v) => v.id === selectedVibeId);
  const vibeColor = selectedVibeId ? getVibeColor(selectedVibeId) : theme.colors.accent;
  const rtl = isRTL(activeLanguage);

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
        return t('setup.nameRequired', activeLanguage);
      }
      if (trimmed.length > 20) {
        return t('setup.maxCharacters', activeLanguage);
      }
      // Check for duplicate names
      const duplicateCount = activeNames.filter(
        (n) => n.trim().toLowerCase() === trimmed.toLowerCase() && trimmed.length > 0
      ).length;
      if (duplicateCount > 1) {
        return t('setup.uniqueNameRequired', activeLanguage);
      }
      return undefined;
    });
  }, [activeNames, touched, activeLanguage]);

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
        <View style={[styles.navBar, rtl && styles.navBarRTL]}>
          <IconButton
            variant="surface"
            size="sm"
            onPress={() => router.back()}
            accessibilityLabel="Go back to vibe selection"
          >
            <AppText style={styles.backArrow}>{rtl ? '→' : '←'}</AppText>
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
          <AppText
            variant="heading"
            style={[styles.title, rtl && styles.textRTL]}
          >
            {t('setup.headerTitle', activeLanguage)}
          </AppText>
          <AppText
            variant="body"
            color="secondary"
            style={[styles.subtitle, rtl && styles.textRTL]}
          >
            {t('setup.headerSubtitle', activeLanguage)}
          </AppText>
        </Animated.View>

        {/* Language Selector Section */}
        <Animated.View entering={FadeIn.duration(410)} style={styles.section}>
          <AppText
            variant="overline"
            color="secondary"
            style={[styles.sectionLabel, rtl && styles.textRTL]}
          >
            {t('setup.languageLabel', activeLanguage)}
          </AppText>
          <View style={[styles.languageGrid, rtl && styles.rowRTL]}>
            {LANGUAGES.map((lang) => {
              const isSelected = activeLanguage === lang.id;
              return (
                <Pressable
                  key={lang.id}
                  onPress={() => {
                    haptic.selection().catch(() => {});
                    setLanguage(lang.id as LanguageId);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${lang.label} (${lang.nativeLabel})`}
                  style={({ pressed }) => [
                    styles.languagePill,
                    isSelected
                      ? [styles.languagePillSelected, { borderColor: vibeColor }]
                      : styles.languagePillUnselected,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <AppText style={styles.flagEmoji}>{lang.flag}</AppText>
                  <AppText
                    variant="label"
                    style={[
                      styles.languagePillText,
                      isSelected && { color: vibeColor, fontWeight: '700' },
                    ]}
                  >
                    {lang.nativeLabel}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Session Type Switcher */}
        <Animated.View entering={FadeIn.duration(420)} style={styles.sessionTypeSection}>
          <AppText
            variant="overline"
            color="secondary"
            style={[styles.sectionLabel, rtl && styles.textRTL]}
          >
            {t('setup.sessionTypeLabel', activeLanguage)}
          </AppText>
          <View style={styles.sessionTypeColumn}>
            {/* 1. Group Session */}
            <Pressable
              onPress={() => {
                haptic.selection().catch(() => {});
                setLocalSessionType('group');
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: sessionType === 'group' }}
              accessibilityLabel="Group Session"
              style={({ pressed }) => [
                styles.sessionTypeCard,
                sessionType === 'group'
                  ? [styles.sessionTypeCardSelected, { borderColor: vibeColor }]
                  : styles.sessionTypeCardUnselected,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.sessionTypeHeader, rtl && styles.rowRTL]}>
                <AppText style={styles.sessionTypeIcon}>👥</AppText>
                <AppText
                  variant="label"
                  style={[
                    styles.sessionTypeTitle,
                    sessionType === 'group' && { color: vibeColor },
                    rtl && styles.textRTL,
                  ]}
                >
                  {t('sessionType.group.title', activeLanguage)}
                </AppText>
                {sessionType === 'group' && (
                  <Badge
                    label={t('sessionType.group.badge', activeLanguage)}
                    color={theme.colors.surfaceElevated}
                    textColor={vibeColor}
                  />
                )}
              </View>
              <AppText
                variant="caption"
                color="secondary"
                style={[styles.sessionTypeDesc, rtl && styles.textRTL]}
              >
                {t('sessionType.group.desc', activeLanguage)}
              </AppText>
            </Pressable>

            {/* 2. Pass The Phone */}
            <Pressable
              onPress={() => {
                haptic.selection().catch(() => {});
                setLocalSessionType('pass-the-phone');
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: sessionType === 'pass-the-phone' }}
              accessibilityLabel="Pass The Phone"
              style={({ pressed }) => [
                styles.sessionTypeCard,
                sessionType === 'pass-the-phone'
                  ? [styles.sessionTypeCardSelected, { borderColor: vibeColor }]
                  : styles.sessionTypeCardUnselected,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.sessionTypeHeader, rtl && styles.rowRTL]}>
                <AppText style={styles.sessionTypeIcon}>📱</AppText>
                <AppText
                  variant="label"
                  style={[
                    styles.sessionTypeTitle,
                    sessionType === 'pass-the-phone' && { color: vibeColor },
                    rtl && styles.textRTL,
                  ]}
                >
                  {t('sessionType.passPhone.title', activeLanguage)}
                </AppText>
                {sessionType === 'pass-the-phone' && (
                  <Badge
                    label={t('sessionType.passPhone.badge', activeLanguage)}
                    color={theme.colors.surfaceElevated}
                    textColor={vibeColor}
                  />
                )}
              </View>
              <AppText
                variant="caption"
                color="secondary"
                style={[styles.sessionTypeDesc, rtl && styles.textRTL]}
              >
                {t('sessionType.passPhone.desc', activeLanguage)}
              </AppText>
            </Pressable>

            {/* 3. Standard Game */}
            <Pressable
              onPress={() => {
                haptic.selection().catch(() => {});
                setLocalSessionType('standard');
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: sessionType === 'standard' }}
              accessibilityLabel="Standard Game"
              style={({ pressed }) => [
                styles.sessionTypeCard,
                sessionType === 'standard'
                  ? [styles.sessionTypeCardSelected, { borderColor: vibeColor }]
                  : styles.sessionTypeCardUnselected,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.sessionTypeHeader, rtl && styles.rowRTL]}>
                <AppText style={styles.sessionTypeIcon}>⚡</AppText>
                <AppText
                  variant="label"
                  style={[
                    styles.sessionTypeTitle,
                    sessionType === 'standard' && { color: vibeColor },
                    rtl && styles.textRTL,
                  ]}
                >
                  {t('sessionType.standard.title', activeLanguage)}
                </AppText>
              </View>
              <AppText
                variant="caption"
                color="secondary"
                style={[styles.sessionTypeDesc, rtl && styles.textRTL]}
              >
                {t('sessionType.standard.desc', activeLanguage)}
              </AppText>
            </Pressable>
          </View>
        </Animated.View>

        {/* Player Count Selector */}
        <Animated.View entering={FadeIn.duration(450)} style={styles.countSection}>
          <AppText
            variant="overline"
            color="secondary"
            style={[styles.sectionLabel, rtl && styles.textRTL]}
          >
            {t('setup.playerCountLabel', activeLanguage)}
          </AppText>
          <View style={[styles.pillRow, rtl && styles.rowRTL]}>
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
                  style={({ pressed }) => [
                    styles.pill,
                    isSelected
                      ? [styles.pillSelected, { backgroundColor: vibeColor }]
                      : styles.pillUnselected,
                    pressed && styles.pillPressed,
                  ]}
                >
                  <AppText
                    variant="label"
                    style={[
                      styles.pillText,
                      isSelected ? styles.pillTextSelected : styles.pillTextUnselected,
                    ]}
                  >
                    {count}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Dynamic Player Name Inputs */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.inputsSection}>
          {Array.from({ length: playerCount }).map((_, index) => {
            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const error = validationErrors[index];

            return (
              <View key={`player-input-${index}`} style={styles.inputWrapper}>
                <AppTextInput
                  value={playerNames[index] || ''}
                  onChangeText={(text) => handleNameChange(text, index)}
                  onBlur={() => handleBlur(index)}
                  placeholder={t('setup.playerInputPlaceholder', activeLanguage, {
                    index: index + 1,
                  })}
                  maxLength={20}
                  error={error}
                  accessibilityLabel={`Name for Player ${index + 1}`}
                  leftIcon={
                    <View
                      style={[styles.avatarIndicator, { backgroundColor: avatarColor }]}
                    >
                      <AppText style={styles.avatarNumber}>{index + 1}</AppText>
                    </View>
                  }
                  containerStyle={styles.textInputContainer}
                />
              </View>
            );
          })}
        </Animated.View>

        {/* Bottom CTA Button */}
        <View style={styles.bottomCta}>
          <AppButton
            variant="primary"
            size="lg"
            disabled={!isFormValid}
            onPress={handleContinue}
            accessibilityHint="Proceeds to choose a game mode"
            style={[styles.ctaButton, isFormValid && { backgroundColor: vibeColor }]}
          >
            {t('setup.chooseModeCta', activeLanguage)}
          </AppButton>
        </View>
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
    marginBottom: theme.spacing.lg,
  },
  navBarRTL: {
    flexDirection: 'row-reverse',
  },
  backArrow: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    lineHeight: 22,
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    marginBottom: theme.spacing.sm,
    letterSpacing: 1.5,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  languagePill: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    gap: theme.spacing.xs,
  },
  languagePillSelected: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  languagePillUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  flagEmoji: {
    fontSize: 16,
  },
  languagePillText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.primary,
  },
  sessionTypeSection: {
    marginBottom: theme.spacing.lg,
  },
  sessionTypeColumn: {
    gap: theme.spacing.sm,
  },
  sessionTypeCard: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
  },
  sessionTypeCardSelected: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  sessionTypeCardUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  cardPressed: {
    opacity: 0.85,
  },
  sessionTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  sessionTypeIcon: {
    fontSize: 20,
  },
  sessionTypeTitle: {
    fontSize: theme.typography.size.md,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  sessionTypeDesc: {
    lineHeight: 18,
    marginTop: 2,
  },
  countSection: {
    marginBottom: theme.spacing.lg,
  },
  pillRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  pill: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    // Background dynamic by vibe
  },
  pillUnselected: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  pillText: {
    fontSize: theme.typography.size.md,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: theme.colors.bg,
    fontWeight: '700',
  },
  pillTextUnselected: {
    color: theme.colors.text.secondary,
  },
  inputsSection: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  inputWrapper: {
    width: '100%',
  },
  textInputContainer: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  avatarIndicator: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.xs,
  },
  avatarNumber: {
    fontSize: theme.typography.size.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomCta: {
    marginTop: 'auto',
    paddingTop: theme.spacing.md,
  },
  ctaButton: {
    width: '100%',
  },
});
