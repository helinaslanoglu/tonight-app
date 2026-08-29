/**
 * Tonight Design System — Theme Object
 * ──────────────────────────────────────
 * This is what components import.
 * Access values via: theme.colors.bg, theme.spacing.md, etc.
 */

import {
  colorTokens,
  durationTokens,
  easingNames,
  fontSizeTokens,
  fontWeightTokens,
  lineHeightTokens,
  motionTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  touchTargetTokens,
} from './tokens';

import type { VibeId } from '@/types';

// ─── Theme object ─────────────────────────────────────────────────────────────

export const theme = {
  colors: {
    // Backgrounds
    bg: colorTokens.bg,
    surface: colorTokens.surface,
    surfaceElevated: colorTokens.surfaceElevated,
    surfaceHighlight: colorTokens.surfaceHighlight,

    // Text
    text: {
      primary: colorTokens.textPrimary,
      secondary: colorTokens.textSecondary,
      tertiary: colorTokens.textTertiary,
      inverse: colorTokens.textInverse,
    },

    // Borders
    border: colorTokens.border,
    borderSubtle: colorTokens.borderSubtle,

    // Brand accent
    accent: colorTokens.accent,
    accentMuted: colorTokens.accentMuted,
    accentForeground: colorTokens.accentForeground,

    // States
    destructive: colorTokens.destructive,
    destructiveMuted: colorTokens.destructiveMuted,
    success: colorTokens.success,

    // Overlay / utilities
    overlay: colorTokens.overlay,
    white: colorTokens.white,
    black: colorTokens.black,
    transparent: colorTokens.transparent,

    // Vibe accent colors — indexed by VibeId
    vibes: colorTokens.vibes,
  },

  spacing: spacingTokens,
  radius: radiusTokens,

  typography: {
    size: fontSizeTokens,
    weight: fontWeightTokens,
    lineHeight: lineHeightTokens,
  },

  shadow: shadowTokens,

  duration: durationTokens,
  easing: easingNames,
  motion: motionTokens,

  touchTarget: touchTargetTokens,
} as const;

// ─── Type helpers ─────────────────────────────────────────────────────────────

export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;
export type ThemeRadius = typeof theme.radius;
export type ThemeTypography = typeof theme.typography;

/** Returns the accent color for a given vibe. */
export function getVibeColor(vibeId: VibeId): string {
  return theme.colors.vibes[vibeId];
}
