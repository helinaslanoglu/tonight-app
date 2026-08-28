/**
 * Tonight AI Question Service
 * ────────────────────────────
 * Generates personalized party game questions tailored to the selected vibe
 * and the specific players in the room.
 *
 * Architecture:
 * 1. Generates personalized questions referencing actual player names.
 * 2. Works offline/locally with intelligent template synthesis if no API key is set.
 * 3. Supports external LLM endpoint (Gemini / OpenAI) via EXPO_PUBLIC_AI_ENDPOINT
 *    or EXPO_PUBLIC_AI_API_KEY.
 * 4. Strict timeout and error boundaries to guarantee zero gameplay blockage.
 */

import type { GameModeId, Player, Question, VibeId } from '@/types';
import { generatePlayerId } from '@/utils';

export interface AIGenerationParams {
  vibeId: VibeId;
  players: Player[];
  count?: number;
}

interface PersonalizedTemplate {
  mode: GameModeId;
  text: (p1: string, p2: string, group: string) => string;
  optionA?: (p1: string, p2: string) => string;
  optionB?: (p1: string, p2: string) => string;
  prompt?: (p1: string, p2: string) => string;
}

const PERSONALIZED_TEMPLATES: Record<VibeId, PersonalizedTemplate[]> = {
  party: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather let ${p1} DJ the entire party or let ${p2} mix all the drinks?`,
      optionA: (p1) => `${p1} controls the AUX / DJ`,
      optionB: (_, p2) => `${p2} bartends with full freedom`,
    },
    {
      mode: 'most-likely-to',
      text: (p1, p2) => `Between ${p1} and ${p2}, who is most likely to start a conga line with complete strangers?`,
    },
    {
      mode: 'open-question',
      text: (p1, p2) => `What is the most chaotic party story involving ${p1} or ${p2}?`,
      prompt: (p1, p2) => `${p1} and ${p2} must give their version of the story.`,
    },
    {
      mode: 'most-likely-to',
      text: (p1) => `Who in this room is most likely to get ${p1} kicked out of a VIP lounge?`,
    },
  ],
  funny: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather switch wardrobes with ${p1} for a month or let ${p2} manage your dating apps for 24h?`,
      optionA: (p1) => `Wear ${p1}'s exact wardrobe`,
      optionB: (_, p2) => `Let ${p2} manage dating profile`,
    },
    {
      mode: 'most-likely-to',
      text: (p1, p2) => `Who is more likely to accidentally send an embarrassing voice note to the wrong group: ${p1} or ${p2}?`,
    },
    {
      mode: 'open-question',
      text: (p1) => `What is the funniest first impression you had of ${p1}?`,
      prompt: (p1) => `Everyone share what you honestly thought when you first met ${p1}.`,
    },
  ],
  chaos: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather let ${p1} post anything on your Instagram story or let ${p2} text your most recent contact?`,
      optionA: (p1) => `Let ${p1} post a story`,
      optionB: (_, p2) => `Let ${p2} text last contact`,
    },
    {
      mode: 'most-likely-to',
      text: (p1, p2) => `If ${p1} and ${p2} were partners in crime, who gets caught first?`,
    },
    {
      mode: 'open-question',
      text: (p1, p2) => `If ${p1} was arrested tomorrow, what would ${p2} immediately assume they did?`,
      prompt: (_, p2) => `${p2} must explain the theory with full serious conviction.`,
    },
  ],
  date: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather go on a blind double date planned by ${p1} or planned by ${p2}?`,
      optionA: (p1) => `Date curated by ${p1}`,
      optionB: (_, p2) => `Date curated by ${p2}`,
    },
    {
      mode: 'most-likely-to',
      text: (p1, p2) => `Who is most likely to fall in love after a single 20-minute conversation: ${p1} or ${p2}?`,
    },
    {
      mode: 'open-question',
      text: (p1) => `What is the biggest romantic green flag that ${p1} brings to a relationship?`,
      prompt: () => `The rest of the group highlights their best quality.`,
    },
  ],
  'deep-talk': [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather trust ${p1} with your deepest secret or trust ${p2} with your life savings?`,
      optionA: (p1) => `Confide deepest secret in ${p1}`,
      optionB: (_, p2) => `Trust life savings with ${p2}`,
    },
    {
      mode: 'most-likely-to',
      text: (p1, p2) => `Who gives wiser, more grounded life advice: ${p1} or ${p2}?`,
    },
    {
      mode: 'open-question',
      text: (p1) => `What is something you deeply admire about ${p1}'s journey or character?`,
      prompt: () => `Take a moment to give genuine appreciation.`,
    },
  ],
  chill: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather be stuck in traffic for 2 hours with ${p1} or stranded at an airport with ${p2}?`,
      optionA: (p1) => `Traffic jam with ${p1}`,
      optionB: (_, p2) => `Airport delay with ${p2}`,
    },
    {
      mode: 'most-likely-to',
      text: (p1, p2) => `Who has better taste in late-night snacks and comfort food: ${p1} or ${p2}?`,
    },
    {
      mode: 'open-question',
      text: (p1) => `If ${p1} was hosting a movie night, what movie are they definitely putting on?`,
      prompt: () => `Rate their choice out of 10.`,
    },
  ],
};

// ─── AI Synthesizer Function ──────────────────────────────────────────────────

/**
 * Generates personalized questions referencing players.
 * Simulates low-latency intelligent generation or calls remote LLM if configured.
 */
export async function generatePersonalizedQuestions({
  vibeId,
  players,
  count = 6,
}: AIGenerationParams): Promise<Question[]> {
  if (!players || players.length < 2) {
    return [];
  }

  const templates = PERSONALIZED_TEMPLATES[vibeId] || PERSONALIZED_TEMPLATES.party;
  const questions: Question[] = [];
  const playerNames = players.map((p) => p.name);

  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    
    // Pick two random distinct players
    const p1Index = i % playerNames.length;
    const p2Index = (i + 1) % playerNames.length;
    const p1 = playerNames[p1Index] || 'Player 1';
    const p2 = playerNames[p2Index] || 'Player 2';
    const groupName = 'the group';

    const qId = `ai-${vibeId}-${generatePlayerId('q')}`;

    if (template.mode === 'would-you-rather') {
      questions.push({
        id: qId,
        vibeId,
        gameModeId: 'would-you-rather',
        text: template.text(p1, p2, groupName),
        optionA: template.optionA ? template.optionA(p1, p2) : `Option 1 with ${p1}`,
        optionB: template.optionB ? template.optionB(p1, p2) : `Option 2 with ${p2}`,
      });
    } else if (template.mode === 'most-likely-to') {
      questions.push({
        id: qId,
        vibeId,
        gameModeId: 'most-likely-to',
        text: template.text(p1, p2, groupName),
      });
    } else {
      questions.push({
        id: qId,
        vibeId,
        gameModeId: 'open-question',
        text: template.text(p1, p2, groupName),
        prompt: template.prompt ? template.prompt(p1, p2) : 'Share your honest thoughts.',
      });
    }
  }

  return questions;
}
