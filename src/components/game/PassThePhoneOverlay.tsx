/**
 * PassThePhoneOverlay Component
 * ──────────────────────────────
 * Privacy Barrier Modal / Fullscreen Card for Group Sessions.
 *
 * Guarantees that when the device is passed from Player A to Player B,
 * Player A's choice is 100% hidden and inaccessible.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { isRTL, t } from '@/services/i18n';
import { useLanguage } from '@/store';
import { theme } from '@/theme';
import { haptic } from '@/utils';

interface PassThePhoneOverlayProps {
  visible: boolean;
  nextPlayerName: string;
  nextPlayerColor?: string;
  onReady: () => void;
}

export const PassThePhoneOverlay: React.FC<PassThePhoneOverlayProps> = ({
  visible,
  nextPlayerName,
  nextPlayerColor = theme.colors.accent,
  onReady,
}) => {
  const language = useLanguage();
  const rtl = isRTL(language);

  if (!visible) return null;

  const handleReadyPress = () => {
    haptic.impactMedium().catch(() => {});
    onReady();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      style={styles.backdrop}
      accessibilityRole="alert"
      accessibilityLabel={`Pass the phone to ${nextPlayerName}`}
    >
      <Animated.View entering={ZoomIn.duration(300)} style={styles.cardWrapper}>
        <AppCard variant="elevated" glow padding="xl" style={styles.card}>
          <View style={styles.iconCircle}>
            <AppText style={styles.iconEmoji}>📱</AppText>
          </View>

          <Badge
            label={t('sessionType.passPhone.title', language).toUpperCase()}
            color={theme.colors.surfaceElevated}
            textColor={nextPlayerColor}
            style={styles.badge}
          />

          <AppText
            variant="heading"
            style={[styles.title, rtl && styles.textRTL]}
          >
            {t('passPhone.handoverTitle', language, { target: nextPlayerName })}
          </AppText>

          <AppText
            variant="body"
            color="secondary"
            style={[styles.subtitle, rtl && styles.textRTL]}
          >
            {t('passPhone.handoverSubtitle', language)}
          </AppText>

          <View style={styles.buttonWrapper}>
            <AppButton
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleReadyPress}
              accessibilityLabel={`I am ready, ${nextPlayerName}`}
              style={{ backgroundColor: nextPlayerColor }}
            >
              {t('passPhone.readyButton', language, { target: nextPlayerName })}
            </AppButton>
          </View>
        </AppCard>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 8, 0.96)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    alignItems: 'center',
    textAlign: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconEmoji: {
    fontSize: 36,
  },
  badge: {
    marginBottom: theme.spacing.sm,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 30,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  textRTL: {
    writingDirection: 'rtl',
  },
  buttonWrapper: {
    width: '100%',
  },
});
