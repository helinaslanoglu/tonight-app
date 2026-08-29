/**
 * Tonight Safe Haptics Utility
 * ────────────────────────────
 * Supplemental tactile feedback layer.
 * All functions are guarded with try/catch and fail silently on unsupported
 * environments (web, simulators, node unit tests, or user-disabled vibration).
 */

let hapticsModule: typeof import('expo-haptics') | null = null;

async function getHaptics() {
  if (hapticsModule) return hapticsModule;
  try {
    hapticsModule = await import('expo-haptics');
    return hapticsModule;
  } catch {
    return null;
  }
}

export const haptic = {
  /** Light selection tick (vibe cards, mode selection, player chips, radio options) */
  selection: async (): Promise<void> => {
    try {
      const h = await getHaptics();
      await h?.selectionAsync();
    } catch {
      // Fail silently
    }
  },

  /** Light impact for subtle button taps */
  impactLight: async (): Promise<void> => {
    try {
      const h = await getHaptics();
      await h?.impactAsync(h.ImpactFeedbackStyle.Light);
    } catch {
      // Fail silently
    }
  },

  /** Medium impact for important confirmations (Next Question, Start Game) */
  impactMedium: async (): Promise<void> => {
    try {
      const h = await getHaptics();
      await h?.impactAsync(h.ImpactFeedbackStyle.Medium);
    } catch {
      // Fail silently
    }
  },

  /** Heavy impact for high-energy moments */
  impactHeavy: async (): Promise<void> => {
    try {
      const h = await getHaptics();
      await h?.impactAsync(h.ImpactFeedbackStyle.Heavy);
    } catch {
      // Fail silently
    }
  },

  /** Success notification pattern (Game Completed, all rounds finished) */
  success: async (): Promise<void> => {
    try {
      const h = await getHaptics();
      await h?.notificationAsync(h.NotificationFeedbackType.Success);
    } catch {
      // Fail silently
    }
  },

  /** Error feedback (Validation failure) */
  error: async (): Promise<void> => {
    try {
      const h = await getHaptics();
      await h?.notificationAsync(h.NotificationFeedbackType.Error);
    } catch {
      // Fail silently
    }
  },
};
