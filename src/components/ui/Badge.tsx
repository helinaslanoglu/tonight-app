/**
 * Badge — small label chip for status, counts, or tags.
 *
 * Usage:
 *   <Badge label="New" />
 *   <Badge label="Party" color={theme.colors.vibes.party} />
 *   <Badge label="3" size="sm" />
 */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';
import { AppText } from './AppText';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  /** Background color — defaults to accent muted */
  color?: string;
  /** Text / border color — defaults to accent */
  textColor?: string;
  size?: BadgeSize;
  style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Badge({
  label,
  color = theme.colors.accentMuted,
  textColor = theme.colors.accent,
  size = 'md',
  style,
}: BadgeProps) {
  return (
    <View
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: color, borderColor: textColor },
        style,
      ]}
    >
      <AppText
        variant="overline"
        style={[
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: textColor },
        ]}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  textSm: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  textMd: {
    fontSize: theme.typography.size.xs,
    letterSpacing: 1.0,
  },
});
