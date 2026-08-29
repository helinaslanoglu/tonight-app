/**
 * Language & Text Direction Helpers
 * ─────────────────────────────────
 * Centralized RTL / LTR layout helpers to avoid scattering conditionals across components.
 */

import type { LanguageId } from './types';

/**
 * Returns true if the specified language requires Right-To-Left (RTL) layout.
 */
export function isRTL(language?: LanguageId): boolean {
  return language === 'ar';
}

/**
 * Returns 'rtl' or 'ltr' writing direction for styling.
 */
export function getTextDirection(language?: LanguageId): 'rtl' | 'ltr' {
  return isRTL(language) ? 'rtl' : 'ltr';
}

/**
 * Returns standard text alignment based on language direction.
 */
export function getTextAlign(
  language?: LanguageId,
  defaultAlign: 'left' | 'center' | 'right' = 'left'
): 'left' | 'center' | 'right' {
  if (defaultAlign === 'center') return 'center';
  if (isRTL(language)) {
    return defaultAlign === 'left' ? 'right' : 'left';
  }
  return defaultAlign;
}
