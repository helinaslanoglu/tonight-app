import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { getVibeColor, theme } from '@/theme';
import type { Vibe } from '@/types';

export interface VibeCardProps {
  vibe: Vibe;
  selected: boolean;
  onSelect: () => void;
}

export function VibeCard({ vibe, selected, onSelect }: VibeCardProps) {
  const vibeColor = getVibeColor(vibe.id);

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${vibe.label} vibe. ${vibe.description}`}
      accessibilityHint="Double tap to select this vibe for tonight"
      style={({ pressed }) => [
        styles.card,
        selected ? [styles.cardSelected, { borderColor: vibeColor }] : styles.cardUnselected,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Emoji & Info Container */}
      <View style={styles.contentRow}>
        <View
          style={[
            styles.emojiContainer,
            selected
              ? { backgroundColor: `${vibeColor}22`, borderColor: `${vibeColor}55` }
              : styles.emojiContainerUnselected,
          ]}
        >
          <AppText style={styles.emojiText}>{vibe.emoji}</AppText>
        </View>

        <View style={styles.textContainer}>
          <AppText
            variant="label"
            style={[styles.title, selected && { color: theme.colors.text.primary }]}
          >
            {vibe.label}
          </AppText>
          <AppText variant="bodySmall" color="secondary" numberOfLines={1}>
            {vibe.description}
          </AppText>
        </View>

        {/* Selection Indicator Dot / Ring */}
        <View
          style={[
            styles.radioOuter,
            selected ? { borderColor: vibeColor } : styles.radioOuterUnselected,
          ]}
        >
          {selected && <View style={[styles.radioInner, { backgroundColor: vibeColor }]} />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1.5,
  },
  cardUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  cardSelected: {
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.shadow.glow,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emojiContainer: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiContainerUnselected: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSubtle,
  },
  emojiText: {
    fontSize: 24,
    lineHeight: 28,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterUnselected: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.transparent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
