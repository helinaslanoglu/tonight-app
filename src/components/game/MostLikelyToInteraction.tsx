import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { theme } from '@/theme';
import type { Player } from '@/types';

interface MostLikelyToInteractionProps {
  players: Player[];
  selectedPlayerId?: string;
  onSelectPlayer: (playerId: string) => void;
}

export function MostLikelyToInteraction({
  players,
  selectedPlayerId,
  onSelectPlayer,
}: MostLikelyToInteractionProps) {
  return (
    <View style={styles.container}>
      <AppText variant="caption" color="secondary" style={styles.prompt}>
        Tap who in the room fits best:
      </AppText>
      <View style={styles.grid}>
        {players.map((player) => {
          const isSelected = selectedPlayerId === player.id;
          const pColor = player.color || theme.colors.accent;

          return (
            <Pressable
              key={player.id}
              onPress={() => onSelectPlayer(player.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Vote for ${player.name}`}
              style={[
                styles.playerCard,
                isSelected
                  ? [styles.playerCardSelected, { borderColor: pColor }]
                  : styles.playerCardUnselected,
              ]}
            >
              <View style={[styles.playerAvatar, { backgroundColor: pColor }]}>
                <AppText style={styles.avatarInitial}>
                  {player.name.charAt(0).toUpperCase()}
                </AppText>
              </View>
              <AppText
                variant="label"
                numberOfLines={1}
                style={[
                  styles.playerName,
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
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  prompt: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  playerCard: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
  },
  playerCardUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  playerCardSelected: {
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.shadow.glow,
  },
  playerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: theme.typography.weight.bold,
  },
  playerName: {
    color: theme.colors.text.secondary,
    flex: 1,
  },
});
