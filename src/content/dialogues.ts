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
    reply: { fi: 'Nimeni on Aino.', en: 'My name is Aino.' },
    distractors: [
      { fi: 'Hyvää, kiitos.', en: 'Good, thanks.' },
      { fi: 'Näkemiin!', en: 'Goodbye!' },
    ],
    tier: 2,
  },
  {
    id: 'how-old',
    prompt: { fi: 'Kuinka vanha olet?', en: 'How old are you?' },
    reply: { fi: 'Olen viisi vuotta.', en: "I'm five years old." },
    distractors: [
      { fi: 'Nimeni on Aino.', en: 'My name is Aino.' },
      { fi: 'Kiitos hyvää.', en: 'Fine, thanks.' },
    ],
    tier: 2,
  },
  {
    id: 'nice-to-meet',
    prompt: { fi: 'Hauska tutustua!', en: 'Nice to meet you!' },
    reply: { fi: 'Samoin!', en: 'You too!' },
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
      { fi: 'Olen viisi vuotta.', en: "I'm five years old." },
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
      { fi: 'Nimeni on Aino.', en: 'My name is Aino.' },
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
      { fi: 'Olen viisi vuotta.', en: "I'm five years old." },
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
];
