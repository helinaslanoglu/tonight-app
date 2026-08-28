/**
 * AppButton — Tonight's reusable button component.
 *
 * Variants:
 *   primary   — filled accent background (main CTA)
 *   secondary — subtle surface background (secondary action)
 *   ghost     — transparent background, accent-colored label
 *   destructive — red, for irreversible actions
 *
 * Sizes:
 *   sm | md | lg
 *
 * Usage:
 *   <AppButton onPress={...}>Start Game</AppButton>
 *   <AppButton variant="ghost" onPress={...}>Skip</AppButton>
 *   <AppButton variant="secondary" size="sm" onPress={...}>Cancel</AppButton>
 *   <AppButton loading onPress={...}>Saving...</AppButton>
 *   <AppButton disabled onPress={...}>Locked</AppButton>
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/theme';
import { AppText } from './AppText';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables interaction */
  loading?: boolean;
  /** Full-width block button */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const containerVariant: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: theme.colors.accent,
  },
  secondary: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ghost: {
    backgroundColor: theme.colors.transparent,
  },
  destructive: {
    backgroundColor: theme.colors.destructiveMuted,
    borderWidth: 1,
    borderColor: theme.colors.destructive,
  },
};

const containerSize: Record<ButtonSize, ViewStyle> = {
  sm: {
    height: theme.touchTarget.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    gap: theme.spacing.xs,
  },
  md: {
    height: theme.touchTarget.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.sm,
  },
  lg: {
    height: theme.touchTarget.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.xl,
    gap: theme.spacing.sm,
  },
};

const labelColor: Record<ButtonVariant, string> = {
  primary: theme.colors.accentForeground,
  secondary: theme.colors.text.primary,
  ghost: theme.colors.accent,
  destructive: theme.colors.destructive,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AppButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled = false,
  style,
  children,
  ...rest
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        containerVariant[variant],
        containerSize[size],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={labelColor[variant]}
        />
      ) : (
        <AppText
          variant="button"
          style={{ color: labelColor[variant] }}
        >
          {children}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
