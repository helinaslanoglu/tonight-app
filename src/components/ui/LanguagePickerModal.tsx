import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { LANGUAGES, t } from '@/services/i18n';
import { useLanguage, useSetLanguage } from '@/store';
import { theme } from '@/theme';
import type { LanguageId } from '@/types';
import { haptic } from '@/utils';

export interface LanguagePickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguagePickerModal({ visible, onClose }: LanguagePickerModalProps) {
  const currentLanguage = useLanguage();
  const setLanguage = useSetLanguage();

  const handleSelectLanguage = (langId: LanguageId) => {
    haptic.selection().catch(() => {});
    setLanguage(langId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>

      <View style={styles.sheetContainer} pointerEvents="box-none">
        <Animated.View entering={SlideInDown.duration(280)} style={styles.sheet}>
          <View style={styles.header}>
            <AppText variant="heading" style={styles.headerTitle}>
              {t('setup.languageSectionTitle', currentLanguage)}
            </AppText>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close language selector"
            >
              <AppText style={styles.closeText}>✕</AppText>
            </Pressable>
          </View>

          <View style={styles.optionsList}>
            {LANGUAGES.map((lang) => {
              const isSelected = currentLanguage === lang.id;
              return (
                <Pressable
                  key={lang.id}
                  onPress={() => handleSelectLanguage(lang.id)}
                  style={({ pressed }) => [
                    styles.optionRow,
                    isSelected ? styles.optionRowSelected : styles.optionRowUnselected,
                    pressed && styles.optionPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${lang.label} (${lang.nativeLabel})`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <AppText style={styles.flagEmoji}>{lang.flag}</AppText>
                  <View style={styles.nameContainer}>
                    <AppText
                      variant="label"
                      style={[
                        styles.primaryName,
                        isSelected && { color: theme.colors.accent },
                      ]}
                    >
                      {lang.nativeLabel}
                    </AppText>
                    <AppText variant="caption" color="secondary">
                      {lang.label}
                    </AppText>
                  </View>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <AppText style={styles.checkText}>✓</AppText>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surfaceElevated,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
    borderTopWidth: 1.5,
    borderColor: theme.colors.border,
    ...theme.shadow.glow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.size.lg,
    color: theme.colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '700',
  },
  optionsList: {
    gap: theme.spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
  },
  optionRowSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: theme.colors.accent,
  },
  optionRowUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  optionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  nameContainer: {
    flex: 1,
  },
  primaryName: {
    fontSize: theme.typography.size.md,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#0B0B0F',
    fontWeight: '800',
    fontSize: 14,
  },
});
