/**
 * IconButton — square/round pressable button for icon-only actions.
 *
 * Usage:
 *   <IconButton onPress={...} accessibilityLabel="Close">
 *     <CloseIcon />
 *   </IconButton>
 *
 *   <IconButton variant="ghost" size="sm" onPress={...} accessibilityLabel="Back">
 *     <ArrowLeftIcon />
 *   </IconButton>
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IconButtonVariant = 'surface' | 'elevated' | 'ghost' | 'accent';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<PressableProps, 'style'> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Makes the button circular (default) or square with radius */
  round?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  /** Required for accessibility */
  accessibilityLabel: string;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantStyle: Record<IconButtonVariant, ViewStyle> = {
  surface: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  elevated: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ghost: {
    backgroundColor: theme.colors.transparent,
  },
  accent: {
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
};

const sizeStyle: Record<IconButtonSize, ViewStyle> = {
  sm: { width: theme.touchTarget.sm, height: theme.touchTarget.sm },
  md: { width: theme.touchTarget.md, height: theme.touchTarget.md },
  lg: { width: theme.touchTarget.lg, height: theme.touchTarget.lg },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function IconButton({
  variant = 'surface',
  size = 'md',
  round = true,
  disabled = false,
  style,
  children,
  accessibilityLabel,
  ...rest
}: IconButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        sizeStyle[size],
        variantStyle[variant],
        round ? styles.round : styles.square,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  round: {
    borderRadius: theme.radius.full,
  },
  square: {
    borderRadius: theme.radius.md,
  },
  pressed: {
    opacity: 0.65,
    transform: [{ scale: 0.93 }],
  },
  disabled: {
    opacity: 0.35,
  },
});
