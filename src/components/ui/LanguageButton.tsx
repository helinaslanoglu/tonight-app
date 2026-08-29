import React, { useState } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { LanguagePickerModal } from './LanguagePickerModal';
import { LANGUAGES } from '@/services/i18n';
import { useLanguage } from '@/store';
import { theme } from '@/theme';
import { haptic } from '@/utils';

export interface LanguageButtonProps {
  style?: StyleProp<ViewStyle>;
}

export function LanguageButton({ style }: LanguageButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const activeLanguage = useLanguage();
  const activeLangDef = LANGUAGES.find((l) => l.id === activeLanguage);

  return (
    <>
      <Pressable
        onPress={() => {
          haptic.selection().catch(() => {});
          setModalVisible(true);
        }}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Language selector. Current language: ${activeLangDef?.label || 'Language'}`}
      >
        <AppText style={styles.flagEmoji}>{activeLangDef?.flag || '🌐'}</AppText>
      </Pressable>

      <LanguagePickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.sm,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  flagEmoji: {
    fontSize: 18,
  },
});
