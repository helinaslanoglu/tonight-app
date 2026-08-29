import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { isRTL } from '@/services/i18n';
import { useLanguage } from '@/store';
import { theme } from '@/theme';
import type { Player, WhoKnowsMeBestQuestion } from '@/types';

export interface WhoKnowsMeBestInteractionProps {
  question: WhoKnowsMeBestQuestion;
  players: Player[];
  respondingPlayer?: Player;
  isGroupSession?: boolean;
}

export function WhoKnowsMeBestInteraction({
  question,
  players,
  respondingPlayer,
  isGroupSession = false,
}: WhoKnowsMeBestInteractionProps) {
  const language = useLanguage();
  const rtl = isRTL(language);

  // 1. Authoritative Structured Target Player Lookup
  const targetPlayer =
    players.find((p) => p.id === question.targetPlayerId) ||
    players[0];

  const pColor = targetPlayer?.color || theme.colors.accent;

  // 2. Structured Respondent Description (Target != Respondent)
  const isAnsweringSelf = respondingPlayer && targetPlayer && respondingPlayer.id === targetPlayer.id;

  return (
    <View style={styles.container}>
      {/* 🎯 Spotlight Target Card — Authoritative Source of Truth */}
      {targetPlayer && (
        <AppCard
          variant="elevated"
          padding="md"
          style={[styles.spotlightCard, { borderColor: pColor }]}
        >
          <View style={[styles.spotlightRow, rtl && styles.rowRTL]}>
            <View style={[styles.avatar, { backgroundColor: pColor }]}>
              <AppText style={styles.avatarInitial}>
                {targetPlayer.name.charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={[styles.spotlightInfo, rtl && styles.alignRTL]}>
              <AppText variant="overline" color="secondary" style={rtl && styles.textRTL}>
                🎯 SPOTLIGHT PLAYER
              </AppText>
              <AppText variant="heading" style={[{ color: pColor, fontSize: 20 }, rtl && styles.textRTL]}>
                {targetPlayer.name}
              </AppText>
            </View>
          </View>
        </AppCard>
      )}

      {/* Structured Context Banner — Truthful, Non-Fictional Representation */}
      <AppCard variant="default" padding="md" style={styles.contextCard}>
        {isGroupSession && respondingPlayer ? (
          <View style={styles.instructionContainer}>
            <AppText variant="body" color="primary" style={[styles.instructionText, rtl && styles.textRTL]}>
              {isAnsweringSelf
                ? `${respondingPlayer.name}, answering about yourself.`
                : `${respondingPlayer.name}, predicting for ${targetPlayer?.name}.`}
            </AppText>
            <AppText variant="caption" color="secondary" style={[styles.subInstructionText, rtl && styles.textRTL]}>
              {question.prompt || `Discuss and share your perspective on ${targetPlayer?.name}.`}
            </AppText>
          </View>
        ) : (
          <AppText variant="body" color="secondary" style={[styles.promptText, rtl && styles.textRTL]}>
            {question.prompt || `Discuss what you know about ${targetPlayer?.name}.`}
          </AppText>
        )}
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  spotlightCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    ...theme.shadow.glow,
  },
  spotlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  alignRTL: {
    alignItems: 'flex-end',
  },
  textRTL: {
    textAlign: 'right',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: theme.typography.weight.bold,
  },
  spotlightInfo: {
    gap: 2,
  },
  contextCard: {
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  instructionContainer: {
    alignItems: 'center',
    gap: 4,
  },
  instructionText: {
    fontWeight: theme.typography.weight.semibold,
    fontSize: theme.typography.size.sm,
    textAlign: 'center',
  },
  subInstructionText: {
    textAlign: 'center',
    fontSize: theme.typography.size.xs,
  },
  promptText: {
    textAlign: 'center',
    fontSize: theme.typography.size.sm,
  },
});
