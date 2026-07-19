// Satuhetki (story time) — tiny illustrated Finnish stories read page by page,
// then a couple of comprehension taps. This is the app's CONNECTED input: where
// every drill serves one utterance at a time, a story strings 4–6 simple
// sentences into a little narrative the child follows for meaning.
//
// Same content discipline as dialogues.ts/conversations.ts: every sentence is
// HUMAN-AUTHORED (never rule-generated in code), built from the game's own
// vetted carrier patterns and vocabulary. Additionally, every inflected form
// used below was CHECKED against the vendored sourced inflection tables before
// authoring (talossa, kalaa, kouluun, menevät, omenan, …) — a pre-vetting
// quality gate, not a substitute for the native pass.
// ⚠️ NEEDS NATIVE FINNISH VETTING (all stories + questions below).
//
// AUTHORING RULES:
//  - Pages: 4–6 short sentences (≤ 5 words), each picturable with one emoji.
//  - Vocabulary: stick to words the game already teaches (they carry sourced
//    paradigms and SRS histories) plus the already-vetted set phrases.
//  - Questions: wh-questions ABOUT the story, exactly one correct option, all
//    options real Finnish forms that appeared in (or fit) the story's frame.

export interface StoryPage {
  fi: string;
  en: string;
  /** The page's illustration. */
  emoji: string;
}

export interface StoryOption {
  fi: string;
  en: string;
  emoji: string;
  /** Exactly one option per question carries this. */
  correct?: boolean;
}

export interface StoryQuestion {
  promptFi: string;
  promptEn: string;
  options: StoryOption[];
}

export interface Story {
  id: string;
  titleFi: string;
  titleEn: string;
  /** Cover emoji (map/header). */
  icon: string;
  tier: number;
  pages: StoryPage[];
  /** Asked after the last page, in order. */
  questions: StoryQuestion[];
}

export const stories: Story[] = [
  {
    id: 'little-cat',
    titleFi: 'Pieni kissa',
    titleEn: 'The little cat',
    icon: '🐱',
    tier: 2,
    pages: [
      { fi: 'Tämä on kissa.', en: 'This is a cat.', emoji: '🐱' },
      { fi: 'Kissa on pieni.', en: 'The cat is small.', emoji: '🐾' },
      { fi: 'Kissa on talossa.', en: 'The cat is in the house.', emoji: '🏠' },
      { fi: 'Kissa syö kalaa.', en: 'The cat eats fish.', emoji: '🐟' },
      { fi: 'Kissa nukkuu.', en: 'The cat sleeps.', emoji: '😴' },
    ],
    questions: [
      {
        promptFi: 'Missä kissa on?',
        promptEn: 'Where is the cat?',
        options: [
          { fi: 'talossa', en: 'in the house', emoji: '🏠', correct: true },
          { fi: 'metsässä', en: 'in the forest', emoji: '🌲' },
          { fi: 'autossa', en: 'in the car', emoji: '🚗' },
        ],
      },
      {
        promptFi: 'Mitä kissa syö?',
        promptEn: 'What does the cat eat?',
        options: [
          { fi: 'kalaa', en: 'fish', emoji: '🐟', correct: true },
          { fi: 'leipää', en: 'bread', emoji: '🍞' },
          { fi: 'omenaa', en: 'apple', emoji: '🍎' },
        ],
      },
    ],
  },
  {
    id: 'morning',
    titleFi: 'Aamu',
    titleEn: 'Morning',
    icon: '🌅',
    tier: 3,
    pages: [
      { fi: 'Aurinko paistaa.', en: 'The sun is shining.', emoji: '☀️' },
      { fi: 'Lapsi herää.', en: 'The child wakes up.', emoji: '⏰' },
      { fi: 'Lapsi syö leipää.', en: 'The child eats bread.', emoji: '🍞' },
      { fi: 'Lapsi juo maitoa.', en: 'The child drinks milk.', emoji: '🥛' },
      { fi: 'Lapsi menee kouluun.', en: 'The child goes to school.', emoji: '🏫' },
    ],
    questions: [
      {
        promptFi: 'Mitä lapsi juo?',
        promptEn: 'What does the child drink?',
        options: [
          { fi: 'maitoa', en: 'milk', emoji: '🥛', correct: true },
          { fi: 'vettä', en: 'water', emoji: '💧' },
          { fi: 'mehua', en: 'juice', emoji: '🧃' },
        ],
      },
      {
        promptFi: 'Minne lapsi menee?',
        promptEn: 'Where does the child go?',
        options: [
          { fi: 'kouluun', en: 'to school', emoji: '🏫', correct: true },
          { fi: 'kotiin', en: 'home', emoji: '🏠' },
          { fi: 'metsään', en: 'to the forest', emoji: '🌲' },
        ],
      },
    ],
  },
  {
    id: 'at-the-shop',
    titleFi: 'Kaupassa',
    titleEn: 'At the shop',
    icon: '🛒',
    tier: 4,
    pages: [
      { fi: 'Äiti ja lapsi menevät kauppaan.', en: 'Mom and the child go to the shop.', emoji: '🛒' },
      { fi: 'Äiti ostaa maitoa.', en: 'Mom buys some milk.', emoji: '🥛' },
      { fi: 'Lapsi ostaa omenan.', en: 'The child buys an apple.', emoji: '🍎' },
      { fi: 'Omena on punainen.', en: 'The apple is red.', emoji: '🟥' },
      { fi: 'He menevät kotiin.', en: 'They go home.', emoji: '🏠' },
      { fi: 'Lapsi syö omenan.', en: 'The child eats the apple.', emoji: '😋' },
    ],
    questions: [
      {
        promptFi: 'Mitä äiti ostaa?',
        promptEn: 'What does mom buy?',
        options: [
          { fi: 'maitoa', en: 'milk', emoji: '🥛', correct: true },
          { fi: 'leipää', en: 'bread', emoji: '🍞' },
          { fi: 'juustoa', en: 'cheese', emoji: '🧀' },
        ],
      },
      {
        promptFi: 'Millainen omena on?',
        promptEn: 'What is the apple like?',
        options: [
          { fi: 'punainen', en: 'red', emoji: '🟥', correct: true },
          { fi: 'sininen', en: 'blue', emoji: '🟦' },
          { fi: 'vihreä', en: 'green', emoji: '🟩' },
        ],
      },
    ],
  },

  // --- Tier 5: the expert-band stories — longer (7 pages), PAST-TENSE
  // narration, and a third question that asks about sequence or motive, not
  // just facts. Every past form checked against the vendored tables before
  // authoring (etsi, näki, leikki, antoi, kävelivät, nukkui, tekivät, auttoi,
  // tuli, lauloivat, söi, nauroi; metsästä, koulun, isoäidille…).
  // ⚠️ NEEDS NATIVE FINNISH VETTING (both stories + questions below).
  {
    id: 'lost-dog',
    titleFi: 'Kadonnut koira',
    titleEn: 'The lost dog',
    icon: '🐶',
    tier: 5,
    pages: [
      { fi: 'Aamulla koira ei ollut kotona.', en: "In the morning the dog wasn't home.", emoji: '🌅' },
      { fi: 'Liisa etsi koiraa metsästä.', en: 'Liisa looked for the dog in the forest.', emoji: '🌲' },
      { fi: 'Hän näki jotain puun takana.', en: 'She saw something behind a tree.', emoji: '👀' },
      { fi: 'Koira leikki siellä kissan kanssa.', en: 'The dog was playing there with a cat.', emoji: '🐱' },
      { fi: 'Liisa antoi koiralle luun.', en: 'Liisa gave the dog a bone.', emoji: '🦴' },
      { fi: 'He kävelivät yhdessä kotiin.', en: 'They walked home together.', emoji: '🏠' },
      { fi: 'Illalla koira nukkui hyvin.', en: 'In the evening the dog slept well.', emoji: '😴' },
    ],
    questions: [
      {
        promptFi: 'Missä koira leikki?',
        promptEn: 'Where was the dog playing?',
        options: [
          { fi: 'puun takana', en: 'behind the tree', emoji: '🌳', correct: true },
          { fi: 'pöydän alla', en: 'under the table', emoji: '🪑' },
          { fi: 'autossa', en: 'in the car', emoji: '🚗' },
        ],
      },
      {
        promptFi: 'Mitä tapahtui ensin?',
        promptEn: 'What happened first?',
        options: [
          { fi: 'Koira ei ollut kotona.', en: "The dog wasn't home.", emoji: '🌅', correct: true },
          { fi: 'He kävelivät kotiin.', en: 'They walked home.', emoji: '🏠' },
          { fi: 'Liisa antoi luun.', en: 'Liisa gave a bone.', emoji: '🦴' },
        ],
      },
      {
        promptFi: 'Miksi Liisa etsi koiraa?',
        promptEn: 'Why did Liisa look for the dog?',
        options: [
          { fi: 'Koska koira ei ollut kotona.', en: "Because the dog wasn't home.", emoji: '🐶', correct: true },
          { fi: 'Koska koira söi.', en: 'Because the dog was eating.', emoji: '🍖' },
          { fi: 'Koska oli yö.', en: 'Because it was night.', emoji: '🌙' },
        ],
      },
    ],
  },
  {
    id: 'birthday-surprise',
    titleFi: 'Syntymäpäiväyllätys',
    titleEn: 'The birthday surprise',
    icon: '🎂',
    tier: 5,
    pages: [
      { fi: 'Lauantaina oli isän syntymäpäivä.', en: "Saturday was dad's birthday.", emoji: '📅' },
      { fi: 'Lapset tekivät kakun salaa.', en: 'The children made a cake in secret.', emoji: '🎂' },
      { fi: 'Äiti auttoi keittiössä.', en: 'Mom helped in the kitchen.', emoji: '👩‍🍳' },
      { fi: 'Isä tuli kotiin kello kuusi.', en: "Dad came home at six o'clock.", emoji: '🚪' },
      { fi: 'Kaikki lauloivat isälle.', en: 'Everyone sang for dad.', emoji: '🎶' },
      { fi: 'Isä söi kakkua ja nauroi.', en: 'Dad ate cake and laughed.', emoji: '😄' },
      { fi: 'Se oli hauska päivä.', en: 'It was a fun day.', emoji: '🌟' },
    ],
    questions: [
      {
        promptFi: 'Kenen syntymäpäivä oli?',
        promptEn: 'Whose birthday was it?',
        options: [
          { fi: 'isän', en: "dad's", emoji: '👨', correct: true },
          { fi: 'äidin', en: "mom's", emoji: '👩' },
          { fi: 'kissan', en: "the cat's", emoji: '🐱' },
        ],
      },
      {
        promptFi: 'Mitä lapset tekivät ensin?',
        promptEn: 'What did the children do first?',
        options: [
          { fi: 'He tekivät kakun.', en: 'They made a cake.', emoji: '🎂', correct: true },
          { fi: 'He lauloivat.', en: 'They sang.', emoji: '🎶' },
          { fi: 'He söivät kakkua.', en: 'They ate cake.', emoji: '🍰' },
        ],
      },
      {
        promptFi: 'Miksi lapset tekivät kakun salaa?',
        promptEn: 'Why did the children make the cake in secret?',
        options: [
          { fi: 'Koska se oli yllätys.', en: 'Because it was a surprise.', emoji: '🎁', correct: true },
          { fi: 'Koska heillä oli nälkä.', en: 'Because they were hungry.', emoji: '🍽️' },
          { fi: 'Koska oli maanantai.', en: 'Because it was Monday.', emoji: '📅' },
        ],
      },
    ],
  },
];
