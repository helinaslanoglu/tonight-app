import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { theme } from '@/theme';
import type { OpenQuestion } from '@/types';

interface OpenQuestionInteractionProps {
  question: OpenQuestion;
}

export function OpenQuestionInteraction({ question }: OpenQuestionInteractionProps) {
  return (
    <View style={styles.container}>
      <AppCard variant="default" padding="lg" style={styles.promptCard}>
        <AppText variant="overline" color="accent" style={styles.tag}>
          GROUP DISCUSSION
        </AppText>
        <AppText variant="body" color="secondary" style={styles.text}>
          {question.prompt || 'Everyone share your thoughts and debate the answers.'}
        </AppText>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  promptCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  tag: {
    letterSpacing: 1.2,
  },
  text: {
    textAlign: 'center',
  },
});
