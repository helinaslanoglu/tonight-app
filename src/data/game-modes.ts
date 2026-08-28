import type { GameMode } from '@/types';

/**
 * Initial game modes available in Tonight MVP.
 */
export const GAME_MODES: GameMode[] = [
  {
    id: 'would-you-rather',
    label: 'Would You Rather',
    emoji: '🤷‍♂️',
    description: 'Pick between two impossible choices',
    minPlayers: 2,
  },
  {
    id: 'most-likely-to',
    label: 'Most Likely To',
    emoji: '👑',
    description: 'Call out who in the group fits best',
    minPlayers: 2,
  },
  {
    id: 'open-question',
    label: 'Open Question',
    emoji: '💬',
    description: 'Start real conversations and hot debates',
    minPlayers: 2,
  },
];
