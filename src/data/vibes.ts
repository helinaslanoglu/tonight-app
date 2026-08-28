import type { Vibe } from '@/types';

/**
 * Centralized list of all available vibes in Tonight.
 * Single source of truth for vibe metadata.
 */
export const VIBES: Vibe[] = [
  {
    id: 'funny',
    label: 'Funny',
    emoji: '😂',
    description: 'Laugh until your stomach hurts',
  },
  {
    id: 'party',
    label: 'Party',
    emoji: '🍸',
    description: 'High energy, hype & drinks',
  },
  {
    id: 'date',
    label: 'Date',
    emoji: '❤️',
    description: 'Flirty questions & chemistry checks',
  },
  {
    id: 'deep-talk',
    label: 'Deep Talk',
    emoji: '🧠',
    description: 'Real conversations & late thoughts',
  },
  {
    id: 'chaos',
    label: 'Chaos',
    emoji: '🤪',
    description: 'Unfiltered, wild & unpredictable',
  },
  {
    id: 'chill',
    label: 'Chill',
    emoji: '😴',
    description: 'Relaxed, easy-going hangout',
  },
];
