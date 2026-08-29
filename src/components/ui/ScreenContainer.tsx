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

export function ScreenContainer({
  scrollable = false,
  disablePadding = false,
  contentStyle,
  avoidKeyboard = false,
  children,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const topInset = insets?.top ?? 0;
  const bottomInset = insets?.bottom ?? 0;

  const content = scrollable ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        !disablePadding && styles.padded,
        {
          paddingTop: topInset + theme.spacing.md,
          paddingBottom: bottomInset + theme.spacing.xl,
        },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bounces={true}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.inner,
        !disablePadding && styles.padded,
        {
          paddingTop: topInset + theme.spacing.md,
          paddingBottom: bottomInset + theme.spacing.md,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  if (avoidKeyboard) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return <View style={styles.root}>{content}</View>;
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
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: theme.spacing.lg,
  },
});
