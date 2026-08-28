import type { GameMode, GameModeId, VibeId } from '@/types';

/**
 * Single source of truth for all Game Modes in Tonight.
 */
export const GAME_MODES: GameMode[] = [
  {
    id: 'would-you-rather',
    label: 'Would You Rather',
    tagline: 'Pick between two impossible choices',
    description: 'Two chaotic options. Vote on which one you’d rather endure.',
    emoji: '🤷‍♂️',
    minPlayers: 2,
    supportedVibes: ['party', 'funny', 'chaos', 'date', 'chill', 'deep-talk'],
    interactionType: 'choice',
  },
  {
    id: 'most-likely-to',
    label: 'Most Likely To',
    tagline: 'Call out who fits the description best',
    description: 'No filters allowed. Tap who in the room is guilty.',
    emoji: '👑',
    minPlayers: 2,
    supportedVibes: ['party', 'funny', 'chaos', 'date'],
    interactionType: 'player-select',
  },
  {
    id: 'hot-take',
    label: 'Hot Take',
    tagline: 'Unpopular opinions & spicy debates',
    description: 'Hear a spicy claim. Stand your ground: Agree or Disagree.',
    emoji: '🔥',
    minPlayers: 2,
    supportedVibes: ['chaos', 'party', 'funny', 'chill'],
    interactionType: 'stance',
  },
  {
    id: 'who-knows-me-best',
    label: 'Who Knows Me Best',
    tagline: 'One player in the spotlight, everyone guesses',
    description: 'A spotlight player holds the answer. Can the group guess it correctly?',
    emoji: '🎯',
    minPlayers: 2,
    supportedVibes: ['party', 'deep-talk', 'date', 'funny'],
    interactionType: 'spotlight-quiz',
  },
  {
    id: 'open-question',
    label: 'Open Question',
    tagline: 'Deep talks, crazy stories & no filters',
    description: 'Spill tea, tell unfiltered stories, and start genuine conversations.',
    emoji: '💬',
    minPlayers: 2,
    supportedVibes: ['deep-talk', 'chill', 'date', 'party', 'funny', 'chaos'],
    interactionType: 'discussion',
  },
];

/**
 * Returns game modes compatible with a given vibe and player count.
 */
export function getCompatibleGameModes(vibeId: VibeId, playerCount = 2): GameMode[] {
  return GAME_MODES.filter(
    (mode) => mode.supportedVibes.includes(vibeId) && playerCount >= mode.minPlayers
  );
}

/**
 * Finds a game mode by ID.
 */
export function getGameModeById(id: GameModeId | string): GameMode | undefined {
  return GAME_MODES.find((m) => m.id === id);
}
