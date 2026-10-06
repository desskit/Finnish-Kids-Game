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
        reply: { fi: 'Nimeni on {name}. Entä sinun?', en: 'My name is {name}. And yours?' },
        distractors: [
          { fi: 'Kiitos, hyvää.', en: 'Fine, thanks.' },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
      {
        partner: { fi: 'Minun nimeni on Eero. Kuinka vanha olet?', en: "My name is Eero. How old are you?" },
        // Nominative echo — "olla" here, so "Entä sinä?" (contrast with turn 1 of Playground).
        reply: { fi: 'Olen kuusivuotias. Entä sinä?', en: "I'm six years old. And you?" },
        distractors: [
          { fi: 'Se on kirja.', en: "It's a book." },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Olen myös kuusi. Hauska tutustua!', en: "I'm six too. Nice to meet you!" },
        // Same reviewer-corrected echo as dialogue `nice-to-meet` (illative
        // with tutustua).
        reply: { fi: 'Niin sinuunkin!', en: 'You too!' },
        distractors: [
          { fi: 'Hyvää huomenta.', en: 'Good morning.' },
          { fi: 'Anteeksi.', en: 'Sorry.' },
        ],
      },
    ],
  },

  // --- NEW scenes: school + evening-at-home. Built from the already-vetted set
  // phrases plus a few canonical additions (opettaja, Aloitetaan, Hyvää iltaa,
  // Mitä haluat syödä). ⚠️ NEEDS NATIVE FINNISH VETTING. ---
  {
    id: 'at-school',
    titleFi: 'Koulussa',
    titleEn: 'At school',
    icon: '🏫',
    partnerIcon: '👩‍🏫',
    tier: 3,
    turns: [
      {
        partner: { fi: 'Hyvää huomenta!', en: 'Good morning!' },
        reply: { fi: 'Hyvää huomenta, opettaja!', en: 'Good morning, teacher!' },
        distractors: [
          { fi: 'Näkemiin!', en: 'Goodbye!' },
          { fi: 'Kiitos!', en: 'Thank you!' },
        ],
      },
      {
        partner: { fi: 'Mitä kuuluu?', en: 'How are you?' },
        reply: { fi: 'Hyvää, kiitos!', en: 'Good, thanks!' },
        distractors: [
          { fi: 'Näkemiin!', en: 'Goodbye!' },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Kiva! Aloitetaan.', en: "Nice! Let's begin." },
        reply: { fi: 'Aloitetaan!', en: "Let's begin!" },
        distractors: [
          { fi: 'Hyvää yötä.', en: 'Good night.' },
          { fi: 'Anteeksi.', en: 'Sorry.' },
        ],
      },
    ],
  },
  {
    id: 'evening-home',
    titleFi: 'Illalla kotona',
    titleEn: 'Evening at home',
    icon: '🌙',
    partnerIcon: '👩',
    tier: 4,
    turns: [
      {
        partner: { fi: 'Hyvää iltaa!', en: 'Good evening!' },
        reply: { fi: 'Hyvää iltaa!', en: 'Good evening!' },
        distractors: [
          { fi: 'Hyvää huomenta!', en: 'Good morning!' },
          { fi: 'Kiitos!', en: 'Thank you!' },
        ],
      },
      {
        partner: { fi: 'Mitä haluat syödä?', en: 'What do you want to eat?' },
        reply: { fi: 'Omena, kiitos!', en: 'An apple, please!' },
        distractors: [
          { fi: 'Se on kirja.', en: "It's a book." },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Hyvää yötä!', en: 'Good night!' },
        reply: { fi: 'Hyvää yötä!', en: 'Good night!' },
        distractors: [
          { fi: 'Hyvää huomenta!', en: 'Good morning!' },
          { fi: 'Kiitos!', en: 'Thank you!' },
        ],
      },
    ],
  },

  // --- NEW scenes (Phase D): shop, asking for help, playdate. Built from the
  // vetted set phrases plus a few first-person forms that were CHECKED against
  // the sourced inflection tables before authoring (haluan, autan, tulen,
  // omenan, autoilla). ⚠️ NEEDS NATIVE FINNISH VETTING. ---
  {
    // Pairs with the Kaupassa skill node: the same buying Finnish, now as a
    // live exchange with a shopkeeper.
    id: 'shop',
    titleFi: 'Kaupassa',
    titleEn: 'At the shop',
    icon: '🛍️',
    partnerIcon: '🧑‍💼',
    tier: 3,
    turns: [
      {
        partner: { fi: 'Hei! Mitä sinä haluat?', en: 'Hi! What would you like?' },
        reply: { fi: 'Haluan omenan, kiitos!', en: 'I want an apple, please!' },
        distractors: [
          { fi: 'Näkemiin!', en: 'Goodbye!' },
          { fi: 'Hyvää yötä.', en: 'Good night.' },
        ],
      },
      {
        partner: { fi: 'Ole hyvä!', en: 'Here you go!' },
        reply: { fi: 'Kiitos!', en: 'Thank you!' },
        distractors: [
          { fi: 'Anteeksi.', en: 'Sorry.' },
          { fi: 'Hyvää huomenta.', en: 'Good morning.' },
        ],
      },
      {
        partner: { fi: 'Näkemiin!', en: 'Goodbye!' },
        reply: { fi: 'Hei hei!', en: 'Bye bye!' },
        distractors: [
          { fi: 'Kiitos ruoasta.', en: 'Thanks for the food.' },
          { fi: 'Ei se mitään.', en: "It's okay." },
        ],
      },
    ],
  },
  {
    id: 'helping',
    titleFi: 'Autetaan!',
    titleEn: "Let's help!",
    icon: '🤝',
    partnerIcon: '🧒',
    tier: 3,
    turns: [
      {
        partner: { fi: 'Apua! Voitko auttaa?', en: 'Help! Can you help?' },
        reply: { fi: 'Joo, minä autan!', en: "Yes, I'll help!" },
        distractors: [
          { fi: 'Hyvää yötä.', en: 'Good night.' },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
      {
        partner: { fi: 'Kiitos paljon!', en: 'Thanks a lot!' },
        reply: { fi: 'Ole hyvä!', en: "You're welcome!" },
        distractors: [
          { fi: 'Anteeksi.', en: 'Sorry.' },
          { fi: 'Hyvää päivää.', en: 'Good day.' },
        ],
      },
      {
        partner: { fi: 'Olet kiltti!', en: 'You are kind!' },
        reply: { fi: 'Kiitos!', en: 'Thank you!' },
        distractors: [
          { fi: 'Näkemiin!', en: 'Goodbye!' },
          { fi: 'Ei se mitään.', en: "It's okay." },
        ],
      },
    ],
  },
  {
    id: 'playdate',
    titleFi: 'Leikitään yhdessä',
    titleEn: 'Playing together',
    icon: '🧸',
    partnerIcon: '👧',
    tier: 4,
    turns: [
      {
        partner: { fi: 'Tuletko leikkimään?', en: 'Will you come and play?' },
        reply: { fi: 'Joo, tulen!', en: "Yes, I'll come!" },
        distractors: [
          { fi: 'Hyvää yötä.', en: 'Good night.' },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Mitä leikitään?', en: 'What shall we play?' },
        reply: { fi: 'Leikitään autoilla!', en: "Let's play with the cars!" },
        distractors: [
          { fi: 'Se on kirja.', en: "It's a book." },
          { fi: 'Anteeksi.', en: 'Sorry.' },
        ],
      },
      {
        partner: { fi: 'Kiva! Mennään ulos.', en: "Nice! Let's go outside." },
        reply: { fi: 'Mennään!', en: "Let's go!" },
        distractors: [
          { fi: 'Kiitos ruoasta.', en: 'Thanks for the food.' },
          { fi: 'Hyvää huomenta.', en: 'Good morning.' },
        ],
      },
      {
        partner: { fi: 'Nähdään huomenna!', en: 'See you tomorrow!' },
        reply: { fi: 'Nähdään!', en: 'See you!' },
        distractors: [
          { fi: 'Ei se mitään.', en: "It's okay." },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
    ],
  },

  // --- Tier 5: the expert-band scenes — longer, multi-clause turns (planning
  // a whole outing; a misunderstanding and its repair). Inflected forms
  // cross-checked against the vendored tables where the word is pooled
  // (haluaisin, metsään, otamme, leikimme…); the rest is authored fixed text.
  // ⚠️ NEEDS NATIVE FINNISH VETTING (both scenes below).
  {
    id: 'plan-day',
    titleFi: 'Suunnitellaan päivää',
    titleEn: 'Planning the day',
    icon: '🗓️',
    partnerIcon: '👩',
    tier: 5,
    turns: [
      {
        partner: { fi: 'Mitä haluaisit tehdä tänään?', en: 'What would you like to do today?' },
        reply: { fi: 'Haluaisin mennä metsään.', en: "I'd like to go to the forest." },
        distractors: [
          { fi: 'Se on kirja.', en: "It's a book." },
          { fi: 'Hyvää yötä!', en: 'Good night!' },
        ],
      },
      {
        partner: { fi: 'Hyvä idea! Millainen sää tänään on?', en: "Good idea! What's the weather like today?" },
        reply: { fi: 'Aurinko paistaa, mutta on kylmä.', en: "The sun is shining, but it's cold." },
        distractors: [
          { fi: 'Minun vuoroni!', en: 'My turn!' },
          { fi: 'Kiitos ruoasta.', en: 'Thanks for the food.' },
        ],
      },
      {
        partner: { fi: 'Mitä otamme mukaan?', en: 'What shall we take along?' },
        reply: { fi: 'Otetaan eväät ja lämmin takki.', en: "Let's take a picnic and a warm coat." },
        distractors: [
          { fi: 'Näkemiin!', en: 'Goodbye!' },
          { fi: 'Kolme euroa.', en: 'Three euros.' },
        ],
      },
      {
        partner: { fi: 'Hienoa! Milloin lähdemme?', en: 'Great! When do we leave?' },
        reply: { fi: 'Heti lounaan jälkeen.', en: 'Right after lunch.' },
        distractors: [
          { fi: 'Olen kuusivuotias.', en: "I'm six years old." },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
    ],
  },
  {
    id: 'mixup',
    titleFi: 'Väärinkäsitys',
    titleEn: 'A mix-up',
    icon: '🤝',
    partnerIcon: '🧒',
    tier: 5,
    turns: [
      {
        partner: { fi: 'Miksi et tullut eilen leikkimään?', en: "Why didn't you come play yesterday?" },
        reply: { fi: 'Anteeksi, minä luulin, että tulemme tänään.', en: 'Sorry — I thought we were coming today.' },
        distractors: [
          { fi: 'Hyvää ruokahalua!', en: 'Enjoy your meal!' },
          { fi: 'Se on sininen.', en: "It's blue." },
        ],
      },
      {
        partner: { fi: 'Ai, minä sanoin sen varmaan epäselvästi.', en: 'Oh, I probably said it unclearly.' },
        reply: { fi: 'Ei se mitään. Leikitään nyt!', en: "It's okay. Let's play now!" },
        distractors: [
          { fi: 'Paljonko se maksaa?', en: 'How much does it cost?' },
          { fi: 'Hyvää yötä!', en: 'Good night!' },
        ],
      },
      {
        partner: { fi: 'Mitä haluat leikkiä?', en: 'What do you want to play?' },
        reply: { fi: 'Leikitään piilosta!', en: "Let's play hide and seek!" },
        distractors: [
          { fi: 'Tulen kotiin kello viisi.', en: "I'll come home at five o'clock." },
          { fi: 'Kiitos samoin!', en: 'Thanks, you too!' },
        ],
      },
      {
        partner: { fi: 'Sinä saat etsiä ensin!', en: 'You get to seek first!' },
        reply: { fi: 'Hyvä on, minä lasken kymmeneen.', en: "Okay, I'll count to ten." },
        distractors: [
          { fi: 'Nimeni on {name}.', en: 'My name is {name}.' },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
    ],
  },
];
