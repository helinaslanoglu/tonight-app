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
import { usePlayers, useSelectedVibe } from '@/store';
import { getVibeColor, theme } from '@/theme';

export default function GamePlaceholderScreen() {
  const router = useRouter();
  const selectedVibeId = useSelectedVibe();
  const players = usePlayers();

  const activeVibe = VIBES.find((v) => v.id === selectedVibeId);
  const vibeColor = selectedVibeId ? getVibeColor(selectedVibeId) : theme.colors.accent;

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      {/* Top Navigation */}
      <View style={styles.navBar}>
        <IconButton
          variant="surface"
          size="sm"
          onPress={() => router.back()}
          accessibilityLabel="Go back to game setup"
        >
          <AppText style={styles.backArrow}>←</AppText>
        </IconButton>

        <Badge label="MILESTONE 5" color={theme.colors.surfaceElevated} textColor={theme.colors.text.secondary} />
      </View>

      {/* Hero Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <AppText variant="heading" style={styles.title}>
          Game coming next.
        </AppText>
        <AppText variant="body" color="secondary" style={styles.subtitle}>
          Your players and vibe are locked in for tonight.
        </AppText>
      </Animated.View>

      {/* Summary Container */}
      <Animated.View entering={FadeIn.duration(450)} style={styles.summaryContainer}>
        {/* Active Vibe Card */}
        {activeVibe ? (
          <AppCard
            variant="elevated"
            padding="md"
            style={[styles.summaryCard, { borderColor: vibeColor }]}
          >
            <View style={styles.vibeRow}>
              <AppText style={styles.vibeEmoji}>{activeVibe.emoji}</AppText>
              <View style={styles.vibeDetails}>
                <AppText variant="overline" color="secondary">
                  SELECTED VIBE
                </AppText>
                <AppText variant="label" style={{ color: vibeColor }}>
                  {activeVibe.label}
                </AppText>
              </View>
            </View>
          </AppCard>
        ) : null}

        {/* Players Roster Card */}
        <AppCard variant="elevated" padding="lg" style={styles.playersCard}>
          <View style={styles.playersHeader}>
            <AppText variant="overline" color="secondary">
              PLAYERS ({players.length})
            </AppText>
          </View>

          <View style={styles.playersGrid}>
            {players.map((player, index) => (
              <View key={player.id || index} style={styles.playerItem}>
                <View
                  style={[
                    styles.playerAvatar,
                    { backgroundColor: player.color || theme.colors.accent },
                  ]}
                >
                  <AppText style={styles.avatarInitial}>
                    {player.name.charAt(0).toUpperCase()}
                  </AppText>
                </View>
                <AppText variant="body" style={styles.playerName} numberOfLines={1}>
                  {player.name}
                </AppText>
              </View>
            ))}
          </View>
        </AppCard>
      </Animated.View>

      {/* Bottom Action Area */}
      <Animated.View entering={FadeIn.duration(500)} style={styles.bottomArea}>
        <AppButton
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.push('/game-setup')}
        >
          EDIT PLAYERS
        </AppButton>
        <AppButton
          variant="ghost"
          size="md"
          fullWidth
          onPress={() => router.replace('/')}
          style={styles.startOverBtn}
        >
          START OVER
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
  backArrow: {
    fontSize: 18,
    lineHeight: 20,
    color: theme.colors.text.primary,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size['3xl'],
  },
  subtitle: {
    marginTop: theme.spacing.xs,
  },
  summaryContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  summaryCard: {
    borderWidth: 1.5,
    borderRadius: theme.radius.xl,
  },
  vibeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  vibeEmoji: {
    fontSize: 32,
    lineHeight: 36,
  },
  vibeDetails: {
    gap: 2,
  },
  playersCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  playersHeader: {
    marginBottom: theme.spacing.md,
  },
  playersGrid: {
    gap: theme.spacing.sm,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  playerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weight.bold,
    fontSize: theme.typography.size.sm,
  },
  playerName: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weight.semibold,
    flex: 1,
  },
  bottomArea: {
    marginTop: 'auto',
    gap: theme.spacing.xs,
  },
  startOverBtn: {
    marginTop: theme.spacing.xs,
  },
});
