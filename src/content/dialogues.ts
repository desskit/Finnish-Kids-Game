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
// greetings, t2 = names/age/courtesies).

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
];
