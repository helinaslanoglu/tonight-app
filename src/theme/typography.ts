/**
 * Tonight Design System — Typography Styles
 * ───────────────────────────────────────────
 * Pre-built text style objects for each typography role.
 * Use these in StyleSheet definitions to keep text consistent.
 *
 * Usage:
 *   StyleSheet.create({ title: { ...typographyStyles.display, color: theme.colors.text.primary } })
 */

import { Platform } from 'react-native';

import { theme } from '@/theme';

const { size, weight, lineHeight } = theme.typography;

export const typographyStyles = {
  /** Hero/display text — large titles on landing or vibe screens */
  display: {
    fontSize: size['5xl'],
    fontWeight: weight.extrabold,
    lineHeight: size['5xl'] * lineHeight.tight,
    letterSpacing: -1.5,
    fontFamily: Platform.select({ ios: 'ui-rounded', default: undefined }),
  },

  /** Screen headings */
  heading: {
    fontSize: size['3xl'],
    fontWeight: weight.bold,
    lineHeight: size['3xl'] * lineHeight.snug,
    letterSpacing: -0.5,
    fontFamily: Platform.select({ ios: 'ui-rounded', default: undefined }),
  },

  /** Section subheadings */
  subheading: {
    fontSize: size['2xl'],
    fontWeight: weight.semibold,
    lineHeight: size['2xl'] * lineHeight.snug,
    letterSpacing: -0.3,
  },

  /** Emphasis labels, card titles */
  label: {
    fontSize: size.lg,
    fontWeight: weight.semibold,
    lineHeight: size.lg * lineHeight.snug,
    letterSpacing: -0.1,
  },

  /** Default body text */
  body: {
    fontSize: size.md,
    fontWeight: weight.regular,
    lineHeight: size.md * lineHeight.normal,
    letterSpacing: 0,
  },

  /** Slightly smaller body — descriptions, hints */
  bodySmall: {
    fontSize: size.sm,
    fontWeight: weight.regular,
    lineHeight: size.sm * lineHeight.normal,
    letterSpacing: 0,
  },

  /** Button labels */
  button: {
    fontSize: size.md,
    fontWeight: weight.semibold,
    lineHeight: size.md * lineHeight.snug,
    letterSpacing: 0.1,
  },

  /** Caption — timestamps, metadata */
  caption: {
    fontSize: size.xs,
    fontWeight: weight.medium,
    lineHeight: size.xs * lineHeight.normal,
    letterSpacing: 0.2,
  },

  /** ALL-CAPS labels — category tags, status chips */
  overline: {
    fontSize: size.xs,
    fontWeight: weight.bold,
    lineHeight: size.xs * lineHeight.normal,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const;

export type TypographyVariant = keyof typeof typographyStyles;
