/**
 * Tonight Results & Persona Insights Engine
 * ──────────────────────────────────────────
 * Pure domain logic to analyze answers, player votes, and stances,
 * generating witty, ironic, humorous, and context-aware persona insights.
 */

import type { GameSession, PlayerInsight, SessionRecap, VibeId } from '@/types';

// Archetype Presets by Vibe & Vote Count
const ARCHETYPES_BY_VIBE: Record<
  VibeId,
  {
    topVote: { badge: string; title: string; roast: string };
    runnerUp: { badge: string; title: string; roast: string };
    chill: { badge: string; title: string; roast: string };
    wildcard: { badge: string; title: string; roast: string };
  }
> = {
  party: {
    topVote: {
      badge: '🥂 VIP Catalyst',
      title: 'Aux Destroyer & Table Dancer',
      roast: 'Voted #1 most likely to lose their shoes and befriend the club bouncer.',
    },
    runnerUp: {
      badge: '⚡ Hype Specialist',
      title: 'Shot Instigator',
      roast: 'Never lets a quiet moment pass without ordering something unnecessary.',
    },
    chill: {
      badge: '🍸 Smooth Observer',
      title: 'VIP Lounge Resident',
      roast: 'Sips drinks quietly while judging everyone else’s dance moves.',
    },
    wildcard: {
      badge: '🎯 Wildcard Legend',
      title: 'Mystery Guest',
      roast: 'Disappears at 2 AM and shows up in someone else’s Instagram story.',
    },
  },
  funny: {
    topVote: {
      badge: '🎭 Sitcom Protagonist',
      title: 'Walking Comedy Disaster',
      roast: 'Voted most likely to trip over nothing and laugh at inappropriate funerals.',
    },
    runnerUp: {
      badge: '🎙️ Roast Master',
      title: 'Zero Filter Champion',
      roast: 'Says what everyone in the room is secretly thinking, but with 200% more volume.',
    },
    chill: {
      badge: '🤫 Silent Laugher',
      title: 'Muted Chaos',
      roast: 'Laughs until crying while pretending to remain completely composed.',
    },
    wildcard: {
      badge: '🤡 Unhinged Theorist',
      title: 'Conspiracy Specialist',
      roast: 'Convinces the room of the wildest theories with complete confidence.',
    },
  },
  chaos: {
    topVote: {
      badge: '🔥 The Instigator',
      title: 'Public Menace #1',
      roast: 'Texts "Hear me out" and single-handedly derails the entire group schedule.',
    },
    runnerUp: {
      badge: '💣 Drama Magnet',
      title: 'Group Chat Hazard',
      roast: 'Drops explosive gossip in the chat and immediately turns on Do Not Disturb.',
    },
    chill: {
      badge: '🛡️ The Enabler',
      title: 'Accomplice in Crime',
      roast: 'Claims to be the voice of reason, but secretly buys the getaway tickets.',
    },
    wildcard: {
      badge: '⚡ Pure Impulse',
      title: '3 AM Decision Maker',
      roast: 'Life motto: "We only live once, so let’s make it everyone else’s problem."',
    },
  },
  date: {
    topVote: {
      badge: '❤️ Hopeless Romantic',
      title: 'Wedding Planner on Date 1',
      roast: 'Falls in love after 15 minutes of eye contact and a shared Spotify playlist.',
    },
    runnerUp: {
      badge: '🌶️ Flirt Specialist',
      title: 'Smooth Operator',
      roast: 'Delivers cheeky compliments with zero hesitation and effortless charm.',
    },
    chill: {
      badge: '🙈 Flustered Royalty',
      title: 'Subtle Soft Spot',
      roast: 'Acts totally calm on the outside while internally melting from romantic tension.',
    },
    wildcard: {
      badge: '🎯 Mystery Crush',
      title: 'Deep Talk Seducer',
      roast: 'Skips all small talk straight to existential life philosophies.',
    },
  },
  'deep-talk': {
    topVote: {
      badge: '🧠 Midnight Philosopher',
      title: 'Soul Reader',
      roast: 'Will analyze your childhood trauma over 2 AM tea with zero judgment.',
    },
    runnerUp: {
      badge: '🔮 Empathic Oracle',
      title: 'Truth Teller',
      roast: 'Gives advice so accurate it feels like a personal callout from the universe.',
    },
    chill: {
      badge: '☕ Gentle Anchor',
      title: 'Grounded Listener',
      roast: 'The friend everyone goes to when the world gets too loud.',
    },
    wildcard: {
      badge: '🌌 Existential Dreamer',
      title: 'Stargazer Mind',
      roast: 'Constantly wondering if we are in a simulation or just tired.',
    },
  },
  chill: {
    topVote: {
      badge: '🛋️ Cozy Overlord',
      title: 'Comfort Curator',
      roast: 'Master of movie marathons, ambient lighting, and elite late-night snacks.',
    },
    runnerUp: {
      badge: '🎧 Lo-Fi Enthusiast',
      title: 'Vibe Architect',
      roast: 'Refuses to let bad music or loud drama ruin a peaceful evening.',
    },
    chill: {
      badge: '🍵 Zen Master',
      title: 'Peaceful Observer',
      roast: 'Completely unbothered by external chaos, happily snacking in peace.',
    },
    wildcard: {
      badge: '🌙 Night Owl',
      title: 'Late Night Thinker',
      roast: 'Only truly wakes up when the clock hits midnight.',
    },
  },
};

/**
 * Evaluates a completed session and generates a rich, witty, contextual recap.
 */
export function generateSessionRecap(session: GameSession): SessionRecap {
  const { vibeId = 'party', players, answers } = session;
  const currentVibe = vibeId || 'party';
  const isDuo = players.length === 2;

  // 1. Tally votes per player
  const voteCounts: Record<string, number> = {};
  players.forEach((p) => {
    voteCounts[p.id] = 0;
  });

  answers.forEach((ans) => {
    if (ans.selectedPlayerId && voteCounts[ans.selectedPlayerId] !== undefined) {
      voteCounts[ans.selectedPlayerId] += 1;
    }
  });

  // Sort players by votes received
  const sortedPlayers = [...players].sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0));

  const vibeArchetypes = ARCHETYPES_BY_VIBE[currentVibe] || ARCHETYPES_BY_VIBE.party;

  // 2. Generate Player Insights
  const playerInsights: PlayerInsight[] = sortedPlayers.map((player, index) => {
    let archetype = vibeArchetypes.wildcard;
    if (index === 0) {
      archetype = vibeArchetypes.topVote;
    } else if (index === 1) {
      archetype = vibeArchetypes.runnerUp;
    } else if (index === 2) {
      archetype = vibeArchetypes.chill;
    }

    return {
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      badge: archetype.badge,
      title: archetype.title,
      roastOrCompliment: archetype.roast,
      voteCount: voteCounts[player.id] || 0,
    };
  });

  // 3. Generate Duo or Group Synergy Summary
  let synergyTitle = '';
  let synergySubtitle = '';
  let vibeSummary = '';

  if (isDuo) {
    const p1 = players[0]?.name || 'Player 1';
    const p2 = players[1]?.name || 'Player 2';

    if (currentVibe === 'date') {
      synergyTitle = '🌶️ 96% Flirty Chemistry & Banter';
      synergySubtitle = `${p1} and ${p2} have undeniable sparks, effortless teasing, and suspicious eye contact.`;
      vibeSummary = 'Tonight proved there is definitely zero awkwardness and high potential between you two.';
    } else if (currentVibe === 'chaos') {
      synergyTitle = '⚡ 99% Unhinged Duo Threat';
      synergySubtitle = `${p1} and ${p2} are an absolute hazard to everyone else’s peace and quiet.`;
      vibeSummary = 'One proposes the crime, the other brings the getaway snacks.';
    } else if (currentVibe === 'funny') {
      synergyTitle = '🎭 100% Sitcom Chemistry';
      synergySubtitle = `${p1} provides the unhinged stories while ${p2} provides the dramatic commentary.`;
      vibeSummary = 'You two need your own podcast or reality TV spinoff immediately.';
    } else if (currentVibe === 'deep-talk') {
      synergyTitle = '🧠 Soulmate Wavelength';
      synergySubtitle = `${p1} and ${p2} skipped all shallow small talk and went straight to the core truths.`;
      vibeSummary = 'Rare, grounded mutual respect with zero filters needed.';
    } else {
      synergyTitle = '🥂 95% Nightlife Energy';
      synergySubtitle = `${p1} and ${p2} together are an unstoppable duo that keeps the party going until sunrise.`;
      vibeSummary = 'Elite mutual hype and unmatched late-night synergy.';
    }
  } else {
    // Group Dynamics (3+ players)
    if (currentVibe === 'chaos') {
      synergyTitle = '💣 Maximum Group Chaos Unlocked';
      synergySubtitle = 'This friend group has zero boundaries and a dangerous level of mutual encouragement.';
      vibeSummary = 'The group chat post-mortem tomorrow is going to require legal disclaimers.';
    } else if (currentVibe === 'date') {
      synergyTitle = '❤️ Romantic Tension & Wingman Synergy';
      synergySubtitle = 'Secret crushes exposed, bold confessions made, and nobody left unscathed.';
      vibeSummary = 'Spicy banter with high emotional investment from the whole room.';
    } else if (currentVibe === 'funny') {
      synergyTitle = '🤣 Unfiltered Comedy Gold';
      synergySubtitle = 'Everyone got roasted, everyone laughed until their ribs hurt.';
      vibeSummary = 'Tonight’s session was a certified classic for the group lore.';
    } else if (currentVibe === 'deep-talk') {
      synergyTitle = '✨ High Trust & Midnight Bonding';
      synergySubtitle = 'Vulnerable truths shared with genuine listening and zero judgment.';
      vibeSummary = 'The kind of conversation that turns good friends into lifelong bonds.';
    } else {
      synergyTitle = '🔥 Elite Nightlife Vibe';
      synergySubtitle = 'High energy, great banter, and continuous laughs across all rounds.';
      vibeSummary = 'Tonight set the benchmark for the next social gathering.';
    }
  }

  // 4. Highlight Question
  const highlightQuestionText =
    session.currentQuestion?.text || 'What is the wildest story this group has ever shared?';

  return {
    synergyTitle,
    synergySubtitle,
    vibeSummary,
    playerInsights,
    highlightQuestionText,
  };
}
