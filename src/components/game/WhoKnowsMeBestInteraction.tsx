import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { theme } from '@/theme';
import type { Player, WhoKnowsMeBestQuestion } from '@/types';

interface WhoKnowsMeBestInteractionProps {
  question: WhoKnowsMeBestQuestion;
  players: Player[];
  spotlightPlayerId?: string;
  onSelectSpotlightPlayer: (playerId: string) => void;
}

export function WhoKnowsMeBestInteraction({
  question,
  players,
  spotlightPlayerId,
  onSelectSpotlightPlayer,
}: WhoKnowsMeBestInteractionProps) {
  // Default to first player if none explicitly selected
  const activeSpotlightId = spotlightPlayerId || players[0]?.id;
  const activePlayer = players.find((p) => p.id === activeSpotlightId) || players[0];
  const pColor = activePlayer?.color || theme.colors.accent;

  return (
    <View style={styles.container}>
      {/* Spotlight Target Card */}
      {activePlayer && (
        <AppCard variant="elevated" padding="md" style={[styles.spotlightCard, { borderColor: pColor }]}>
          <View style={styles.spotlightRow}>
            <View style={[styles.avatar, { backgroundColor: pColor }]}>
              <AppText style={styles.avatarInitial}>
                {activePlayer.name.charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={styles.spotlightInfo}>
              <AppText variant="overline" color="secondary">
                🎯 SPOTLIGHT PLAYER
              </AppText>
              <AppText variant="heading" style={{ color: pColor, fontSize: 18 }}>
                {activePlayer.name}
              </AppText>
            </View>
          </View>
        </AppCard>
      )}

      {/* Rules / Prompt */}
      <AppCard variant="default" padding="md" style={styles.promptCard}>
        <AppText variant="body" color="secondary" style={styles.promptText}>
          {question.prompt ||
            `${activePlayer?.name || 'Spotlight player'} decides the real answer. The room takes turns guessing!`}
        </AppText>
      </AppCard>

      {/* Change Spotlight Player Selector */}
      <View style={styles.rosterSection}>
        <AppText variant="caption" color="secondary" style={styles.rosterTitle}>
          Switch spotlight player:
        </AppText>
        <View style={styles.rosterRow}>
          {players.map((p) => {
            const isSelected = p.id === activeSpotlightId;
            return (
              <Pressable
                key={p.id}
                onPress={() => onSelectSpotlightPlayer(p.id)}
                accessibilityRole="button"
                accessibilityLabel={`Set spotlight on ${p.name}`}
                style={[
                  styles.rosterChip,
                  isSelected && [styles.rosterChipSelected, { borderColor: p.color || theme.colors.accent }],
                ]}
              >
                <View style={[styles.chipDot, { backgroundColor: p.color || theme.colors.accent }]} />
                <AppText
                  variant="caption"
                  style={[styles.chipName, isSelected && { color: theme.colors.text.primary, fontWeight: '700' }]}
                >
                  {p.name}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  spotlightCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
  },
  spotlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: theme.typography.weight.bold,
  },
  spotlightInfo: {
    gap: 2,
  },
  promptCard: {
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  promptText: {
    textAlign: 'center',
    fontSize: theme.typography.size.sm,
  },
  rosterSection: {
    marginTop: theme.spacing.xs,
    gap: 6,
  },
  rosterTitle: {
    textAlign: 'center',
  },
  rosterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  rosterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rosterChipSelected: {
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.shadow.glow,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipName: {
    color: theme.colors.text.secondary,
  },
});
