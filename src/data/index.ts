import type { GameMode, GameModeId, Question, Vibe, VibeId } from '@/types';

import { GAME_MODES } from './game-modes';
import { QUESTIONS } from './questions';
import { VIBES } from './vibes';

export { GAME_MODES } from './game-modes';
export { QUESTIONS } from './questions';
export { VIBES } from './vibes';

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
 * Default local content provider.
 */
export const defaultContentProvider: ContentProvider = {
  getVibes: async (): Promise<Vibe[]> => {
    return VIBES;
  },

  getGameModes: async (): Promise<GameMode[]> => {
    return GAME_MODES;
  },

  getQuestions: async (filter?: ContentFilter): Promise<Question[]> => {
    let result = [...QUESTIONS];

    if (filter?.vibeId) {
      result = result.filter((q) => q.vibeId === filter.vibeId);
    }

    if (filter?.gameModeId) {
      result = result.filter((q) => q.gameModeId === filter.gameModeId);
    }

    if (filter?.limit && filter.limit > 0) {
      result = result.slice(0, filter.limit);
    }

    return result;
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
