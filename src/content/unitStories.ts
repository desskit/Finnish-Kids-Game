// One short story at the end of (almost) every unit — the unit's grammar,
// used for meaning in a little narrative instead of one sentence at a time.
//
// Same discipline as stories.ts: HUMAN-AUTHORED Finnish, short pages (≤ 5
// words), every page picturable, questions about the story with exactly one
// right option. Every word is checked against the vendored Wiktionary forms by
// `unitStories.test.ts` (a form that doesn't exist fails the build), and each
// story sticks to its unit's grammar plus words met by then.
// ⚠️ NEEDS NATIVE FINNISH VETTING (all stories below; listed in FINNISH_REVIEW.md).

import type { Story } from './stories';

/** unitId → the story read at the end of that unit. */
export const UNIT_STORY_IDS: Record<string, string> = {};

const story = (unitId: string, s: Story): Story => {
  UNIT_STORY_IDS[unitId] = s.id;
  return s;
};

export const UNIT_STORIES: Story[] = [
  story('hello', {
    id: 'hello-eero',
    titleFi: 'Hei, Eero!',
    titleEn: 'Hi, Eero!',
    icon: '👋',
    tier: 2,
    pages: [
      { fi: 'Hei! Minä olen Aino.', en: "Hi! I'm Aino.", emoji: '👧' },
      { fi: 'Hei! Minä olen Eero.', en: "Hi! I'm Eero.", emoji: '👦' },
      { fi: 'Mitä kuuluu, Eero?', en: 'How are you, Eero?', emoji: '❓' },
      { fi: 'Hyvää, kiitos!', en: 'Good, thanks!', emoji: '😊' },
      { fi: 'Näkemiin, Eero!', en: 'Goodbye, Eero!', emoji: '👋' },
    ],
    questions: [
      {
        promptFi: 'Mitä Eero vastaa?',
        promptEn: 'What does Eero answer?',
        options: [
          { fi: 'Hyvää, kiitos!', en: 'Good, thanks!', emoji: '😊', correct: true },
          { fi: 'Hyvää yötä!', en: 'Good night!', emoji: '🌙' },
          { fi: 'Anteeksi!', en: 'Sorry!', emoji: '🙇' },
        ],
      },
      {
        promptFi: 'Mitä Aino sanoo lopuksi?',
        promptEn: 'What does Aino say at the end?',
        options: [
          { fi: 'Näkemiin!', en: 'Goodbye!', emoji: '👋', correct: true },
          { fi: 'Hei!', en: 'Hi!', emoji: '🙋' },
          { fi: 'Kiitos!', en: 'Thank you!', emoji: '🙏' },
        ],
      },
    ],
  }),
  story('people', {
    id: 'in-class',
    titleFi: 'Luokassa',
    titleEn: 'In the classroom',
    icon: '🏫',
    tier: 2,
    pages: [
      { fi: 'Tämä on luokka.', en: 'This is a classroom.', emoji: '🏫' },
      { fi: 'Tämä on opettaja.', en: 'This is the teacher.', emoji: '🧑‍🏫' },
      { fi: 'Onko tämä kirja?', en: 'Is this a book?', emoji: '❓' },
      { fi: 'Ei, tämä on kuva.', en: 'No, this is a picture.', emoji: '🖼️' },
      { fi: 'Tämä on kello.', en: 'This is a clock.', emoji: '🕐' },
    ],
    questions: [
      {
        promptFi: 'Kuka on luokassa?',
        promptEn: 'Who is in the classroom?',
        options: [
          { fi: 'opettaja', en: 'the teacher', emoji: '🧑‍🏫', correct: true },
          { fi: 'isä', en: 'Dad', emoji: '👨' },
          { fi: 'vauva', en: 'a baby', emoji: '👶' },
        ],
      },
      {
        promptFi: 'Onko se kirja?',
        promptEn: 'Is it a book?',
        options: [
          { fi: 'Ei, se on kuva.', en: "No, it's a picture.", emoji: '🖼️', correct: true },
          { fi: 'Kyllä, se on kirja.', en: "Yes, it's a book.", emoji: '📕' },
          { fi: 'Ei, se on kello.', en: "No, it's a clock.", emoji: '🕐' },
        ],
      },
    ],
  }),
  story('numbers', {
    id: 'three-cats',
    titleFi: 'Kolme kissaa',
    titleEn: 'Three cats',
    icon: '🐱',
    tier: 2,
    pages: [
      { fi: 'Tässä on kolme kissaa.', en: 'Here are three cats.', emoji: '🐱🐱🐱' },
      { fi: 'Tässä on kaksi koiraa.', en: 'Here are two dogs.', emoji: '🐶🐶' },
      { fi: 'Tässä on yksi kirja.', en: 'Here is one book.', emoji: '📕' },
      { fi: 'Montako kissaa?', en: 'How many cats?', emoji: '❓' },
      { fi: 'Kolme kissaa!', en: 'Three cats!', emoji: '🎉' },
    ],
    questions: [
      {
        promptFi: 'Montako koiraa?',
        promptEn: 'How many dogs?',
        options: [
          { fi: 'kaksi koiraa', en: 'two dogs', emoji: '🐶🐶', correct: true },
          { fi: 'kolme koiraa', en: 'three dogs', emoji: '🐶🐶🐶' },
          { fi: 'yksi koira', en: 'one dog', emoji: '🐶' },
        ],
      },
      {
        promptFi: 'Montako kissaa?',
        promptEn: 'How many cats?',
        options: [
          { fi: 'kolme kissaa', en: 'three cats', emoji: '🐱🐱🐱', correct: true },
          { fi: 'kaksi kissaa', en: 'two cats', emoji: '🐱🐱' },
          { fi: 'neljä kissaa', en: 'four cats', emoji: '🐱🐱🐱🐱' },
        ],
      },
    ],
  }),
  story('having', {
    id: 'what-we-have',
    titleFi: 'Mitä meillä on?',
    titleEn: 'What have we got?',
    icon: '🎒',
    tier: 2,
    pages: [
      { fi: 'Minulla on pallo.', en: 'I have a ball.', emoji: '⚽' },
      { fi: 'Sinulla on kitara.', en: 'You have a guitar.', emoji: '🎸' },
      { fi: 'Eerolla on koira.', en: 'Eero has a dog.', emoji: '🐶' },
      { fi: 'Ainolla on pyörä.', en: 'Aino has a bike.', emoji: '🚲' },
      { fi: 'Meillä on kissa.', en: 'We have a cat.', emoji: '🐱' },
    ],
    questions: [
      {
        promptFi: 'Kenellä on koira?',
        promptEn: 'Who has a dog?',
        options: [
          { fi: 'Eerolla', en: 'Eero', emoji: '👦', correct: true },
          { fi: 'Ainolla', en: 'Aino', emoji: '👧' },
          { fi: 'minulla', en: 'me', emoji: '🙋' },
        ],
      },
      {
        promptFi: 'Mitä meillä on?',
        promptEn: 'What do we have?',
        options: [
          { fi: 'kissa', en: 'a cat', emoji: '🐱', correct: true },
          { fi: 'koira', en: 'a dog', emoji: '🐶' },
          { fi: 'pallo', en: 'a ball', emoji: '⚽' },
        ],
      },
    ],
  }),
  story('not-having', {
    id: 'no-hat',
    titleFi: 'Missä hattu on?',
    titleEn: "Where's the hat?",
    icon: '🧢',
    tier: 2,
    pages: [
      { fi: 'On kylmä.', en: "It's cold.", emoji: '🥶' },
      { fi: 'Minulla on takki.', en: 'I have a coat.', emoji: '🧥' },
      { fi: 'Minulla ei ole hattua.', en: "I don't have a hat.", emoji: '🙅' },
      { fi: 'Äidillä on hattu.', en: 'Mom has a hat.', emoji: '👩' },
      { fi: 'Kiitos, äiti!', en: 'Thank you, Mom!', emoji: '😊' },
    ],
    questions: [
      {
        promptFi: 'Mitä minulla ei ole?',
        promptEn: "What don't I have?",
        options: [
          { fi: 'hattua', en: 'a hat', emoji: '🧢', correct: true },
          { fi: 'takkia', en: 'a coat', emoji: '🧥' },
          { fi: 'sukkaa', en: 'a sock', emoji: '🧦' },
        ],
      },
      {
        promptFi: 'Kenellä on hattu?',
        promptEn: 'Who has a hat?',
        options: [
          { fi: 'äidillä', en: 'Mom', emoji: '👩', correct: true },
          { fi: 'isällä', en: 'Dad', emoji: '👨' },
          { fi: 'minulla', en: 'me', emoji: '🙋' },
        ],
      },
    ],
  }),
  story('whose', {
    id: 'my-backpack',
    titleFi: 'Minun reppuni',
    titleEn: 'My backpack',
    icon: '🎒',
    tier: 2,
    pages: [
      { fi: 'Tämä on minun kirjani.', en: 'This is my book.', emoji: '📕' },
      { fi: 'Tämä on sinun kynäsi.', en: 'This is your pencil.', emoji: '✏️' },
      { fi: 'Missä on minun reppuni?', en: 'Where is my backpack?', emoji: '❓' },
      { fi: 'Tässä on sinun reppusi!', en: 'Here is your backpack!', emoji: '🎒' },
      { fi: 'Kiitos!', en: 'Thank you!', emoji: '😊' },
    ],
    questions: [
      {
        promptFi: 'Kenen kynä se on?',
        promptEn: 'Whose pencil is it?',
        options: [
          { fi: 'sinun', en: 'yours', emoji: '🫵', correct: true },
          { fi: 'minun', en: 'mine', emoji: '🙋' },
          { fi: 'hänen', en: 'his / hers', emoji: '🧑' },
        ],
      },
      {
        promptFi: 'Kenen kirja se on?',
        promptEn: 'Whose book is it?',
        options: [
          { fi: 'minun', en: 'mine', emoji: '🙋', correct: true },
          { fi: 'sinun', en: 'yours', emoji: '🫵' },
          { fi: 'hänen', en: 'his / hers', emoji: '🧑' },
        ],
      },
    ],
  }),
  story('owners', {
    id: 'dads-bike',
    titleFi: 'Isän pyörä',
    titleEn: "Dad's bike",
    icon: '🚲',
    tier: 2,
    pages: [
      { fi: 'Tämä on isän pyörä.', en: "This is Dad's bike.", emoji: '🚲' },
      { fi: 'Tämä on äidin takki.', en: "This is Mom's coat.", emoji: '🧥' },
      { fi: 'Tämä on koiran pallo.', en: "This is the dog's ball.", emoji: '⚽' },
      { fi: 'Missä on vauvan hattu?', en: "Where is the baby's hat?", emoji: '👶' },
      { fi: 'Tässä!', en: 'Here!', emoji: '🧢' },
    ],
    questions: [
      {
        promptFi: 'Kenen pyörä se on?',
        promptEn: 'Whose bike is it?',
        options: [
          { fi: 'isän', en: "Dad's", emoji: '👨', correct: true },
          { fi: 'äidin', en: "Mom's", emoji: '👩' },
          { fi: 'koiran', en: "the dog's", emoji: '🐶' },
        ],
      },
      {
        promptFi: 'Kenen pallo se on?',
        promptEn: 'Whose ball is it?',
        options: [
          { fi: 'koiran', en: "the dog's", emoji: '🐶', correct: true },
          { fi: 'isän', en: "Dad's", emoji: '👨' },
          { fi: 'vauvan', en: "the baby's", emoji: '👶' },
        ],
      },
    ],
  }),
  story('doing', {
    id: 'busy-park',
    titleFi: 'Puistossa',
    titleEn: 'In the park',
    icon: '🌳',
    tier: 3,
    pages: [
      { fi: 'Eero juoksee.', en: 'Eero runs.', emoji: '🏃' },
      { fi: 'Aino laulaa.', en: 'Aino sings.', emoji: '🎤' },
      { fi: 'Me uimme.', en: 'We swim.', emoji: '🏊' },
      { fi: 'Isä lukee.', en: 'Dad reads.', emoji: '📖' },
      { fi: 'Vauva nukkuu.', en: 'The baby sleeps.', emoji: '😴' },
    ],
    questions: [
      {
        promptFi: 'Mitä Aino tekee?',
        promptEn: 'What is Aino doing?',
        options: [
          { fi: 'laulaa', en: 'sings', emoji: '🎤', correct: true },
          { fi: 'juoksee', en: 'runs', emoji: '🏃' },
          { fi: 'nukkuu', en: 'sleeps', emoji: '😴' },
        ],
      },
      {
        promptFi: 'Kuka nukkuu?',
        promptEn: 'Who is sleeping?',
        options: [
          { fi: 'vauva', en: 'the baby', emoji: '👶', correct: true },
          { fi: 'isä', en: 'Dad', emoji: '👨' },
          { fi: 'Eero', en: 'Eero', emoji: '👦' },
        ],
      },
    ],
  }),
  story('doing-kpt', {
    id: 'evening',
    titleFi: 'Ilta',
    titleEn: 'Evening',
    icon: '🌙',
    tier: 3,
    pages: [
      { fi: 'Illalla luen kirjaa.', en: 'In the evening I read a book.', emoji: '📖' },
      { fi: 'Isä lukee myös.', en: 'Dad reads too.', emoji: '👨' },
      { fi: 'Vauva nukkuu jo.', en: 'The baby is already asleep.', emoji: '👶' },
      { fi: 'Minä en nuku vielä.', en: "I'm not sleeping yet.", emoji: '🙈' },
      { fi: 'Kirjoitan ja piirrän.', en: 'I write and draw.', emoji: '✏️' },
    ],
    questions: [
      {
        promptFi: 'Kuka nukkuu?',
        promptEn: 'Who is sleeping?',
        options: [
          { fi: 'vauva', en: 'the baby', emoji: '👶', correct: true },
          { fi: 'isä', en: 'Dad', emoji: '👨' },
          { fi: 'minä', en: 'me', emoji: '🙋' },
        ],
      },
      {
        promptFi: 'Mitä isä tekee?',
        promptEn: 'What is Dad doing?',
        options: [
          { fi: 'lukee', en: 'reading', emoji: '📖', correct: true },
          { fi: 'nukkuu', en: 'sleeping', emoji: '😴' },
          { fi: 'kirjoittaa', en: 'writing', emoji: '✏️' },
        ],
      },
    ],
  }),
  story('not-doing', {
    id: 'tired-cat',
    titleFi: 'Väsynyt kissa',
    titleEn: 'The tired cat',
    icon: '😴',
    tier: 3,
    pages: [
      { fi: 'Kissa ei syö.', en: "The cat doesn't eat.", emoji: '🍽️' },
      { fi: 'Kissa ei juo.', en: "The cat doesn't drink.", emoji: '💧' },
      { fi: 'Kissa ei leiki.', en: "The cat doesn't play.", emoji: '🧶' },
      { fi: 'Kissa nukkuu.', en: 'The cat sleeps.', emoji: '😴' },
      { fi: 'Kissa on väsynyt.', en: 'The cat is tired.', emoji: '🐱' },
    ],
    questions: [
      {
        promptFi: 'Mitä kissa tekee?',
        promptEn: 'What does the cat do?',
        options: [
          { fi: 'nukkuu', en: 'sleeps', emoji: '😴', correct: true },
          { fi: 'syö', en: 'eats', emoji: '🍽️' },
          { fi: 'leikkii', en: 'plays', emoji: '🧶' },
        ],
      },
      {
        promptFi: 'Syökö kissa?',
        promptEn: 'Does the cat eat?',
        options: [
          { fi: 'Ei syö.', en: "No, it doesn't.", emoji: '🙅', correct: true },
          { fi: 'Syö.', en: 'Yes, it does.', emoji: '🍽️' },
          { fi: 'Juo.', en: 'It drinks.', emoji: '💧' },
        ],
      },
    ],
  }),
  story('asking', {
    id: 'do-you-sing',
    titleFi: 'Laulatko?',
    titleEn: 'Do you sing?',
    icon: '❓',
    tier: 3,
    pages: [
      { fi: 'Uitko, Eero?', en: 'Do you swim, Eero?', emoji: '🏊' },
      { fi: 'Uin!', en: 'I do!', emoji: '😄' },
      { fi: 'Laulatko, Aino?', en: 'Do you sing, Aino?', emoji: '🎤' },
      { fi: 'En laula.', en: "I don't.", emoji: '🙅' },
      { fi: 'Tanssitko?', en: 'Do you dance?', emoji: '💃' },
      { fi: 'Tanssin!', en: 'I do!', emoji: '🎉' },
    ],
    questions: [
      {
        promptFi: 'Laulaako Aino?',
        promptEn: 'Does Aino sing?',
        options: [
          { fi: 'Ei laula.', en: "No, she doesn't.", emoji: '🙅', correct: true },
          { fi: 'Laulaa.', en: 'Yes, she does.', emoji: '🎤' },
          { fi: 'Ui.', en: 'She swims.', emoji: '🏊' },
        ],
      },
      {
        promptFi: 'Uiko Eero?',
        promptEn: 'Does Eero swim?',
        options: [
          { fi: 'Ui.', en: 'Yes, he does.', emoji: '🏊', correct: true },
          { fi: 'Ei ui.', en: "No, he doesn't.", emoji: '🙅' },
          { fi: 'Laulaa.', en: 'He sings.', emoji: '🎤' },
        ],
      },
    ],
  }),
  story('feelings', {
    id: 'sick-day',
    titleFi: 'Sairas päivä',
    titleEn: 'A sick day',
    icon: '🤒',
    tier: 3,
    pages: [
      { fi: 'Eero on surullinen.', en: 'Eero is sad.', emoji: '😢' },
      { fi: 'Hän on sairas.', en: 'He is sick.', emoji: '🤒' },
      { fi: 'Hänellä on kylmä.', en: 'He is cold.', emoji: '🥶' },
      { fi: 'Äiti tuo mehua.', en: 'Mom brings some juice.', emoji: '🧃' },
      { fi: 'Nyt Eero on iloinen.', en: 'Now Eero is happy.', emoji: '😊' },
    ],
    questions: [
      {
        promptFi: 'Mitä äiti tuo?',
        promptEn: 'What does Mom bring?',
        options: [
          { fi: 'mehua', en: 'juice', emoji: '🧃', correct: true },
          { fi: 'maitoa', en: 'milk', emoji: '🥛' },
          { fi: 'vettä', en: 'water', emoji: '💧' },
        ],
      },
      {
        promptFi: 'Millainen Eero on lopussa?',
        promptEn: 'How is Eero at the end?',
        options: [
          { fi: 'iloinen', en: 'happy', emoji: '😊', correct: true },
          { fi: 'surullinen', en: 'sad', emoji: '😢' },
          { fi: 'vihainen', en: 'angry', emoji: '😠' },
        ],
      },
    ],
  }),
  story('likes', {
    id: 'what-we-like',
    titleFi: 'Mistä tykkäämme?',
    titleEn: 'What we like',
    icon: '❤️',
    tier: 3,
    pages: [
      { fi: 'Tykkään pitsasta.', en: 'I like pizza.', emoji: '🍕' },
      { fi: 'Eero tykkää jäätelöstä.', en: 'Eero likes ice cream.', emoji: '🍦' },
      { fi: 'Aino rakastaa suklaata.', en: 'Aino loves chocolate.', emoji: '🍫' },
      { fi: 'En tykkää kalasta.', en: "I don't like fish.", emoji: '🐟' },
      { fi: 'Pidän musiikista!', en: 'I like music!', emoji: '🎵' },
    ],
    questions: [
      {
        promptFi: 'Mistä Eero tykkää?',
        promptEn: 'What does Eero like?',
        options: [
          { fi: 'jäätelöstä', en: 'ice cream', emoji: '🍦', correct: true },
          { fi: 'pitsasta', en: 'pizza', emoji: '🍕' },
          { fi: 'kalasta', en: 'fish', emoji: '🐟' },
        ],
      },
      {
        promptFi: 'Mitä Aino rakastaa?',
        promptEn: 'What does Aino love?',
        options: [
          { fi: 'suklaata', en: 'chocolate', emoji: '🍫', correct: true },
          { fi: 'pitsaa', en: 'pizza', emoji: '🍕' },
          { fi: 'kalaa', en: 'fish', emoji: '🐟' },
        ],
      },
    ],
  }),
  story('wanting', {
    id: 'swim-or-play',
    titleFi: 'Uida vai leikkiä?',
    titleEn: 'Swim or play?',
    icon: '🏊',
    tier: 3,
    pages: [
      { fi: 'Haluan uida.', en: 'I want to swim.', emoji: '🏊' },
      { fi: 'Osaan uida hyvin.', en: 'I can swim well.', emoji: '🌊' },
      { fi: 'Eero ei halua uida.', en: "Eero doesn't want to swim.", emoji: '🙅' },
      { fi: 'Hän haluaa leikkiä.', en: 'He wants to play.', emoji: '🧸' },
      { fi: 'Saanko minäkin leikkiä?', en: 'May I play too?', emoji: '🙋' },
    ],
    questions: [
      {
        promptFi: 'Mitä Eero haluaa tehdä?',
        promptEn: 'What does Eero want to do?',
        options: [
          { fi: 'leikkiä', en: 'to play', emoji: '🧸', correct: true },
          { fi: 'uida', en: 'to swim', emoji: '🏊' },
          { fi: 'nukkua', en: 'to sleep', emoji: '😴' },
        ],
      },
      {
        promptFi: 'Mitä minä osaan?',
        promptEn: 'What can I do?',
        options: [
          { fi: 'uida', en: 'swim', emoji: '🏊', correct: true },
          { fi: 'laulaa', en: 'sing', emoji: '🎤' },
          { fi: 'lukea', en: 'read', emoji: '📖' },
        ],
      },
    ],
  }),
  story('verbs-4', {
    id: 'open-window',
    titleFi: 'Herään',
    titleEn: 'I wake up',
    icon: '⏰',
    tier: 3,
    pages: [
      { fi: 'Minä herään.', en: 'I wake up.', emoji: '⏰' },
      { fi: 'Avaan ikkunan.', en: 'I open the window.', emoji: '🪟' },
      { fi: 'Kissa hyppää sängylle.', en: 'The cat jumps onto the bed.', emoji: '🐱' },
      { fi: 'Siivoan huoneen.', en: 'I tidy the room.', emoji: '🧹' },
      { fi: 'Haluan leipää!', en: 'I want some bread!', emoji: '🍞' },
    ],
    questions: [
      {
        promptFi: 'Mitä minä avaan?',
        promptEn: 'What do I open?',
        options: [
          { fi: 'ikkunan', en: 'the window', emoji: '🪟', correct: true },
          { fi: 'oven', en: 'the door', emoji: '🚪' },
          { fi: 'laatikon', en: 'the box', emoji: '📦' },
        ],
      },
      {
        promptFi: 'Mihin kissa hyppää?',
        promptEn: 'Where does the cat jump?',
        options: [
          { fi: 'sängylle', en: 'onto the bed', emoji: '🛏️', correct: true },
          { fi: 'tuolille', en: 'onto the chair', emoji: '🪑' },
          { fi: 'pöydälle', en: 'onto the table', emoji: '🍽️' },
        ],
      },
    ],
  }),
  story('school-day', {
    id: 'math-and-gym',
    titleFi: 'Matikka ja liikunta',
    titleEn: 'Math and gym',
    icon: '🏫',
    tier: 3,
    pages: [
      { fi: 'Menen kouluun.', en: 'I go to school.', emoji: '🎒' },
      { fi: 'Ensin on matematiikkaa.', en: 'First there is math.', emoji: '🔢' },
      { fi: 'En tykkää matematiikasta.', en: "I don't like math.", emoji: '😕' },
      { fi: 'Sitten on liikuntaa.', en: 'Then there is gym.', emoji: '🤸' },
      { fi: 'Tykkään liikunnasta!', en: 'I like gym!', emoji: '😄' },
    ],
    questions: [
      {
        promptFi: 'Mistä en tykkää?',
        promptEn: "What don't I like?",
        options: [
          { fi: 'matematiikasta', en: 'math', emoji: '🔢', correct: true },
          { fi: 'liikunnasta', en: 'gym', emoji: '🤸' },
          { fi: 'englannista', en: 'English', emoji: '🇬🇧' },
        ],
      },
      {
        promptFi: 'Mitä on sitten?',
        promptEn: 'What comes next?',
        options: [
          { fi: 'liikuntaa', en: 'gym', emoji: '🤸', correct: true },
          { fi: 'matematiikkaa', en: 'math', emoji: '🔢' },
          { fi: 'englantia', en: 'English', emoji: '🇬🇧' },
        ],
      },
    ],
  }),
  story('seeing', {
    id: 'waiting-bus',
    titleFi: 'Odotan bussia',
    titleEn: "I'm waiting for the bus",
    icon: '🚏',
    tier: 3,
    pages: [
      { fi: 'Odotan bussia.', en: "I'm waiting for the bus.", emoji: '🚏' },
      { fi: 'Katson autoja.', en: "I'm watching the cars.", emoji: '🚗' },
      { fi: 'Näen junan!', en: 'I see a train!', emoji: '🚆' },
      { fi: 'Ja nyt näen bussin.', en: 'And now I see the bus.', emoji: '🚌' },
      { fi: 'Bussi tulee.', en: 'The bus is coming.', emoji: '😊' },
    ],
    questions: [
      {
        promptFi: 'Mitä minä odotan?',
        promptEn: 'What am I waiting for?',
        options: [
          { fi: 'bussia', en: 'the bus', emoji: '🚌', correct: true },
          { fi: 'junaa', en: 'the train', emoji: '🚆' },
          { fi: 'autoa', en: 'a car', emoji: '🚗' },
        ],
      },
      {
        promptFi: 'Mitä näen ensin?',
        promptEn: 'What do I see first?',
        options: [
          { fi: 'junan', en: 'a train', emoji: '🚆', correct: true },
          { fi: 'bussin', en: 'the bus', emoji: '🚌' },
          { fi: 'auton', en: 'a car', emoji: '🚗' },
        ],
      },
    ],
  }),
  story('shop', {
    id: 'shopping-trip',
    titleFi: 'Kauppareissu',
    titleEn: 'The shopping trip',
    icon: '🛒',
    tier: 4,
    pages: [
      { fi: 'Menemme kauppaan.', en: 'We go to the shop.', emoji: '🛒' },
      { fi: 'Ostamme maitoa.', en: 'We buy some milk.', emoji: '🥛' },
      { fi: 'Ostamme leipää.', en: 'We buy some bread.', emoji: '🍞' },
      { fi: 'Ostan yhden omenan.', en: 'I buy one apple.', emoji: '🍎' },
      { fi: 'Isä ostaa jäätelön!', en: 'Dad buys an ice cream!', emoji: '🍦' },
    ],
    questions: [
      {
        promptFi: 'Mitä isä ostaa?',
        promptEn: 'What does Dad buy?',
        options: [
          { fi: 'jäätelön', en: 'an ice cream', emoji: '🍦', correct: true },
          { fi: 'omenan', en: 'an apple', emoji: '🍎' },
          { fi: 'maitoa', en: 'some milk', emoji: '🥛' },
        ],
      },
      {
        promptFi: 'Mitä me ostamme?',
        promptEn: 'What do we buy?',
        options: [
          { fi: 'maitoa ja leipää', en: 'milk and bread', emoji: '🥛', correct: true },
          { fi: 'jäätelöä', en: 'ice cream', emoji: '🍦' },
          { fi: 'kalaa', en: 'fish', emoji: '🐟' },
        ],
      },
    ],
  }),
  story('commands', {
    id: 'lets-play-ball',
    titleFi: 'Pelataan!',
    titleEn: "Let's play!",
    icon: '⚽',
    tier: 4,
    pages: [
      { fi: 'Hyppää, Eero!', en: 'Jump, Eero!', emoji: '🦘' },
      { fi: 'Juokse!', en: 'Run!', emoji: '🏃' },
      { fi: 'Älä istu!', en: "Don't sit down!", emoji: '🪑' },
      { fi: 'Leikitään yhdessä!', en: "Let's play together!", emoji: '🤝' },
      { fi: 'Pelataan palloa!', en: "Let's play ball!", emoji: '⚽' },
    ],
    questions: [
      {
        promptFi: 'Mitä Eero tekee ensin?',
        promptEn: 'What does Eero do first?',
        options: [
          { fi: 'hyppää', en: 'jumps', emoji: '🦘', correct: true },
          { fi: 'istuu', en: 'sits', emoji: '🪑' },
          { fi: 'nukkuu', en: 'sleeps', emoji: '😴' },
        ],
      },
      {
        promptFi: 'Mitä pelataan?',
        promptEn: 'What do they play?',
        options: [
          { fi: 'palloa', en: 'ball', emoji: '⚽', correct: true },
          { fi: 'pianoa', en: 'the piano', emoji: '🎹' },
          { fi: 'kitaraa', en: 'the guitar', emoji: '🎸' },
        ],
      },
    ],
  }),
  story('describing', {
    id: 'big-and-small',
    titleFi: 'Iso ja pieni',
    titleEn: 'Big and small',
    icon: '🐕',
    tier: 4,
    pages: [
      { fi: 'Tässä on iso koira.', en: 'Here is a big dog.', emoji: '🐕' },
      { fi: 'Ja pieni kissa.', en: 'And a small cat.', emoji: '🐈' },
      { fi: 'Koira on ruskea.', en: 'The dog is brown.', emoji: '🟫' },
      { fi: 'Kissa on valkoinen.', en: 'The cat is white.', emoji: '⬜' },
      { fi: 'Ne ovat kavereita.', en: 'They are friends.', emoji: '🤝' },
    ],
    questions: [
      {
        promptFi: 'Millainen koira on?',
        promptEn: 'What is the dog like?',
        options: [
          { fi: 'iso', en: 'big', emoji: '🐘', correct: true },
          { fi: 'pieni', en: 'small', emoji: '🐭' },
          { fi: 'valkoinen', en: 'white', emoji: '⬜' },
        ],
      },
      {
        promptFi: 'Mikä on valkoinen?',
        promptEn: 'What is white?',
        options: [
          { fi: 'kissa', en: 'the cat', emoji: '🐈', correct: true },
          { fi: 'koira', en: 'the dog', emoji: '🐕' },
          { fi: 'pallo', en: 'the ball', emoji: '⚽' },
        ],
      },
    ],
  }),
  story('comparing', {
    id: 'zoo-race',
    titleFi: 'Kuka on nopein?',
    titleEn: 'Who is the fastest?',
    icon: '🐘',
    tier: 4,
    pages: [
      { fi: 'Norsu on iso.', en: 'The elephant is big.', emoji: '🐘' },
      { fi: 'Hevonen on pienempi.', en: 'The horse is smaller.', emoji: '🐴' },
      { fi: 'Hiiri on pienin.', en: 'The mouse is the smallest.', emoji: '🐭' },
      { fi: 'Mikä on nopein?', en: 'Which one is the fastest?', emoji: '🏁' },
      { fi: 'Hevonen on nopein!', en: 'The horse is the fastest!', emoji: '🐎' },
    ],
    questions: [
      {
        promptFi: 'Mikä on pienin?',
        promptEn: 'Which one is the smallest?',
        options: [
          { fi: 'hiiri', en: 'the mouse', emoji: '🐭', correct: true },
          { fi: 'norsu', en: 'the elephant', emoji: '🐘' },
          { fi: 'hevonen', en: 'the horse', emoji: '🐴' },
        ],
      },
      {
        promptFi: 'Mikä on nopein?',
        promptEn: 'Which one is the fastest?',
        options: [
          { fi: 'hevonen', en: 'the horse', emoji: '🐴', correct: true },
          { fi: 'hiiri', en: 'the mouse', emoji: '🐭' },
          { fi: 'norsu', en: 'the elephant', emoji: '🐘' },
        ],
      },
    ],
  }),
  story('where', {
    id: 'where-cat',
    titleFi: 'Missä kissa on?',
    titleEn: "Where's the cat?",
    icon: '🐱',
    tier: 4,
    pages: [
      { fi: 'Missä kissa on?', en: "Where's the cat?", emoji: '❓' },
      { fi: 'Kissa ei ole laatikossa.', en: "The cat isn't in the box.", emoji: '📦' },
      { fi: 'Kissa ei ole pöydällä.', en: "The cat isn't on the table.", emoji: '🍽️' },
      { fi: 'Kissa on sängyllä!', en: 'The cat is on the bed!', emoji: '🛏️' },
      { fi: 'Kissa nukkuu siellä.', en: 'The cat is sleeping there.', emoji: '😴' },
    ],
    questions: [
      {
        promptFi: 'Missä kissa on?',
        promptEn: "Where's the cat?",
        options: [
          { fi: 'sängyllä', en: 'on the bed', emoji: '🛏️', correct: true },
          { fi: 'laatikossa', en: 'in the box', emoji: '📦' },
          { fi: 'pöydällä', en: 'on the table', emoji: '🍽️' },
        ],
      },
      {
        promptFi: 'Mitä kissa tekee?',
        promptEn: 'What is the cat doing?',
        options: [
          { fi: 'nukkuu', en: 'sleeping', emoji: '😴', correct: true },
          { fi: 'syö', en: 'eating', emoji: '🍽️' },
          { fi: 'leikkii', en: 'playing', emoji: '🧶' },
        ],
      },
    ],
  }),
  story('moving', {
    id: 'cat-and-box',
    titleFi: 'Kissa ja laatikko',
    titleEn: 'The cat and the box',
    icon: '📦',
    tier: 4,
    pages: [
      { fi: 'Kissa menee laatikkoon.', en: 'The cat goes into the box.', emoji: '📦' },
      { fi: 'Kissa tulee laatikosta.', en: 'The cat comes out of the box.', emoji: '🐱' },
      { fi: 'Kissa menee pöydälle.', en: 'The cat goes onto the table.', emoji: '⬆️' },
      { fi: 'Kissa hyppää pöydältä.', en: 'The cat jumps off the table.', emoji: '⬇️' },
      { fi: 'Nyt kissa on sängyssä.', en: 'Now the cat is in bed.', emoji: '🛏️' },
    ],
    questions: [
      {
        promptFi: 'Mihin kissa menee ensin?',
        promptEn: 'Where does the cat go first?',
        options: [
          { fi: 'laatikkoon', en: 'into the box', emoji: '📦', correct: true },
          { fi: 'pöydälle', en: 'onto the table', emoji: '🍽️' },
          { fi: 'sänkyyn', en: 'into bed', emoji: '🛏️' },
        ],
      },
      {
        promptFi: 'Missä kissa on lopuksi?',
        promptEn: 'Where is the cat at the end?',
        options: [
          { fi: 'sängyssä', en: 'in bed', emoji: '🛏️', correct: true },
          { fi: 'laatikossa', en: 'in the box', emoji: '📦' },
          { fi: 'pöydällä', en: 'on the table', emoji: '🍽️' },
        ],
      },
    ],
  }),
  story('town', {
    id: 'park-and-library',
    titleFi: 'Puisto ja kirjasto',
    titleEn: 'The park and the library',
    icon: '🌳',
    tier: 4,
    pages: [
      { fi: 'Menemme puistoon.', en: 'We go to the park.', emoji: '🌳' },
      { fi: 'Puistossa on paljon lapsia.', en: 'There are lots of children in the park.', emoji: '🛝' },
      { fi: 'Sitten menemme kirjastoon.', en: 'Then we go to the library.', emoji: '📚' },
      { fi: 'Kirjastossa on hiljaista.', en: "It's quiet in the library.", emoji: '🤫' },
      { fi: 'Lopuksi tulemme kotiin.', en: 'Last, we come home.', emoji: '🏠' },
    ],
    questions: [
      {
        promptFi: 'Mihin menemme ensin?',
        promptEn: 'Where do we go first?',
        options: [
          { fi: 'puistoon', en: 'to the park', emoji: '🌳', correct: true },
          { fi: 'kirjastoon', en: 'to the library', emoji: '📚' },
          { fi: 'kouluun', en: 'to school', emoji: '🏫' },
        ],
      },
      {
        promptFi: 'Missä on hiljaista?',
        promptEn: 'Where is it quiet?',
        options: [
          { fi: 'kirjastossa', en: 'in the library', emoji: '📚', correct: true },
          { fi: 'puistossa', en: 'in the park', emoji: '🌳' },
          { fi: 'kaupassa', en: 'in the shop', emoji: '🛒' },
        ],
      },
    ],
  }),
  story('by-with', {
    id: 'how-we-go',
    titleFi: 'Miten menemme?',
    titleEn: 'How we go',
    icon: '🚌',
    tier: 4,
    pages: [
      { fi: 'Isä menee bussilla.', en: 'Dad goes by bus.', emoji: '🚌' },
      { fi: 'Äiti menee autolla.', en: 'Mom goes by car.', emoji: '🚗' },
      { fi: 'Minä menen pyörällä.', en: 'I go by bike.', emoji: '🚲' },
      { fi: 'Isoäiti tulee junalla.', en: 'Grandma comes by train.', emoji: '🚆' },
      { fi: 'Leikin kaverin kanssa.', en: 'I play with a friend.', emoji: '🤝' },
    ],
    questions: [
      {
        promptFi: 'Miten äiti menee?',
        promptEn: 'How does Mom go?',
        options: [
          { fi: 'autolla', en: 'by car', emoji: '🚗', correct: true },
          { fi: 'bussilla', en: 'by bus', emoji: '🚌' },
          { fi: 'junalla', en: 'by train', emoji: '🚆' },
        ],
      },
      {
        promptFi: 'Kenen kanssa leikin?',
        promptEn: 'Who do I play with?',
        options: [
          { fi: 'kaverin kanssa', en: 'with a friend', emoji: '🤝', correct: true },
          { fi: 'isän kanssa', en: 'with Dad', emoji: '👨' },
          { fi: 'äidin kanssa', en: 'with Mom', emoji: '👩' },
        ],
      },
    ],
  }),
  story('when', {
    id: 'my-saturday',
    titleFi: 'Minun lauantaini',
    titleEn: 'My Saturday',
    icon: '📅',
    tier: 4,
    pages: [
      { fi: 'Tänään on lauantai.', en: 'Today is Saturday.', emoji: '📅' },
      { fi: 'Aamulla syön puuroa.', en: 'In the morning I eat porridge.', emoji: '🥣' },
      { fi: 'Päivällä uin.', en: 'In the daytime I swim.', emoji: '🏊' },
      { fi: 'Illalla luen kirjaa.', en: 'In the evening I read a book.', emoji: '📖' },
      { fi: 'Sunnuntaina leikin kaverin kanssa.', en: 'On Sunday I play with a friend.', emoji: '🤝' },
    ],
    questions: [
      {
        promptFi: 'Mitä teen aamulla?',
        promptEn: 'What do I do in the morning?',
        options: [
          { fi: 'syön puuroa', en: 'eat porridge', emoji: '🥣', correct: true },
          { fi: 'uin', en: 'swim', emoji: '🏊' },
          { fi: 'luen kirjaa', en: 'read a book', emoji: '📖' },
        ],
      },
      {
        promptFi: 'Milloin uin?',
        promptEn: 'When do I swim?',
        options: [
          { fi: 'päivällä', en: 'in the daytime', emoji: '☀️', correct: true },
          { fi: 'aamulla', en: 'in the morning', emoji: '🌅' },
          { fi: 'illalla', en: 'in the evening', emoji: '🌆' },
        ],
      },
    ],
  }),
  story('big-numbers', {
    id: 'sweets-day',
    titleFi: 'Karkkipäivä',
    titleEn: 'Sweets day',
    icon: '🍬',
    tier: 4,
    pages: [
      { fi: 'Lauantaina on karkkipäivä.', en: 'On Saturday it is sweets day.', emoji: '🍬' },
      { fi: 'Minulla on viisitoista karkkia.', en: 'I have fifteen sweets.', emoji: '🍭' },
      { fi: 'Eerolla on yksitoista karkkia.', en: 'Eero has eleven sweets.', emoji: '👦' },
      { fi: 'Annan Eerolle kaksi karkkia.', en: 'I give Eero two sweets.', emoji: '🎁' },
      { fi: 'Nyt meillä on yhtä paljon.', en: 'Now we have the same amount.', emoji: '🤝' },
    ],
    questions: [
      {
        promptFi: 'Montako karkkia annan Eerolle?',
        promptEn: 'How many sweets do I give Eero?',
        options: [
          { fi: 'kaksi', en: 'two', emoji: '2️⃣', correct: true },
          { fi: 'kolme', en: 'three', emoji: '3️⃣' },
          { fi: 'neljä', en: 'four', emoji: '4️⃣' },
        ],
      },
      {
        promptFi: 'Milloin on karkkipäivä?',
        promptEn: 'When is sweets day?',
        options: [
          { fi: 'lauantaina', en: 'on Saturday', emoji: '📅', correct: true },
          { fi: 'maanantaina', en: 'on Monday', emoji: '🗓️' },
          { fi: 'sunnuntaina', en: 'on Sunday', emoji: '☀️' },
        ],
      },
    ],
  }),
  story('birthdays', {
    id: 'my-birthday',
    titleFi: 'Syntymäpäiväni',
    titleEn: 'My birthday',
    icon: '🎂',
    tier: 5,
    pages: [
      { fi: 'Syntymäpäiväni on toukokuussa.', en: 'My birthday is in May.', emoji: '🎂' },
      { fi: 'Se on viides toukokuuta.', en: "It's the 5th of May.", emoji: '📅' },
      { fi: 'Täytän yhdeksän vuotta.', en: "I'm turning nine.", emoji: '9️⃣' },
      { fi: 'Saan ilmapalloja ja lahjoja.', en: 'I get balloons and presents.', emoji: '🎈' },
      { fi: 'Kaikki laulavat minulle.', en: 'Everyone sings to me.', emoji: '🎶' },
    ],
    questions: [
      {
        promptFi: 'Milloin syntymäpäiväni on?',
        promptEn: 'When is my birthday?',
        options: [
          { fi: 'viides toukokuuta', en: 'the 5th of May', emoji: '📅', correct: true },
          { fi: 'kuudes toukokuuta', en: 'the 6th of May', emoji: '🗓️' },
          { fi: 'viides kesäkuuta', en: 'the 5th of June', emoji: '☀️' },
        ],
      },
      {
        promptFi: 'Montako vuotta täytän?',
        promptEn: 'How old am I turning?',
        options: [
          { fi: 'yhdeksän', en: 'nine', emoji: '9️⃣', correct: true },
          { fi: 'kahdeksan', en: 'eight', emoji: '8️⃣' },
          { fi: 'seitsemän', en: 'seven', emoji: '7️⃣' },
        ],
      },
    ],
  }),
  story('question-words', {
    id: 'new-boy',
    titleFi: 'Uusi oppilas',
    titleEn: 'The new pupil',
    icon: '🧒',
    tier: 5,
    pages: [
      { fi: 'Luokkaan tulee uusi oppilas.', en: 'A new pupil comes to the class.', emoji: '🧒' },
      { fi: 'Hänen nimensä on Leo.', en: 'His name is Leo.', emoji: '🏷️' },
      { fi: 'Leo istuu ikkunan vieressä.', en: 'Leo sits next to the window.', emoji: '🪟' },
      { fi: 'Hänellä on punainen reppu.', en: 'He has a red backpack.', emoji: '🎒' },
      { fi: 'Leo tykkää jalkapallosta.', en: 'Leo likes football.', emoji: '⚽' },
    ],
    questions: [
      {
        promptFi: 'Kuka tulee luokkaan?',
        promptEn: 'Who comes to the class?',
        options: [
          { fi: 'uusi oppilas', en: 'a new pupil', emoji: '🧒', correct: true },
          { fi: 'opettaja', en: 'the teacher', emoji: '🧑‍🏫' },
          { fi: 'äiti', en: 'Mom', emoji: '👩' },
        ],
      },
      {
        promptFi: 'Missä Leo istuu?',
        promptEn: 'Where does Leo sit?',
        options: [
          { fi: 'ikkunan vieressä', en: 'next to the window', emoji: '🪟', correct: true },
          { fi: 'oven vieressä', en: 'next to the door', emoji: '🚪' },
          { fi: 'pöydän alla', en: 'under the table', emoji: '🍽️' },
        ],
      },
      {
        promptFi: 'Mistä Leo tykkää?',
        promptEn: 'What does Leo like?',
        options: [
          { fi: 'jalkapallosta', en: 'football', emoji: '⚽', correct: true },
          { fi: 'musiikista', en: 'music', emoji: '🎵' },
          { fi: 'kalasta', en: 'fish', emoji: '🐟' },
        ],
      },
    ],
  }),
  story('me-you', {
    id: 'help-the-cat',
    titleFi: 'Auta minua!',
    titleEn: 'Help me!',
    icon: '🐱',
    tier: 5,
    pages: [
      { fi: 'Kissa on puussa.', en: 'The cat is up in the tree.', emoji: '🌳' },
      { fi: 'Auta minua!', en: 'Help me!', emoji: '😿' },
      { fi: 'Eero auttaa kissaa.', en: 'Eero helps the cat.', emoji: '🧒' },
      { fi: 'Kiitos! Pidän sinusta.', en: 'Thank you! I like you.', emoji: '❤️' },
      { fi: 'Eero vie kissan kotiin.', en: 'Eero takes the cat home.', emoji: '🏠' },
    ],
    questions: [
      {
        promptFi: 'Kuka auttaa kissaa?',
        promptEn: 'Who helps the cat?',
        options: [
          { fi: 'Eero', en: 'Eero', emoji: '🧒', correct: true },
          { fi: 'äiti', en: 'Mom', emoji: '👩' },
          { fi: 'koira', en: 'the dog', emoji: '🐶' },
        ],
      },
      {
        promptFi: 'Mitä kissa sanoo lopuksi?',
        promptEn: 'What does the cat say at the end?',
        options: [
          { fi: 'Pidän sinusta.', en: 'I like you.', emoji: '❤️', correct: true },
          { fi: 'Auta häntä.', en: 'Help him.', emoji: '🙏' },
          { fi: 'Näen sinut.', en: 'I see you.', emoji: '👀' },
        ],
      },
    ],
  }),
  story('around', {
    id: 'where-ball',
    titleFi: 'Missä pallo on?',
    titleEn: "Where's the ball?",
    icon: '⚽',
    tier: 5,
    pages: [
      { fi: 'Missä pallo on?', en: "Where's the ball?", emoji: '❓' },
      { fi: 'Se ei ole sängyn alla.', en: "It isn't under the bed.", emoji: '🛏️' },
      { fi: 'Se ei ole tuolin takana.', en: "It isn't behind the chair.", emoji: '🪑' },
      { fi: 'Se on oven vieressä!', en: "It's next to the door!", emoji: '🚪' },
      { fi: 'Koira istuu pallon edessä.', en: 'The dog sits in front of the ball.', emoji: '🐶' },
    ],
    questions: [
      {
        promptFi: 'Missä pallo on?',
        promptEn: "Where's the ball?",
        options: [
          { fi: 'oven vieressä', en: 'next to the door', emoji: '🚪', correct: true },
          { fi: 'sängyn alla', en: 'under the bed', emoji: '🛏️' },
          { fi: 'tuolin takana', en: 'behind the chair', emoji: '🪑' },
        ],
      },
      {
        promptFi: 'Kuka istuu pallon edessä?',
        promptEn: 'Who sits in front of the ball?',
        options: [
          { fi: 'koira', en: 'the dog', emoji: '🐶', correct: true },
          { fi: 'kissa', en: 'the cat', emoji: '🐱' },
          { fi: 'vauva', en: 'the baby', emoji: '👶' },
        ],
      },
    ],
  }),
  story('many', {
    id: 'my-things',
    titleFi: 'Paljon tavaraa',
    titleEn: 'Lots of things',
    icon: '🧸',
    tier: 5,
    pages: [
      { fi: 'Huoneessani on paljon tavaraa.', en: 'There are lots of things in my room.', emoji: '🧸' },
      { fi: 'Minulla on kolme palloa.', en: 'I have three balls.', emoji: '⚽' },
      { fi: 'Minulla on myös autoja.', en: 'I have some cars too.', emoji: '🚗' },
      { fi: 'Kirjat ovat laatikossa.', en: 'The books are in the box.', emoji: '📦' },
      { fi: 'Missä ovat kenkäni?', en: 'Where are my shoes?', emoji: '👟' },
    ],
    questions: [
      {
        promptFi: 'Missä kirjat ovat?',
        promptEn: 'Where are the books?',
        options: [
          { fi: 'laatikossa', en: 'in the box', emoji: '📦', correct: true },
          { fi: 'pöydällä', en: 'on the table', emoji: '🍽️' },
          { fi: 'sängyssä', en: 'in the bed', emoji: '🛏️' },
        ],
      },
      {
        promptFi: 'Montako palloa minulla on?',
        promptEn: 'How many balls do I have?',
        options: [
          { fi: 'kolme', en: 'three', emoji: '3️⃣', correct: true },
          { fi: 'kaksi', en: 'two', emoji: '2️⃣' },
          { fi: 'neljä', en: 'four', emoji: '4️⃣' },
        ],
      },
    ],
  }),
  story('verbs-5-6', {
    id: 'drawing-a-house',
    titleFi: 'Piirrän talon',
    titleEn: 'I draw a house',
    icon: '✏️',
    tier: 5,
    pages: [
      { fi: 'Tarvitsen kynän.', en: 'I need a pencil.', emoji: '✏️' },
      { fi: 'Valitsen punaisen kynän.', en: 'I choose the red pencil.', emoji: '🟥' },
      { fi: 'Piirrän ison talon.', en: 'I draw a big house.', emoji: '🏠' },
      { fi: 'Kissa lämpenee auringossa.', en: 'The cat warms up in the sun.', emoji: '☀️' },
      { fi: 'Illalla lukitsen oven.', en: 'In the evening I lock the door.', emoji: '🔒' },
    ],
    questions: [
      {
        promptFi: 'Minkä kynän valitsen?',
        promptEn: 'Which pencil do I choose?',
        options: [
          { fi: 'punaisen', en: 'the red one', emoji: '🟥', correct: true },
          { fi: 'sinisen', en: 'the blue one', emoji: '🟦' },
          { fi: 'vihreän', en: 'the green one', emoji: '🟩' },
        ],
      },
      {
        promptFi: 'Mitä piirrän?',
        promptEn: 'What do I draw?',
        options: [
          { fi: 'ison talon', en: 'a big house', emoji: '🏠', correct: true },
          { fi: 'pienen koiran', en: 'a small dog', emoji: '🐶' },
          { fi: 'kissan', en: 'a cat', emoji: '🐱' },
        ],
      },
    ],
  }),
];
