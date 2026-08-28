/**
 * AppText — Tonight's canonical text component.
 *
 * Usage:
 *   <AppText variant="heading">Tonight</AppText>
 *   <AppText variant="body" color="secondary">Choose your vibe</AppText>
 *   <AppText variant="caption" color={theme.colors.accent}>New</AppText>
 */

import React from 'react';
import { Text, type TextProps, StyleSheet } from 'react-native';

import { theme } from '@/theme';
import { typographyStyles, type TypographyVariant } from '@/theme/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'accent'
  | 'inverse'
  | 'destructive'
  | 'success'
  | (string & {}); // allow arbitrary hex strings

export interface AppTextProps extends TextProps {
  /** Typography role — maps to a pre-defined style */
  variant?: TypographyVariant;
  /** Semantic color shorthand or any hex string */
  color?: TextColor;
  /** Center-align the text */
  center?: boolean;
}

// ─── Color map ────────────────────────────────────────────────────────────────

function resolveColor(color: TextColor): string {
  switch (color) {
    case 'primary':
      return theme.colors.text.primary;
    case 'secondary':
      return theme.colors.text.secondary;
    case 'tertiary':
      return theme.colors.text.tertiary;
    case 'accent':
      return theme.colors.accent;
    case 'inverse':
      return theme.colors.text.inverse;
    case 'destructive':
      return theme.colors.destructive;
    case 'success':
      return theme.colors.success;
    default:
      return color; // raw hex / rgba
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppText({
  variant = 'body',
  color = 'primary',
  center = false,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        typographyStyles[variant],
        { color: resolveColor(color) },
        center && styles.center,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
});
