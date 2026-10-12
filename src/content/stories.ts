// Satuhetki (story time) — little picture-book stories, read page by page and
// then talked about. This is the app's CONNECTED input: where every drill
// serves one utterance at a time, a story strings a dozen short sentences into
// something that happens — someone wants something, something goes wrong, and
// it ends — and the child follows it for meaning.
//
// The same people come back in every story (see storyKit.ts): Aino, her friend
// Eero, her mom, dad and grandma, her cat Mirri and Eero's dog Musti.
//
// Same content discipline as dialogues.ts / conversations.ts: every sentence is
// HUMAN-AUTHORED (never rule-generated in code), and every word must be a real
// form in the vendored tables (`unitStories.test.ts` fails the build if not).
// ⚠️ NEEDS NATIVE FINNISH VETTING (all stories, questions and statements; listed
// in FINNISH_REVIEW.md).
//
// AUTHORING RULES:
//  - Three or four pages, one to three lines each, a line at most six or seven
//    words; each page picturable as a small emoji scene.
//  - A story stays inside its unit's grammar and the words met by then.
//  - Questions: at least three picture questions, each with exactly one right
//    option that the story itself says; and (from unit 2 on) at least two
//    true-or-false statements whose truth doesn't change during the story.
//    "Put the pictures in order" and "who says this?" come from the pages.

import { UNIT_STORIES } from './unitStories';
import {
  ask,
  falseFact,
  page,
  right,
  say,
  sc,
  tell,
  trueFact,
  wrong,
  type Story,
} from './storyKit';

export type {
  CastId,
  CastMember,
  SceneTone,
  Story,
  StoryFact,
  StoryLine,
  StoryOption,
  StoryPage,
  StoryQuestion,
  StoryScene,
} from './storyKit';
export { CAST, NARRATOR_PITCH, storyLines } from './storyKit';

export const CORE_STORIES: Story[] = [
  {
    id: 'little-cat',
    titleFi: 'Pieni kissa',
    titleEn: 'The little cat',
    icon: '🐱',
    tier: 2,
    pages: [
      page(
        sc('🌲 🌧️ 🌲', '🐱'),
        tell('Tämä on pieni kissa.', 'This is a little cat.'),
        tell('Kissa on metsässä.', 'The cat is in the forest.'),
        tell('Sillä on nälkä.', "It's hungry."),
      ),
      page(
        sc('🌲 🌲 🌲', '👧 🐱'),
        say('aino', 'Hei, pieni kissa!', 'Hi, little cat!'),
        say('aino', 'Onko sinulla koti?', 'Do you have a home?'),
      ),
      page(
        sc('🏠', '👧 🐱 🥛', 'inside'),
        tell('Aino vie kissan kotiin.', 'Aino takes the cat home.'),
        tell('Kissa juo maitoa.', 'The cat drinks milk.'),
      ),
      page(
        sc('🏠 🌙', '👧 🐱 🛏️', 'night'),
        say('aino', 'Sinun nimesi on Mirri!', 'Your name is Mirri!'),
        tell('Mirri nukkuu Ainon sängyssä.', "Mirri sleeps in Aino's bed."),
      ),
    ],
    questions: [
      ask(
        'Missä kissa on ensin?',
        'Where is the cat at first?',
        right('metsässä', 'in the forest', '🌲'),
        wrong('talossa', 'in the house', '🏠'),
        wrong('koulussa', 'at school', '🏫'),
      ),
      ask(
        'Mitä kissa juo?',
        'What does the cat drink?',
        right('maitoa', 'milk', '🥛'),
        wrong('vettä', 'water', '💧'),
        wrong('mehua', 'juice', '🧃'),
      ),
      ask(
        'Mikä kissan nimi on?',
        "What is the cat's name?",
        right('Mirri', 'Mirri', '🐱'),
        wrong('Musti', 'Musti', '🐶'),
        wrong('Leo', 'Leo', '🧒'),
      ),
    ],
    facts: [
      trueFact('Kissalla on nälkä.', 'The cat is hungry.'),
      falseFact('Eero vie kissan kotiin.', 'Eero takes the cat home.'),
      falseFact('Mirri nukkuu metsässä.', 'Mirri sleeps in the forest.'),
    ],
  },
  {
    id: 'morning',
    titleFi: 'Aamu',
    titleEn: 'Morning',
    icon: '🌅',
    tier: 3,
    pages: [
      page(
        sc('🏠 🌅', '👧 🛏️ ⏰', 'inside'),
        tell('Aurinko paistaa.', 'The sun is shining.'),
        tell('Kello on kahdeksan.', "It's eight o'clock."),
        say('aiti', 'Aino, herää! Koulu alkaa!', 'Aino, wake up! School is starting!'),
      ),
      page(
        sc('🏠 🌅', '👧 🥣 🥛', 'inside'),
        tell('Aino syö puuroa.', 'Aino eats porridge.'),
        tell('Hän juo maitoa nopeasti.', 'She drinks her milk quickly.'),
      ),
      page(
        sc('🏡 ☀️', '👦 👧'),
        say('eero', 'Hei, Aino! Mennään!', "Hi, Aino! Let's go!"),
        tell('He juoksevat kouluun.', 'They run to school.'),
      ),
      page(
        sc('🏫', '👧 😮 👦', 'inside'),
        say('aino', 'Voi ei! Missä reppuni on?', 'Oh no! Where is my backpack?'),
        tell('Reppu on kotona.', 'The backpack is at home.'),
        say('eero', 'Ei hätää! Ota minun kynäni.', 'No worries! Take my pencil.'),
      ),
    ],
    questions: [
      ask(
        'Mitä Aino syö?',
        'What does Aino eat?',
        right('puuroa', 'porridge', '🥣'),
        wrong('leipää', 'bread', '🍞'),
        wrong('pitsaa', 'pizza', '🍕'),
      ),
      ask(
        'Paljonko kello on?',
        'What time is it?',
        right('kahdeksan', 'eight', '🕗'),
        wrong('kaksi', 'two', '🕑'),
        wrong('kuusi', 'six', '🕕'),
      ),
      ask(
        'Missä Ainon reppu on?',
        "Where is Aino's backpack?",
        right('kotona', 'at home', '🏠'),
        wrong('koulussa', 'at school', '🏫'),
        wrong('puistossa', 'in the park', '🛝'),
      ),
    ],
    facts: [
      trueFact('Eero auttaa Ainoa.', 'Eero helps Aino.'),
      falseFact('Aino syö jäätelöä.', 'Aino eats ice cream.'),
      falseFact('Reppu on koulussa.', 'The backpack is at school.'),
    ],
  },
  {
    id: 'at-the-shop',
    titleFi: 'Kaupassa',
    titleEn: 'At the shop',
    icon: '🛒',
    tier: 4,
    pages: [
      page(
        sc('🏪', '👩 👧 🛒', 'inside'),
        tell('Äiti ja Aino menevät kauppaan.', 'Mom and Aino go to the shop.'),
        say('aiti', 'Teemme keittoa isoäidille.', "We're making soup for Grandma."),
      ),
      page(
        sc('🏪', '🥕 🥔 🍅', 'inside'),
        say('aiti', 'Ostamme porkkanoita ja perunoita.', 'We buy carrots and potatoes.'),
        tell('Aino ostaa yhden tomaatin.', 'Aino buys one tomato.'),
      ),
      page(
        sc('🏪', '🐱 🛒 👧', 'inside'),
        tell('Kaupassa on kissa!', "There's a cat in the shop!"),
        say('aino', 'Mirri! Mitä sinä teet täällä?', 'Mirri! What are you doing here?'),
      ),
      page(
        sc('🏠 🌆', '👵 🍲 👧 🐱', 'evening'),
        tell('Illalla he syövät keittoa isoäidin kanssa.', 'In the evening they eat soup with Grandma.'),
        say('isoaiti', 'Hyvää keittoa! Kiitos!', 'Good soup! Thank you!'),
        tell('Mirri saa vähän makkaraa.', 'Mirri gets a bit of sausage.'),
      ),
    ],
    questions: [
      ask(
        'Mitä äiti ja Aino tekevät isoäidille?',
        'What are Mom and Aino making for Grandma?',
        right('keittoa', 'soup', '🍲'),
        wrong('kakkua', 'cake', '🍰'),
        wrong('pitsaa', 'pizza', '🍕'),
      ),
      ask(
        'Mitä Aino ostaa?',
        'What does Aino buy?',
        right('tomaatin', 'a tomato', '🍅'),
        wrong('omenan', 'an apple', '🍎'),
        wrong('banaanin', 'a banana', '🍌'),
      ),
      ask(
        'Mikä eläin on kaupassa?',
        'Which animal is in the shop?',
        right('kissa', 'a cat', '🐱'),
        wrong('koira', 'a dog', '🐶'),
        wrong('hiiri', 'a mouse', '🐭'),
      ),
    ],
    facts: [
      trueFact('Mirri saa makkaraa.', 'Mirri gets some sausage.'),
      falseFact('He ostavat jäätelöä.', 'They buy ice cream.'),
      falseFact('Isoäiti tekee keittoa.', 'Grandma makes the soup.'),
    ],
  },

  // --- The past-tense stories (the Yesterday unit): longer, told in the past,
  // and with a question about WHY, not just what.
  {
    id: 'lost-dog',
    titleFi: 'Kadonnut koira',
    titleEn: 'The lost dog',
    icon: '🐶',
    tier: 5,
    pages: [
      page(
        sc('🏡 🌅', '👦 😟'),
        tell('Aamulla Musti ei ollut kotona.', "In the morning Musti wasn't home."),
        say('eero', 'Musti! Missä olet?', 'Musti! Where are you?'),
      ),
      page(
        sc('🌲 🌲 🌲', '👧 👦'),
        tell('Aino ja Eero etsivät Mustia metsästä.', 'Aino and Eero looked for Musti in the forest.'),
        tell('He näkivät jotain puun takana.', 'They saw something behind a tree.'),
      ),
      page(
        sc('🌲 🌳 🌲', '🐶 🐱'),
        tell('Musti leikki siellä Mirrin kanssa!', 'Musti was playing there with Mirri!'),
        say('aino', 'Mirri! Sinä olit täällä!', 'Mirri! You were here!'),
      ),
      page(
        sc('🏡 🌆', '👦 🐶 🦴 👧 🐱', 'evening'),
        tell('Eero antoi Mustille luun.', 'Eero gave Musti a bone.'),
        tell('He kävelivät yhdessä kotiin.', 'They walked home together.'),
        tell('Illalla Musti nukkui hyvin.', 'In the evening Musti slept well.'),
      ),
    ],
    questions: [
      ask(
        'Missä Musti leikki?',
        'Where was Musti playing?',
        right('puun takana', 'behind a tree', '🌳'),
        wrong('pöydän alla', 'under the table', '🍽️'),
        wrong('autossa', 'in the car', '🚗'),
      ),
      ask(
        'Kenen kanssa Musti leikki?',
        'Who was Musti playing with?',
        right('Mirrin kanssa', 'with Mirri', '🐱'),
        wrong('Ainon kanssa', 'with Aino', '👧'),
        wrong('isän kanssa', 'with Dad', '👨'),
      ),
      ask(
        'Mitä Eero antoi Mustille?',
        'What did Eero give Musti?',
        right('luun', 'a bone', '🦴'),
        wrong('pallon', 'a ball', '⚽'),
        wrong('makkaran', 'a sausage', '🌭'),
      ),
      ask(
        'Miksi Aino ja Eero etsivät Mustia?',
        'Why did Aino and Eero look for Musti?',
        right('Koska Musti ei ollut kotona.', "Because Musti wasn't home.", '🏡'),
        wrong('Koska Musti söi.', 'Because Musti was eating.', '🍖'),
        wrong('Koska oli yö.', 'Because it was night.', '🌙'),
      ),
    ],
    facts: [
      trueFact('Mirri oli metsässä.', 'Mirri was in the forest.'),
      falseFact('Musti oli aamulla kotona.', 'Musti was home in the morning.'),
      falseFact('He menivät kotiin autolla.', 'They went home by car.'),
    ],
  },
  {
    id: 'birthday-surprise',
    titleFi: 'Syntymäpäiväyllätys',
    titleEn: 'The birthday surprise',
    icon: '🎂',
    tier: 5,
    pages: [
      page(
        sc('🏠 📅', '👧 👩 🎂', 'inside'),
        tell('Lauantaina oli isän syntymäpäivä.', "Saturday was Dad's birthday."),
        tell('Aino ja äiti tekivät kakun salaa.', 'Aino and Mom made a cake in secret.'),
      ),
      page(
        sc('🏠', '👵 🎈 🐱 🎂', 'inside'),
        tell('Isoäiti toi ilmapalloja.', 'Grandma brought balloons.'),
        tell('Mirri halusi syödä kakkua!', 'Mirri wanted to eat the cake!'),
        say('aino', 'Ei, Mirri! Se on isälle!', "No, Mirri! It's for Dad!"),
      ),
      page(
        sc('🏠 🚪', '👨 😮 🎈', 'inside'),
        tell('Isä tuli kotiin kello kuusi.', "Dad came home at six o'clock."),
        tell('Kaikki lauloivat isälle.', 'Everyone sang to Dad.'),
      ),
      page(
        sc('🏠 🎈', '👨 🎂 😄 🐱', 'inside'),
        tell('Isä söi kakkua ja nauroi.', 'Dad ate cake and laughed.'),
        say('isa', 'Kiitos! Tämä on paras päivä!', 'Thank you! This is the best day!'),
      ),
    ],
    questions: [
      ask(
        'Kenen syntymäpäivä oli?',
        'Whose birthday was it?',
        right('isän', "Dad's", '👨'),
        wrong('äidin', "Mom's", '👩'),
        wrong('Ainon', "Aino's", '👧'),
      ),
      ask(
        'Mitä isoäiti toi?',
        'What did Grandma bring?',
        right('ilmapalloja', 'balloons', '🎈'),
        wrong('kakun', 'a cake', '🎂'),
        wrong('lahjan', 'a present', '🎁'),
      ),
      ask(
        'Milloin isä tuli kotiin?',
        'When did Dad come home?',
        right('kello kuusi', "at six o'clock", '🕕'),
        wrong('kello kaksi', "at two o'clock", '🕑'),
        wrong('kello yhdeksän', "at nine o'clock", '🕘'),
      ),
      ask(
        'Miksi Aino ja äiti tekivät kakun salaa?',
        'Why did Aino and Mom make the cake in secret?',
        right('Koska se oli yllätys.', 'Because it was a surprise.', '🎁'),
        wrong('Koska heillä oli nälkä.', 'Because they were hungry.', '🍽️'),
        wrong('Koska oli maanantai.', 'Because it was Monday.', '📅'),
      ),
    ],
    facts: [
      trueFact('Mirri halusi kakkua.', 'Mirri wanted some cake.'),
      falseFact('Isä teki kakun.', 'Dad made the cake.'),
      falseFact('Isä itki.', 'Dad cried.'),
    ],
  },
];

/** Every story: the core five, then one per unit (unitStories.ts). */
export const stories: Story[] = [...CORE_STORIES, ...UNIT_STORIES];

export const storyById: Record<string, Story> = Object.fromEntries(stories.map((s) => [s.id, s]));
