/**
 * ScreenContainer — Tonight's standard screen wrapper.
 *
 * Handles:
 *  - Background color (always Tonight dark)
 *  - Safe area insets
 *  - Optional scroll behavior
 *  - Consistent horizontal padding
 *
 * Usage:
 *   // Fixed layout (non-scrollable)
 *   <ScreenContainer>
 *     <AppText variant="heading">Hello</AppText>
 *   </ScreenContainer>
 *
 *   // Scrollable screen
 *   <ScreenContainer scrollable>
 *     {content}
 *   </ScreenContainer>
 *
 *   // No horizontal padding (e.g. full-bleed sections)
 *   <ScreenContainer disablePadding>
 *     {content}
 *   </ScreenContainer>
 */

import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScreenContainerProps {
  /** Wraps content in a ScrollView */
  scrollable?: boolean;
  /** Removes horizontal padding for full-bleed sections */
  disablePadding?: boolean;
  /** Additional style on the inner content container */
  contentStyle?: StyleProp<ViewStyle>;
  /** Avoid keyboard on screens with inputs */
  avoidKeyboard?: boolean;
  children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScreenContainer({
  scrollable = false,
  disablePadding = false,
  contentStyle,
  avoidKeyboard = false,
  children,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const innerStyle: StyleProp<ViewStyle> = [
    styles.inner,
    !disablePadding && styles.padded,
    {
      paddingTop: insets.top + theme.spacing.md,
      paddingBottom: insets.bottom + theme.spacing.md,
    },
    contentStyle,
  ];

  const content = scrollable ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={innerStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={innerStyle}>{children}</View>
  );

  const wrapper = avoidKeyboard ? (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    <View style={styles.root}>{content}</View>
  );

  return wrapper;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  inner: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: theme.spacing.lg,
  },
});
