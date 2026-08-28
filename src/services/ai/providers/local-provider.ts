/**
 * Local Synthesizer AI Provider
 * ──────────────────────────────
 * Offline-first, high-speed generative synthesis using curated semantic templates.
 * Zero API keys, zero network latency, 100% reliable.
 */

import type { GameModeId, Question, VibeId } from '@/types';
import { generatePlayerId } from '@/utils';
import type { AIGenerationParams, AIQuestionProvider } from '../types';

interface PersonalizedTemplate {
  mode: GameModeId;
  text: (p1: string, p2: string, group: string) => string;
  optionA?: (p1: string, p2: string) => string;
  optionB?: (p1: string, p2: string) => string;
  prompt?: (p1: string, p2: string) => string;
  agreeLabel?: string;
  disagreeLabel?: string;
}

const TEMPLATES_BY_VIBE: Record<VibeId, PersonalizedTemplate[]> = {
  party: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather let ${p1} DJ the entire night or let ${p2} mix every single drink?`,
      optionA: (p1) => `${p1} has full AUX control`,
      optionB: (_, p2) => `${p2} makes all custom cocktails`,
    },
    {
      mode: 'most-likely-to',
      text: (p1, p2) => `Between ${p1} and ${p2}, who is most likely to start a conga line with total strangers?`,
    },
    {
      mode: 'hot-take',
      text: (p1) => `${p1} has the most controversial music taste in this entire room.`,
      agreeLabel: '100% FACTS',
      disagreeLabel: 'TOTAL CAP',
    },
    {
      mode: 'who-knows-me-best',
      text: (p1) => `What is ${p1}'s absolute dream hype song when going out?`,
      prompt: (p1) => `${p1} holds the answer. The rest of the group guesses!`,
    },
    {
      mode: 'open-question',
      text: (p1, p2) => `What is the wildest party story involving ${p1} or ${p2}?`,
      prompt: (p1, p2) => `${p1} and ${p2} must share their side of the story.`,
    },
  ],
  funny: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather switch closets with ${p1} for a month or let ${p2} manage your dating apps for 24h?`,
      optionA: (p1) => `Wear ${p1}'s exact wardrobe`,
      optionB: (_, p2) => `Let ${p2} control dating profile`,
    },
    {
      mode: 'most-likely-to',
      text: (p1, p2) => `Who is more likely to accidentally send an embarrassing screenshot to the person it was about: ${p1} or ${p2}?`,
    },
    {
      mode: 'hot-take',
      text: (p1) => `${p1} would be the first person eliminated on a reality TV survival show.`,
      agreeLabel: 'AGREE',
      disagreeLabel: 'DISAGREE',
    },
    {
      mode: 'who-knows-me-best',
      text: (p1) => `What is ${p1}'s weirdest guilty pleasure snack?`,
      prompt: (p1) => `Group guesses what ${p1} loves eating late at night!`,
    },
    {
      mode: 'open-question',
      text: (p1) => `What is the funniest first impression you ever had of ${p1}?`,
      prompt: (p1) => `Everyone describe what you honestly thought when you first met ${p1}.`,
    },
  ],
  chaos: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather let ${p1} post anything on your main social story or let ${p2} text your most recent contact?`,
      optionA: (p1) => `Let ${p1} post a photo`,
      optionB: (_, p2) => `Let ${p2} text my last DM`,
    },
    {
      mode: 'most-likely-to',
      text: (p1, p2) => `If ${p1} and ${p2} were partners in crime, who gets caught within the first 10 minutes?`,
    },
    {
      mode: 'hot-take',
      text: (p1, p2) => `If ${p1} and ${p2} got into an argument, ${p1} would definitely win purely with volume.`,
      agreeLabel: 'NO DOUBT',
      disagreeLabel: 'FALSE',
    },
    {
      mode: 'open-question',
      text: (p1, p2) => `If ${p1} was arrested tomorrow, what would ${p2} immediately assume they did?`,
      prompt: (_, p2) => `${p2} must give a serious explanation with evidence.`,
    },
  ],
  date: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather go on a blind double date planned by ${p1} or planned by ${p2}?`,
      optionA: (p1) => `Date planned by ${p1}`,
      optionB: (_, p2) => `Date planned by ${p2}`,
    },
    {
      mode: 'most-likely-to',
      text: (p1, p2) => `Who is most likely to fall head-over-heels after a single 20-minute conversation: ${p1} or ${p2}?`,
    },
    {
      mode: 'who-knows-me-best',
      text: (p1) => `What is ${p1}'s biggest pet peeve on a first date?`,
      prompt: (p1) => `Everyone guess ${p1}'s instant dealbreaker!`,
    },
    {
      mode: 'open-question',
      text: (p1) => `What is the biggest romantic green flag that ${p1} brings into relationships?`,
      prompt: () => `Everyone call out their best genuine quality.`,
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
      mode: 'who-knows-me-best',
      text: (p1) => `What is something that ${p1} is deeply passionate about that few people know?`,
      prompt: (p1) => `Share what you think ${p1} cares most deeply about.`,
    },
    {
      mode: 'open-question',
      text: (p1) => `What is one trait you deeply respect about ${p1}'s character?`,
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
      mode: 'hot-take',
      text: (p1) => `${p1} spends way more time deciding what movie to watch than actually watching it.`,
      agreeLabel: '100% TRUE',
      disagreeLabel: 'CAP',
    },
    {
      mode: 'open-question',
      text: (p1) => `If ${p1} was hosting a cozy movie night, what movie are they definitely putting on?`,
      prompt: () => `Everyone rate their movie taste out of 10.`,
    },
  ],
};

export class LocalSynthesizerProvider implements AIQuestionProvider {
  readonly name = 'LocalSynthesizer';

  async generateQuestions(params: AIGenerationParams): Promise<Question[]> {
    const { vibeId, players, count = 6 } = params;
    if (!players || players.length < 2) return [];

    const templates = TEMPLATES_BY_VIBE[vibeId] || TEMPLATES_BY_VIBE.party;
    const questions: Question[] = [];
    const playerNames = players.map((p) => p.name);

    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
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
          optionA: template.optionA ? template.optionA(p1, p2) : `Choice with ${p1}`,
          optionB: template.optionB ? template.optionB(p1, p2) : `Choice with ${p2}`,
        });
      } else if (template.mode === 'most-likely-to') {
        questions.push({
          id: qId,
          vibeId,
          gameModeId: 'most-likely-to',
          text: template.text(p1, p2, groupName),
        });
      } else if (template.mode === 'hot-take') {
        questions.push({
          id: qId,
          vibeId,
          gameModeId: 'hot-take',
          text: template.text(p1, p2, groupName),
          agreeLabel: template.agreeLabel || 'AGREE',
          disagreeLabel: template.disagreeLabel || 'DISAGREE',
        });
      } else if (template.mode === 'who-knows-me-best') {
        questions.push({
          id: qId,
          vibeId,
          gameModeId: 'who-knows-me-best',
          text: template.text(p1, p2, groupName),
          prompt: template.prompt ? template.prompt(p1, p2) : 'Guess the truth!',
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
}
