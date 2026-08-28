import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { VibeCard } from '@/components/vibe-card';
import { VIBES } from '@/data';
import { useSelectedVibe, useSetVibe } from '@/store';
import { theme } from '@/theme';
import type { VibeId } from '@/types';

export default function VibeSelectionScreen() {
  const router = useRouter();
  const selectedVibe = useSelectedVibe();
  const setVibe = useSetVibe();

  const handleSelectVibe = (vibeId: VibeId) => {
    setVibe(vibeId);
  };

  const handleContinue = () => {
    if (selectedVibe) {
      router.push('/game-setup');
    }
  };

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <IconButton
          variant="surface"
          size="sm"
          onPress={() => router.back()}
          accessibilityLabel="Go back to welcome screen"
        >
          <AppText style={styles.backArrow}>←</AppText>
        </IconButton>
      </View>

      {/* Screen Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <AppText variant="heading" style={styles.title}>
          What&apos;s the vibe?
        </AppText>
        <AppText variant="body" color="secondary" style={styles.subtitle}>
          Pick the mood for tonight.
        </AppText>
      </Animated.View>

      {/* Vibe Selection List */}
      <View style={styles.vibeList}>
        {VIBES.map((vibe) => (
          <VibeCard
            key={vibe.id}
            vibe={vibe}
            selected={selectedVibe === vibe.id}
            onSelect={() => handleSelectVibe(vibe.id)}
          />
        ))}
      </View>

      {/* Bottom Action Area */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.bottomArea}>
        <AppButton
          size="lg"
          fullWidth
          disabled={!selectedVibe}
          onPress={handleContinue}
          style={selectedVibe ? styles.continueButtonActive : undefined}
        >
          CONTINUE
        </AppButton>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.lg,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  backArrow: {
    fontSize: 18,
    lineHeight: 20,
    color: theme.colors.text.primary,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size['3xl'],
  },
  subtitle: {
    marginTop: theme.spacing.xs,
  },
  vibeList: {
    marginBottom: theme.spacing.lg,
  },
  bottomArea: {
    marginTop: 'auto',
    paddingTop: theme.spacing.sm,
  },
  continueButtonActive: {
    ...theme.shadow.glow,
  },
});
