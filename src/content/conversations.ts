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
        reply: { fi: 'Olen seitsemänvuotias. Entä sinä?', en: "I'm seven years old. And you?" },
        distractors: [
          { fi: 'Se on kirja.', en: "It's a book." },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Olen myös seitsemän. Hauska tutustua!', en: "I'm seven too. Nice to meet you!" },
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
          { fi: 'Olen seitsemänvuotias.', en: "I'm seven years old." },
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

  // --- One scene per unit (course expansion). Each uses ONLY its unit's
  // grammar plus the words met so far; every inflected form was looked up in
  // the sourced tables before authoring. Where it can, a "wrong move"
  // distractor is the unit's own contrast: "Olen puistossa" for a MIHIN?
  // question, "Tämä on kirja" for MITÄ NÄMÄ OVAT?, present-tense twins
  // ("Menen puistoon", "En syö") for an EILEN? question.
  // ⚠️ NEEDS NATIVE FINNISH VETTING (all scenes below). ---
  {
    // Unit: having
    id: 'what-you-have',
    titleFi: 'Mitä sinulla on?',
    titleEn: 'What have you got?',
    icon: '🎒',
    partnerIcon: '🧒',
    tier: 3,
    turns: [
      {
        partner: { fi: 'Hei! Mitä sinulla on?', en: 'Hi! What have you got?' },
        reply: { fi: 'Minulla on pallo.', en: 'I have a ball.' },
        distractors: [
          { fi: 'Hyvää yötä.', en: 'Good night.' },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Kiva! Minulla on koira. Entä sinulla?', en: 'Nice! I have a dog. And you?' },
        reply: { fi: 'Minulla on kissa.', en: 'I have a cat.' },
        distractors: [
          { fi: 'Näkemiin!', en: 'Goodbye!' },
          { fi: 'Anteeksi.', en: 'Sorry.' },
        ],
      },
      {
        partner: { fi: 'Leikitäänkö pallolla?', en: 'Shall we play with the ball?' },
        reply: { fi: 'Joo, leikitään!', en: "Yeah, let's play!" },
        distractors: [
          { fi: 'Kiitos ruoasta.', en: 'Thanks for the food.' },
          { fi: 'Hyvää huomenta.', en: 'Good morning.' },
        ],
      },
    ],
  },
  {
    // Unit: not-having
    id: 'going-out',
    titleFi: 'Mennään ulos',
    titleEn: 'Going outside',
    icon: '🧥',
    partnerIcon: '👩',
    tier: 3,
    turns: [
      {
        partner: { fi: 'Mennään ulos! Onko sinulla takki?', en: "Let's go out! Do you have a coat?" },
        reply: { fi: 'On. Minulla on takki.', en: 'Yes. I have a coat.' },
        distractors: [
          { fi: 'Näkemiin!', en: 'Goodbye!' },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Onko sinulla hattu?', en: 'Do you have a hat?' },
        reply: { fi: 'Ei ole. Minulla ei ole hattua.', en: "No. I don't have a hat." },
        distractors: [
          { fi: 'Minulla on kissa.', en: 'I have a cat.' },
          { fi: 'Hyvää yötä.', en: 'Good night.' },
        ],
      },
      {
        partner: { fi: 'Ei se mitään. Ota tämä hattu!', en: "That's okay. Take this hat!" },
        reply: { fi: 'Kiitos!', en: 'Thank you!' },
        distractors: [
          { fi: 'Anteeksi.', en: 'Sorry.' },
          { fi: 'Hyvää huomenta.', en: 'Good morning.' },
        ],
      },
    ],
  },
  {
    // Unit: not-doing
    id: 'bedtime',
    titleFi: 'Nukutko jo?',
    titleEn: 'Are you asleep?',
    icon: '🛏️',
    partnerIcon: '👨',
    tier: 3,
    turns: [
      {
        partner: { fi: 'Mitä teet? Piirrätkö?', en: 'What are you doing? Are you drawing?' },
        reply: { fi: 'En piirrä. Luen.', en: "I'm not drawing. I'm reading." },
        distractors: [
          { fi: 'Hyvää huomenta!', en: 'Good morning!' },
          { fi: 'Minulla on pallo.', en: 'I have a ball.' },
        ],
      },
      {
        partner: { fi: 'Nukutko jo?', en: 'Are you asleep already?' },
        reply: { fi: 'En nuku!', en: "I'm not sleeping!" },
        distractors: [
          { fi: 'Ole hyvä.', en: "You're welcome." },
          { fi: 'Kiitos ruoasta.', en: 'Thanks for the food.' },
        ],
      },
      {
        partner: { fi: 'Nyt on yö. Hyvää yötä!', en: "It's night now. Good night!" },
        reply: { fi: 'Hyvää yötä!', en: 'Good night!' },
        distractors: [
          { fi: 'Hyvää huomenta!', en: 'Good morning!' },
          { fi: 'Anteeksi.', en: 'Sorry.' },
        ],
      },
    ],
  },
  {
    // Unit: feelings
    id: 'how-feel',
    titleFi: 'Miltä tuntuu?',
    titleEn: 'How do you feel?',
    icon: '😄',
    partnerIcon: '👩',
    tier: 3,
    turns: [
      {
        partner: { fi: 'Miltä sinusta tuntuu?', en: 'How do you feel?' },
        reply: { fi: 'Olen väsynyt.', en: "I'm tired." },
        distractors: [
          { fi: 'Minulla on pallo.', en: 'I have a ball.' },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Oletko surullinen?', en: 'Are you sad?' },
        reply: { fi: 'En ole surullinen.', en: "I'm not sad." },
        distractors: [
          { fi: 'Hyvää huomenta!', en: 'Good morning!' },
          { fi: 'En nuku!', en: "I'm not sleeping!" },
        ],
      },
      {
        partner: { fi: 'Onko sinulla nälkä?', en: 'Are you hungry?' },
        reply: { fi: 'On! Minulla on nälkä.', en: "Yes! I'm hungry." },
        distractors: [
          { fi: 'Kiitos ruoasta.', en: 'Thanks for the food.' },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
    ],
  },
  {
    // Unit: school-day
    id: 'school-day',
    titleFi: 'Koulupäivä',
    titleEn: 'A school day',
    icon: '✏️',
    partnerIcon: '👧',
    tier: 3,
    turns: [
      {
        partner: { fi: 'Pidätkö matematiikasta?', en: 'Do you like math?' },
        reply: { fi: 'Joo, pidän matematiikasta!', en: 'Yes, I like math!' },
        distractors: [
          { fi: 'Minulla on kumi.', en: 'I have an eraser.' },
          { fi: 'Hyvää yötä.', en: 'Good night.' },
        ],
      },
      {
        partner: { fi: 'Entä liikunnasta?', en: 'And gym?' },
        reply: { fi: 'En pidä liikunnasta.', en: "I don't like gym." },
        distractors: [
          { fi: 'Ole hyvä.', en: "You're welcome." },
          { fi: 'Olen iloinen.', en: "I'm happy." },
        ],
      },
      {
        partner: { fi: 'Mennään ruokalaan!', en: "Let's go to the canteen!" },
        reply: { fi: 'Mennään! Minulla on nälkä.', en: "Let's go! I'm hungry." },
        distractors: [
          { fi: 'Hyvää huomenta.', en: 'Good morning.' },
          { fi: 'En piirrä.', en: "I'm not drawing." },
        ],
      },
    ],
  },
  {
    // Unit: seeing
    id: 'bus-stop',
    titleFi: 'Bussipysäkillä',
    titleEn: 'At the bus stop',
    icon: '🚏',
    partnerIcon: '👴',
    tier: 4,
    turns: [
      {
        partner: { fi: 'Mitä sinä odotat?', en: 'What are you waiting for?' },
        reply: { fi: 'Odotan bussia.', en: "I'm waiting for the bus." },
        distractors: [
          { fi: 'Minulla on kumi.', en: 'I have an eraser.' },
          { fi: 'Hyvää yötä.', en: 'Good night.' },
        ],
      },
      {
        partner: { fi: 'Näetkö bussin?', en: 'Do you see the bus?' },
        reply: { fi: 'Joo, näen bussin!', en: 'Yes, I see the bus!' },
        distractors: [
          { fi: 'En pidä matematiikasta.', en: "I don't like math." },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Hienoa! Mennään.', en: "Great! Let's go." },
        reply: { fi: 'Mennään!', en: "Let's go!" },
        distractors: [
          { fi: 'Kiitos ruoasta.', en: 'Thanks for the food.' },
          { fi: 'Olen väsynyt.', en: "I'm tired." },
        ],
      },
    ],
  },
  {
    // Unit: describing
    id: 'what-like',
    titleFi: 'Millainen?',
    titleEn: 'What is it like?',
    icon: '🎨',
    partnerIcon: '🧒',
    tier: 4,
    turns: [
      {
        partner: { fi: 'Millainen koira sinulla on?', en: 'What kind of dog do you have?' },
        reply: { fi: 'Minulla on iso, ruskea koira.', en: 'I have a big, brown dog.' },
        distractors: [
          { fi: 'Odotan bussia.', en: "I'm waiting for the bus." },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
      {
        partner: { fi: 'Onko se nopea?', en: 'Is it fast?' },
        reply: { fi: 'Ei ole. Se on hidas.', en: "No. It's slow." },
        distractors: [
          { fi: 'Minulla on nälkä.', en: "I'm hungry." },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Minulla on pieni, valkoinen kissa.', en: 'I have a small, white cat.' },
        reply: { fi: 'Kiva! Se on söpö.', en: "Nice! It's cute." },
        distractors: [
          { fi: 'En pidä liikunnasta.', en: "I don't like gym." },
          { fi: 'Hyvää yötä.', en: 'Good night.' },
        ],
      },
    ],
  },
  {
    // Unit: where
    id: 'tidy-up',
    titleFi: 'Missä se on?',
    titleEn: 'Where is it?',
    icon: '🔍',
    partnerIcon: '👩',
    tier: 4,
    turns: [
      {
        partner: { fi: 'Missä reppu on?', en: 'Where is the backpack?' },
        reply: { fi: 'Reppu on tuolilla.', en: 'The backpack is on the chair.' },
        distractors: [
          { fi: 'Odotan bussia.', en: "I'm waiting for the bus." },
          { fi: 'Olen väsynyt.', en: "I'm tired." },
        ],
      },
      {
        partner: { fi: 'Entä kirja? Missä kirja on?', en: 'And the book? Where is the book?' },
        reply: { fi: 'Kirja on laatikossa.', en: 'The book is in the box.' },
        distractors: [
          { fi: 'Se on hidas.', en: "It's slow." },
          { fi: 'Hyvää huomenta!', en: 'Good morning!' },
        ],
      },
      {
        partner: { fi: 'Kiitos paljon!', en: 'Thanks a lot!' },
        reply: { fi: 'Ole hyvä!', en: "You're welcome!" },
        distractors: [
          { fi: 'Anteeksi.', en: 'Sorry.' },
          { fi: 'Kirja on pöydällä.', en: 'The book is on the table.' },
        ],
      },
    ],
  },
  {
    // Unit: moving
    id: 'cat-moves',
    titleFi: 'Mihin kissa menee?',
    titleEn: "Where's the cat going?",
    icon: '🐈',
    partnerIcon: '👦',
    tier: 4,
    turns: [
      {
        partner: { fi: 'Mihin kissa menee?', en: 'Where is the cat going?' },
        reply: { fi: 'Kissa menee laatikkoon.', en: 'The cat is going into the box.' },
        distractors: [
          { fi: 'Kissa on iloinen.', en: 'The cat is happy.' },
          { fi: 'Hyvää yötä.', en: 'Good night.' },
        ],
      },
      {
        partner: { fi: 'Ja nyt? Mistä kissa tulee?', en: 'And now? Where is the cat coming from?' },
        reply: { fi: 'Kissa tulee laatikosta.', en: 'The cat is coming out of the box.' },
        distractors: [
          { fi: 'Odotan bussia.', en: "I'm waiting for the bus." },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Mihin se menee nyt?', en: 'Where is it going now?' },
        reply: { fi: 'Se menee pöydälle.', en: "It's going onto the table." },
        distractors: [
          { fi: 'Se on pöydällä.', en: "It's on the table." },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
    ],
  },
  {
    // Unit: town
    id: 'in-town',
    titleFi: 'Kaupungilla',
    titleEn: 'Out in town',
    icon: '🏙️',
    partnerIcon: '🧒',
    tier: 4,
    turns: [
      {
        partner: { fi: 'Hei! Mistä sinä tulet?', en: 'Hi! Where are you coming from?' },
        reply: { fi: 'Tulen koulusta.', en: "I'm coming from school." },
        distractors: [
          { fi: 'Menen kouluun.', en: "I'm going to school." },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Mihin sinä menet nyt?', en: 'Where are you going now?' },
        reply: { fi: 'Menen puistoon.', en: "I'm going to the park." },
        distractors: [
          { fi: 'Olen puistossa.', en: "I'm in the park." },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
      {
        partner: { fi: 'Minä myös! Mennään yhdessä.', en: "Me too! Let's go together." },
        reply: { fi: 'Joo, mennään!', en: "Yeah, let's go!" },
        distractors: [
          { fi: 'Kiitos ruoasta.', en: 'Thanks for the food.' },
          { fi: 'Tulen koulusta.', en: "I'm coming from school." },
        ],
      },
    ],
  },
  {
    // Unit: when
    id: 'when-play',
    titleFi: 'Milloin leikitään?',
    titleEn: 'When shall we play?',
    icon: '📅',
    partnerIcon: '👧',
    tier: 4,
    turns: [
      {
        partner: { fi: 'Mikä päivä tänään on?', en: 'What day is it today?' },
        reply: { fi: 'Tänään on lauantai.', en: 'Today is Saturday.' },
        distractors: [
          { fi: 'Kello on kolme.', en: "It's three o'clock." },
          { fi: 'Hyvää yötä.', en: 'Good night.' },
        ],
      },
      {
        partner: { fi: 'Mitä kello on?', en: 'What time is it?' },
        reply: { fi: 'Kello on kymmenen.', en: "It's ten o'clock." },
        distractors: [
          { fi: 'Tänään on maanantai.', en: 'Today is Monday.' },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Leikitäänkö sunnuntaina?', en: 'Shall we play on Sunday?' },
        reply: { fi: 'Joo, leikitään sunnuntaina!', en: "Yes, let's play on Sunday!" },
        distractors: [
          { fi: 'Kiitos ruoasta.', en: 'Thanks for the food.' },
          { fi: 'Menen puistoon.', en: "I'm going to the park." },
        ],
      },
    ],
  },
  {
    // Unit: around
    id: 'hiding',
    titleFi: 'Piilossa',
    titleEn: 'Hiding',
    icon: '🙈',
    partnerIcon: '👦',
    tier: 4,
    turns: [
      {
        partner: { fi: 'Missä kissa on?', en: 'Where is the cat?' },
        reply: { fi: 'Kissa on tuolin alla.', en: 'The cat is under the chair.' },
        distractors: [
          { fi: 'Tänään on lauantai.', en: 'Today is Saturday.' },
          { fi: 'Hyvää huomenta.', en: 'Good morning.' },
        ],
      },
      {
        partner: { fi: 'Entä pallo?', en: 'And the ball?' },
        reply: { fi: 'Pallo on sängyn vieressä.', en: 'The ball is next to the bed.' },
        distractors: [
          { fi: 'Kello on kymmenen.', en: "It's ten o'clock." },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Ja koira?', en: 'And the dog?' },
        reply: { fi: 'Koira on oven takana.', en: 'The dog is behind the door.' },
        distractors: [
          { fi: 'Koira on iso.', en: 'The dog is big.' },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
    ],
  },
  {
    // Unit: whose
    id: 'whose-is-it',
    titleFi: 'Kenen tämä on?',
    titleEn: 'Whose is this?',
    icon: '🙋',
    partnerIcon: '👩‍🏫',
    tier: 4,
    turns: [
      {
        // Unit "whose" now comes right after "Not having": only "Onko…? – On /
        // Ei ole", minun/sinun/hänen + -ni/-si/-nsa, and words met so far.
        partner: { fi: 'Onko tämä sinun kirjasi?', en: 'Is this your book?' },
        reply: { fi: 'Ei ole. Se on hänen kirjansa.', en: "No. It's their book." },
        distractors: [
          { fi: 'Minulla on kissa.', en: 'I have a cat.' },
          { fi: 'Hyvää yötä.', en: 'Good night.' },
        ],
      },
      {
        partner: { fi: 'Entä tämä reppu? Onko se sinun reppusi?', en: 'And this backpack? Is it your backpack?' },
        reply: { fi: 'On! Se on minun reppuni.', en: "Yes! It's my backpack." },
        distractors: [
          { fi: 'Minulla ei ole hattua.', en: "I don't have a hat." },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
      {
        partner: { fi: 'Ole hyvä. Tässä on sinun reppusi.', en: 'Here you go. Here is your backpack.' },
        reply: { fi: 'Kiitos!', en: 'Thank you!' },
        distractors: [
          { fi: 'Se on hänen kirjansa.', en: "It's their book." },
          { fi: 'Anteeksi.', en: 'Sorry.' },
        ],
      },
    ],
  },
  {
    // Unit: many
    id: 'lots-of-things',
    titleFi: 'Paljon tavaraa',
    titleEn: 'Lots of things',
    icon: '🧺',
    partnerIcon: '🧒',
    tier: 4,
    turns: [
      {
        partner: { fi: 'Mitä nämä ovat?', en: 'What are these?' },
        reply: { fi: 'Nämä ovat kirjoja.', en: 'These are books.' },
        distractors: [
          { fi: 'Tämä on kirja.', en: 'This is a book.' },
          { fi: 'Hyvää yötä.', en: 'Good night.' },
        ],
      },
      {
        partner: { fi: 'Onko sinulla autoja?', en: 'Do you have any cars?' },
        reply: { fi: 'On, minulla on kolme autoa.', en: 'Yes, I have three cars.' },
        distractors: [
          { fi: 'Pallot ovat laatikoissa.', en: 'The balls are in the boxes.' },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
      {
        partner: { fi: 'Missä pallot ovat?', en: 'Where are the balls?' },
        reply: { fi: 'Pallot ovat laatikoissa.', en: 'The balls are in the boxes.' },
        distractors: [
          { fi: 'Minulla on palloja.', en: 'I have some balls.' },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
    ],
  },
  {
    // Unit: yesterday
    id: 'yesterday',
    titleFi: 'Mitä teit eilen?',
    titleEn: 'What did you do yesterday?',
    icon: '⏮️',
    partnerIcon: '👵',
    tier: 4,
    turns: [
      {
        partner: { fi: 'Mitä teit eilen?', en: 'What did you do yesterday?' },
        reply: { fi: 'Menin puistoon.', en: 'I went to the park.' },
        distractors: [
          { fi: 'Menen puistoon.', en: "I'm going to the park." },
          { fi: 'Hyvää huomenta.', en: 'Good morning.' },
        ],
      },
      {
        partner: { fi: 'Mitä sinä näit siellä?', en: 'What did you see there?' },
        reply: { fi: 'Näin koiran.', en: 'I saw a dog.' },
        distractors: [
          { fi: 'Koira on iso.', en: 'The dog is big.' },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
      {
        partner: { fi: 'Söitkö jäätelöä?', en: 'Did you eat ice cream?' },
        reply: { fi: 'En syönyt.', en: "No, I didn't." },
        distractors: [
          { fi: 'En syö.', en: "I don't eat." },
          { fi: 'Kiitos!', en: 'Thank you!' },
        ],
      },
    ],
  },

  // --- Scenes for the six grammar units added after the course expansion
  // (owners, asking, wanting, commands, question words, me & you). Each uses
  // only its unit's grammar plus words met so far; every inflected form was
  // checked against the sourced tables (pronoun forms: pronouns.ts).
  // ⚠️ NEEDS NATIVE FINNISH VETTING (all scenes below). ---
  {
    // Unit: owners
    id: 'whose-thing',
    titleFi: 'Kenen pyörä?',
    titleEn: 'Whose bike?',
    icon: '🚲',
    partnerIcon: '🧒',
    tier: 3,
    turns: [
      {
        partner: { fi: 'Kenen pyörä tämä on?', en: 'Whose bike is this?' },
        reply: { fi: 'Se on isän pyörä.', en: "It's Dad's bike." },
        distractors: [
          { fi: 'Minulla on kissa.', en: 'I have a cat.' },
          { fi: 'Hyvää yötä.', en: 'Good night.' },
        ],
      },
      {
        partner: { fi: 'Entä tämä takki? Onko se äidin takki?', en: "And this coat? Is it Mom's coat?" },
        reply: { fi: 'On. Se on äidin takki.', en: "Yes. It's Mom's coat." },
        distractors: [
          { fi: 'Se on minun reppuni.', en: "It's my backpack." },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
      {
        partner: { fi: 'Kenen koira tuo on?', en: 'Whose dog is that?' },
        reply: { fi: 'Se on kaverin koira.', en: "It's my friend's dog." },
        distractors: [
          { fi: 'Ei ole.', en: 'No.' },
          { fi: 'Kiitos!', en: 'Thank you!' },
        ],
      },
    ],
  },
  {
    // Unit: asking
    id: 'do-you',
    titleFi: 'Leikitkö?',
    titleEn: 'Do you play?',
    icon: '❓',
    partnerIcon: '👧',
    tier: 3,
    turns: [
      {
        partner: { fi: 'Hei! Leikitkö sinä pallolla?', en: 'Hi! Do you play with a ball?' },
        reply: { fi: 'Leikin!', en: 'Yes, I do!' },
        distractors: [
          { fi: 'Leikit.', en: 'You play.' },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
      {
        partner: { fi: 'Uitko sinä?', en: 'Do you swim?' },
        reply: { fi: 'En ui.', en: "No, I don't." },
        distractors: [
          { fi: 'Et ui.', en: "You don't swim." },
          { fi: 'Kiitos!', en: 'Thank you!' },
        ],
      },
      {
        partner: { fi: 'Laulatko sinä?', en: 'Do you sing?' },
        reply: { fi: 'Laulan!', en: 'Yes, I do!' },
        distractors: [
          { fi: 'Laulat.', en: 'You sing.' },
          { fi: 'Hyvää huomenta.', en: 'Good morning.' },
        ],
      },
    ],
  },
  {
    // Unit: wanting
    id: 'what-to-do',
    titleFi: 'Mitä haluat tehdä?',
    titleEn: 'What do you want to do?',
    icon: '🎯',
    partnerIcon: '👦',
    tier: 3,
    turns: [
      {
        partner: { fi: 'Mitä haluat tehdä?', en: 'What do you want to do?' },
        reply: { fi: 'Haluan leikkiä.', en: 'I want to play.' },
        distractors: [
          { fi: 'Pidän pitsasta.', en: 'I like pizza.' },
          { fi: 'Leikitkö?', en: 'Do you play?' },
        ],
      },
      {
        partner: { fi: 'Osaatko uida?', en: 'Can you swim?' },
        reply: { fi: 'Osaan!', en: 'Yes, I can!' },
        distractors: [
          { fi: 'Uitko?', en: 'Do you swim?' },
          { fi: 'Haluan nukkua.', en: 'I want to sleep.' },
        ],
      },
      {
        partner: { fi: 'Saanko tulla?', en: 'May I come?' },
        reply: { fi: 'Saat!', en: 'Yes, you may!' },
        distractors: [
          { fi: 'En halua nukkua.', en: "I don't want to sleep." },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
    ],
  },
  {
    // Unit: commands
    id: 'lets-go',
    titleFi: 'Leikitään!',
    titleEn: "Let's play!",
    icon: '🏃',
    partnerIcon: '🧒',
    tier: 3,
    turns: [
      {
        partner: { fi: 'Hei! Leikitään!', en: "Hi! Let's play!" },
        reply: { fi: 'Joo, leikitään!', en: "Yeah, let's play!" },
        distractors: [
          { fi: 'Älä leiki!', en: "Don't play!" },
          { fi: 'Leikin.', en: 'I play.' },
        ],
      },
      {
        partner: { fi: 'Juostaan!', en: "Let's run!" },
        reply: { fi: 'Ei, kävellään!', en: "No, let's walk!" },
        distractors: [
          { fi: 'Juokse!', en: 'Run!' },
          { fi: 'Kiitos!', en: 'Thank you!' },
        ],
      },
      {
        partner: { fi: 'Odota! Älä unohda reppua!', en: "Wait! Don't forget your backpack!" },
        reply: { fi: 'Kiitos!', en: 'Thanks!' },
        distractors: [
          { fi: 'Juostaan!', en: "Let's run!" },
          { fi: 'Hyvää yötä.', en: 'Good night.' },
        ],
      },
    ],
  },
  {
    // Unit: question-words
    id: 'new-pupil',
    titleFi: 'Uusi oppilas',
    titleEn: 'The new pupil',
    icon: '🧑‍🎓',
    partnerIcon: '👦',
    tier: 4,
    turns: [
      {
        partner: { fi: 'Hei! Kuka sinä olet?', en: 'Hi! Who are you?' },
        reply: { fi: 'Olen {name}.', en: "I'm {name}." },
        distractors: [
          { fi: 'Olen koulussa.', en: "I'm at school." },
          { fi: 'Lauantaina.', en: 'On Saturday.' },
        ],
      },
      {
        partner: { fi: 'Mistä sinä tulet?', en: 'Where are you coming from?' },
        reply: { fi: 'Tulen kirjastosta.', en: "I'm coming from the library." },
        distractors: [
          { fi: 'Menen kirjastoon.', en: "I'm going to the library." },
          { fi: 'Kaksi.', en: 'Two.' },
        ],
      },
      {
        partner: { fi: 'Milloin leikitään?', en: 'When shall we play?' },
        reply: { fi: 'Huomenna!', en: 'Tomorrow!' },
        distractors: [
          { fi: 'Puistossa.', en: 'In the park.' },
          { fi: 'Se on isän pallo.', en: "It's Dad's ball." },
        ],
      },
    ],
  },
  {
    // Unit: me-you
    id: 'help-me',
    titleFi: 'Auta minua!',
    titleEn: 'Help me!',
    icon: '🤝',
    partnerIcon: '👧',
    tier: 4,
    turns: [
      {
        partner: { fi: 'Auta minua!', en: 'Help me!' },
        reply: { fi: 'Joo, autan sinua!', en: "Sure, I'll help you!" },
        distractors: [
          { fi: 'Pidän sinusta.', en: 'I like you.' },
          { fi: 'Hyvää yötä.', en: 'Good night.' },
        ],
      },
      {
        partner: { fi: 'Anna se minulle!', en: 'Give it to me!' },
        reply: { fi: 'Ole hyvä!', en: 'Here you go!' },
        distractors: [
          { fi: 'Näen sinut.', en: 'I see you.' },
          { fi: 'Kiitos ruoasta.', en: 'Thanks for the food.' },
        ],
      },
      {
        partner: { fi: 'Kiitos! Pidän sinusta.', en: 'Thanks! I like you.' },
        reply: { fi: 'Ja minä pidän sinusta!', en: 'And I like you!' },
        distractors: [
          { fi: 'Auta minua!', en: 'Help me!' },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
        ],
      },
    ],
  },
];
