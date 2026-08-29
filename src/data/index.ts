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
 * Hydrates questions with active session players:
 * - For Who Knows Me Best questions, deterministically assigns a target player from the roster,
 *   embeds the target player's name into the text, and sets `targetPlayerId`.
 */
export function hydrateQuestionsForPlayers(
  questions: Question[],
  players?: Player[]
): Question[] {
  if (!players || players.length === 0) {
    return questions;
  }

  return questions.map((q, index) => {
    if (q.gameModeId === 'who-knows-me-best') {
      const targetPlayer = players[index % players.length] || players[0];
      const hydratedText = q.text.replace(/\{target\}/g, targetPlayer.name);
      const hydratedPrompt = q.prompt ? q.prompt.replace(/\{target\}/g, targetPlayer.name) : undefined;
      return {
        ...q,
        targetPlayerId: targetPlayer.id,
        text: hydratedText,
        prompt: hydratedPrompt,
      };
    }
    return q;
  });
}

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

    if (filter?.players && filter.players.length > 0) {
      result = hydrateQuestionsForPlayers(result, filter.players);
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
