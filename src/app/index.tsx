import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { theme } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/vibes');
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      {/* Top Header Badge */}
      <Animated.View entering={FadeIn.duration(500)} style={styles.topSection}>
        <Badge label="PARTY GAME" color={theme.colors.accentMuted} textColor={theme.colors.accent} />
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
            You bring the people.
          </AppText>
          <AppText variant="subheading" color="accent" style={styles.taglineAccent}>
            We bring the chaos.
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(800)}>
          <AppText variant="body" color="secondary" style={styles.supportingText}>
            Your night starts here.
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
          START
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
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
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
