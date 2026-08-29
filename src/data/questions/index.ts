import type { LanguageId, Question } from '@/types';

import { ARABIC_QUESTIONS } from './ar';
import { ENGLISH_QUESTIONS } from './en';
import { FRENCH_QUESTIONS } from './fr';
import { TURKISH_QUESTIONS } from './tr';

export { ARABIC_QUESTIONS } from './ar';
export { ENGLISH_QUESTIONS } from './en';
export { FRENCH_QUESTIONS } from './fr';
export { TURKISH_QUESTIONS } from './tr';

export const QUESTIONS_BY_LANGUAGE: Record<LanguageId, Question[]> = {
  en: ENGLISH_QUESTIONS,
  tr: TURKISH_QUESTIONS,
  fr: FRENCH_QUESTIONS,
  ar: ARABIC_QUESTIONS,
};

/**
 * Returns localized questions for the requested language.
 * Falls back deterministically to English if a language catalog is missing.
 */
export function getQuestionsByLanguage(language: LanguageId = 'en'): Question[] {
  return QUESTIONS_BY_LANGUAGE[language] || ENGLISH_QUESTIONS;
}

/**
 * Default question catalog (English) for backwards compatibility.
 */
export const QUESTIONS: Question[] = ENGLISH_QUESTIONS;
