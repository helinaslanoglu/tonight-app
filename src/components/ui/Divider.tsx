/**
 * Divider — horizontal separator.
 *
 * Usage:
 *   <Divider />
 *   <Divider spacing="lg" />
 *   <Divider color={theme.colors.accent} />
 *
 * With label:
 *   <Divider label="or" />
 */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';
import { AppText } from './AppText';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DividerProps {
  /** Optional center label (e.g. "or") */
  label?: string;
  /** Vertical spacing above and below — uses spacing token keys */
  spacing?: keyof typeof theme.spacing;
  /** Override the line color */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Divider({
  label,
  spacing = 'md',
  color = theme.colors.border,
  style,
}: DividerProps) {
  const marginVertical = theme.spacing[spacing];

  if (label) {
    return (
      <View style={[styles.row, { marginVertical }, style]}>
        <View style={[styles.line, { backgroundColor: color }]} />
        <AppText variant="caption" color="tertiary" style={styles.label}>
          {label}
        </AppText>
        <View style={[styles.line, { backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.solo,
        { backgroundColor: color, marginVertical },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  solo: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  label: {
    flexShrink: 0,
  },
});
