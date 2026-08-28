import type { Question } from '@/types';

/**
 * Question dataset for Tonight party game.
 * Original questions across 5 game modes and 6 vibes.
 */
export const QUESTIONS: Question[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. WOULD YOU RATHER
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'wyr-party-1',
    vibeId: 'party',
    gameModeId: 'would-you-rather',
    text: 'Would you rather lose your phone at the club or lose your shoes?',
    optionA: 'Lose my phone',
    optionB: 'Lose my shoes',
  },
  {
    id: 'wyr-party-2',
    vibeId: 'party',
    gameModeId: 'would-you-rather',
    text: 'Would you rather only drink warm tequila or only listen to country music at parties?',
    optionA: 'Warm tequila',
    optionB: 'Country music forever',
  },
  {
    id: 'wyr-party-3',
    vibeId: 'party',
    gameModeId: 'would-you-rather',
    text: 'Would you rather be the DJ with complete aux control or the VIP bartender with unlimited drinks?',
    optionA: 'Aux Controller / DJ',
    optionB: 'VIP Bartender',
  },
  {
    id: 'wyr-funny-1',
    vibeId: 'funny',
    gameModeId: 'would-you-rather',
    text: 'Would you rather accidentally reply-all to a company email or call your teacher/boss "Mom"?',
    optionA: 'Reply-all nightmare',
    optionB: 'Call them Mom',
  },
  {
    id: 'wyr-funny-2',
    vibeId: 'funny',
    gameModeId: 'would-you-rather',
    text: 'Would you rather have a live laugh track follow your life or background dramatic soap opera music?',
    optionA: 'Sitcom laugh track',
    optionB: 'Dramatic soap music',
  },
  {
    id: 'wyr-funny-3',
    vibeId: 'funny',
    gameModeId: 'would-you-rather',
    text: 'Would you rather sweat mayonnaise or sneeze glitter every single time?',
    optionA: 'Mayo sweat',
    optionB: 'Glitter sneeze',
  },
  {
    id: 'wyr-chaos-1',
    vibeId: 'chaos',
    gameModeId: 'would-you-rather',
    text: 'Would you rather let the group read your search history or your last 5 DMs?',
    optionA: 'Search history',
    optionB: 'Last 5 DMs',
  },
  {
    id: 'wyr-chaos-2',
    vibeId: 'chaos',
    gameModeId: 'would-you-rather',
    text: 'Would you rather text your ex "I still think about us" or send a selfie to your boss with no context?',
    optionA: 'Text the ex',
    optionB: 'Selfie to boss',
  },
  {
    id: 'wyr-chaos-3',
    vibeId: 'chaos',
    gameModeId: 'would-you-rather',
    text: 'Would you rather swap lives with someone in this room for a week or switch bodies with your nemesis for a day?',
    optionA: 'Someone here for a week',
    optionB: 'Nemesis for a day',
  },
  {
    id: 'wyr-date-1',
    vibeId: 'date',
    gameModeId: 'would-you-rather',
    text: 'Would you rather go on a first date with bad food or terrible conversation?',
    optionA: 'Awful food, great convo',
    optionB: 'Amazing food, zero convo',
  },
  {
    id: 'wyr-date-2',
    vibeId: 'date',
    gameModeId: 'would-you-rather',
    text: 'Would you rather know on date 1 if they are the one or enjoy the mystery of dating?',
    optionA: 'Know immediately',
    optionB: 'Enjoy the mystery',
  },
  {
    id: 'wyr-deeptalk-1',
    vibeId: 'deep-talk',
    gameModeId: 'would-you-rather',
    text: 'Would you rather know the exact day you will succeed or how you will fail?',
    optionA: 'Day of success',
    optionB: 'How I will fail',
  },
  {
    id: 'wyr-deeptalk-2',
    vibeId: 'deep-talk',
    gameModeId: 'would-you-rather',
    text: 'Would you rather be remembered by millions of strangers or deeply cherished by just five people?',
    optionA: 'Millions of strangers',
    optionB: 'Deeply by 5 people',
  },
  {
    id: 'wyr-chill-1',
    vibeId: 'chill',
    gameModeId: 'would-you-rather',
    text: 'Would you rather have unlimited free coffee for life or unlimited free flight tickets?',
    optionA: 'Unlimited free coffee',
    optionB: 'Unlimited free flights',
  },
  {
    id: 'wyr-chill-2',
    vibeId: 'chill',
    gameModeId: 'would-you-rather',
    text: 'Would you rather spend a rainy Sunday binge-watching movies or playing board games with friends?',
    optionA: 'Movie marathon',
    optionB: 'Board games & snacks',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. MOST LIKELY TO
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'mlt-party-1',
    vibeId: 'party',
    gameModeId: 'most-likely-to',
    text: 'Who is most likely to disappear at the club and show up in another city the next morning?',
  },
  {
    id: 'mlt-party-2',
    vibeId: 'party',
    gameModeId: 'most-likely-to',
    text: 'Who is most likely to order $200 worth of late-night fast food for everyone?',
  },
  {
    id: 'mlt-party-3',
    vibeId: 'party',
    gameModeId: 'most-likely-to',
    text: 'Who is most likely to dance on the table the moment the beat drops?',
  },
  {
    id: 'mlt-funny-1',
    vibeId: 'funny',
    gameModeId: 'most-likely-to',
    text: 'Who is most likely to trip over nothing in public and pretend they were running?',
  },
  {
    id: 'mlt-funny-2',
    vibeId: 'funny',
    gameModeId: 'most-likely-to',
    text: 'Who is most likely to laugh uncontrollably at the most inappropriate serious moment?',
  },
  {
    id: 'mlt-chaos-1',
    vibeId: 'chaos',
    gameModeId: 'most-likely-to',
    text: 'Who is most likely to start drama in the group chat and then immediately mute notifications?',
  },
  {
    id: 'mlt-chaos-2',
    vibeId: 'chaos',
    gameModeId: 'most-likely-to',
    text: 'Who is most likely to impulse dye their hair neon green at 3 AM?',
  },
  {
    id: 'mlt-date-1',
    vibeId: 'date',
    gameModeId: 'most-likely-to',
    text: 'Who is most likely to plan a whole wedding after just three dates?',
  },
  {
    id: 'mlt-date-2',
    vibeId: 'date',
    gameModeId: 'most-likely-to',
    text: 'Who is most likely to fall in love with someone solely based on their Spotify playlist?',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. HOT TAKE
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'ht-chaos-1',
    vibeId: 'chaos',
    gameModeId: 'hot-take',
    text: 'Pineapple on pizza is genuinely elite, and anyone who hates it is just following internet trends.',
    agreeLabel: '100% FACTS',
    disagreeLabel: 'TOTAL CAP',
  },
  {
    id: 'ht-chaos-2',
    vibeId: 'chaos',
    gameModeId: 'hot-take',
    text: 'Going to sleep at 9 PM on a Friday is vastly superior to going out to loud crowded clubs.',
    agreeLabel: 'AGREE',
    disagreeLabel: 'DISAGREE',
  },
  {
    id: 'ht-party-1',
    vibeId: 'party',
    gameModeId: 'hot-take',
    text: 'The pre-game is almost always more fun than the actual party or club itself.',
    agreeLabel: 'FACTS',
    disagreeLabel: 'NO WAY',
  },
  {
    id: 'ht-party-2',
    vibeId: 'party',
    gameModeId: 'hot-take',
    text: 'People who skip the song after 30 seconds on the aux should permanently lose aux privileges.',
    agreeLabel: 'AGREE',
    disagreeLabel: 'DISAGREE',
  },
  {
    id: 'ht-funny-1',
    vibeId: 'funny',
    gameModeId: 'hot-take',
    text: 'Leaving people on "read" is a basic human right and should not require any apology.',
    agreeLabel: 'VALID TAKE',
    disagreeLabel: 'RUDE AF',
  },
  {
    id: 'ht-funny-2',
    vibeId: 'funny',
    gameModeId: 'hot-take',
    text: 'Astrology is just modern superstition with aesthetic graphic design.',
    agreeLabel: 'AGREE',
    disagreeLabel: 'DISAGREE',
  },
  {
    id: 'ht-chill-1',
    vibeId: 'chill',
    gameModeId: 'hot-take',
    text: 'Rewatching your comfort show 10 times is better than starting a new critically acclaimed series.',
    agreeLabel: 'ABSOLUTELY',
    disagreeLabel: 'NOPE',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. WHO KNOWS ME BEST
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'wkmb-party-1',
    vibeId: 'party',
    gameModeId: 'who-knows-me-best',
    text: 'What is the spotlight player’s go-to drink order when celebrating?',
    prompt: 'The spotlight player writes their answer mentally. The group guesses out loud!',
  },
  {
    id: 'wkmb-party-2',
    vibeId: 'party',
    gameModeId: 'who-knows-me-best',
    text: 'What song will guaranteed get the spotlight player running onto the dance floor?',
    prompt: 'Everyone guess the song before the spotlight player reveals.',
  },
  {
    id: 'wkmb-funny-1',
    vibeId: 'funny',
    gameModeId: 'who-knows-me-best',
    text: 'What is the spotlight player’s weirdest pet peeve that instantly annoys them?',
    prompt: 'Group guesses their pet peeve. Spotlight player confirms who was closest!',
  },
  {
    id: 'wkmb-deeptalk-1',
    vibeId: 'deep-talk',
    gameModeId: 'who-knows-me-best',
    text: 'What is the spotlight player’s dream bucket list travel destination?',
    prompt: 'Take turns guessing their dream trip. Spotlight player grades the answers.',
  },
  {
    id: 'wkmb-date-1',
    vibeId: 'date',
    gameModeId: 'who-knows-me-best',
    text: 'What is the spotlight player’s ideal first date scenario?',
    prompt: 'Group pitches what they think the perfect date is for them.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. OPEN QUESTION
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'open-party-1',
    vibeId: 'party',
    gameModeId: 'open-question',
    text: 'What is the absolute wildest night out story this group has ever experienced together?',
    prompt: 'Everyone take turns sharing your side of the story.',
  },
  {
    id: 'open-party-2',
    vibeId: 'party',
    gameModeId: 'open-question',
    text: 'If our friend group was a reality TV show, what would the show title be?',
    prompt: 'Debate and decide on the season finale plot twist.',
  },
  {
    id: 'open-funny-1',
    vibeId: 'funny',
    gameModeId: 'open-question',
    text: 'What is the most ridiculous lie you told as a child that everyone believed?',
    prompt: 'Share and rank the best story in the room.',
  },
  {
    id: 'open-chaos-1',
    vibeId: 'chaos',
    gameModeId: 'open-question',
    text: 'What is an unpopular opinion you have that would get you canceled in 5 minutes?',
    prompt: 'No judgment allowed — defend your take.',
  },
  {
    id: 'open-date-1',
    vibeId: 'date',
    gameModeId: 'open-question',
    text: 'What is the biggest green flag you look for in someone right now?',
    prompt: 'Share what immediately makes someone 10x more attractive to you.',
  },
  {
    id: 'open-deeptalk-1',
    vibeId: 'deep-talk',
    gameModeId: 'open-question',
    text: 'What is one lesson you learned the hard way in the last two years that you are grateful for now?',
    prompt: 'Take your time. Listen without interrupting.',
  },
  {
    id: 'open-chill-1',
    vibeId: 'chill',
    gameModeId: 'open-question',
    text: 'What is your ultimate comfort song that never fails to reset your mood?',
    prompt: 'Play 10 seconds of it if you have your phone ready.',
  },
];
