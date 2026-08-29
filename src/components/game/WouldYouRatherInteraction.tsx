import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { theme } from '@/theme';
import type { WouldYouRatherQuestion } from '@/types';
import { haptic } from '@/utils';

interface WouldYouRatherInteractionProps {
  question: WouldYouRatherQuestion;
  selectedOption?: 'A' | 'B';
  onSelectOption: (option: 'A' | 'B') => void;
}

export function WouldYouRatherInteraction({
  question,
  selectedOption,
  onSelectOption,
}: WouldYouRatherInteractionProps) {
  const handleSelect = (option: 'A' | 'B') => {
    haptic.selection().catch(() => {});
    onSelectOption(option);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => handleSelect('A')}
        accessibilityRole="radio"
        accessibilityState={{ selected: selectedOption === 'A' }}
        accessibilityLabel={`Option A: ${question.optionA}`}
        style={({ pressed }) => [
          styles.optionCard,
          selectedOption === 'A' ? styles.optionSelected : styles.optionUnselected,
          pressed && styles.optionPressed,
        ]}
      >
        <AppText variant="overline" color="secondary" style={styles.optionTag}>
          OPTION A
        </AppText>
        <AppText
          variant="label"
          style={[styles.optionText, selectedOption === 'A' && styles.optionTextSelected]}
        >
          {question.optionA}
        </AppText>
      </Pressable>

      <View style={styles.vsBadge}>
        <AppText variant="overline" style={styles.vsText}>
          VS
        </AppText>
      </View>

      <Pressable
        onPress={() => handleSelect('B')}
        accessibilityRole="radio"
        accessibilityState={{ selected: selectedOption === 'B' }}
        accessibilityLabel={`Option B: ${question.optionB}`}
        style={({ pressed }) => [
          styles.optionCard,
          selectedOption === 'B' ? styles.optionSelected : styles.optionUnselected,
          pressed && styles.optionPressed,
        ]}
      >
        <AppText variant="overline" color="secondary" style={styles.optionTag}>
          OPTION B
        </AppText>
        <AppText
          variant="label"
          style={[styles.optionText, selectedOption === 'B' && styles.optionTextSelected]}
        >
          {question.optionB}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  optionCard: {
    width: '100%',
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
  },
  optionUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  optionSelected: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.accent,
    ...theme.shadow.glow,
  },
  optionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  optionTag: {
    marginBottom: 4,
  },
  optionText: {
    color: theme.colors.text.secondary,
  },
  optionTextSelected: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weight.bold,
  },
  vsBadge: {
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  vsText: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
});
