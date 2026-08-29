/**
 * Local Synthesizer AI Provider
 * ──────────────────────────────
 * Offline-first, high-speed generative synthesis using curated semantic templates.
 * Enforces strict Game Mode filtering and deterministic ID generation.
 *
 * Guarantees:
 * 1. If gameModeId is specified, ONLY templates matching that gameModeId are synthesized.
 * 2. Deterministic ID generation prevents identical template generations from duplicating.
 */

import type { GameModeId, LanguageId, Question, VibeId } from '@/types';
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

// ─── 2-Player (Duo Dynamics) Templates ────────────────────────────────────────
const DUO_TEMPLATES_BY_VIBE: Record<VibeId, PersonalizedTemplate[]> = {
  date: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather let ${p1} plan an impromptu midnight road trip or let ${p2} cook a candlelit dinner?`,
      optionA: (p1) => `Midnight road trip with ${p1}`,
      optionB: (_, p2) => `Candlelit dinner by ${p2}`,
    },
    {
      mode: 'hot-take',
      text: (p1, p2) => `${p1} definitely gets flustered much faster than ${p2} when romantic tension builds.`,
      agreeLabel: '🔥 100% TRUE',
      disagreeLabel: '🙈 TOTAL CAP',
    },
    {
      mode: 'most-likely-to',
      text: (p1, p2) => `Between you two, who is more likely to fall head-over-heels first: ${p1} or ${p2}?`,
    },
    {
      mode: 'who-knows-me-best',
      text: (p1) => `What is ${p1}'s biggest romantic weakness or soft spot?`,
      prompt: (p1, p2) => `${p2} takes the first guess before ${p1} reveals the truth!`,
    },
    {
      mode: 'open-question',
      text: (p1, p2) => `What was the exact first thought ${p1} had when meeting ${p2}?`,
      prompt: () => 'Be 100% honest — no holding back.',
    },
    {
      mode: 'would-you-rather',
      text: () => 'Would you rather have unmatched late-night deep conversations or effortless flirty chemistry?',
      optionA: () => 'Late-night deep talks',
      optionB: () => 'Magnetic chemistry',
    },
  ],
  chaos: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather let ${p1} go through your unlocked camera roll or let ${p2} text your most recent chat?`,
      optionA: (p1) => `Camera roll to ${p1}`,
      optionB: (_, p2) => `Last DM to ${p2}`,
    },
    {
      mode: 'hot-take',
      text: (p1, p2) => `If ${p1} and ${p2} went to Vegas together, they would be banned from at least one venue by midnight.`,
      agreeLabel: 'GUARANTEED',
      disagreeLabel: 'NO WAY',
    },
    {
      mode: 'most-likely-to',
      text: (p1, p2) => `Between you two, who is the real bad influence in this dynamic: ${p1} or ${p2}?`,
    },
    {
      mode: 'open-question',
      text: (p1, p2) => `If ${p1} and ${p2} were partners in crime, what would your duo codename be?`,
      prompt: () => 'Agree on your chaotic duo alias.',
    },
  ],
  funny: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather hear ${p1} give a 10-minute speech on their conspiracy theories or watch ${p2} do standup comedy?`,
      optionA: (p1) => `${p1}'s conspiracy speech`,
      optionB: (_, p2) => `${p2}'s standup routine`,
    },
    {
      mode: 'hot-take',
      text: (p1) => `${p1} definitely checks their reflection in every car window and mirror they pass.`,
      agreeLabel: 'CAUGHT RED HANDED',
      disagreeLabel: 'INNOCENT',
    },
    {
      mode: 'most-likely-to',
      text: (p1, p2) => `Who is more likely to laugh uncontrollably at the worst possible moment: ${p1} or ${p2}?`,
    },
    {
      mode: 'who-knows-me-best',
      text: (p1) => `What is ${p1}'s weirdest late-night snack combination?`,
      prompt: (p1, p2) => `${p2} guess ${p1}'s midnight guilty pleasure!`,
    },
  ],
  party: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather let ${p1} control the aux all night or let ${p2} order every round of drinks?`,
      optionA: (p1) => `${p1} on Aux Control`,
      optionB: (_, p2) => `${p2} on Drinks Duty`,
    },
    {
      mode: 'hot-take',
      text: (p1, p2) => `${p1} and ${p2} together on a night out is an unstoppable threat to getting home before 4 AM.`,
      agreeLabel: 'FACTS',
      disagreeLabel: 'CAP',
    },
    {
      mode: 'most-likely-to',
      text: (p1, p2) => `Between you two, who is the first to start dancing on tables: ${p1} or ${p2}?`,
    },
    {
      mode: 'who-knows-me-best',
      text: (p1) => `What song will guaranteed get ${p1} screaming every single lyric?`,
      prompt: (p1, p2) => `${p2} guess before ${p1} reveals!`,
    },
  ],
  'deep-talk': [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather trust ${p1} with your deepest secret or trust ${p2} with your emergency bail call?`,
      optionA: (p1) => `Deepest secret to ${p1}`,
      optionB: (_, p2) => `Emergency bail to ${p2}`,
    },
    {
      mode: 'open-question',
      text: (p1, p2) => `What is one quality in ${p2} that ${p1} genuinely admires but rarely says out loud?`,
      prompt: () => 'Take a moment for genuine appreciation.',
    },
    {
      mode: 'who-knows-me-best',
      text: (p1) => `What is something ${p1} is deeply passionate about that few people realize?`,
      prompt: (p1, p2) => `${p2} share what you think ${p1} cares most about.`,
    },
  ],
  chill: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather spend a cozy rainy Sunday marathon watching movies with ${p1} or playing video games with ${p2}?`,
      optionA: (p1) => `Movie day with ${p1}`,
      optionB: (_, p2) => `Gaming day with ${p2}`,
    },
    {
      mode: 'hot-take',
      text: (p1) => `${p1} spends at least 45 minutes browsing Netflix before falling asleep in the first 10 minutes.`,
      agreeLabel: '100% ACCURATE',
      disagreeLabel: 'DEFEND YOURSELF',
    },
    {
      mode: 'open-question',
      text: (p1, p2) => `What is the ultimate comfort hangout plan that ${p1} and ${p2} would both love?`,
      prompt: () => 'Design your dream lazy day.',
    },
  ],
};

// ─── Group (3+ Players) Templates ─────────────────────────────────────────────
const GROUP_TEMPLATES_BY_VIBE: Record<VibeId, PersonalizedTemplate[]> = {
  party: [
    {
      mode: 'would-you-rather',
      text: (p1, p2) => `Would you rather let ${p1} DJ the entire night or let ${p2} mix every single cocktail?`,
      optionA: (p1) => `${p1} has full AUX control`,
      optionB: (_, p2) => `${p2} makes custom drinks`,
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
      prompt: () => 'Everyone call out their best genuine quality.',
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
      prompt: (p1) => 'Share what you think they care most deeply about.',
    },
    {
      mode: 'open-question',
      text: (p1) => `What is one trait you deeply respect about ${p1}'s character?`,
      prompt: () => 'Take a moment to give genuine appreciation.',
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
      prompt: () => 'Everyone rate their movie taste out of 10.',
    },
  ],
};

interface LocalizedTextMap {
  text: (p1: string, p2: string) => string;
  optionA?: (p1: string, p2: string) => string;
  optionB?: (p1: string, p2: string) => string;
  agreeLabel?: string;
  disagreeLabel?: string;
  prompt?: (p1: string, p2: string) => string;
}

function getLocalizedTemplate(
  base: {
    mode: GameModeId;
    text: (p1: string, p2: string, group: string) => string;
    optionA?: (p1: string, p2: string) => string;
    optionB?: (p1: string, p2: string) => string;
    agreeLabel?: string;
    disagreeLabel?: string;
    prompt?: (p1: string, p2: string) => string;
  },
  language: LanguageId,
  p1: string,
  p2: string,
  groupName: string,
  index = 0
): LocalizedTextMap {
  if (language === 'tr') {
    if (base.mode === 'would-you-rather') {
      const wyrTrVariants = [
        {
          text: `${p1} ile plansız bir yolculuğa çıkmayı mı yoksa ${p2} ile baş başa akşam yemeğini mi tercih ederdin?`,
          optA: `${p1} ile yolculuk`,
          optB: `${p2} ile akşam yemeği`,
        },
        {
          text: `${p1}’in müzik listesini 24 saat dinlemeyi mi yoksa ${p2}’nin sana kıyafet seçmesini mi tercih ederdin?`,
          optA: `${p1}’in müzikleri`,
          optB: `${p2}’nin kıyafet seçimi`,
        },
        {
          text: `Bir sırrını ${p1}’e emanet etmeyi mi yoksa ${p2} ile bir hafta aynı evde kalmayı mı tercih ederdin?`,
          optA: `${p1}’e sır vermek`,
          optB: `${p2} ile aynı ev`,
        },
      ];
      const v = wyrTrVariants[index % wyrTrVariants.length];
      return {
        text: () => v.text,
        optionA: () => v.optA,
        optionB: () => v.optB,
      };
    }
    if (base.mode === 'most-likely-to') {
      const mltTrVariants = [
        `${p1} ve ${p2} arasında hangisi bu grupta en çılgın fikri ilk ortaya atar?`,
        `${p1} ve ${p2} arasında hangisi gece yarısı herkesi arayıp dışarı çağırır?`,
        `${p1} ve ${p2} arasında hangisi zor bir durumda daha sakin kalabilir?`,
      ];
      return {
        text: () => mltTrVariants[index % mltTrVariants.length],
      };
    }
    if (base.mode === 'hot-take') {
      const htTrVariants = [
        `${p1}, romantik veya gergin anlarda ${p2}'den çok daha hızlı utanır.`,
        `${p1} ve ${p2} birlikte tatile çıksa ilk günden rotayı kaybederler.`,
        `${p1} bu gruptaki herkesin sırrını en iyi saklayan kişidir.`,
      ];
      return {
        text: () => htTrVariants[index % htTrVariants.length],
        agreeLabel: 'KESİNLİKLE DOĞRU',
        disagreeLabel: 'ASLA KATILMAM',
      };
    }
    if (base.mode === 'who-knows-me-best') {
      return {
        text: () => `${p1} için en unutulmaz tatil veya seyahat hayali nedir?`,
        prompt: () => `${p2} ilk tahmini yapar, sonra ${p1} gerçeği açıklar!`,
      };
    }
    return {
      text: () => `${p1} ve ${p2} ilk tanıştıklarında birbirleri hakkında ne düşünmüştü?`,
      prompt: () => 'Tamamen dürüst olun — hiçbir şeyi saklamayın.',
    };
  }

  if (language === 'fr') {
    if (base.mode === 'would-you-rather') {
      const wyrFrVariants = [
        {
          text: `Préfères-tu partir en voyage improvisé avec ${p1} ou dîner aux chandelles avec ${p2} ?`,
          optA: `Voyage avec ${p1}`,
          optB: `Dîner avec ${p2}`,
        },
        {
          text: `Préfères-tu laisser ${p1} choisir ta tenue ou écouter la playlist de ${p2} en boucle pendant 24h ?`,
          optA: `Tenue par ${p1}`,
          optB: `Playlist de ${p2}`,
        },
        {
          text: `Préfères-tu confier ton plus grand secret à ${p1} ou vivre en coloc avec ${p2} ?`,
          optA: `Secret à ${p1}`,
          optB: `Coloc avec ${p2}`,
        },
      ];
      const v = wyrFrVariants[index % wyrFrVariants.length];
      return {
        text: () => v.text,
        optionA: () => v.optA,
        optionB: () => v.optB,
      };
    }
    if (base.mode === 'most-likely-to') {
      const mltFrVariants = [
        `Entre ${p1} et ${p2}, qui est le plus susceptible de lancer une idée folle ?`,
        `Entre ${p1} et ${p2}, qui est le plus susceptible de motiver tout le groupe à sortir ?`,
        `Entre ${p1} et ${p2}, qui garde son calme le plus longtemps en situation de stress ?`,
      ];
      return {
        text: () => mltFrVariants[index % mltFrVariants.length],
      };
    }
    if (base.mode === 'hot-take') {
      const htFrVariants = [
        `${p1} stresse beaucoup plus vite que ${p2} quand la tension monte.`,
        `Si ${p1} et ${p2} partaient en voyage ensemble, ils se disputeraient sur l'itinéraire dès le premier jour.`,
        `${p1} est secrètement la personne la plus prudente de tout le groupe.`,
      ];
      return {
        text: () => htFrVariants[index % htFrVariants.length],
        agreeLabel: '100% VRAI',
        disagreeLabel: 'PAS D’ACCORD',
      };
    }
    if (base.mode === 'who-knows-me-best') {
      return {
        text: () => `Quel est le plus grand point faible romantique de ${p1} ?`,
        prompt: () => `${p2} devine en premier avant la révélation de ${p1} !`,
      };
    }
    return {
      text: () => `Quelle a été la toute première impression de ${p1} en rencontrant ${p2} ?`,
      prompt: () => 'Soyez 100% honnêtes — sans filtre.',
    };
  }

  if (language === 'ar') {
    if (base.mode === 'would-you-rather') {
      const wyrArVariants = [
        {
          text: `هل تفضل الذهاب في رحلة عفوية مع ${p1} أو تناول عشاء هادئ مع ${p2}؟`,
          optA: `رحلة مع ${p1}`,
          optB: `عشاء مع ${p2}`,
        },
        {
          text: `هل تفضل أن يختار ${p1} ملابسك ليوم كامل أو الاستماع لأغاني ${p2} فقط طوال اليوم؟`,
          optA: `ملابس من ${p1}`,
          optB: `أغاني ${p2}`,
        },
        {
          text: `هل تفضل إخبار ${p1} بأكبر سر لديك أو السكن في شقة واحدة مع ${p2} لأسبوع؟`,
          optA: `سر لـ ${p1}`,
          optB: `سكن مع ${p2}`,
        },
      ];
      const v = wyrArVariants[index % wyrArVariants.length];
      return {
        text: () => v.text,
        optionA: () => v.optA,
        optionB: () => v.optB,
      };
    }
    if (base.mode === 'most-likely-to') {
      const mltArVariants = [
        `بين ${p1} و ${p2}، من الأكثر ترجيحاً أن يقترح خطة جنونية أولاً؟`,
        `بين ${p1} و ${p2}، من الأكثر ترجيحاً أن يحمس الجميع للخروج في منتصف الليل؟`,
        `بين ${p1} و ${p2}، من الأكثر هدوءاً وقدرة على حل المشاكل؟`,
      ];
      return {
        text: () => mltArVariants[index % mltArVariants.length],
      };
    }
    if (base.mode === 'hot-take') {
      const htArVariants = [
        `${p1} يرتبك أسرع بكثير من ${p2} في المواقف المحرجة والمفاجئة.`,
        `لو سافر ${p1} و ${p2} معاً، لضاعا عن الطريق في اليوم الأول بالتأكيد.`,
        `${p1} هو الشخص الأكثر حفظاً لأسرار المجموعة دون أدنى شك.`,
      ];
      return {
        text: () => htArVariants[index % htArVariants.length],
        agreeLabel: 'حقيقة 100%',
        disagreeLabel: 'غير صحيح',
      };
    }
    if (base.mode === 'who-knows-me-best') {
      return {
        text: () => `ما هي أمنية السفر المفضلة والأهم لدى ${p1}؟`,
        prompt: () => `ليخمن ${p2} أولاً قبل أن يكشف ${p1} الحقيقة!`,
      };
    }
    return {
      text: () => `ما هو أول انطباع خطَر في بال ${p1} عند لقاء ${p2} لأول مرة؟`,
      prompt: () => 'كونوا صادقين تماماً دون تردد.',
    };
  }

  // Default: English
  return {
    text: () => base.text(p1, p2, groupName),
    optionA: base.optionA ? () => base.optionA!(p1, p2) : undefined,
    optionB: base.optionB ? () => base.optionB!(p1, p2) : undefined,
    agreeLabel: base.agreeLabel,
    disagreeLabel: base.disagreeLabel,
    prompt: base.prompt ? () => base.prompt!(p1, p2) : undefined,
  };
}

export class LocalSynthesizerProvider implements AIQuestionProvider {
  readonly name = 'LocalSynthesizer';

  async generateQuestions(params: AIGenerationParams): Promise<Question[]> {
    const { vibeId, players, gameModeId = 'all', count = 6, language = 'en' } = params;
    if (!players || players.length < 2) return [];

    const isDuo = players.length === 2;
    const templateSource = isDuo ? DUO_TEMPLATES_BY_VIBE : GROUP_TEMPLATES_BY_VIBE;
    let templates = templateSource[vibeId] || templateSource.party;

    // Filter templates strictly by gameModeId if a specific mode is requested
    if (gameModeId && gameModeId !== 'all') {
      const modeFiltered = templates.filter((t) => t.mode === gameModeId);
      if (modeFiltered.length > 0) {
        templates = modeFiltered;
      } else {
        // If this vibe has no templates for this mode, look in other vibes for the SAME mode
        const allTemplates = Object.values(templateSource).flat();
        const fallbackModeTemplates = allTemplates.filter((t) => t.mode === gameModeId);
        if (fallbackModeTemplates.length > 0) {
          templates = fallbackModeTemplates;
        }
      }
    }

    if (templates.length === 0) return [];

    const questions: Question[] = [];
    const playerNames = players.map((p) => p.name);
    const sortedPlayerIds = players.map((p) => p.id).sort().join('-');

    for (let i = 0; i < count; i++) {
      const templateIdx = i % templates.length;
      const template = templates[templateIdx];
      const p1Index = i % playerNames.length;
      const p2Index = (i + 1) % playerNames.length;
      const p1 = playerNames[p1Index] || 'Player 1';
      const p2 = playerNames[p2Index] || 'Player 2';
      const groupName = isDuo ? 'you two' : 'the group';

      const localized = getLocalizedTemplate(template, language, p1, p2, groupName, i);

      // Deterministic question ID ensures identical generations across sessions are caught by deduplicator
      const qId = `ai-${language}-${vibeId}-${template.mode}-${templateIdx}-${i}-${sortedPlayerIds}`;

      if (template.mode === 'would-you-rather') {
        questions.push({
          id: qId,
          vibeId,
          gameModeId: 'would-you-rather',
          language,
          text: localized.text(p1, p2),
          optionA: localized.optionA ? localized.optionA(p1, p2) : `Choice with ${p1}`,
          optionB: localized.optionB ? localized.optionB(p1, p2) : `Choice with ${p2}`,
        });
      } else if (template.mode === 'most-likely-to') {
        questions.push({
          id: qId,
          vibeId,
          gameModeId: 'most-likely-to',
          language,
          text: localized.text(p1, p2),
        });
      } else if (template.mode === 'hot-take') {
        questions.push({
          id: qId,
          vibeId,
          gameModeId: 'hot-take',
          language,
          text: localized.text(p1, p2),
          agreeLabel: localized.agreeLabel || 'AGREE',
          disagreeLabel: localized.disagreeLabel || 'DISAGREE',
        });
      } else if (template.mode === 'who-knows-me-best') {
        questions.push({
          id: qId,
          vibeId,
          gameModeId: 'who-knows-me-best',
          language,
          text: localized.text(p1, p2),
          prompt: localized.prompt ? localized.prompt(p1, p2) : 'Guess the truth!',
        });
      } else {
        questions.push({
          id: qId,
          vibeId,
          gameModeId: 'open-question',
          language,
          text: localized.text(p1, p2),
          prompt: localized.prompt ? localized.prompt(p1, p2) : 'Share your honest thoughts.',
        });
      }
    }

    return questions;
  }
}
