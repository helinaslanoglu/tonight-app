/**
 * AppTextInput — Tonight's reusable text input component.
 *
 * Features:
 *   - Dark-first aesthetic with distinct focus ring
 *   - Optional label and error message
 *   - Accessible props and clear touch targets
 *   - Automatic trim & character limit support
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/theme';
import { AppText } from './AppText';

export interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
}

export function AppTextInput({
  label,
  error,
  containerStyle,
  leftIcon,
  style,
  onFocus,
  onBlur,
  placeholderTextColor = theme.colors.text.tertiary,
  ...rest
}: AppTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <AppText variant="caption" color="secondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error ? styles.errorBorder : null,
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={placeholderTextColor}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          selectionColor={theme.colors.accent}
          accessibilityLabel={label || rest.placeholder || 'Text input'}
          accessibilityRole="text"
          {...rest}
        />
      </View>

      {error ? (
        <AppText
          variant="caption"
          color="destructive"
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: theme.typography.weight.semibold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.touchTarget.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  focused: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.shadow.glow,
  },
  errorBorder: {
    borderColor: theme.colors.destructive,
  },
  leftIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 2,
  },
});
