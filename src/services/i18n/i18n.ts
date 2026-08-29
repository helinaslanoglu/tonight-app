/**
 * Pure Typed Translation Engine
 * ─────────────────────────────
 * Lightweight, zero-dependency translation resolver with parameter interpolation
 * and deterministic English fallback.
 */

import { ARABIC_TRANSLATIONS } from './translations/ar';
import { ENGLISH_TRANSLATIONS } from './translations/en';
import { FRENCH_TRANSLATIONS } from './translations/fr';
import { TURKISH_TRANSLATIONS } from './translations/tr';
import type { LanguageId, TranslationKey, TranslationMap } from './types';

const TRANSLATIONS: Record<LanguageId, TranslationMap> = {
  en: ENGLISH_TRANSLATIONS,
  tr: TURKISH_TRANSLATIONS,
  fr: FRENCH_TRANSLATIONS,
  ar: ARABIC_TRANSLATIONS,
};

/**
 * Translates a given key into the target language with string interpolation.
 * If translation is missing in the target language, falls back deterministically to English.
 */
export function t(
  key: TranslationKey,
  language: LanguageId = 'en',
  params?: Record<string, string | number>
): string {
  const dictionary = TRANSLATIONS[language] || TRANSLATIONS.en;
  let text = dictionary[key] || TRANSLATIONS.en[key] || key;

  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    }
  }

  return text;
}
