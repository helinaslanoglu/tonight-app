import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { theme } from '@/theme';
import type { HotTakeQuestion } from '@/types';
import { haptic } from '@/utils';

interface HotTakeInteractionProps {
  question: HotTakeQuestion;
  selectedStance?: 'agree' | 'disagree';
  onSelectStance: (stance: 'agree' | 'disagree') => void;
}

export function HotTakeInteraction({
  question,
  selectedStance,
  onSelectStance,
}: HotTakeInteractionProps) {
  const agreeText = question.agreeLabel || 'AGREE';
  const disagreeText = question.disagreeLabel || 'DISAGREE';

  const handleSelect = (stance: 'agree' | 'disagree') => {
    haptic.selection().catch(() => {});
    onSelectStance(stance);
  };

  return (
    <View style={styles.container}>
      <AppText variant="caption" color="secondary" style={styles.prompt}>
        Take your stance on this hot take:
      </AppText>

      <View style={styles.row}>
        {/* AGREE / FACTS */}
        <Pressable
          onPress={() => handleSelect('agree')}
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedStance === 'agree' }}
          accessibilityLabel={`Agree: ${agreeText}`}
          style={({ pressed }) => [
            styles.stanceCard,
            styles.agreeCard,
            selectedStance === 'agree' ? styles.agreeSelected : styles.cardUnselected,
            pressed && styles.stancePressed,
          ]}
        >
          <AppText style={styles.stanceEmoji}>🔥</AppText>
          <AppText
            variant="label"
            style={[
              styles.stanceText,
              selectedStance === 'agree' && styles.agreeTextSelected,
            ]}
          >
            {agreeText}
          </AppText>
        </Pressable>

        {/* DISAGREE / CAP */}
        <Pressable
          onPress={() => handleSelect('disagree')}
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedStance === 'disagree' }}
          accessibilityLabel={`Disagree: ${disagreeText}`}
          style={({ pressed }) => [
            styles.stanceCard,
            styles.disagreeCard,
            selectedStance === 'disagree' ? styles.disagreeSelected : styles.cardUnselected,
            pressed && styles.stancePressed,
          ]}
        >
          <AppText style={styles.stanceEmoji}>🚫</AppText>
          <AppText
            variant="label"
            style={[
              styles.stanceText,
              selectedStance === 'disagree' && styles.disagreeTextSelected,
            ]}
          >
            {disagreeText}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  prompt: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  stanceCard: {
    flex: 1,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  cardUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  agreeCard: {
    borderColor: theme.colors.border,
  },
  agreeSelected: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: '#F59E0B',
    ...theme.shadow.glow,
  },
  disagreeCard: {
    borderColor: theme.colors.border,
  },
  disagreeSelected: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.destructive,
    ...theme.shadow.glow,
  },
  stancePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  stanceEmoji: {
    fontSize: 28,
  },
  stanceText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: theme.typography.weight.bold,
  },
  agreeTextSelected: {
    color: '#FBBF24',
  },
  disagreeTextSelected: {
    color: theme.colors.destructive,
  },
});
