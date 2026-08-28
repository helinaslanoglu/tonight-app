/**
 * AppCard — Tonight's surface card.
 *
 * Variants:
 *   default   — standard surface (#15151C)
 *   elevated  — slightly lifted surface (#1D1D26)
 *   outlined  — transparent + border
 *   accent    — accent-tinted border glow (for highlighted states)
 *
 * Usage:
 *   <AppCard>...</AppCard>
 *   <AppCard variant="elevated" padding="lg">...</AppCard>
 *   <AppCard variant="accent" onPress={...}>...</AppCard>
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'accent';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface AppCardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  /** Whether the card has glow shadow */
  glow?: boolean;
  /** Makes the card pressable */
  onPress?: PressableProps['onPress'];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantStyle: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  elevated: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  outlined: {
    backgroundColor: theme.colors.transparent,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  accent: {
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
};

const paddingStyle: Record<CardPadding, ViewStyle> = {
  none: { padding: 0 },
  sm: { padding: theme.spacing.sm },
  md: { padding: theme.spacing.md },
  lg: { padding: theme.spacing.lg },
  xl: { padding: theme.spacing.xl },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AppCard({
  variant = 'default',
  padding = 'md',
  glow = false,
  onPress,
  style,
  children,
}: AppCardProps) {
  const containerStyle = [
    styles.base,
    variantStyle[variant],
    paddingStyle[padding],
    glow && theme.shadow.glow,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...containerStyle,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
});
