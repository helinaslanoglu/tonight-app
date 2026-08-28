import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { VIBES } from '@/data';
import { useSelectedVibe } from '@/store';
import { getVibeColor, theme } from '@/theme';

export default function GameSetupPlaceholderScreen() {
  const router = useRouter();
  const selectedVibeId = useSelectedVibe();
  const activeVibe = VIBES.find((v) => v.id === selectedVibeId);
  const vibeColor = selectedVibeId ? getVibeColor(selectedVibeId) : theme.colors.accent;

  return (
    <ScreenContainer contentStyle={styles.container}>
      {/* Top Nav Bar */}
      <View style={styles.navBar}>
        <IconButton
          variant="surface"
          size="sm"
          onPress={() => router.back()}
          accessibilityLabel="Go back to vibe selection"
        >
          <AppText style={styles.backArrow}>←</AppText>
        </IconButton>
      </View>

      {/* Main Placeholder Content */}
      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.centerBlock}>
          <Badge label="MILESTONE 4" color={theme.colors.surfaceElevated} textColor={theme.colors.text.secondary} />

          <AppText variant="heading" style={styles.title}>
            Game setup coming next.
          </AppText>

          <AppText variant="body" color="secondary" style={styles.description}>
            Players, game modes, and question decks will be configured here.
          </AppText>

          {/* Selected Vibe Confirmation Card */}
          {activeVibe && (
            <AppCard
              variant="elevated"
              padding="lg"
              style={[styles.vibeSummaryCard, { borderColor: vibeColor }]}
            >
              <View style={styles.vibeCardRow}>
                <AppText style={styles.vibeEmoji}>{activeVibe.emoji}</AppText>
                <View style={styles.vibeTextGroup}>
                  <AppText variant="overline" color="secondary">
                    SELECTED VIBE
                  </AppText>
                  <AppText variant="label" style={{ color: vibeColor }}>
                    {activeVibe.label}
                  </AppText>
                  <AppText variant="bodySmall" color="secondary">
                    {activeVibe.description}
                  </AppText>
                </View>
              </View>
            </AppCard>
          )}
        </Animated.View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomArea}>
        <AppButton
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.push('/vibes')}
        >
          CHANGE VIBE
        </AppButton>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.lg,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  backArrow: {
    fontSize: 18,
    lineHeight: 20,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBlock: {
    alignItems: 'center',
    gap: theme.spacing.md,
    width: '100%',
  },
  title: {
    textAlign: 'center',
    color: theme.colors.text.primary,
  },
  description: {
    textAlign: 'center',
    maxWidth: 280,
  },
  vibeSummaryCard: {
    width: '100%',
    marginTop: theme.spacing.md,
    borderWidth: 1.5,
    borderRadius: theme.radius.xl,
  },
  vibeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  vibeEmoji: {
    fontSize: 36,
    lineHeight: 42,
  },
  vibeTextGroup: {
    flex: 1,
    gap: 2,
  },
  bottomArea: {
    paddingTop: theme.spacing.md,
  },
});
