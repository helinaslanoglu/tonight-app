/**
 * Supported Languages Definitions
 * ────────────────────────────────
 * Extensible metadata for all supported session languages.
 */

import type { LanguageDefinition, LanguageId } from './types';

export const DEFAULT_LANGUAGE: LanguageId = 'en';

export const LANGUAGES: LanguageDefinition[] = [
  {
    id: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
    direction: 'ltr',
  },
  {
    id: 'tr',
    label: 'Turkish',
    nativeLabel: 'Türkçe',
    flag: '🇹🇷',
    direction: 'ltr',
  },
  {
    id: 'fr',
    label: 'French',
    nativeLabel: 'Français',
    flag: '🇫🇷',
    direction: 'ltr',
  },
  {
    id: 'ar',
    label: 'Arabic',
    nativeLabel: 'العربية',
    flag: '🇸🇦',
    direction: 'rtl',
  },
];

export function getLanguageDefinition(languageId: LanguageId): LanguageDefinition {
  return LANGUAGES.find((l) => l.id === languageId) || LANGUAGES[0];
}
