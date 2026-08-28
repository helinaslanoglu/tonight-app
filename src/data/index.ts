import type { GameMode, GameModeId, Question, Vibe, VibeId } from '@/types';

/**
 * Data Access Layer (Boundary Contract)
 * ──────────────────────────────────────
 * Decouples the UI and game engine from the underlying content source.
 * In future milestones, this layer can seamlessly fetch from:
 *   - Local JSON / bundle assets
 *   - Remote REST / GraphQL CMS API
 *   - AI generation service
 *   - Offline synced database
 *
 * Calling code always interacts via this interface.
 */

export interface ContentFilter {
  vibeId?: VibeId;
  gameModeId?: GameModeId;
  limit?: number;
}

export interface ContentProvider {
  getVibes: () => Promise<Vibe[]>;
  getGameModes: () => Promise<GameMode[]>;
  getQuestions: (filter?: ContentFilter) => Promise<Question[]>;
}

/**
 * Default local content provider stub.
 * Concrete question banks and vibe metadata will be populated in Milestone 3+.
 */
export const defaultContentProvider: ContentProvider = {
  getVibes: async (): Promise<Vibe[]> => {
    return [];
  },

  getGameModes: async (): Promise<GameMode[]> => {
    return [];
  },

  getQuestions: async (_filter?: ContentFilter): Promise<Question[]> => {
    return [];
  },
};

// ─── Direct helper exports for convenience ────────────────────────────────────

export async function fetchVibes(): Promise<Vibe[]> {
  return defaultContentProvider.getVibes();
}

export async function fetchGameModes(): Promise<GameMode[]> {
  return defaultContentProvider.getGameModes();
}

export async function fetchQuestions(filter?: ContentFilter): Promise<Question[]> {
  return defaultContentProvider.getQuestions(filter);
}
