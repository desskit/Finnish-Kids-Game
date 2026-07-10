// Small talk — short, multi-turn Finnish scenes for the "hold a conversation"
// game. Where the greetings node drills one adjacency pair at a time
// ("Kiitos!" → "Ole hyvä!"), a Conversation strings those pieces into a
// connected mini-dialogue the child steers turn by turn to the end.
//
// Same content discipline as dialogues.ts: everything here is HUMAN-AUTHORED,
// grammar-vetted set phrases (never rule-generated Finnish). Each turn gives the
// partner's line, the ONE fitting reply, and real-Finnish-but-wrong-move
// distractors — so the skill is discourse competence (keeping a conversation
// going), not spotting broken grammar.
//
// A note the reviewer cares about: reciprocal "and you?" is case-sensitive. The
// verb decides — "Mitä (sinulle) kuuluu?" governs the allative, so it echoes as
// "Entä sinulle?"; "Kuinka vanha olet?" is plain olla, so it echoes as "Entä
// sinä?". Both appear below, on purpose.

import type { DialogueLine } from './dialogues';

export interface ConversationTurn {
  /** The partner speaks first each turn. */
  partner: DialogueLine;
  /** The fitting reply the child should pick. */
  reply: DialogueLine;
  /** Real Finnish that's the wrong move HERE (backfilled to fill the tiles). */
  distractors: DialogueLine[];
}

export interface Conversation {
  id: string;
  titleFi: string;
  titleEn: string;
  /** Scene emoji (map/hub). */
  icon: string;
  /** The partner's avatar emoji, shown beside their bubbles. */
  partnerIcon: string;
  turns: ConversationTurn[];
  tier: number;
}

export const conversations: Conversation[] = [
  {
    id: 'playground',
    titleFi: 'Leikkipuistossa',
    titleEn: 'At the playground',
    icon: '🛝',
    partnerIcon: '🧒',
    tier: 3,
    turns: [
      {
        partner: { fi: 'Moi! Mitä kuuluu?', en: 'Hi! How are you?' },
        // Allative echo — "kuulua" governs "sinulle", so NOT "Entä sinä?".
        reply: { fi: 'Hyvää, kiitos! Entä sinulle?', en: 'Good, thanks! And you?' },
        distractors: [
          { fi: 'Näkemiin!', en: 'Goodbye!' },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Kiitos, hyvää! Leikitäänkö?', en: 'Thanks, good! Shall we play?' },
        reply: { fi: 'Joo, leikitään!', en: "Yeah, let's play!" },
        distractors: [
          { fi: 'Hyvää yötä.', en: 'Good night.' },
          { fi: 'Anteeksi.', en: 'Sorry.' },
        ],
      },
      {
        partner: { fi: 'Kiva! Mennään.', en: "Nice! Let's go." },
        reply: { fi: 'Mennään!', en: "Let's go!" },
        distractors: [
          { fi: 'Kiitos ruoasta.', en: 'Thanks for the food.' },
          { fi: 'Nähdään huomenna.', en: 'See you tomorrow.' },
        ],
      },
    ],
  },
  {
    id: 'new-friend',
    titleFi: 'Uusi kaveri',
    titleEn: 'A new friend',
    icon: '👋',
    partnerIcon: '👦',
    tier: 4,
    turns: [
      {
        partner: { fi: 'Hei! Mikä sinun nimesi on?', en: "Hi! What's your name?" },
        reply: { fi: 'Nimeni on Aino. Entä sinun?', en: 'My name is Aino. And yours?' },
        distractors: [
          { fi: 'Kiitos, hyvää.', en: 'Fine, thanks.' },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
      {
        partner: { fi: 'Minun nimeni on Eero. Kuinka vanha olet?', en: "My name is Eero. How old are you?" },
        // Nominative echo — "olla" here, so "Entä sinä?" (contrast with turn 1 of Playground).
        reply: { fi: 'Olen kuusi vuotta. Entä sinä?', en: "I'm six years old. And you?" },
        distractors: [
          { fi: 'Se on kirja.', en: "It's a book." },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Olen myös kuusi. Hauska tutustua!', en: "I'm six too. Nice to meet you!" },
        reply: { fi: 'Samoin!', en: 'You too!' },
        distractors: [
          { fi: 'Hyvää huomenta.', en: 'Good morning.' },
          { fi: 'Anteeksi.', en: 'Sorry.' },
        ],
      },
    ],
  },
];
