import { generatePersonalizedQuestions } from '@/services/ai';
import type {
  GameMode,
  GameModeId,
  LanguageId,
  Player,
  Question,
  Vibe,
  VibeId,
} from '@/types';

import { GAME_MODES } from './game-modes';
import { getQuestionsByLanguage } from './questions';
import { VIBES } from './vibes';

export { GAME_MODES, getCompatibleGameModes, getGameModeById } from './game-modes';
export {
  ARABIC_QUESTIONS,
  ENGLISH_QUESTIONS,
  FRENCH_QUESTIONS,
  getQuestionsByLanguage,
  QUESTIONS,
  QUESTIONS_BY_LANGUAGE,
  TURKISH_QUESTIONS,
} from './questions';
export { VIBES } from './vibes';

/**
 * Data Access Layer (Hybrid Content Provider)
 * ───────────────────────────────────────────
 * Decouples the UI and game engine from content sources.
 * Combines high-quality curated localized static questions with dynamic,
 * background-synthesized AI questions referencing the active players and language.
 */

export interface ContentFilter {
  language?: LanguageId;
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
    language?: LanguageId;
    vibeId: VibeId;
    players: Player[];
    gameModeId?: GameModeId | 'all';
    count?: number;
  }) => Promise<Question[]>;
}

/**
 * Hybrid content provider combining instant localized questions with AI personalization.
 */
export const defaultContentProvider: ContentProvider = {
  getVibes: async (): Promise<Vibe[]> => {
    return VIBES;
  },

  getGameModes: async (): Promise<GameMode[]> => {
    return GAME_MODES;
  },

  getQuestions: async (filter?: ContentFilter): Promise<Question[]> => {
    const rawQuestions = getQuestionsByLanguage(filter?.language || 'en');
    let result = [...rawQuestions];

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

  getPersonalizedQuestions: async ({
    language = 'en',
    vibeId,
    players,
    gameModeId = 'all',
    count = 6,
  }) => {
    return generatePersonalizedQuestions({ language, vibeId, players, gameModeId, count });
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
  language?: LanguageId;
  vibeId: VibeId;
  players: Player[];
  gameModeId?: GameModeId | 'all';
  count?: number;
}): Promise<Question[]> {
  return defaultContentProvider.getPersonalizedQuestions(params);
}
