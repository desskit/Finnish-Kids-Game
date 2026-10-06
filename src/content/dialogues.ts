// Conversations — short, everyday Finnish exchanges for the "choose the right
// reply" game. These are HUMAN-AUTHORED fixed conversational phrases (greetings,
// courtesies, classroom talk), the same kind of hand-vetted content as the
// carrier phrases and sentence templates. They are set expressions, not
// rule-inflected forms, so the golden rule (never generate Finnish forms in
// code) is respected: nothing here is produced by an algorithm.
//
// Each exchange gives the OTHER speaker's line (the prompt) and the reply the
// child should pick, plus a couple of plausible-but-wrong replies. Distractors
// are real, correct Finnish for OTHER situations — so the skill practiced is
// pragmatic appropriateness ("what do you say back?"), not spotting broken
// Finnish. Tiers gate difficulty like everywhere else (t1 = the simplest
// greetings, t2 = names/age/courtesies, t3 = everyday wh-questions +
// leave-taking, t4 = favourites / turn-taking / birthday).
//
// AUTHORING RULE: every prompt must have exactly ONE pragmatically fitting
// reply. Distractors are backfilled from OTHER exchanges' replies, so a second
// valid answer (e.g. a bare "yes"/"no" to a polar question) could slip into the
// options — hence only wh-questions and ritual adjacency pairs live here.

export interface DialogueLine {
  fi: string;
  en: string;
}

// Every line that states "my name is ___" carries this placeholder instead of
// a hardcoded name, so the round builder can fill in the CHILD'S OWN name
// (see personalizeLine, used by buildDialogueRound/buildConversation in
// src/game/round.ts) — a nominative name slot, so nothing is inflected/generated.
export const NAME_PLACEHOLDER = '{name}';

/** Fill a line's {name} placeholder with the child's own name (falls back to
 *  the original vetted name when none is set yet, e.g. a brand-new profile). */
export function personalizeLine(line: DialogueLine, name: string): DialogueLine {
  if (!line.fi.includes(NAME_PLACEHOLDER)) return line;
  const safeName = name.trim() || 'Aino';
  return {
    fi: line.fi.split(NAME_PLACEHOLDER).join(safeName),
    en: line.en.split(NAME_PLACEHOLDER).join(safeName),
  };
}

export interface DialogueExchange {
  id: string;
  /** The line the child hears/reads (the other person speaks first). */
  prompt: DialogueLine;
  /** The appropriate reply — the correct answer. */
  reply: DialogueLine;
  /** Correct Finnish for OTHER moments — wrong as a reply HERE. */
  distractors: DialogueLine[];
  tier: number;
}

export const dialogues: DialogueExchange[] = [
  {
    id: 'how-are-you',
    prompt: { fi: 'Mitä kuuluu?', en: 'How are you?' },
    reply: { fi: 'Hyvää, kiitos!', en: 'Good, thanks!' },
    distractors: [
      { fi: 'Näkemiin!', en: 'Goodbye!' },
      { fi: 'Ole hyvä.', en: "You're welcome." },
    ],
    tier: 1,
  },
  {
    id: 'thanks',
    prompt: { fi: 'Kiitos!', en: 'Thank you!' },
    reply: { fi: 'Ole hyvä!', en: "You're welcome!" },
    distractors: [
      { fi: 'Anteeksi.', en: 'Sorry.' },
      { fi: 'Hyvää huomenta.', en: 'Good morning.' },
    ],
    tier: 1,
  },
  {
    id: 'good-morning',
    prompt: { fi: 'Hyvää huomenta!', en: 'Good morning!' },
    reply: { fi: 'Hyvää huomenta!', en: 'Good morning!' },
    distractors: [
      { fi: 'Hyvää yötä!', en: 'Good night!' },
      { fi: 'Kiitos!', en: 'Thank you!' },
    ],
    tier: 1,
  },
  {
    id: 'goodbye',
    prompt: { fi: 'Näkemiin!', en: 'Goodbye!' },
    reply: { fi: 'Hei hei!', en: 'Bye bye!' },
    distractors: [
      { fi: 'Hyvää päivää.', en: 'Good day.' },
      { fi: 'Anteeksi.', en: 'Excuse me.' },
    ],
    tier: 1,
  },
  {
    id: 'good-night',
    prompt: { fi: 'Hyvää yötä!', en: 'Good night!' },
    reply: { fi: 'Hyvää yötä!', en: 'Good night!' },
    distractors: [
      { fi: 'Hyvää huomenta!', en: 'Good morning!' },
      { fi: 'Kiitos!', en: 'Thank you!' },
    ],
    tier: 1,
  },
  {
    id: 'here-you-go',
    prompt: { fi: 'Ole hyvä!', en: 'Here you go!' },
    reply: { fi: 'Kiitos!', en: 'Thank you!' },
    distractors: [
      { fi: 'Anteeksi.', en: 'Sorry.' },
      { fi: 'Näkemiin.', en: 'Goodbye.' },
    ],
    tier: 1,
  },
  {
    id: 'sorry',
    prompt: { fi: 'Anteeksi!', en: 'Sorry!' },
    reply: { fi: 'Ei se mitään.', en: "It's okay." },
    distractors: [
      { fi: 'Kiitos!', en: 'Thank you!' },
      { fi: 'Hyvää yötä.', en: 'Good night.' },
    ],
    tier: 2,
  },
  {
    id: 'your-name',
    prompt: { fi: 'Mikä sinun nimesi on?', en: "What's your name?" },
    reply: { fi: 'Nimeni on {name}.', en: 'My name is {name}.' },
    distractors: [
      { fi: 'Hyvää, kiitos.', en: 'Good, thanks.' },
      { fi: 'Näkemiin!', en: 'Goodbye!' },
    ],
    tier: 2,
  },
  {
    id: 'how-old',
    prompt: { fi: 'Kuinka vanha olet?', en: 'How old are you?' },
    reply: { fi: 'Olen viisivuotias.', en: "I'm five years old." },
    distractors: [
      { fi: 'Nimeni on {name}.', en: 'My name is {name}.' },
      { fi: 'Kiitos hyvää.', en: 'Fine, thanks.' },
    ],
    tier: 2,
  },
  {
    id: 'nice-to-meet',
    prompt: { fi: 'Hauska tutustua!', en: 'Nice to meet you!' },
    // Reviewer-corrected echo reply. Illative ("sinuunkin") because tutustua
    // governs the illative; the partitive echo ("sinuakin") pairs with tavata.
    reply: { fi: 'Niin sinuunkin!', en: 'You too!' },
    distractors: [
      { fi: 'Ole hyvä.', en: "You're welcome." },
      { fi: 'Hyvää yötä.', en: 'Good night.' },
    ],
    tier: 2,
  },

  // --- Tier 3: everyday wh-questions + leave-taking (each has ONE fitting
  // reply, so the pooled distractors never accidentally become a second right
  // answer). ---
  {
    id: 'where-going',
    prompt: { fi: 'Minne menet?', en: 'Where are you going?' },
    reply: { fi: 'Menen kotiin.', en: "I'm going home." },
    distractors: [
      { fi: 'Hyvää yötä.', en: 'Good night.' },
      { fi: 'Ole hyvä.', en: "You're welcome." },
    ],
    tier: 3,
  },
  {
    id: 'what-is-this',
    prompt: { fi: 'Mikä tämä on?', en: 'What is this?' },
    reply: { fi: 'Se on kirja.', en: "It's a book." },
    distractors: [
      { fi: 'Näkemiin!', en: 'Goodbye!' },
      { fi: 'Anteeksi.', en: 'Sorry.' },
    ],
    tier: 3,
  },
  {
    id: 'good-day',
    prompt: { fi: 'Hyvää päivää!', en: 'Good day!' },
    reply: { fi: 'Hyvää päivää!', en: 'Good day!' },
    distractors: [
      { fi: 'Hyvää yötä!', en: 'Good night!' },
      { fi: 'Kiitos!', en: 'Thank you!' },
    ],
    tier: 3,
  },
  {
    id: 'see-tomorrow',
    prompt: { fi: 'Nähdään huomenna!', en: 'See you tomorrow!' },
    reply: { fi: 'Nähdään!', en: 'See you!' },
    distractors: [
      { fi: 'Ei se mitään.', en: "It's okay." },
      { fi: 'Ole hyvä.', en: "You're welcome." },
    ],
    tier: 3,
  },
  {
    id: 'where-live',
    prompt: { fi: 'Missä sinä asut?', en: 'Where do you live?' },
    reply: { fi: 'Asun Suomessa.', en: 'I live in Finland.' },
    distractors: [
      { fi: 'Olen viisivuotias.', en: "I'm five years old." },
      { fi: 'Hyvää, kiitos.', en: 'Good, thanks.' },
    ],
    tier: 3,
  },
  {
    id: 'welcome',
    prompt: { fi: 'Tervetuloa!', en: 'Welcome!' },
    reply: { fi: 'Kiitos!', en: 'Thank you!' },
    distractors: [
      { fi: 'Näkemiin!', en: 'Goodbye!' },
      { fi: 'Anteeksi.', en: 'Sorry.' },
    ],
    tier: 3,
  },

  // --- Tier 4: a little more to hold in mind (favourite, turn-taking, a
  // birthday wish). ---
  {
    id: 'fav-color',
    prompt: { fi: 'Mikä on lempivärisi?', en: "What's your favorite color?" },
    reply: { fi: 'Sininen.', en: 'Blue.' },
    distractors: [
      { fi: 'Se on kirja.', en: "It's a book." },
      { fi: 'Nimeni on {name}.', en: 'My name is {name}.' },
    ],
    tier: 4,
  },
  {
    id: 'whose-turn',
    prompt: { fi: 'Kenen vuoro on?', en: 'Whose turn is it?' },
    reply: { fi: 'Minun vuoroni!', en: 'My turn!' },
    distractors: [
      { fi: 'Se on kirja.', en: "It's a book." },
      { fi: 'Samoin!', en: 'You too!' },
    ],
    tier: 4,
  },
  {
    id: 'happy-birthday',
    prompt: { fi: 'Hyvää syntymäpäivää!', en: 'Happy birthday!' },
    reply: { fi: 'Kiitos!', en: 'Thank you!' },
    distractors: [
      { fi: 'Hyvää huomenta!', en: 'Good morning!' },
      { fi: 'Näkemiin!', en: 'Goodbye!' },
    ],
    tier: 4,
  },

  // --- NEW: school / mealtime / feelings & weather. Every prompt is a
  // wh-question or a ritual pair (one fitting reply); distractors reuse the
  // already-vetted set phrases above. ⚠️ NEEDS NATIVE FINNISH VETTING. ---
  {
    id: 'who-wants',
    prompt: { fi: 'Kuka haluaa vastata?', en: 'Who wants to answer?' },
    reply: { fi: 'Minä!', en: 'Me!' },
    distractors: [
      { fi: 'Ole hyvä.', en: "You're welcome." },
      { fi: 'Näkemiin!', en: 'Goodbye!' },
    ],
    tier: 3,
  },
  {
    id: 'thanks-food',
    prompt: { fi: 'Kiitos ruoasta!', en: 'Thanks for the food!' },
    reply: { fi: 'Ole hyvä!', en: "You're welcome!" },
    distractors: [
      { fi: 'Anteeksi.', en: 'Sorry.' },
      { fi: 'Näkemiin!', en: 'Goodbye!' },
    ],
    tier: 2,
  },
  {
    id: 'enjoy-meal',
    prompt: { fi: 'Hyvää ruokahalua!', en: 'Enjoy your meal!' },
    reply: { fi: 'Kiitos samoin!', en: 'Thanks, you too!' },
    distractors: [
      { fi: 'Anteeksi.', en: 'Sorry.' },
      { fi: 'Hyvää yötä.', en: 'Good night.' },
    ],
    tier: 3,
  },
  {
    id: 'feeling',
    prompt: { fi: 'Miltä sinusta tuntuu?', en: 'How do you feel?' },
    reply: { fi: 'Olen iloinen!', en: 'I feel happy!' },
    distractors: [
      { fi: 'Se on kirja.', en: "It's a book." },
      { fi: 'Näkemiin!', en: 'Goodbye!' },
    ],
    tier: 4,
  },
  {
    id: 'weather',
    prompt: { fi: 'Millainen sää on?', en: "What's the weather like?" },
    reply: { fi: 'Aurinko paistaa.', en: 'The sun is shining.' },
    distractors: [
      { fi: 'Olen viisivuotias.', en: "I'm five years old." },
      { fi: 'Se on kirja.', en: "It's a book." },
    ],
    tier: 4,
  },
  {
    id: 'favorite-food',
    prompt: { fi: 'Mikä on lempiruokasi?', en: "What's your favorite food?" },
    reply: { fi: 'Pitsa.', en: 'Pizza.' },
    distractors: [
      { fi: 'Sininen.', en: 'Blue.' },
      { fi: 'Se on kirja.', en: "It's a book." },
    ],
    tier: 4,
  },

  // --- NEW (Phase D): the shop/help register — asking for things, offering
  // help, and the price question. Wh-questions and ritual pairs only (one
  // fitting reply each). ⚠️ NEEDS NATIVE FINNISH VETTING. ---
  {
    id: 'may-i-have',
    prompt: { fi: 'Saanko omenan?', en: 'May I have an apple?' },
    reply: { fi: 'Ole hyvä!', en: 'Here you go!' },
    distractors: [
      { fi: 'Näkemiin!', en: 'Goodbye!' },
      { fi: 'Hyvää yötä.', en: 'Good night.' },
    ],
    tier: 3,
  },
  {
    id: 'can-you-help',
    prompt: { fi: 'Voitko auttaa minua?', en: 'Can you help me?' },
    reply: { fi: 'Joo, minä autan!', en: "Yes, I'll help!" },
    distractors: [
      { fi: 'Hyvää päivää.', en: 'Good day.' },
      { fi: 'Nähdään!', en: 'See you!' },
    ],
    tier: 3,
  },
  {
    id: 'how-much',
    prompt: { fi: 'Paljonko se maksaa?', en: 'How much does it cost?' },
    reply: { fi: 'Kolme euroa.', en: 'Three euros.' },
    distractors: [
      { fi: 'Se on kirja.', en: "It's a book." },
      { fi: 'Olen viisivuotias.', en: "I'm five years old." },
    ],
    tier: 4,
  },

  // --- Tier 5: the expert-band register — multi-clause exchanges about real
  // errands and repair moves (directions, phone talk, running late, plans).
  // Inflected forms cross-checked against the vendored tables where the word
  // exists in the pools (koulun, metsään, isoäidille, heräsin, luimme…).
  // ⚠️ NEEDS NATIVE FINNISH VETTING (all eight exchanges below).
  {
    id: 'ask-directions',
    prompt: { fi: 'Anteeksi, missä on kauppa?', en: 'Excuse me, where is the shop?' },
    reply: { fi: 'Se on tuolla, koulun vieressä.', en: "It's over there, next to the school." },
    distractors: [
      { fi: 'Kello on kolme.', en: "It's three o'clock." },
      { fi: 'Hyvää yötä!', en: 'Good night!' },
    ],
    tier: 5,
  },
  {
    id: 'say-it-again',
    prompt: { fi: 'En kuullut, mitä sanoit.', en: "I didn't hear what you said." },
    reply: { fi: 'Minä sanon sen uudestaan.', en: "I'll say it again." },
    distractors: [
      { fi: 'Se on kirja.', en: "It's a book." },
      { fi: 'Hauska tutustua!', en: 'Nice to meet you!' },
    ],
    tier: 5,
  },
  {
    id: 'whats-wrong',
    prompt: { fi: 'Mikä hätänä?', en: "What's wrong?" },
    reply: { fi: 'Minä kaaduin, mutta ei sattunut.', en: "I fell, but it didn't hurt." },
    distractors: [
      { fi: 'Ole hyvä!', en: "You're welcome!" },
      { fi: 'Hyvää ruokahalua!', en: 'Enjoy your meal!' },
    ],
    tier: 5,
  },
  {
    id: 'who-calling',
    prompt: { fi: 'Kenelle sinä soitat?', en: 'Who are you calling?' },
    reply: { fi: 'Soitan isoäidille.', en: "I'm calling grandma." },
    distractors: [
      { fi: 'Näkemiin!', en: 'Goodbye!' },
      { fi: 'Tervetuloa!', en: 'Welcome!' },
    ],
    tier: 5,
  },
  {
    id: 'when-home',
    prompt: { fi: 'Milloin tulet kotiin?', en: 'When are you coming home?' },
    reply: { fi: 'Tulen kotiin kello viisi.', en: "I'll come home at five o'clock." },
    distractors: [
      { fi: 'Asun Suomessa.', en: 'I live in Finland.' },
      { fi: 'Kolme euroa.', en: 'Three euros.' },
    ],
    tier: 5,
  },
  {
    id: 'what-did-today',
    prompt: { fi: 'Mitä teit tänään koulussa?', en: 'What did you do at school today?' },
    reply: { fi: 'Me luimme kirjaa ja leikimme.', en: 'We read a book and played.' },
    distractors: [
      { fi: 'Minulla on jano.', en: "I'm thirsty." },
      { fi: 'Hyvää huomenta!', en: 'Good morning!' },
    ],
    tier: 5,
  },
  {
    id: 'why-late',
    prompt: { fi: 'Miksi myöhästyit?', en: 'Why were you late?' },
    reply: { fi: 'Koska heräsin myöhään.', en: 'Because I woke up late.' },
    distractors: [
      { fi: 'Ole hyvä.', en: "You're welcome." },
      { fi: 'Nähdään!', en: 'See you!' },
    ],
    tier: 5,
  },
  {
    id: 'weekend-plans',
    prompt: { fi: 'Mitä teette viikonloppuna?', en: 'What are you doing on the weekend?' },
    reply: { fi: 'Menemme isoäidille kylään.', en: "We're going to visit grandma." },
    distractors: [
      { fi: 'Kiitos samoin!', en: 'Thanks, you too!' },
      { fi: 'Se on koira.', en: "It's a dog." },
    ],
    tier: 5,
  },
];
