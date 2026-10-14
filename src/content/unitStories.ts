// One short picture-book story at the end of (almost) every unit — the unit's
// grammar, used for meaning in something that happens, with the same people
// every time: Aino, her friend Eero, her family, her cat Mirri and Eero's dog
// Musti (see storyKit.ts).
//
// Same discipline as stories.ts: HUMAN-AUTHORED Finnish, short lines, every
// page picturable, questions with exactly one right option that the story
// says, and true-or-false statements whose truth never changes during the
// story. Every word is checked against the vendored Wiktionary forms by
// `unitStories.test.ts` (a form that doesn't exist fails the build), and each
// story sticks to its unit's grammar plus words met by then.
// ⚠️ NEEDS NATIVE FINNISH VETTING (all stories below; listed in FINNISH_REVIEW.md).

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

/** unitId → the story read at the end of that unit. */
export const UNIT_STORY_IDS: Record<string, string> = {};

const story = (unitId: string, s: Story): Story => {
  UNIT_STORY_IDS[unitId] = s.id;
  return s;
};


export const UNIT_STORIES: Story[] = [
  // 1. Hello — greetings only: how Aino and Eero met.
  story('hello', {
    id: 'hello-eero',
    titleFi: 'Hei, Eero!',
    titleEn: 'Hi, Eero!',
    icon: '👋',
    tier: 2,
    pages: [
      page(
        sc('park', '👧 🐱 👦'),
        say('aino', 'Hei! Minä olen Aino.', "Hi! I'm Aino."),
        say('eero', 'Moi! Minä olen Eero.', "Hi! I'm Eero."),
      ),
      page(
        sc('park', '👧 👦'),
        say('eero', 'Mitä kuuluu, Aino?', 'How are you, Aino?'),
        say('aino', 'Hyvää, kiitos! Entä sinulle?', 'Good, thanks! And you?'),
        say('eero', 'Hyvää, kiitos!', 'Good, thanks!'),
      ),
      page(
        sc('park', '👦 🐱'),
        say('eero', 'Hei! Kuka sinä olet?', 'Hi! Who are you?'),
        say('mirri', 'Miau!', 'Meow!'),
        say('aino', 'Se on Mirri!', "That's Mirri!"),
      ),
      page(
        sc('park', '👧 🐱 👦', 'evening'),
        say('eero', 'Näkemiin, Aino! Näkemiin, Mirri!', 'Goodbye, Aino! Goodbye, Mirri!'),
        say('mirri', 'Miau!', 'Meow!'),
      ),
    ],
    questions: [
      ask(
        'Mitä Aino vastaa?',
        'What does Aino answer?',
        right('Hyvää, kiitos!', 'Good, thanks!', '😊'),
        wrong('Hyvää yötä!', 'Good night!', '🌙'),
        wrong('Anteeksi!', 'Sorry!', '🙇'),
      ),
      ask(
        'Mitä Mirri sanoo?',
        'What does Mirri say?',
        right('Miau!', 'Meow!', '🐱'),
        wrong('Moi!', 'Hi!', '🙋'),
        wrong('Kiitos!', 'Thank you!', '🙏'),
      ),
      ask(
        'Mitä Eero sanoo lopuksi?',
        'What does Eero say at the end?',
        right('Näkemiin!', 'Goodbye!', '👋'),
        wrong('Hyvää huomenta!', 'Good morning!', '🌅'),
        wrong('Mitä kuuluu?', 'How are you?', '❓'),
      ),
    ],
    // Unit 1 has greetings only — nothing to make a statement with yet.
    facts: [],
  }),

  // 2. People & things — Tämä on… / Onko tämä…? The teacher shows a book; Aino
  // digs through her backpack for hers, and finds Mirri sitting on it.
  story('people', {
    id: 'in-class',
    titleFi: 'Onko tämä kirja?',
    titleEn: 'Is this a book?',
    icon: '🏫',
    tier: 2,
    pages: [
      page(
        sc('classroom', '🧑‍🏫 📕 👧'),
        tell('Tämä on luokka.', 'This is a classroom.'),
        tell('Tämä on opettaja.', 'This is the teacher.'),
        say('opettaja', 'Tämä on kirja.', 'This is a book.'),
      ),
      page(
        sc('classroom', '👧 🎒 ✏️'),
        tell('Aino etsii kirjaa repusta.', 'Aino looks in her backpack for her book.'),
        say('aino', 'Onko tämä kirja?', 'Is this a book?'),
        say('aino', 'Ei. Tämä on kynä.', 'No. This is a pencil.'),
      ),
      page(
        sc('classroom', '👧 🎒 🖼️'),
        say('aino', 'Onko tämä kirja?', 'Is this a book?'),
        say('aino', 'Ei. Tämä on kuva.', 'No. This is a picture.'),
      ),
      page(
        sc('classroom', '👧 🎒 🐱 📕'),
        say('mirri', 'Miau!', 'Meow!'),
        say('aino', 'Ei! Tämä on Mirri!', 'No! This is Mirri!'),
        say('aino', 'Ja tässä on kirja!', 'And here is the book!'),
      ),
    ],
    questions: [
      ask(
        'Mitä Aino etsii?',
        'What is Aino looking for?',
        right('kirjaa', 'her book', '📕'),
        wrong('kynää', 'a pencil', '✏️'),
        wrong('kuvaa', 'a picture', '🖼️'),
      ),
      ask(
        'Kuka on repussa?',
        'Who is in the backpack?',
        right('Mirri', 'Mirri', '🐱'),
        wrong('opettaja', 'the teacher', '🧑‍🏫'),
        wrong('vauva', 'the baby', '👶'),
      ),
      ask(
        'Mikä tulee ensin?',
        'What comes out first?',
        right('kynä', 'a pencil', '✏️'),
        wrong('kuva', 'a picture', '🖼️'),
        wrong('kello', 'a clock', '⏰'),
      ),
      ask(
        'Mitä opettaja sanoo?',
        'What does the teacher say?',
        right('Tämä on kirja.', 'This is a book.', '📕'),
        wrong('Tämä on kello.', 'This is a clock.', '⏰'),
        wrong('Tämä on kynä.', 'This is a pencil.', '✏️'),
      ),
    ],
    facts: [
      trueFact('Aino on luokassa.', 'Aino is in the classroom.'),
      trueFact('Mirri on repussa.', 'Mirri is in the backpack.'),
      falseFact('Mirri on kirja.', 'Mirri is a book.'),
      falseFact('Opettaja on Mirri.', 'The teacher is Mirri.'),
    ],
  }),

  // 3. Numbers — kymmenen lasta (a number + -a).
  story('numbers', {
    id: 'three-cats',
    titleFi: 'Montako lasta?',
    titleEn: 'How many children?',
    icon: '🔢',
    tier: 2,
    pages: [
      page(
        sc('classroom', '🧑‍🏫 🧒 🧒 👧'),
        say('opettaja', 'Montako lasta?', 'How many children?'),
        say('aino', 'Kymmenen lasta!', 'Ten children!'),
      ),
      page(
        sc('classroom', '👦 🧒 🧒 👧'),
        tell('Tässä on Eero.', "Here's Eero."),
        say('eero', 'Hei! Anteeksi!', 'Hi! Sorry!'),
        say('aino', 'Nyt yksitoista lasta!', 'Now eleven children!'),
      ),
      page(
        sc('classroom', '🐱 🧒 🧒 🧑‍🏫'),
        say('mirri', 'Miau!', 'Meow!'),
        say('opettaja', 'Mikä tämä on?', 'What is this?'),
        say('aino', 'Tämä on Mirri!', 'This is Mirri!'),
      ),
      page(
        sc('classroom', '🧑‍🏫 🐱 👧 👦'),
        say('opettaja', 'Montako lasta nyt?', 'How many children now?'),
        say('eero', 'Kaksitoista lasta!', 'Twelve children!'),
        say('aino', 'Ei! Yksitoista lasta ja Mirri!', 'No! Eleven children and Mirri!'),
      ),
    ],
    questions: [
      ask(
        'Montako lasta on ensin?',
        'How many children are there at first?',
        right('kymmenen lasta', 'ten children', '10'),
        wrong('kaksi lasta', 'two children', '2'),
        wrong('viisi lasta', 'five children', '5'),
      ),
      ask(
        'Montako lasta on lopuksi?',
        'How many children are there at the end?',
        right('yksitoista lasta', 'eleven children', '11'),
        wrong('kaksitoista lasta', 'twelve children', '12'),
        wrong('kymmenen lasta', 'ten children', '10'),
      ),
      ask(
        'Mitä Eero sanoo?',
        'What does Eero say when he comes in?',
        right('Hei! Anteeksi!', 'Hi! Sorry!', '🙇'),
        wrong('Näkemiin!', 'Goodbye!', '👋'),
        wrong('Hyvää yötä!', 'Good night!', '🌙'),
      ),
    ],
    facts: [
      falseFact('Mirri on lapsi.', 'Mirri is a child.'),
      trueFact('Eero on luokassa.', 'Eero is in the classroom.'),
      falseFact('Luokassa on kaksi lasta.', 'There are two children in the classroom.'),
    ],
  }),

  // 4. Having — Minulla on / Onko sinulla…? / Kenellä on? Eero needs a ball
  // for Musti; Aino has none, but Grandma does.
  story('having', {
    id: 'what-we-have',
    titleFi: 'Onko sinulla pallo?',
    titleEn: 'Do you have a ball?',
    icon: '⚽',
    tier: 2,
    pages: [
      page(
        sc('park', '👦 🐶 👧 🐱'),
        tell('Eerolla on koira.', 'Eero has a dog.'),
        tell('Ainolla on kissa.', 'Aino has a cat.'),
        say('eero', 'Aino, onko sinulla pallo?', 'Aino, do you have a ball?'),
      ),
      page(
        sc('home', '👧 🎸 👦'),
        say('aino', 'Ei. Minulla on kitara.', 'No. I have a guitar.'),
        say('aino', 'Onko isoäidillä pallo?', 'Does Grandma have a ball?'),
      ),
      page(
        sc('yard', '👵 🐰 ⚽'),
        say('isoaiti', 'Hei! Minulla on pupu.', 'Hi! I have a bunny.'),
        tell('Isoäidillä on pupu ja pallo!', 'Grandma has a bunny and a ball!'),
      ),
      page(
        sc('park', '👧 👦 👵 🐶 ⚽ 🐰'),
        tell('Nyt meillä on pallo!', 'Now we have a ball!'),
        say('eero', 'Kiitos, isoäiti!', 'Thank you, Grandma!'),
      ),
    ],
    questions: [
      ask(
        'Kenellä on koira?',
        'Who has a dog?',
        right('Eerolla', 'Eero', '👦'),
        wrong('Ainolla', 'Aino', '👧'),
        wrong('isoäidillä', 'Grandma', '👵'),
      ),
      ask(
        'Mitä Ainolla on?',
        'What does Aino have?',
        right('kitara', 'a guitar', '🎸'),
        wrong('pallo', 'a ball', '⚽'),
        wrong('pupu', 'a bunny', '🐰'),
      ),
      ask(
        'Kenellä on pallo?',
        'Who has a ball?',
        right('isoäidillä', 'Grandma', '👵'),
        wrong('Ainolla', 'Aino', '👧'),
        wrong('Eerolla', 'Eero', '👦'),
      ),
      ask(
        'Mitä isoäidillä on?',
        'What does Grandma have?',
        right('pupu', 'a bunny', '🐰'),
        wrong('kissa', 'a cat', '🐱'),
        wrong('koira', 'a dog', '🐶'),
      ),
    ],
    facts: [
      trueFact('Ainolla on kissa.', 'Aino has a cat.'),
      trueFact('Isoäidillä on pallo.', 'Grandma has a ball.'),
      falseFact('Ainolla on pallo.', 'Aino has a ball.'),
      falseFact('Eerolla on pupu.', 'Eero has a bunny.'),
    ],
  }),

  // 5. Not having — Minulla ei ole hattua.
  story('not-having', {
    id: 'no-hat',
    titleFi: 'Missä hattu on?',
    titleEn: "Where's the hat?",
    icon: '👒',
    tier: 2,
    pages: [
      page(
        sc('yard', '👧 👗'),
        tell('On kuuma.', "It's hot."),
        say('aino', 'Minulla on mekko.', 'I have a dress.'),
        say('aino', 'Mutta minulla ei ole hattua!', "But I don't have a hat!"),
      ),
      page(
        sc('home', '👧 👩'),
        say('aino', 'Äiti! Minulla ei ole hattua!', "Mom! I don't have my hat!"),
        say('aiti', 'Onko Eerolla hattu?', 'Does Eero have a hat?'),
      ),
      page(
        sc('yard', '👦 🧢'),
        say('eero', 'Minulla on lakki.', 'I have a cap.'),
        say('eero', 'Minulla ei ole hattua.', "I don't have a hat."),
      ),
      page(
        sc('home', '🐱 👒 👧'),
        say('aino', 'Mirri! Sinulla on hattu!', 'Mirri! You have the hat!'),
        say('mirri', 'Miau!', 'Meow!'),
      ),
    ],
    questions: [
      ask(
        'Kenellä on hattu?',
        'Who has the hat?',
        right('Mirrillä', 'Mirri', '🐱'),
        wrong('äidillä', 'Mom', '👩'),
        wrong('Eerolla', 'Eero', '👦'),
      ),
      ask(
        'Mitä Eerolla on?',
        'What does Eero have?',
        right('lakki', 'a cap', '🧢'),
        wrong('hattu', 'a hat', '👒'),
        wrong('mekko', 'a dress', '👗'),
      ),
      ask(
        'Mitä Ainolla on?',
        'What does Aino have?',
        right('mekko', 'a dress', '👗'),
        wrong('lakki', 'a cap', '🧢'),
        wrong('takki', 'a coat', '🧥'),
      ),
    ],
    facts: [
      trueFact('Eerolla on lakki.', 'Eero has a cap.'),
      falseFact('Äidillä on hattu.', 'Mom has the hat.'),
      falseFact('On kylmä.', "It's cold."),
    ],
  }),

  // 6. Whose? — reppuni, palloni, puhelimesi. Two backpacks look the same;
  // what's inside says whose is whose — and Eero's phone is in Aino's.
  story('whose', {
    id: 'my-backpack',
    titleFi: 'Kaksi reppua',
    titleEn: 'Two backpacks',
    icon: '🎒',
    tier: 3,
    pages: [
      page(
        sc('classroom', '🎒 🎒 👦'),
        tell('Tässä on kaksi reppua.', 'Here are two backpacks.'),
        say('eero', 'Kumpi on minun reppuni?', 'Which one is my backpack?'),
      ),
      page(
        sc('classroom', '👧 🎒 📕'),
        say('aino', 'Tämä on minun kirjani!', 'This is my book!'),
        say('aino', 'Tämä on minun reppuni.', 'This is my backpack.'),
      ),
      page(
        sc('classroom', '👦 🎒 ⚽'),
        say('eero', 'Ja tämä on minun palloni!', 'And this is my ball!'),
        say('eero', 'Tämä on minun reppuni.', 'This is my backpack.'),
      ),
      page(
        sc('classroom', '👧 🎒 📱 👦'),
        tell('Ainon repussa on puhelin.', "There's a phone in Aino's backpack."),
        say('aino', 'Onko tämä sinun puhelimesi?', 'Is this your phone?'),
        say('eero', 'On! Kiitos, Aino!', 'Yes! Thanks, Aino!'),
      ),
    ],
    questions: [
      ask(
        'Kenen kirja se on?',
        'Whose book is it?',
        right('Ainon', "Aino's", '👧'),
        wrong('Eeron', "Eero's", '👦'),
        wrong('opettajan', "the teacher's", '🧑‍🏫'),
      ),
      ask(
        'Kenen pallo se on?',
        'Whose ball is it?',
        right('Eeron', "Eero's", '👦'),
        wrong('Ainon', "Aino's", '👧'),
        wrong('isän', "Dad's", '👨'),
      ),
      ask(
        'Montako reppua on?',
        'How many backpacks are there?',
        right('kaksi reppua', 'two backpacks', '🎒🎒'),
        wrong('yksi reppu', 'one backpack', '🎒'),
        wrong('kolme reppua', 'three backpacks', '🎒🎒🎒'),
      ),
      ask(
        'Kenen repussa puhelin on?',
        "Whose backpack is the phone in?",
        right('Ainon', "Aino's", '👧'),
        wrong('Eeron', "Eero's", '👦'),
        wrong('opettajan', "the teacher's", '🧑‍🏫'),
      ),
    ],
    facts: [
      trueFact('Puhelin on Eeron.', "The phone is Eero's."),
      falseFact('Kirja on Eeron.', "The book is Eero's."),
      falseFact('Pallo on Ainon.', "The ball is Aino's."),
    ],
  }),

  // 7. Mom's bike — isän pyörä, äidin takki. Dad and Mom quiz Aino with
  // trick questions; then the baby grabs Dad's phone and gets a ball instead.
  story('owners', {
    id: 'dads-bike',
    titleFi: 'Kenen tämä on?',
    titleEn: 'Whose is this?',
    icon: '🚲',
    tier: 3,
    pages: [
      page(
        sc('yard', '👨 🚲 👧'),
        say('isa', 'Aino, onko tämä äidin pyörä?', "Aino, is this Mom's bike?"),
        say('aino', 'Ei! Se on isän pyörä!', "No! It's Dad's bike!"),
        say('isa', 'Oikein!', 'Right!'),
      ),
      page(
        sc('home', '👩 🧥 👧'),
        say('aiti', 'Onko tämä isän takki?', "Is this Dad's coat?"),
        say('aino', 'Ei! Se on äidin takki!', "No! It's Mom's coat!"),
        say('aiti', 'Oikein!', 'Right!'),
      ),
      page(
        sc('home', '👶 📱 👨'),
        tell('Vauvalla on puhelin.', 'The baby has a phone.'),
        say('isa', 'Hei! Se on isän puhelin!', "Hey! That's Dad's phone!"),
      ),
      page(
        sc('home', '👶 ⚽ 👨 📱'),
        say('isa', 'Tässä on vauvan pallo.', "Here's the baby's ball."),
        tell('Nyt vauvalla on pallo.', 'Now the baby has a ball.'),
        say('aino', 'Ja isällä on puhelin!', 'And Dad has his phone!'),
      ),
    ],
    questions: [
      ask(
        'Kenen pyörä se on?',
        'Whose bike is it?',
        right('isän', "Dad's", '👨'),
        wrong('äidin', "Mom's", '👩'),
        wrong('Ainon', "Aino's", '👧'),
      ),
      ask(
        'Kenen takki se on?',
        'Whose coat is it?',
        right('äidin', "Mom's", '👩'),
        wrong('isän', "Dad's", '👨'),
        wrong('vauvan', "the baby's", '👶'),
      ),
      ask(
        'Mitä vauvalla on lopuksi?',
        'What does the baby have at the end?',
        right('pallo', 'a ball', '⚽'),
        wrong('puhelin', 'a phone', '📱'),
        wrong('takki', 'a coat', '🧥'),
      ),
    ],
    facts: [
      trueFact('Puhelin on isän.', "The phone is Dad's."),
      falseFact('Pyörä on äidin.', "The bike is Mom's."),
      falseFact('Takki on vauvan.', "The coat is the baby's."),
    ],
  }),

  // 8. Verbs, part 1 — types 1–3: juoksen, laulan, tanssii. A walk in the
  // park: Aino sings, Grandma listens — and starts to dance, then everyone does.
  story('doing', {
    id: 'busy-park',
    titleFi: 'Puistossa',
    titleEn: 'In the park',
    icon: '🌳',
    tier: 3,
    pages: [
      page(
        sc('park', '👧 👦 👵 🐶'),
        tell('Aino, Eero ja isoäiti kävelevät.', 'Aino, Eero and Grandma go for a walk.'),
        say('eero', 'Minä juoksen!', "I'm running!"),
        tell('Musti juoksee myös.', 'Musti runs too.'),
      ),
      page(
        sc('park', '👧 🎤 👵'),
        say('aino', 'Minä laulan!', "I'm singing!"),
        tell('Aino laulaa ja isoäiti kuuntelee.', 'Aino sings and Grandma listens.'),
      ),
      page(
        sc('park', '👵 💃 👦'),
        tell('Isoäiti alkaa tanssia!', 'Grandma starts to dance!'),
        say('isoaiti', 'Minä tanssin!', "I'm dancing!"),
        say('eero', 'Isoäiti tanssii hyvin!', 'Grandma dances well!'),
      ),
      page(
        sc('park', '👧 👦 👵 🐶 💃'),
        tell('Nyt kaikki tanssivat.', 'Now everyone is dancing.'),
        say('aino', 'Musti tanssii myös!', 'Musti is dancing too!'),
      ),
    ],
    questions: [
      ask(
        'Mitä isoäiti tekee?',
        'What does Grandma do?',
        right('Hän tanssii.', 'She dances.', '💃'),
        wrong('Hän ui.', 'She swims.', '🏊'),
        wrong('Hän syö.', 'She eats.', '🍽️'),
      ),
      ask(
        'Mitä Aino tekee?',
        'What does Aino do?',
        right('Hän laulaa.', 'She sings.', '🎤'),
        wrong('Hän juoksee.', 'She runs.', '🏃'),
        wrong('Hän ui.', 'She swims.', '🏊'),
      ),
      ask(
        'Kuka juoksee myös?',
        'Who runs too?',
        right('Musti', 'Musti', '🐶'),
        wrong('isoäiti', 'Grandma', '👵'),
        wrong('Aino', 'Aino', '👧'),
      ),
      ask(
        'Kuka kuuntelee?',
        'Who listens?',
        right('isoäiti', 'Grandma', '👵'),
        wrong('Eero', 'Eero', '👦'),
        wrong('Musti', 'Musti', '🐶'),
      ),
    ],
    facts: [
      trueFact('Isoäiti tanssii hyvin.', 'Grandma dances well.'),
      trueFact('Isoäiti kuuntelee.', 'Grandma listens.'),
      falseFact('Eero laulaa.', 'Eero sings.'),
      falseFact('Musti ui.', 'Musti swims.'),
    ],
  }),

  // 9. Verbs, part 1b — k, p, t change: luen, lukee, nukkuu, piirrän. Dad
  // reads Aino a bedtime book — and falls asleep before she does.
  story('doing-kpt', {
    id: 'evening',
    titleFi: 'Ilta',
    titleEn: 'Evening',
    icon: '🌙',
    tier: 3,
    narrator: 'aino',
    pages: [
      page(
        sc('home', '👧 ✏️ 👶', 'evening'),
        tell('On ilta.', "It's evening."),
        tell('Minä piirrän.', "I'm drawing."),
        tell('Vauva nukkuu.', 'The baby is asleep.'),
      ),
      page(
        sc('home', '👨 📕 👧', 'evening'),
        say('isa', 'Luen sinulle kirjaa.', "I'll read you a book."),
        tell('Isä lukee. Minä kuuntelen.', 'Dad reads. I listen.'),
      ),
      page(
        sc('home', '👨 😴 📕', 'night'),
        tell('Isä lukee ja lukee…', 'Dad reads and reads…'),
        tell('Nyt isä nukkuu!', 'Now Dad is asleep!'),
      ),
      page(
        sc('home', '👧 📕 👨 😴', 'night'),
        say('aino', 'Hyvää yötä, isä!', 'Good night, Dad!'),
        tell('Nyt minä luen.', "Now I'm reading."),
      ),
    ],
    questions: [
      ask(
        'Mitä minä teen ensin?',
        'What do I do first?',
        right('Piirrän.', 'I draw.', '✏️'),
        wrong('Nukun.', 'I sleep.', '😴'),
        wrong('Kirjoitan.', 'I write.', '📝'),
      ),
      ask(
        'Kuka nukkuu ensin?',
        'Who is asleep first?',
        right('vauva', 'the baby', '👶'),
        wrong('isä', 'Dad', '👨'),
        wrong('Mirri', 'Mirri', '🐱'),
      ),
      ask(
        'Mitä isä tekee lopuksi?',
        'What is Dad doing at the end?',
        right('Hän nukkuu.', "He's asleep.", '😴'),
        wrong('Hän lukee.', "He's reading.", '📕'),
        wrong('Hän piirtää.', "He's drawing.", '✏️'),
      ),
    ],
    facts: [
      trueFact('Isä lukee kirjaa.', 'Dad reads a book.'),
      falseFact('Vauva piirtää.', 'The baby draws.'),
      falseFact('Isä laulaa.', 'Dad sings.'),
    ],
  }),

  // 10. Saying no — ei syö, ei juo, ei leiki. Mirri won't play or eat; Aino
  // worries, Mom knows why: Mirri is tired. A long sleep, and she's back.
  story('not-doing', {
    id: 'tired-cat',
    titleFi: 'Mirri ei leiki',
    titleEn: "Mirri won't play",
    icon: '🐱',
    tier: 3,
    pages: [
      page(
        sc('home', '👧 ⚽ 🐱'),
        tell('Aino leikkii.', 'Aino is playing.'),
        tell('Mirri ei leiki.', "Mirri doesn't play."),
        say('aino', 'Mirri, sinä et leiki!', "Mirri, you're not playing!"),
      ),
      page(
        sc('kitchen', '🐱 🍽️'),
        tell('Mirri ei syö.', "Mirri doesn't eat."),
        tell('Mirri ei juo.', "Mirri doesn't drink."),
        say('aino', 'Äiti! Mirri ei syö!', "Mom! Mirri isn't eating!"),
      ),
      page(
        sc('home', '👩 🐱 😴'),
        say('aiti', 'Mirri on väsynyt.', 'Mirri is tired.'),
        tell('Mirri nukkuu ja nukkuu.', 'Mirri sleeps and sleeps.'),
      ),
      page(
        sc('home', '🐱 ⚽ 👧'),
        tell('Nyt Mirri syö ja juo.', 'Now Mirri eats and drinks.'),
        say('aino', 'Ja nyt Mirri leikkii!', 'And now Mirri plays!'),
        say('mirri', 'Miau!', 'Meow!'),
      ),
    ],
    questions: [
      ask(
        'Mitä äiti sanoo?',
        'What does Mom say?',
        right('Mirri on väsynyt.', 'Mirri is tired.', '😴'),
        wrong('Mirri ui.', 'Mirri is swimming.', '🏊'),
        wrong('Mirri laulaa.', 'Mirri is singing.', '🎤'),
      ),
      ask(
        'Mitä Aino tekee alussa?',
        'What is Aino doing at the start?',
        right('Hän leikkii.', "She's playing.", '⚽'),
        wrong('Hän nukkuu.', "She's sleeping.", '😴'),
        wrong('Hän syö.', "She's eating.", '🍽️'),
      ),
      ask(
        'Leikkiikö Mirri lopuksi?',
        'Does Mirri play at the end?',
        right('Kyllä, se leikkii.', 'Yes, she plays.', '⚽'),
        wrong('Ei, se ei leiki.', "No, she doesn't play.", '🚫'),
      ),
    ],
    facts: [
      falseFact('Aino ei leiki.', "Aino doesn't play."),
      trueFact('Mirri nukkuu ja nukkuu.', 'Mirri sleeps and sleeps.'),
      falseFact('Mirri laulaa.', 'Mirri sings.'),
    ],
  }),

  // 11. Asking — Laulatko? – Laulan! / En laula. Grandma is coming, so Aino
  // and Eero get a show ready: who sings, who dances?
  story('asking', {
    id: 'do-you-sing',
    titleFi: 'Laulatko?',
    titleEn: 'Do you sing?',
    icon: '🎤',
    tier: 3,
    pages: [
      page(
        sc('home', '👧 👦'),
        tell('Isoäiti tulee tänään!', 'Grandma is coming today!'),
        say('aino', 'Laulamme isoäidille! Eero, laulatko?', "We'll sing for Grandma! Eero, do you sing?"),
        say('eero', 'En laula.', "I don't sing."),
      ),
      page(
        sc('home', '👧 👦 💃'),
        say('aino', 'Tanssitko?', 'Do you dance?'),
        say('eero', 'Tanssin!', 'I do!'),
      ),
      page(
        sc('home', '👦 👧 🎤'),
        say('eero', 'Aino, laulatko sinä?', 'Aino, do you sing?'),
        say('aino', 'Laulan!', 'I do!'),
      ),
      page(
        sc('home', '👵 👧 🎤 👦 💃'),
        tell('Isoäiti tulee.', 'Grandma comes.'),
        tell('Aino laulaa ja Eero tanssii.', 'Aino sings and Eero dances.'),
        say('isoaiti', 'Laulanko minäkin?', 'Shall I sing too?'),
      ),
    ],
    questions: [
      ask(
        'Laulaako Eero?',
        'Does Eero sing?',
        right('Ei, hän ei laula.', "No, he doesn't sing.", '🚫'),
        wrong('Kyllä, hän laulaa.', 'Yes, he sings.', '🎤'),
      ),
      ask(
        'Mitä Eero tekee?',
        'What does Eero do?',
        right('Hän tanssii.', 'He dances.', '💃'),
        wrong('Hän laulaa.', 'He sings.', '🎤'),
        wrong('Hän ui.', 'He swims.', '🏊'),
      ),
      ask(
        'Kuka tulee lopuksi?',
        'Who comes at the end?',
        right('isoäiti', 'Grandma', '👵'),
        wrong('opettaja', 'the teacher', '🧑‍🏫'),
        wrong('isä', 'Dad', '👨'),
      ),
      ask(
        'Kenelle Aino laulaa?',
        'Who does Aino sing for?',
        right('isoäidille', 'for Grandma', '👵'),
        wrong('opettajalle', 'for the teacher', '🧑‍🏫'),
        wrong('Mirrille', 'for Mirri', '🐱'),
      ),
    ],
    facts: [
      trueFact('Aino laulaa.', 'Aino sings.'),
      falseFact('Eero laulaa.', 'Eero sings.'),
      trueFact('Eero tanssii.', 'Eero dances.'),
    ],
  }),

  // 12. Feelings — Olen sairas. Minulla on kylmä.
  story('feelings', {
    id: 'sick-day',
    titleFi: 'Sairas päivä',
    titleEn: 'A sick day',
    icon: '🤒',
    tier: 3,
    pages: [
      page(
        sc('bedroom', '👦 🤒'),
        say('eero', 'Olen sairas.', "I'm sick."),
        say('eero', 'Minulla on kylmä.', "I'm cold."),
        say('eero', 'Olen surullinen.', "I'm sad."),
      ),
      page(
        sc('home', '👩 👦'),
        say('aiti', 'Onko sinulla nälkä?', 'Are you hungry?'),
        say('eero', 'Ei ole. Minulla on jano.', "No. I'm thirsty."),
      ),
      page(
        sc('home', '👧 🖼️ 👦'),
        tell('Aino tulee.', 'Aino comes.'),
        say('aino', 'Hei, Eero! Tämä on sinulle.', 'Hi, Eero! This is for you.'),
        tell('Se on kuva.', "It's a picture."),
      ),
      page(
        sc('home', '👦 😄 👧'),
        say('eero', 'Kiitos, Aino! Nyt olen iloinen!', "Thanks, Aino! Now I'm happy!"),
        say('aino', 'Minäkin olen iloinen!', "I'm happy too!"),
      ),
    ],
    questions: [
      ask(
        'Millainen Eero on alussa?',
        'How is Eero at the start?',
        right('surullinen', 'sad', '😞'),
        wrong('iloinen', 'happy', '😄'),
        wrong('vihainen', 'angry', '😠'),
      ),
      ask(
        'Mitä Aino tuo?',
        'What does Aino bring?',
        right('kuvan', 'a picture', '🖼️'),
        wrong('kirjan', 'a book', '📕'),
        wrong('pallon', 'a ball', '⚽'),
      ),
      ask(
        'Millainen Eero on lopuksi?',
        'How is Eero at the end?',
        right('iloinen', 'happy', '😄'),
        wrong('surullinen', 'sad', '😞'),
        wrong('vihainen', 'angry', '😠'),
      ),
    ],
    facts: [
      trueFact('Eerolla on kylmä.', 'Eero is cold.'),
      falseFact('Eerolla on nälkä.', 'Eero is hungry.'),
      falseFact('Aino on sairas.', 'Aino is sick.'),
    ],
  }),

  // 13. Likes — tykkään jäätelöstä, rakastan suklaata.
  story('likes', {
    id: 'what-we-like',
    titleFi: 'Mistä tykkäämme?',
    titleEn: 'What we like',
    icon: '😋',
    tier: 3,
    // Aino tells it: "we" are Aino, Eero and Grandma.
    narrator: 'aino',
    pages: [
      page(
        sc('park', '👧 👦 👵 🧺'),
        tell('Me syömme ulkona.', 'We eat outside.'),
        say('aino', 'Tykkään jäätelöstä!', 'I like ice cream!'),
        say('eero', 'Minä pidän kakusta.', 'I like cake.'),
      ),
      page(
        sc('park', '👵 🍫 👧'),
        say('isoaiti', 'Minä rakastan suklaata!', 'I love chocolate!'),
        say('aino', 'Isoäiti, tykkäätkö jäätelöstä?', 'Grandma, do you like ice cream?'),
        say('isoaiti', 'En tykkää. Rakastan suklaata!', "No. I love chocolate!"),
      ),
      page(
        sc('park', '🐱 🥛'),
        tell('Mirri tulee.', 'Mirri comes.'),
        tell('Mirri rakastaa maitoa.', 'Mirri loves milk.'),
      ),
      page(
        sc('park', '🐱 🥛 👵'),
        say('isoaiti', 'Hei! Se on minun maitoni!', "Hey! That's my milk!"),
        tell('Mirri juo maitoa.', 'Mirri drinks the milk.'),
        say('mirri', 'Miau!', 'Meow!'),
      ),
    ],
    questions: [
      ask(
        'Mistä Aino tykkää?',
        'What does Aino like?',
        right('jäätelöstä', 'ice cream', '🍦'),
        wrong('kakusta', 'cake', '🍰'),
        wrong('suklaasta', 'chocolate', '🍫'),
      ),
      ask(
        'Mitä isoäiti rakastaa?',
        'What does Grandma love?',
        right('suklaata', 'chocolate', '🍫'),
        wrong('jäätelöä', 'ice cream', '🍦'),
        wrong('kakkua', 'cake', '🍰'),
      ),
      ask(
        'Mitä Mirri juo?',
        'What does Mirri drink?',
        right('maitoa', 'milk', '🥛'),
        wrong('mehua', 'juice', '🧃'),
        wrong('vettä', 'water', '💧'),
      ),
    ],
    facts: [
      trueFact('Eero pitää kakusta.', 'Eero likes cake.'),
      falseFact('Isoäiti tykkää jäätelöstä.', 'Grandma likes ice cream.'),
      falseFact('Maito on Mirrin.', "The milk is Mirri's."),
    ],
  }),

  // 14. Want, can, may — haluan uida, osaatko uida?
  story('wanting', {
    id: 'swim-or-play',
    titleFi: 'Osaatko uida?',
    titleEn: 'Can you swim?',
    icon: '🏊',
    tier: 3,
    pages: [
      page(
        sc('beach', '👧 👦 👨'),
        say('aino', 'Haluan uida!', 'I want to swim!'),
        say('eero', 'Minä en halua uida.', "I don't want to swim."),
      ),
      page(
        sc('beach', '👨 👦 😟'),
        say('isa', 'Eero, osaatko uida?', 'Eero, can you swim?'),
        say('eero', 'En osaa.', "I can't."),
      ),
      page(
        sc('beach', '👨 👦 🏊'),
        say('isa', 'Minä autan!', "I'll help!"),
        tell('Isä ja Eero uivat.', 'Dad and Eero swim.'),
      ),
      page(
        sc('beach', '👦 😄 👧 🏊'),
        say('eero', 'Nyt osaan uida!', 'Now I can swim!'),
        say('eero', 'Haluan uida taas!', 'I want to swim again!'),
      ),
    ],
    questions: [
      ask(
        'Mitä Aino haluaa tehdä?',
        'What does Aino want to do?',
        right('uida', 'swim', '🏊'),
        wrong('leikkiä', 'play', '⚽'),
        wrong('nukkua', 'sleep', '😴'),
      ),
      ask(
        'Osaako Eero uida alussa?',
        'Can Eero swim at the start?',
        right('Ei osaa.', "No, he can't.", '🚫'),
        wrong('Osaa.', 'Yes, he can.', '🏊'),
      ),
      ask(
        'Kuka auttaa Eeroa?',
        'Who helps Eero?',
        right('isä', 'Dad', '👨'),
        wrong('äiti', 'Mom', '👩'),
        wrong('Aino', 'Aino', '👧'),
      ),
    ],
    facts: [
      trueFact('Isä auttaa Eeroa.', 'Dad helps Eero.'),
      falseFact('Aino ei halua uida.', "Aino doesn't want to swim."),
      trueFact('Lopuksi Eero osaa uida.', 'In the end Eero can swim.'),
    ],
  }),

  // 15. Verbs, part 2 — type 4: herään, avaan, hyppää, kiipeää. Mirri wakes
  // Aino to play; Aino lets her out to Musti — and goes back to sleep.
  story('verbs-4', {
    id: 'open-window',
    titleFi: 'Herään',
    titleEn: 'I wake up',
    icon: '⏰',
    tier: 3,
    narrator: 'aino',
    pages: [
      page(
        sc('bedroom', '👧 ⏰', 'morning'),
        tell('Minä herään.', 'I wake up.'),
        tell('Haluan nukkua…', 'I want to sleep…'),
        tell('Mutta Mirri herää myös!', 'But Mirri wakes up too!'),
      ),
      page(
        sc('bedroom', '🐱 👧', 'morning'),
        tell('Mirri hyppää.', 'Mirri jumps.'),
        tell('Mirri haluaa leikkiä!', 'Mirri wants to play!'),
      ),
      page(
        sc('home', '👧 🪟 🐱', 'morning'),
        tell('Avaan ikkunan.', 'I open the window.'),
        tell('Mirri kiipeää ulos.', 'Mirri climbs out.'),
        tell('Ulkona on Eero ja Musti.', 'Eero and Musti are outside.'),
      ),
      page(
        sc('yard', '🐱 🐶 👦'),
        say('eero', 'Huomenta, Aino! Huomenta, Mirri!', 'Morning, Aino! Morning, Mirri!'),
        tell('Nyt Mirri ja Musti leikkivät.', 'Now Mirri and Musti play.'),
        tell('Ja minä nukun taas.', 'And I go back to sleep.'),
      ),
    ],
    questions: [
      ask(
        'Kuka herää myös?',
        'Who wakes up too?',
        right('Mirri', 'Mirri', '🐱'),
        wrong('isä', 'Dad', '👨'),
        wrong('vauva', 'the baby', '👶'),
      ),
      ask(
        'Mitä minä avaan?',
        'What do I open?',
        right('ikkunan', 'the window', '🪟'),
        wrong('oven', 'the door', '🚪'),
        wrong('repun', 'the backpack', '🎒'),
      ),
      ask(
        'Kuka on ulkona?',
        'Who is outside?',
        right('Eero', 'Eero', '👦'),
        wrong('isoäiti', 'Grandma', '👵'),
        wrong('opettaja', 'the teacher', '🧑‍🏫'),
      ),
    ],
    facts: [
      trueFact('Mirri haluaa leikkiä.', 'Mirri wants to play.'),
      trueFact('Mirri ja Musti leikkivät.', 'Mirri and Musti play.'),
      falseFact('Avaan oven.', 'I open the door.'),
      falseFact('Mirri nukkuu.', 'Mirri sleeps.'),
    ],
  }),

  // 16. School day — En tykkää matematiikasta.
  story('school-day', {
    id: 'math-and-gym',
    titleFi: 'Matikka ja liikunta',
    titleEn: 'Math and gym',
    icon: '➗',
    tier: 3,
    pages: [
      page(
        sc('classroom', '👧 📋 ➗'),
        say('aino', 'Tänään on koe.', "There's a test today."),
        say('aino', 'En tykkää matematiikasta!', "I don't like math!"),
      ),
      page(
        sc('classroom', '👦 ➗ 👧'),
        say('eero', 'Minä tykkään matematiikasta.', 'I like math.'),
        say('eero', 'Autan!', "I'll help!"),
      ),
      page(
        sc('field', '👧 🏃 👦'),
        tell('Sitten on liikuntaa.', 'Then there is gym.'),
        say('aino', 'Tykkään liikunnasta!', 'I like gym!'),
        say('eero', 'Minä en tykkää liikunnasta.', "I don't like gym."),
      ),
      page(
        sc('field', '👧 👦 ⚽'),
        say('aino', 'Autan!', "I'll help!"),
        tell('Kaverit auttavat.', 'Friends help each other.'),
      ),
    ],
    questions: [
      ask(
        'Mistä Aino ei tykkää?',
        "What doesn't Aino like?",
        right('matematiikasta', 'math', '➗'),
        wrong('liikunnasta', 'gym', '🤸'),
        wrong('englannista', 'English', '🇬🇧'),
      ),
      ask(
        'Mitä tänään on?',
        'What is there today?',
        right('koe', 'a test', '📋'),
        wrong('syntymäpäivä', 'a birthday', '🎂'),
        wrong('karkkipäivä', 'candy day', '🍬'),
      ),
      ask(
        'Kuka tykkää matematiikasta?',
        'Who likes math?',
        right('Eero', 'Eero', '👦'),
        wrong('Aino', 'Aino', '👧'),
        wrong('opettaja', 'the teacher', '🧑‍🏫'),
      ),
    ],
    facts: [
      trueFact('Aino tykkää liikunnasta.', 'Aino likes gym.'),
      falseFact('Eero tykkää liikunnasta.', 'Eero likes gym.'),
      trueFact('Eero auttaa Ainoa.', 'Eero helps Aino.'),
    ],
  }),

  // 17. Seeing & waiting — odotan bussia, näen junan.
  story('seeing', {
    id: 'waiting-bus',
    titleFi: 'Odotan bussia',
    titleEn: "I'm waiting for the bus",
    icon: '🚌',
    tier: 3,
    narrator: 'aino',
    pages: [
      page(
        sc('bus-stop', '👧 👵'),
        tell('Odotan bussia.', "I'm waiting for the bus."),
        tell('Isoäiti odottaa myös.', 'Grandma is waiting too.'),
        tell('Isoäiti ei näe hyvin.', "Grandma can't see well."),
      ),
      page(
        sc('bus-stop', '🚗 👵 👧'),
        tell('Näen auton.', 'I see a car.'),
        say('isoaiti', 'Onko tuo bussi?', 'Is that the bus?'),
        say('aino', 'Ei. Se on auto.', "No. It's a car."),
      ),
      page(
        sc('bus-stop', '🚆 👵 👧'),
        tell('Nyt näen junan.', 'Now I see a train.'),
        say('isoaiti', 'Onko tuo bussi?', 'Is that the bus?'),
        say('aino', 'Ei! Se on juna!', "No! It's a train!"),
      ),
      page(
        sc('bus-stop', '🚌 👵 👧'),
        tell('Ja nyt näen bussin!', 'And now I see the bus!'),
        say('aino', 'Isoäiti, bussi tulee!', 'Grandma, the bus is coming!'),
        say('isoaiti', 'Hyvä! Kiitos, Aino!', 'Good! Thank you, Aino!'),
      ),
    ],
    questions: [
      ask(
        'Mitä me odotamme?',
        'What are we waiting for?',
        right('bussia', 'the bus', '🚌'),
        wrong('junaa', 'the train', '🚆'),
        wrong('autoa', 'a car', '🚗'),
      ),
      ask(
        'Mitä näen ensin?',
        'What do I see first?',
        right('auton', 'a car', '🚗'),
        wrong('junan', 'a train', '🚆'),
        wrong('bussin', 'the bus', '🚌'),
      ),
      ask(
        'Kuka ei näe hyvin?',
        "Who can't see well?",
        right('isoäiti', 'Grandma', '👵'),
        wrong('Aino', 'Aino', '👧'),
        wrong('Mirri', 'Mirri', '🐱'),
      ),
    ],
    facts: [
      trueFact('Isoäiti odottaa bussia.', 'Grandma is waiting for the bus.'),
      falseFact('Näen koiran.', 'I see a dog.'),
      falseFact('Bussi ei tule.', "The bus doesn't come."),
    ],
  }),

  // 18. At the shop — one whole thing (-n), or some (-a).
  story('shop', {
    id: 'shopping-trip',
    titleFi: 'Kauppareissu',
    titleEn: 'The shopping trip',
    icon: '🛒',
    tier: 3,
    // Aino tells it: "we" are Dad and Aino.
    narrator: 'aino',
    pages: [
      page(
        sc('shop', '👨 👧 🛒'),
        tell('Menemme kauppaan.', 'We go to the shop.'),
        say('isa', 'Ostamme maitoa ja leipää.', 'We buy milk and bread.'),
      ),
      page(
        sc('shop', '🥛 🍞 🍎 👧'),
        say('aino', 'Ostanko omenan?', 'Shall I buy an apple?'),
        say('isa', 'Osta vain!', 'Go ahead!'),
        tell('Ostan omenan.', 'I buy an apple.'),
      ),
      page(
        sc('shop', '👧 🍬 👨'),
        say('aino', 'Isä, saanko karkkia?', 'Dad, may I have some candy?'),
        say('isa', 'Et saa. Tänään ei ole karkkipäivä.', "No, you may not. Today isn't candy day."),
      ),
      page(
        sc('shop', '👨 🍦 👧'),
        tell('Mutta isä ostaa jäätelön!', 'But Dad buys an ice cream!'),
        say('aino', 'Kiitos, isä!', 'Thank you, Dad!'),
      ),
    ],
    questions: [
      ask(
        'Mitä me ostamme ensin?',
        'What do we buy first?',
        right('maitoa ja leipää', 'milk and bread', '🥛'),
        wrong('karkkia', 'candy', '🍬'),
        wrong('jäätelöä', 'ice cream', '🍦'),
      ),
      ask(
        'Mitä Aino ostaa?',
        'What does Aino buy?',
        right('omenan', 'an apple', '🍎'),
        wrong('banaanin', 'a banana', '🍌'),
        wrong('kakun', 'a cake', '🍰'),
      ),
      ask(
        'Mitä isä ostaa lopuksi?',
        'What does Dad buy at the end?',
        right('jäätelön', 'an ice cream', '🍦'),
        wrong('karkkia', 'candy', '🍬'),
        wrong('kakun', 'a cake', '🍰'),
      ),
    ],
    facts: [
      falseFact('Aino saa karkkia.', 'Aino gets candy.'),
      trueFact('Tänään ei ole karkkipäivä.', "Today isn't candy day."),
      falseFact('Isä ostaa juustoa.', 'Dad buys cheese.'),
    ],
  }),

  // 19. Do it, don't, let's — Pelataan! Juokse! Älä syö palloa!
  story('commands', {
    id: 'lets-play-ball',
    titleFi: 'Pelataan!',
    titleEn: "Let's play!",
    icon: '⚽',
    tier: 3,
    pages: [
      page(
        sc('field', '👧 👦 ⚽'),
        say('eero', 'Pelataan jalkapalloa!', "Let's play soccer!"),
        say('aino', 'Joo! Pelataan!', "Yes! Let's play!"),
      ),
      page(
        sc('field', '👧 ⚽ 👦'),
        say('aino', 'Juokse, Eero!', 'Run, Eero!'),
        say('eero', 'Hyppää, Aino!', 'Jump, Aino!'),
      ),
      page(
        sc('field', '🐶 ⚽ 👦'),
        tell('Musti ottaa pallon!', 'Musti takes the ball!'),
        say('eero', 'Musti! Älä syö palloa!', "Musti! Don't eat the ball!"),
      ),
      page(
        sc('field', '👧 👦 🐶 ⚽'),
        say('aino', 'Tule, Musti! Juostaan yhdessä!', "Come, Musti! Let's run together!"),
        tell('Nyt Musti pelaa myös.', 'Now Musti plays too.'),
      ),
    ],
    questions: [
      ask(
        'Mitä he pelaavat?',
        'What do they play?',
        right('jalkapalloa', 'soccer', '⚽'),
        wrong('pianoa', 'the piano', '🎹'),
        wrong('kitaraa', 'the guitar', '🎸'),
      ),
      ask(
        'Kuka ottaa pallon?',
        'Who takes the ball?',
        right('Musti', 'Musti', '🐶'),
        wrong('Mirri', 'Mirri', '🐱'),
        wrong('Aino', 'Aino', '👧'),
      ),
      ask(
        'Mitä Eero sanoo Mustille?',
        'What does Eero tell Musti?',
        right('Älä syö palloa!', "Don't eat the ball!", '🚫'),
        wrong('Syö pallo!', 'Eat the ball!', '⚽'),
        wrong('Nuku!', 'Sleep!', '😴'),
      ),
    ],
    facts: [
      trueFact('Lopuksi Musti pelaa.', 'In the end Musti plays.'),
      falseFact('Eero ei halua pelata.', "Eero doesn't want to play."),
      falseFact('Musti syö pallon.', 'Musti eats the ball.'),
    ],
  }),

  // 20. Describing — iso koira, pieni kissa; Musti on ruskea. Big Musti eats
  // little Mirri's food; she's angry, he runs away; a red ball makes peace.
  story('describing', {
    id: 'big-and-small',
    titleFi: 'Iso ja pieni',
    titleEn: 'Big and small',
    icon: '🐶',
    tier: 3,
    pages: [
      page(
        sc('yard', '🐶 🐱'),
        tell('Musti on iso koira.', 'Musti is a big dog.'),
        tell('Mirri on pieni kissa.', 'Mirri is a small cat.'),
        tell('Musti on ruskea ja Mirri on valkoinen.', 'Musti is brown and Mirri is white.'),
      ),
      page(
        sc('yard', '🐶 🍽️ 🐱'),
        tell('Musti syö Mirrin ruokaa!', "Musti eats Mirri's food!"),
        tell('Pieni Mirri on vihainen.', 'Little Mirri is angry.'),
      ),
      page(
        sc('yard', '🐱 😠 🐶 💨'),
        tell('Iso Musti juoksee pois!', 'Big Musti runs away!'),
        say('aino', 'Musti, tule takaisin!', 'Musti, come back!'),
      ),
      page(
        sc('yard', '👧 🐶 🐱 🔴'),
        say('aino', 'Tässä on punainen pallo.', "Here's a red ball."),
        tell('Nyt Musti ja Mirri leikkivät.', 'Now Musti and Mirri play.'),
        say('aino', 'Kiltti koira, kiltti kissa!', 'Good dog, good cat!'),
      ),
    ],
    questions: [
      ask(
        'Millainen Musti on?',
        'What is Musti like?',
        right('iso ja ruskea', 'big and brown', '🐶'),
        wrong('pieni ja valkoinen', 'small and white', '🐱'),
        wrong('pieni ja musta', 'small and black', '⬛'),
      ),
      ask(
        'Kuka on vihainen?',
        'Who is angry?',
        right('Mirri', 'Mirri', '🐱'),
        wrong('Musti', 'Musti', '🐶'),
        wrong('Aino', 'Aino', '👧'),
      ),
      ask(
        'Millainen pallo on?',
        'What is the ball like?',
        right('punainen', 'red', '🟥'),
        wrong('sininen', 'blue', '🟦'),
        wrong('vihreä', 'green', '🟩'),
      ),
      ask(
        'Mitä Musti syö?',
        'What does Musti eat?',
        right('Mirrin ruokaa', "Mirri's food", '🍽️'),
        wrong('palloa', 'a ball', '🔴'),
        wrong('kakkua', 'cake', '🍰'),
      ),
    ],
    facts: [
      trueFact('Mirri on valkoinen.', 'Mirri is white.'),
      trueFact('Musti juoksee pois.', 'Musti runs away.'),
      falseFact('Musti on pieni.', 'Musti is small.'),
      falseFact('Mirri on iso.', 'Mirri is big.'),
    ],
  }),

  // 21. Comparing — isompi kuin, pienin, nopein.
  story('comparing', {
    id: 'zoo-race',
    titleFi: 'Kuka on nopein?',
    titleEn: 'Who is the fastest?',
    icon: '🏁',
    tier: 4,
    pages: [
      page(
        sc('zoo', '👧 👦 🐘 🐴 🐭'),
        tell('Aino ja Eero ovat eläintarhassa.', 'Aino and Eero are at the zoo.'),
        tell('Siellä on norsu, hevonen ja hiiri.', "There's an elephant, a horse and a mouse there."),
      ),
      page(
        sc('zoo', '🐘 🐴 🐭'),
        tell('Norsu on isoin.', 'The elephant is the biggest.'),
        tell('Hevonen on pienempi kuin norsu.', 'The horse is smaller than the elephant.'),
        tell('Hiiri on pienin.', 'The mouse is the smallest.'),
      ),
      page(
        sc('zoo', '👦 👧'),
        say('eero', 'Kuka on nopein?', 'Who is the fastest?'),
        say('aino', 'Minä olen nopeampi kuin sinä!', "I'm faster than you!"),
      ),
      page(
        sc('zoo', '🐴 💨 👦 👧'),
        tell('Eero ja Aino juoksevat.', 'Eero and Aino run.'),
        tell('Mutta hevonen on nopein!', 'But the horse is the fastest!'),
      ),
    ],
    questions: [
      ask(
        'Mikä on isoin?',
        'Which is the biggest?',
        right('norsu', 'the elephant', '🐘'),
        wrong('hevonen', 'the horse', '🐴'),
        wrong('hiiri', 'the mouse', '🐭'),
      ),
      ask(
        'Mikä on pienin?',
        'Which is the smallest?',
        right('hiiri', 'the mouse', '🐭'),
        wrong('norsu', 'the elephant', '🐘'),
        wrong('hevonen', 'the horse', '🐴'),
      ),
      ask(
        'Kuka on nopein?',
        'Who is the fastest?',
        right('hevonen', 'the horse', '🐴'),
        wrong('Aino', 'Aino', '👧'),
        wrong('Eero', 'Eero', '👦'),
      ),
    ],
    facts: [
      trueFact('Norsu on isompi kuin hevonen.', 'The elephant is bigger than the horse.'),
      falseFact('Hiiri on isompi kuin hevonen.', 'The mouse is bigger than the horse.'),
      falseFact('Aino on nopein.', 'Aino is the fastest.'),
    ],
  }),

  // 22. Where is it? — laatikossa, pöydällä, sängyssä.
  story('where', {
    id: 'where-cat',
    titleFi: 'Missä Mirri on?',
    titleEn: "Where's Mirri?",
    icon: '🐱',
    tier: 3,
    pages: [
      page(
        sc('home', '👧 ❓ 📦'),
        say('aino', 'Missä Mirri on?', 'Where is Mirri?'),
        tell('Mirri ei ole laatikossa.', "Mirri isn't in the box."),
      ),
      page(
        sc('kitchen', '🍽️ 📕'),
        tell('Mirri ei ole pöydällä.', "Mirri isn't on the table."),
        tell('Pöydällä on vain kirja.', "There's only a book on the table."),
      ),
      page(
        sc('home', '🧺 ⚽ 👧'),
        say('aino', 'Onko Mirri korissa?', 'Is Mirri in the basket?'),
        tell('Ei ole. Korissa on pallo.', "No. There's a ball in the basket."),
      ),
      page(
        sc('bedroom', '🐱 👧', 'night'),
        tell('Mirri on sängyssä!', 'Mirri is in the bed!'),
        tell('Mirri nukkuu siellä.', "Mirri is sleeping there."),
        say('aino', 'Hyvää yötä, Mirri!', 'Good night, Mirri!'),
      ),
    ],
    questions: [
      ask(
        'Missä Mirri on lopuksi?',
        'Where is Mirri at the end?',
        right('sängyssä', 'in the bed', '🛏️'),
        wrong('laatikossa', 'in the box', '📦'),
        wrong('korissa', 'in the basket', '🧺'),
      ),
      ask(
        'Mitä pöydällä on?',
        'What is on the table?',
        right('kirja', 'a book', '📕'),
        wrong('pallo', 'a ball', '⚽'),
        wrong('Mirri', 'Mirri', '🐱'),
      ),
      ask(
        'Mitä korissa on?',
        'What is in the basket?',
        right('pallo', 'a ball', '⚽'),
        wrong('kirja', 'a book', '📕'),
        wrong('Mirri', 'Mirri', '🐱'),
      ),
    ],
    facts: [
      falseFact('Mirri on laatikossa.', 'Mirri is in the box.'),
      trueFact('Pöydällä on kirja.', 'There is a book on the table.'),
      falseFact('Mirri on pöydällä.', 'Mirri is on the table.'),
    ],
  }),

  // 23. Going & coming — laatikkoon, laatikosta, pöydälle, pöydältä.
  story('moving', {
    id: 'cat-and-box',
    titleFi: 'Mirri ja laatikko',
    titleEn: 'Mirri and the box',
    icon: '📦',
    tier: 3,
    pages: [
      page(
        sc('home', '👧 📦'),
        tell('Tässä on iso laatikko.', 'Here is a big box.'),
        say('aino', 'Mitä laatikossa on?', "What's in the box?"),
        tell('Laatikossa on pallo.', "There's a ball in the box."),
      ),
      page(
        sc('home', '👧 ⚽ 🐱 📦'),
        tell('Aino ottaa pallon laatikosta.', 'Aino takes the ball out of the box.'),
        tell('Mirri menee laatikkoon!', 'Mirri goes into the box!'),
      ),
      page(
        sc('kitchen', '🐱 📦 🍽️'),
        tell('Mirri tulee laatikosta.', 'Mirri comes out of the box.'),
        tell('Mirri hyppää pöydälle.', 'Mirri jumps onto the table.'),
        tell('Ja sitten pöydältä laatikkoon!', 'And then off the table, into the box!'),
      ),
      page(
        sc('home', '👧 ⚽ 🐱 📦'),
        say('aino', 'Mirri, tässä on pallo!', "Mirri, here's the ball!"),
        tell('Mutta Mirri rakastaa laatikkoa.', 'But Mirri loves the box.'),
      ),
    ],
    questions: [
      ask(
        'Mitä laatikossa on alussa?',
        'What is in the box at the start?',
        right('pallo', 'a ball', '⚽'),
        wrong('kirja', 'a book', '📕'),
        wrong('Mirri', 'Mirri', '🐱'),
      ),
      ask(
        'Mihin Mirri hyppää?',
        'Where does Mirri jump?',
        right('pöydälle', 'onto the table', '🍽️'),
        wrong('sängylle', 'onto the bed', '🛏️'),
        wrong('tuolille', 'onto the chair', '🪑'),
      ),
      ask(
        'Mitä Mirri rakastaa?',
        'What does Mirri love?',
        right('laatikkoa', 'the box', '📦'),
        wrong('palloa', 'the ball', '⚽'),
        wrong('pöytää', 'the table', '🍽️'),
      ),
    ],
    facts: [
      trueFact('Mirri menee laatikkoon.', 'Mirri goes into the box.'),
      falseFact('Mirri rakastaa palloa.', 'Mirri loves the ball.'),
      falseFact('Mirri hyppää sängylle.', 'Mirri jumps onto the bed.'),
    ],
  }),

  // 24. Around town & home — puistoon, kirjastossa, kahvilassa, kotiin. A day
  // out with Dad, told by Aino: loud Eero is fine in the park — not in the library.
  story('town', {
    id: 'park-and-library',
    titleFi: 'Puisto ja kirjasto',
    titleEn: 'The park and the library',
    icon: '🛝',
    tier: 4,
    narrator: 'aino',
    pages: [
      page(
        sc('playground', '👨 👧 👦'),
        tell('Isä, Eero ja minä menemme puistoon.', 'Dad, Eero and I go to the park.'),
        tell('Puistossa on paljon lapsia.', 'There are lots of children in the park.'),
      ),
      page(
        sc('library', '👧 👦 📕'),
        tell('Sitten menemme kirjastoon.', 'Then we go to the library.'),
        tell('Kirjastossa on hiljaista.', "It's quiet in the library."),
        say('eero', 'MOI!', 'HI!'),
      ),
      page(
        sc('library', '👧 🤫 👦'),
        say('aino', 'Eero! Hiljaa!', 'Eero! Quiet!'),
        tell('Sitten olemme kahvilassa.', 'Then we are at the café.'),
        say('isa', 'Haluatteko jäätelöä?', 'Do you want ice cream?'),
      ),
      page(
        sc('kitchen', '👨 👧 👦 🍦', 'evening'),
        say('aino', 'Haluamme!', 'We do!'),
        tell('Lopuksi tulemme kotiin.', 'In the end we come home.'),
        say('eero', 'Huomenna taas puistoon!', 'Tomorrow, the park again!'),
      ),
    ],
    questions: [
      ask(
        'Mihin menemme ensin?',
        'Where do we go first?',
        right('puistoon', 'to the park', '🛝'),
        wrong('kirjastoon', 'to the library', '📚'),
        wrong('kahvilaan', 'to the café', '☕'),
      ),
      ask(
        'Missä on hiljaista?',
        'Where is it quiet?',
        right('kirjastossa', 'in the library', '📚'),
        wrong('puistossa', 'in the park', '🛝'),
        wrong('kahvilassa', 'in the café', '☕'),
      ),
      ask(
        'Mitä isä tarjoaa kahvilassa?',
        'What does Dad offer at the café?',
        right('jäätelöä', 'ice cream', '🍦'),
        wrong('pitsaa', 'pizza', '🍕'),
        wrong('keittoa', 'soup', '🍲'),
      ),
    ],
    facts: [
      trueFact('Isä on puistossa.', 'Dad is in the park.'),
      falseFact('Eero on hiljaa kirjastossa.', 'Eero is quiet in the library.'),
      falseFact('Lopuksi menemme kouluun.', 'In the end we go to school.'),
    ],
  }),

  // 25. By bus, with a pen — autolla, junalla, veneellä; isoäidin kanssa.
  story('by-with', {
    id: 'how-we-go',
    titleFi: 'Miten menemme?',
    titleEn: 'How do we get there?',
    icon: '🚆',
    tier: 4,
    narrator: 'aino',
    pages: [
      page(
        sc('yard', '👨 👩 👧 🚗'),
        say('aino', 'Miten menemme isoäidille?', "How do we get to Grandma's?"),
        say('isa', 'Menemme autolla.', 'We go by car.'),
      ),
      page(
        sc('yard', '🚗 😟 👨 👩'),
        say('isa', 'Voi ei! Auto ei käy.', "Oh no! The car won't start."),
        say('aiti', 'Menemme junalla!', "We'll go by train!"),
      ),
      page(
        sc('station', '🚆 👧 👩 👨 🚤'),
        tell('Menemme junalla.', 'We go by train.'),
        tell('Sitten menemme veneellä.', 'Then we go by boat.'),
      ),
      page(
        sc('beach', '🚤 👵 👧'),
        tell('Isoäiti odottaa saaressa.', 'Grandma is waiting on the island.'),
        say('isoaiti', 'Tervetuloa!', 'Welcome!'),
        tell('Menen isoäidin kanssa sisään.', 'I go inside with Grandma.'),
      ),
    ],
    questions: [
      ask(
        'Miten menemme ensin?',
        'How do we travel first?',
        right('junalla', 'by train', '🚆'),
        wrong('autolla', 'by car', '🚗'),
        wrong('bussilla', 'by bus', '🚌'),
      ),
      ask(
        'Miten menemme lopuksi?',
        'How do we travel at the end?',
        right('veneellä', 'by boat', '🚤'),
        wrong('junalla', 'by train', '🚆'),
        wrong('lentokoneella', 'by plane', '🛩️'),
      ),
      ask(
        'Kuka odottaa saaressa?',
        'Who is waiting on the island?',
        right('isoäiti', 'Grandma', '👵'),
        wrong('Eero', 'Eero', '👦'),
        wrong('opettaja', 'the teacher', '🧑‍🏫'),
      ),
    ],
    facts: [
      trueFact('Isoäiti on saaressa.', 'Grandma is on the island.'),
      falseFact('Auto käy hyvin.', 'The car runs well.'),
      falseFact('Isä menee bussilla.', 'Dad goes by bus.'),
    ],
  }),

  // 26. When? — lauantai, aamulla, päivällä, illalla, sunnuntaina, kello on…
  story('when', {
    id: 'my-saturday',
    titleFi: 'Minun lauantaini',
    titleEn: 'My Saturday',
    icon: '📅',
    tier: 4,
    narrator: 'aino',
    pages: [
      page(
        sc('kitchen', '👧 🥣', 'morning'),
        tell('Tänään on lauantai.', 'Today is Saturday.'),
        tell('Aamulla syön puuroa.', 'In the morning I eat porridge.'),
      ),
      page(
        sc('beach', '👧 🏊 👨'),
        tell('Kello on kymmenen.', "It's ten o'clock."),
        say('isa', 'Mennään uimaan!', "Let's go swimming!"),
        tell('Päivällä uin isän kanssa.', 'In the daytime I swim with Dad.'),
      ),
      page(
        sc('home', '👧 📕 🐱 😴', 'evening'),
        tell('Illalla luen kirjaa.', 'In the evening I read a book.'),
        tell('Mirri nukkuu jo.', 'Mirri is already asleep.'),
      ),
      page(
        sc('bedroom', '👧 👵', 'night'),
        tell('Sunnuntaina isoäiti tulee!', 'On Sunday Grandma comes!'),
        say('aino', 'Hyvää yötä! Huomenna on sunnuntai!', 'Good night! Tomorrow is Sunday!'),
      ),
    ],
    questions: [
      ask(
        'Mitä syön aamulla?',
        'What do I eat in the morning?',
        right('puuroa', 'porridge', '🥣'),
        wrong('pitsaa', 'pizza', '🍕'),
        wrong('jäätelöä', 'ice cream', '🍦'),
      ),
      ask(
        'Milloin uin?',
        'When do I swim?',
        right('päivällä', 'in the daytime', '🌞'),
        wrong('aamulla', 'in the morning', '🌅'),
        wrong('illalla', 'in the evening', '🌆'),
      ),
      ask(
        'Milloin isoäiti tulee?',
        'When does Grandma come?',
        right('sunnuntaina', 'on Sunday', 'su'),
        wrong('maanantaina', 'on Monday', 'ma'),
        wrong('lauantaina', 'on Saturday', 'la'),
      ),
    ],
    facts: [
      trueFact('Mirri nukkuu illalla.', 'Mirri is asleep in the evening.'),
      falseFact('Uin aamulla.', 'I swim in the morning.'),
      falseFact('Kello on kaksi.', "It's two o'clock."),
    ],
  }),

  // 27. Big numbers — viisitoista, yksitoista, kolmetoista.
  story('big-numbers', {
    id: 'sweets-day',
    titleFi: 'Karkkipäivä',
    titleEn: 'Candy day',
    icon: '🍬',
    tier: 4,
    pages: [
      page(
        sc('home', '👧 🍬'),
        tell('Lauantaina on karkkipäivä.', 'Saturday is candy day.'),
        say('aino', 'Minulla on viisitoista karkkia!', 'I have fifteen candies!'),
      ),
      page(
        sc('home', '👦 🍬'),
        say('eero', 'Minulla on vain yksitoista karkkia.', 'I only have eleven candies.'),
      ),
      page(
        sc('home', '👧 🍬 👦'),
        tell('Aino antaa Eerolle kaksi karkkia.', 'Aino gives Eero two candies.'),
        say('eero', 'Kiitos! Nyt minulla on kolmetoista!', 'Thanks! Now I have thirteen!'),
        say('aino', 'Ja minulla on kolmetoista!', 'And I have thirteen!'),
      ),
      page(
        sc('home', '🐱 🍬 👧'),
        tell('Mirri haluaa myös karkkia.', 'Mirri wants some candy too.'),
        say('aino', 'Ei, Mirri! Karkki ei ole kissalle!', "No, Mirri! Candy isn't for cats!"),
      ),
    ],
    questions: [
      ask(
        'Montako karkkia Ainolla on alussa?',
        'How many candies does Aino have at first?',
        right('viisitoista', 'fifteen', '15'),
        wrong('yksitoista', 'eleven', '11'),
        wrong('kolmetoista', 'thirteen', '13'),
      ),
      ask(
        'Montako karkkia Aino antaa Eerolle?',
        'How many candies does Aino give Eero?',
        right('kaksi', 'two', '2'),
        wrong('viisi', 'five', '5'),
        wrong('yksi', 'one', '1'),
      ),
      ask(
        'Milloin on karkkipäivä?',
        'When is candy day?',
        right('lauantaina', 'on Saturday', 'la'),
        wrong('maanantaina', 'on Monday', 'ma'),
        wrong('perjantaina', 'on Friday', 'pe'),
      ),
    ],
    facts: [
      trueFact('Lopuksi Eerolla on kolmetoista karkkia.', 'In the end Eero has thirteen candies.'),
      falseFact('Mirri saa karkkia.', 'Mirri gets candy.'),
      falseFact('Eerolla on alussa viisitoista karkkia.', 'At first Eero has fifteen candies.'),
    ],
  }),

  // 28. Months & birthdays — toukokuussa, viides toukokuuta, yhdeksän vuotta.
  story('birthdays', {
    id: 'my-birthday',
    titleFi: 'Syntymäpäiväni',
    titleEn: 'My birthday',
    icon: '🎂',
    tier: 4,
    narrator: 'aino',
    pages: [
      page(
        sc('party', '👧 🎂'),
        tell('Syntymäpäiväni on toukokuussa.', 'My birthday is in May.'),
        tell('Tänään on viides toukokuuta.', 'Today is the fifth of May.'),
        tell('Täytän yhdeksän vuotta!', "I'm turning nine!"),
      ),
      page(
        sc('party', '🎂 🕯️ 👨 👩 👵'),
        tell('Kakussa on yhdeksän kynttilää.', 'There are nine candles on the cake.'),
        tell('Kaikki laulavat minulle.', 'Everyone sings to me.'),
      ),
      page(
        sc('party', '👨 🎁 👧'),
        say('isa', 'Tässä on lahja sinulle!', "Here's a present for you!"),
        tell('Lahja on iso laatikko.', 'The present is a big box.'),
      ),
      page(
        sc('party', '📦 🚲 🐱'),
        tell('Laatikossa on uusi pyörä!', "There's a new bike in the box!"),
        tell('Ja Mirri hyppää laatikkoon.', 'And Mirri jumps into the box.'),
      ),
    ],
    questions: [
      ask(
        'Milloin syntymäpäiväni on?',
        'When is my birthday?',
        right('toukokuussa', 'in May', '🌷'),
        wrong('joulukuussa', 'in December', '🎄'),
        wrong('heinäkuussa', 'in July', '🏖️'),
      ),
      ask(
        'Montako vuotta täytän?',
        'How old am I turning?',
        right('yhdeksän', 'nine', '9'),
        wrong('seitsemän', 'seven', '7'),
        wrong('kymmenen', 'ten', '10'),
      ),
      ask(
        'Mikä lahja on?',
        'What is the present?',
        right('pyörä', 'a bike', '🚲'),
        wrong('kissa', 'a cat', '🐱'),
        wrong('kirja', 'a book', '📕'),
      ),
    ],
    facts: [
      trueFact('Tänään on syntymäpäiväni.', 'Today is my birthday.'),
      falseFact('Syntymäpäiväni on kesäkuussa.', 'My birthday is in June.'),
      falseFact('Täytän kymmenen vuotta.', "I'm turning ten."),
    ],
  }),

  // 29. Question words — kuka, missä, mistä, milloin.
  story('question-words', {
    id: 'new-boy',
    titleFi: 'Uusi oppilas',
    titleEn: 'The new pupil',
    icon: '🧒',
    tier: 4,
    pages: [
      page(
        sc('classroom', '🧑‍🏫 🧒 👧'),
        tell('Luokkaan tulee uusi oppilas.', 'A new pupil comes into the class.'),
        say('aino', 'Kuka sinä olet?', 'Who are you?'),
        say('leo', 'Minä olen Leo.', "I'm Leo."),
      ),
      page(
        sc('classroom', '👧 🧒 🛝'),
        say('aino', 'Missä sinä asut?', 'Where do you live?'),
        say('leo', 'Asun ison puiston vieressä.', 'I live next to the big park.'),
      ),
      page(
        sc('classroom', '👧 🧒 ⚽ 👦'),
        say('aino', 'Mistä sinä tykkäät?', 'What do you like?'),
        say('leo', 'Tykkään jalkapallosta!', 'I like soccer!'),
        say('eero', 'Minäkin!', 'Me too!'),
      ),
      page(
        sc('field', '🧒 👦 👧 ⚽'),
        say('leo', 'Milloin pelataan?', 'When do we play?'),
        say('eero', 'Nyt! Pelataan yhdessä!', "Now! Let's play together!"),
      ),
    ],
    questions: [
      ask(
        'Kuka tulee luokkaan?',
        'Who comes into the class?',
        right('Leo', 'Leo', '🧒'),
        wrong('Eero', 'Eero', '👦'),
        wrong('opettaja', 'the teacher', '🧑‍🏫'),
      ),
      ask(
        'Missä Leo asuu?',
        'Where does Leo live?',
        right('puiston vieressä', 'next to the park', '🛝'),
        wrong('koulun takana', 'behind the school', '🏫'),
        wrong('kirjaston edessä', 'in front of the library', '📚'),
      ),
      ask(
        'Mistä Leo tykkää?',
        'What does Leo like?',
        right('jalkapallosta', 'soccer', '⚽'),
        wrong('musiikista', 'music', '🎵'),
        wrong('matematiikasta', 'math', '➗'),
      ),
    ],
    facts: [
      trueFact('Eero tykkää myös jalkapallosta.', 'Eero likes soccer too.'),
      falseFact('Leo asuu koulussa.', 'Leo lives at the school.'),
      falseFact('He pelaavat huomenna.', 'They play tomorrow.'),
    ],
  }),

  // 30. Me and you — Auta minua! Pidän sinusta.
  story('me-you', {
    id: 'help-the-cat',
    titleFi: 'Auta minua!',
    titleEn: 'Help me!',
    icon: '🌳',
    tier: 4,
    pages: [
      page(
        sc('yard', '🐱 🌳'),
        tell('Mirri on puussa.', 'Mirri is up in a tree.'),
        say('mirri', 'Miau! Auta minua!', 'Meow! Help me!'),
      ),
      page(
        sc('yard', '👧 🌳 🐱'),
        say('aino', 'Mirri, tule alas!', 'Mirri, come down!'),
        tell('Mirri ei tule.', "Mirri doesn't come."),
        say('aino', 'Eero! Auta minua!', 'Eero! Help me!'),
      ),
      page(
        sc('yard', '👦 🌳 🐱'),
        tell('Eero kiipeää puuhun.', 'Eero climbs the tree.'),
        tell('Eero auttaa Mirriä.', 'Eero helps Mirri.'),
      ),
      page(
        sc('yard', '👦 🐱 👧'),
        say('aino', 'Kiitos, Eero! Pidän sinusta!', 'Thanks, Eero! I like you!'),
        say('eero', 'Minäkin pidän sinusta!', 'I like you too!'),
        say('mirri', 'Miau!', 'Meow!'),
      ),
    ],
    questions: [
      ask(
        'Missä Mirri on?',
        'Where is Mirri?',
        right('puussa', 'up in a tree', '🌳'),
        wrong('talossa', 'in the house', '🏠'),
        wrong('laatikossa', 'in the box', '📦'),
      ),
      ask(
        'Keneltä Aino pyytää apua?',
        'Who does Aino ask for help?',
        right('Eerolta', 'Eero', '👦'),
        wrong('äidiltä', 'Mom', '👩'),
        wrong('isältä', 'Dad', '👨'),
      ),
      ask(
        'Kuka kiipeää puuhun?',
        'Who climbs the tree?',
        right('Eero', 'Eero', '👦'),
        wrong('Aino', 'Aino', '👧'),
        wrong('isä', 'Dad', '👨'),
      ),
    ],
    facts: [
      trueFact('Aino pitää Eerosta.', 'Aino likes Eero.'),
      falseFact('Aino kiipeää puuhun.', 'Aino climbs the tree.'),
      falseFact('Mirri on laatikossa.', 'Mirri is in the box.'),
    ],
  }),

  // 31. Around things — sängyn alla, tuolin takana, oven vieressä, pallon edessä.
  story('around', {
    id: 'where-ball',
    titleFi: 'Missä pallo on?',
    titleEn: "Where's the ball?",
    icon: '⚽',
    tier: 4,
    pages: [
      page(
        sc('home', '👦 ❓ 👧'),
        say('eero', 'Missä pallo on?', 'Where is the ball?'),
        say('aino', 'Onko se sängyn alla?', 'Is it under the bed?'),
      ),
      page(
        sc('bedroom', '🪑'),
        tell('Pallo ei ole sängyn alla.', "The ball isn't under the bed."),
        tell('Se ei ole tuolin takana.', "It isn't behind the chair."),
      ),
      page(
        sc('home', '🚪 ⚽ 🐶'),
        tell('Pallo on oven vieressä!', 'The ball is next to the door!'),
        tell('Mutta Musti istuu pallon edessä.', 'But Musti is sitting in front of the ball.'),
      ),
      page(
        sc('home', '🐶 ⚽ 💨 👦 👧'),
        say('eero', 'Musti, anna pallo!', 'Musti, give me the ball!'),
        tell('Musti ottaa pallon ja juoksee!', 'Musti takes the ball and runs!'),
      ),
    ],
    questions: [
      ask(
        'Missä pallo on?',
        'Where is the ball?',
        right('oven vieressä', 'next to the door', '🚪'),
        wrong('sängyn alla', 'under the bed', '🛏️'),
        wrong('tuolin takana', 'behind the chair', '🪑'),
      ),
      ask(
        'Kuka istuu pallon edessä?',
        'Who is sitting in front of the ball?',
        right('Musti', 'Musti', '🐶'),
        wrong('Mirri', 'Mirri', '🐱'),
        wrong('Aino', 'Aino', '👧'),
      ),
      ask(
        'Mitä Musti tekee lopuksi?',
        'What does Musti do at the end?',
        right('Se ottaa pallon.', 'It takes the ball.', '⚽'),
        wrong('Se nukkuu.', 'It sleeps.', '😴'),
        wrong('Se syö.', 'It eats.', '🍽️'),
      ),
    ],
    facts: [
      falseFact('Pallo on sängyn alla.', 'The ball is under the bed.'),
      trueFact('Eero etsii palloa.', 'Eero is looking for the ball.'),
      falseFact('Musti antaa pallon Eerolle.', 'Musti gives the ball to Eero.'),
    ],
  }),

  // 32. Many — kirjat, palloa, kengät, kenkien.
  story('many', {
    id: 'my-things',
    titleFi: 'Paljon tavaraa',
    titleEn: 'Lots of things',
    icon: '🧸',
    tier: 4,
    narrator: 'aino',
    pages: [
      page(
        sc('bedroom', '👩 👧 🧸'),
        tell('Huoneessani on paljon tavaraa.', 'There are lots of things in my room.'),
        say('aiti', 'Aino, siivoa huone!', 'Aino, clean the room!'),
      ),
      page(
        sc('bedroom', '📕 📕 📦 ⚽ 🧺'),
        tell('Kirjat menevät laatikkoon.', 'The books go into the box.'),
        tell('Minulla on kolme palloa.', 'I have three balls.'),
        tell('Pallot menevät koriin.', 'The balls go into the basket.'),
      ),
      page(
        sc('bedroom', '👧 ❓ 📦'),
        say('aino', 'Missä ovat kenkäni?', 'Where are my shoes?'),
        tell('Kengät eivät ole laatikossa.', "The shoes aren't in the box."),
      ),
      page(
        sc('bedroom', '👟 🐱 👟'),
        tell('Kengät ovat sängyn alla.', 'The shoes are under the bed.'),
        tell('Ja kenkien vieressä nukkuu Mirri!', 'And next to the shoes, Mirri is sleeping!'),
      ),
    ],
    questions: [
      ask(
        'Mihin kirjat menevät?',
        'Where do the books go?',
        right('laatikkoon', 'into the box', '📦'),
        wrong('koriin', 'into the basket', '🧺'),
        wrong('sänkyyn', 'into the bed', '🛏️'),
      ),
      ask(
        'Montako palloa minulla on?',
        'How many balls do I have?',
        right('kolme palloa', 'three balls', '3'),
        wrong('kaksi palloa', 'two balls', '2'),
        wrong('viisi palloa', 'five balls', '5'),
      ),
      ask(
        'Missä kengät ovat?',
        'Where are the shoes?',
        right('sängyn alla', 'under the bed', '🛏️'),
        wrong('laatikossa', 'in the box', '📦'),
        wrong('korissa', 'in the basket', '🧺'),
      ),
    ],
    facts: [
      trueFact('Pallot ovat korissa.', 'The balls are in the basket.'),
      falseFact('Kengät ovat laatikossa.', 'The shoes are in the box.'),
      falseFact('Äiti siivoaa huoneen.', 'Mom cleans the room.'),
    ],
  }),

  // 33. Verbs, part 3 — types 5 & 6: tarvitsen, valitsen, häiritsee, pakenee.
  // Aino draws Grandma a red house; Mirri runs off with the red pencil, so the
  // blue one draws the sky.
  story('verbs-5-6', {
    id: 'drawing-a-house',
    titleFi: 'Piirrän talon',
    titleEn: 'I draw a house',
    icon: '✏️',
    tier: 5,
    narrator: 'aino',
    pages: [
      page(
        sc('home', '👧 📄'),
        tell('Piirrän talon isoäidille.', 'I draw a house for Grandma.'),
        tell('Tarvitsen kynän.', 'I need a pencil.'),
      ),
      page(
        sc('home', '✏️ 🟥 🏠'),
        tell('Valitsen punaisen kynän.', 'I choose the red pencil.'),
        tell('Piirrän ison talon.', 'I draw a big house.'),
      ),
      page(
        sc('home', '🐱 ✏️ 💨'),
        tell('Mirri häiritsee minua!', 'Mirri is bothering me!'),
        tell('Mirri ottaa kynän ja pakenee!', 'Mirri takes the pencil and runs away!'),
      ),
      page(
        sc('home', '🟦 🏠 👵 👧'),
        tell('Valitsen sinisen kynän.', 'I choose the blue pencil.'),
        tell('Piirrän taivaan.', 'I draw the sky.'),
        say('isoaiti', 'Punainen talo ja sininen taivas! Kaunis!', 'A red house and a blue sky! Beautiful!'),
      ),
    ],
    questions: [
      ask(
        'Minkä kynän valitsen ensin?',
        'Which pencil do I choose first?',
        right('punaisen', 'the red one', '🟥'),
        wrong('sinisen', 'the blue one', '🟦'),
        wrong('vihreän', 'the green one', '🟩'),
      ),
      ask(
        'Mitä Mirri tekee?',
        'What does Mirri do?',
        right('Se ottaa kynän.', 'She takes the pencil.', '✏️'),
        wrong('Se nukkuu.', 'She sleeps.', '😴'),
        wrong('Se piirtää.', 'She draws.', '🖼️'),
      ),
      ask(
        'Kenelle piirrän talon?',
        'Who do I draw the house for?',
        right('isoäidille', 'for Grandma', '👵'),
        wrong('opettajalle', 'for the teacher', '🧑‍🏫'),
        wrong('Eerolle', 'for Eero', '👦'),
      ),
      ask(
        'Mitä piirrän sinisellä kynällä?',
        'What do I draw with the blue pencil?',
        right('taivaan', 'the sky', '🟦'),
        wrong('talon', 'the house', '🏠'),
        wrong('koiran', 'a dog', '🐶'),
      ),
    ],
    facts: [
      trueFact('Talo on punainen.', 'The house is red.'),
      trueFact('Taivas on sininen.', 'The sky is blue.'),
      falseFact('Mirri auttaa minua.', 'Mirri helps me.'),
      falseFact('Piirrän koiran.', 'I draw a dog.'),
    ],
  }),
];
