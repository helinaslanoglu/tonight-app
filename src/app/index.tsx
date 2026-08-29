import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { LanguageButton } from '@/components/ui/LanguageButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { isRTL, t } from '@/services/i18n';
import { useLanguage } from '@/store';
import { theme } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const activeLanguage = useLanguage();
  const rtl = isRTL(activeLanguage);

  const handleStart = () => {
    router.push('/vibes');
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      {/* Top Header Section: Circular Language Selector on Left, Badge in Center */}
      <Animated.View entering={FadeIn.duration(500)} style={[styles.topSection, rtl && styles.rowRTL]}>
        <LanguageButton />
        <Badge
          label={t('welcome.badge', activeLanguage)}
          color={theme.colors.accentMuted}
          textColor={theme.colors.accent}
        />
        <View style={styles.topSideSlot} />
      </Animated.View>

      {/* Hero Brand & Taglines */}
      <View style={styles.heroSection}>
        <Animated.View entering={FadeIn.duration(600)}>
          <AppText variant="display" style={styles.title}>
            TONIGHT
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(700)} style={styles.taglineContainer}>
          <AppText variant="subheading" style={styles.taglineWhite}>
            {t('welcome.tagline1', activeLanguage)}
          </AppText>
          <AppText variant="subheading" color="accent" style={styles.taglineAccent}>
            {t('welcome.tagline2', activeLanguage)}
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(800)}>
          <AppText variant="body" color="secondary" style={styles.supportingText}>
            {t('welcome.subtitle', activeLanguage)}
          </AppText>
        </Animated.View>
      </View>

      {/* Bottom CTA Button */}
      <Animated.View entering={FadeIn.duration(600)} style={styles.bottomSection}>
        <AppButton
          size="lg"
          fullWidth
          onPress={handleStart}
          style={styles.startButton}
        >
          {t('welcome.startCta', activeLanguage)}
        </AppButton>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
  },
  topSideSlot: {
    width: 38,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  title: {
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -2,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  taglineContainer: {
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.xs,
  },
  taglineWhite: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: theme.typography.weight.bold,
  },
  taglineAccent: {
    color: theme.colors.accent,
    textAlign: 'center',
    fontWeight: theme.typography.weight.extrabold,
  },
  supportingText: {
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  bottomSection: {
    paddingBottom: theme.spacing.sm,
  },
  startButton: {
    borderRadius: theme.radius.xl,
    ...theme.shadow.glow,
  },
});
