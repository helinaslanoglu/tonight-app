import { generatePersonalizedQuestions } from '@/services/ai';
import type { GameMode, GameModeId, Player, Question, Vibe, VibeId } from '@/types';

import { GAME_MODES } from './game-modes';
import { QUESTIONS } from './questions';
import { VIBES } from './vibes';

export { GAME_MODES, getCompatibleGameModes, getGameModeById } from './game-modes';
export { QUESTIONS } from './questions';
export { VIBES } from './vibes';

/**
 * Data Access Layer (Hybrid Content Provider)
 * ───────────────────────────────────────────
 * Decouples the UI and game engine from content sources.
 * Combines high-quality curated static questions with dynamic,
 * background-synthesized AI questions referencing the active players.
 */

export interface ContentFilter {
  vibeId?: VibeId;
  gameModeId?: GameModeId;
  players?: Player[];
  limit?: number;
}

export interface ContentProvider {
  getVibes: () => Promise<Vibe[]>;
  getGameModes: () => Promise<GameMode[]>;
  getQuestions: (filter?: ContentFilter) => Promise<Question[]>;
  getPersonalizedQuestions: (params: {
    vibeId: VibeId;
    players: Player[];
    gameModeId?: GameModeId | 'all';
    count?: number;
  }) => Promise<Question[]>;
}

/**
 * Hybrid content provider combining instant static questions with AI personalization.
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

  getPersonalizedQuestions: async ({ vibeId, players, gameModeId = 'all', count = 6 }) => {
    return generatePersonalizedQuestions({ vibeId, players, gameModeId, count });
  },
};

// ─── Helper Exports ───────────────────────────────────────────────────────────

export async function fetchVibes(): Promise<Vibe[]> {
  return defaultContentProvider.getVibes();
}

export async function fetchGameModes(): Promise<GameMode[]> {
  return defaultContentProvider.getGameModes();
}

export async function fetchQuestions(filter?: ContentFilter): Promise<Question[]> {
  return defaultContentProvider.getQuestions(filter);
}

export async function fetchPersonalizedQuestions(params: {
  vibeId: VibeId;
  players: Player[];
  gameModeId?: GameModeId | 'all';
  count?: number;
}): Promise<Question[]> {
  return defaultContentProvider.getPersonalizedQuestions(params);
}
