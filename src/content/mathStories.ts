// The math section's stories (Lasketaan!, see src/game/mathPath.tsx): one per
// stage, with the same people as the course's stories, where the counting
// happens in Finnish — buns eaten, cars compared, blueberries given away,
// stones found and a countdown to the jump; buns baked by the ten, strawberries
// halved, prices added up and paid, and a train half an hour away.
//
// Same discipline as every story (storyKit.ts): human-authored Finnish, short
// lines, every word a sourced form or a glossary word. One rule of their own:
// a number is only ever a Finnish word — the English lines keep it in Finnish
// ("Grandma has viisi buns"), so re-reading with the English never turns the
// math back into English. The questions ask about who, what and where; the
// counting is in the true-or-false statements, whose truth never changes.
// ⚠️ NEEDS NATIVE FINNISH VETTING (all of them; listed in FINNISH_REVIEW.md).

import { ask, falseFact, page, right, say, sc, tell, trueFact, wrong, type Story } from './storyKit';

export const MATH_STORIES: Story[] = [
  // Plus and minus: five buns, two for Leo, one for Aino.
  {
    id: 'math-buns',
    titleFi: 'Viisi pullaa',
    titleEn: 'Viisi buns',
    icon: '🥐',
    tier: 2,
    pages: [
      page(sc('kitchen', '👵 🥐'), tell('Isoäidillä on viisi pullaa.', 'Grandma has viisi buns.')),
      page(
        sc('kitchen', '🧒 👵 🥐'),
        say('leo', 'Saanko kaksi pullaa?', 'May I have kaksi buns?'),
        say('isoaiti', 'Saat!', 'You may!'),
      ),
      page(sc('kitchen', '👧 👵 🥐'), tell('Aino syö yhden pullan.', 'Aino eats a bun.')),
      page(
        sc('kitchen', '👵 🥐'),
        tell('Nyt isoäidillä on kaksi pullaa.', 'Now Grandma has kaksi buns.'),
        say('isoaiti', 'Viisi miinus kolme on kaksi!', 'Viisi minus kolme is kaksi!'),
      ),
    ],
    questions: [
      ask(
        'Mitä isoäidillä on?',
        'What does Grandma have?',
        right('pullaa', 'sweet buns', '🥐'),
        wrong('jäätelöä', 'ice cream', '🍦'),
        wrong('omenia', 'apples', '🍎'),
      ),
      ask(
        'Kuka syö yhden pullan?',
        'Who eats a bun?',
        right('Aino', 'Aino', '👧'),
        wrong('Eero', 'Eero', '👦'),
        wrong('Mirri', 'Mirri', '🐱'),
      ),
      ask(
        'Kuka sanoo: "Saat!"?',
        'Who says "You may!"?',
        right('isoäiti', 'Grandma', '👵'),
        wrong('Aino', 'Aino', '👧'),
        wrong('Leo', 'Leo', '🧒'),
      ),
    ],
    facts: [
      trueFact('Leo saa kaksi pullaa.', 'Leo gets kaksi buns.'),
      falseFact('Aino syö kolme pullaa.', 'Aino eats kolme buns.'),
      trueFact('Viisi miinus kolme on kaksi.', 'Viisi minus kolme is kaksi.'),
    ],
  },

  // More or less: Eero's cars and Leo's.
  {
    id: 'math-cars',
    titleFi: 'Kummalla on enemmän?',
    titleEn: 'Who has more?',
    icon: '🚗',
    tier: 2,
    pages: [
      page(sc('home', '👦 🧒 🚗'), tell('Eero ja Leo leikkivät autoilla.', 'Eero and Leo play with cars.')),
      page(sc('home', '👦 🚗'), say('eero', 'Minulla on neljä autoa.', 'I have neljä cars.')),
      page(sc('home', '🧒 🚗'), say('leo', 'Minulla on kuusi autoa.', 'I have kuusi cars.')),
      page(
        sc('home', '👦 🧒 🚗'),
        say('eero', 'Kummalla on enemmän?', 'Who has more?'),
        say('leo', 'Minulla! Kuusi on enemmän kuin neljä.', 'Me! Kuusi is more than neljä.'),
      ),
    ],
    questions: [
      ask(
        'Mitä pojilla on?',
        'What do the boys have?',
        right('autoja', 'cars', '🚗'),
        wrong('palloja', 'balls', '🏐'),
        wrong('nukkeja', 'dolls', '🪆'),
      ),
      ask(
        'Kenellä on kuusi autoa?',
        'Who has kuusi cars?',
        right('Leolla', 'Leo', '🧒'),
        wrong('Eerolla', 'Eero', '👦'),
        wrong('Ainolla', 'Aino', '👧'),
      ),
      ask(
        'Kuka sanoo: "Kummalla on enemmän?"',
        'Who says "Who has more?"',
        right('Eero', 'Eero', '👦'),
        wrong('Aino', 'Aino', '👧'),
        wrong('Isä', 'Dad', '👨'),
      ),
    ],
    facts: [
      trueFact('Eerolla on neljä autoa.', 'Eero has neljä cars.'),
      falseFact('Eerolla on enemmän autoja.', 'Eero has more cars.'),
      trueFact('Kuusi on enemmän kuin neljä.', 'Kuusi is more than neljä.'),
    ],
  },

  // How many now? Blueberries in the forest: some for Musti, some eaten.
  {
    id: 'math-berries',
    titleFi: 'Mustikoita metsässä',
    titleEn: 'Blueberries in the forest',
    icon: '🫐',
    tier: 3,
    pages: [
      page(sc('forest', '👧 🫐'), tell('Aino on metsässä.', 'Aino is in the forest.'), tell('Hän etsii mustikoita.', 'She looks for blueberries.')),
      page(sc('forest', '👧 🫐'), say('aino', 'Minulla on kahdeksan mustikkaa!', 'I have kahdeksan blueberries!')),
      page(
        sc('forest', '👧 🐶 🫐'),
        tell('Musti tulee.', 'Musti comes.'),
        tell('Aino antaa Mustille kaksi mustikkaa.', 'Aino gives Musti kaksi blueberries.'),
      ),
      page(
        sc('forest', '👧 🫐'),
        tell('Sitten Aino syö kolme mustikkaa.', 'Then Aino eats kolme blueberries.'),
        say('aino', 'Nyt minulla on kolme mustikkaa.', 'Now I have kolme blueberries.'),
      ),
    ],
    questions: [
      ask(
        'Missä Aino on?',
        'Where is Aino?',
        right('metsässä', 'in the forest', '🌲'),
        wrong('koulussa', 'at school', '🏫'),
        wrong('kaupassa', 'at the shop', '🏪'),
      ),
      ask(
        'Kuka tulee metsään?',
        'Who comes to the forest?',
        right('Musti', 'Musti', '🐶'),
        wrong('Mirri', 'Mirri', '🐱'),
        wrong('Leo', 'Leo', '🧒'),
      ),
      ask(
        'Mitä Aino etsii?',
        'What does Aino look for?',
        right('mustikoita', 'blueberries', '🫐'),
        wrong('kiviä', 'stones', '🪨'),
        wrong('kukkia', 'flowers', '🌸'),
      ),
    ],
    facts: [
      trueFact('Aino antaa Mustille kaksi mustikkaa.', 'Aino gives Musti kaksi blueberries.'),
      falseFact('Aino syö viisi mustikkaa.', 'Aino eats viisi blueberries.'),
      trueFact('Lopuksi Ainolla on kolme mustikkaa.', 'In the end Aino has kolme blueberries.'),
    ],
  },

  // The -toista numbers: stones on the beach, then a countdown and a jump.
  {
    id: 'math-stones',
    titleFi: 'Hyppy mereen!',
    titleEn: 'A jump into the sea!',
    icon: '🌊',
    tier: 3,
    pages: [
      page(sc('beach', '🧒 👦'), tell('Leo ja Eero ovat rannalla.', 'Leo and Eero are at the beach.')),
      page(
        sc('beach', '🧒 👦 🪨'),
        say('leo', 'Minä löydän yksitoista kiveä.', 'I find yksitoista stones.'),
        say('eero', 'Minä löydän neljätoista kiveä!', 'I find neljätoista stones!'),
      ),
      page(
        sc('beach', '🧒 👦'),
        say('eero', 'Kymmenen, yhdeksän, kahdeksan…', 'Kymmenen, yhdeksän, kahdeksan…'),
        say('leo', 'Kolme, kaksi, yksi…', 'Kolme, kaksi, yksi…'),
      ),
      page(sc('beach', '🧒 👦 🌊'), say('leo', 'Nolla!', 'Nolla!'), tell('Pojat hyppäävät mereen.', 'The boys jump into the sea.')),
    ],
    questions: [
      ask(
        'Missä pojat ovat?',
        'Where are the boys?',
        right('rannalla', 'at the beach', '🐚'),
        wrong('koulussa', 'at school', '🏫'),
        wrong('metsässä', 'in the forest', '🌲'),
      ),
      ask(
        'Mitä pojat löytävät?',
        'What do the boys find?',
        right('kiviä', 'stones', '🪨'),
        wrong('kaloja', 'fish', '🐟'),
        wrong('kukkia', 'flowers', '🌸'),
      ),
      ask(
        'Kuka sanoo: "Nolla!"?',
        'Who says "Nolla!"?',
        right('Leo', 'Leo', '🧒'),
        wrong('Eero', 'Eero', '👦'),
        wrong('Aino', 'Aino', '👧'),
      ),
    ],
    facts: [
      trueFact('Eero löytää neljätoista kiveä.', 'Eero finds neljätoista stones.'),
      falseFact('Leo löytää kaksikymmentä kiveä.', 'Leo finds kaksikymmentä stones.'),
      trueFact('Pojat hyppäävät mereen.', 'The boys jump into the sea.'),
    ],
  },

  // Round tens: Grandma and Aino bake kolmekymmentä buns, kymmenen for each.
  {
    id: 'math-baking',
    titleFi: 'Kolmekymmentä pullaa',
    titleEn: 'Kolmekymmentä buns',
    icon: '🥐',
    tier: 3,
    pages: [
      page(
        sc('kitchen', '👵 👧 🥐'),
        tell('Isoäiti tekee pullaa.', 'Grandma makes sweet buns.'),
        say('aino', 'Saanko auttaa?', 'May I help?'),
      ),
      page(
        sc('kitchen', '👵 👧 🥐'),
        say('isoaiti', 'Teemme kolmekymmentä pullaa.', 'We make kolmekymmentä buns.'),
        say('aino', 'Kolmekymmentä? Se on paljon!', 'Kolmekymmentä? That is a lot!'),
      ),
      page(
        sc('kitchen', '👧 🥐'),
        say('aino', 'Kymmenen pullaa Leolle, kymmenen pullaa Eerolle…', 'Kymmenen buns for Leo, kymmenen buns for Eero…'),
        say('aino', '…ja kymmenen pullaa meille!', '…and kymmenen buns for us!'),
      ),
      page(
        sc('kitchen', '👵 👧 🧒 👦 🥐'),
        say('isoaiti', 'Kymmenen plus kymmenen plus kymmenen on kolmekymmentä.', 'Kymmenen plus kymmenen plus kymmenen is kolmekymmentä.'),
        tell('Kaikki syövät pullaa.', 'Everyone eats sweet buns.'),
      ),
    ],
    questions: [
      ask(
        'Mitä isoäiti tekee?',
        'What does Grandma make?',
        right('pullaa', 'sweet buns', '🥐'),
        wrong('jäätelöä', 'ice cream', '🍦'),
        wrong('omenia', 'apples', '🍎'),
      ),
      ask(
        'Kuka sanoo: "Saanko auttaa?"',
        'Who says "May I help?"',
        right('Aino', 'Aino', '👧'),
        wrong('Leo', 'Leo', '🧒'),
        wrong('Mirri', 'Mirri', '🐱'),
      ),
      ask(
        'Kuka sanoo: "Teemme kolmekymmentä pullaa."?',
        'Who says "We make kolmekymmentä buns."?',
        right('isoäiti', 'Grandma', '👵'),
        wrong('Aino', 'Aino', '👧'),
        wrong('Eero', 'Eero', '👦'),
      ),
    ],
    facts: [
      trueFact('Leo saa kymmenen pullaa.', 'Leo gets kymmenen buns.'),
      falseFact('Eero saa kaksikymmentä pullaa.', 'Eero gets kaksikymmentä buns.'),
      trueFact('Kymmenen plus kymmenen plus kymmenen on kolmekymmentä.', 'Kymmenen plus kymmenen plus kymmenen is kolmekymmentä.'),
    ],
  },

  // Times and halves: a picnic, strawberries halved and cookies doubled.
  {
    id: 'math-picnic',
    titleFi: 'Puolet sinulle!',
    titleEn: 'Half for you!',
    icon: '🍓',
    tier: 3,
    pages: [
      page(
        sc('park', '🧒 👧 🍓'),
        tell('Leo ja Aino ovat puistossa.', 'Leo and Aino are in the park.'),
        tell('Heillä on mansikoita.', 'They have strawberries.'),
      ),
      page(
        sc('park', '🧒 🍓'),
        say('leo', 'Minulla on kahdeksan mansikkaa.', 'I have kahdeksan strawberries.'),
        say('leo', 'Puolet sinulle, Aino!', 'Half for you, Aino!'),
      ),
      page(sc('park', '👧 🍓'), say('aino', 'Puolet kahdeksasta on neljä. Kiitos!', 'Half of kahdeksan is neljä. Thank you!')),
      page(
        sc('park', '🧒 👧 🍪'),
        say('aino', 'Minulla on kaksi keksiä.', 'I have kaksi cookies.'),
        say('aino', 'Sinulla on kaksi keksiä.', 'You have kaksi cookies.'),
        say('leo', 'Kaksi kertaa kaksi on neljä!', 'Kaksi times kaksi is neljä!'),
      ),
    ],
    questions: [
      ask(
        'Missä Leo ja Aino ovat?',
        'Where are Leo and Aino?',
        right('puistossa', 'in the park', '🌳'),
        wrong('koulussa', 'at school', '🏫'),
        wrong('kaupassa', 'at the shop', '🏪'),
      ),
      ask(
        'Mitä Leolla on?',
        'What does Leo have?',
        right('mansikoita', 'strawberries', '🍓'),
        wrong('kukkia', 'flowers', '🌸'),
        wrong('omenia', 'apples', '🍎'),
      ),
      ask(
        'Kuka sanoo: "Kiitos!"?',
        'Who says "Thank you!"?',
        right('Aino', 'Aino', '👧'),
        wrong('Leo', 'Leo', '🧒'),
        wrong('Eero', 'Eero', '👦'),
      ),
    ],
    facts: [
      trueFact('Leolla on kahdeksan mansikkaa.', 'Leo has kahdeksan strawberries.'),
      falseFact('Aino saa kaksi mansikkaa.', 'Aino gets kaksi strawberries.'),
      trueFact('Kaksi kertaa kaksi on neljä.', 'Kaksi times kaksi is neljä.'),
    ],
  },

  // At the shop: an apple and a banana, viisi euros in all, paid coin by coin.
  {
    id: 'math-shopping',
    titleFi: 'Paljonko yhteensä?',
    titleEn: 'How much in all?',
    icon: '💶',
    tier: 3,
    pages: [
      page(sc('shop', '👩 👧'), tell('Äiti ja Aino ovat kaupassa.', 'Mom and Aino are at the shop.')),
      page(
        sc('shop', '👧 🍎 🍌'),
        tell('Omena maksaa kaksi euroa.', 'An apple costs kaksi euros.'),
        tell('Banaani maksaa kolme euroa.', 'A banana costs kolme euros.'),
      ),
      page(
        sc('shop', '👩 👧 🍎 🍌'),
        say('aiti', 'Paljonko yhteensä?', 'How much in all?'),
        say('aino', 'Kaksi plus kolme on viisi.', 'Kaksi plus kolme is viisi.'),
        say('aino', 'Yhteensä viisi euroa!', 'Viisi euros in all!'),
      ),
      page(
        sc('shop', '👧 💶'),
        tell('Aino maksaa kolikoilla.', 'Aino pays with coins.'),
        say('aino', 'Yksi, kaksi, kolme, neljä, viisi!', 'Yksi, kaksi, kolme, neljä, viisi!'),
      ),
    ],
    questions: [
      ask(
        'Missä Äiti ja Aino ovat?',
        'Where are Mom and Aino?',
        right('kaupassa', 'at the shop', '🏪'),
        wrong('puistossa', 'in the park', '🌳'),
        wrong('koulussa', 'at school', '🏫'),
      ),
      ask(
        'Kuka sanoo: "Paljonko yhteensä?"',
        'Who says "How much in all?"',
        right('Äiti', 'Mom', '👩'),
        wrong('Aino', 'Aino', '👧'),
        wrong('Isä', 'Dad', '👨'),
      ),
      ask(
        'Kuka maksaa?',
        'Who pays?',
        right('Aino', 'Aino', '👧'),
        wrong('Äiti', 'Mom', '👩'),
        wrong('Leo', 'Leo', '🧒'),
      ),
    ],
    facts: [
      trueFact('Omena maksaa kaksi euroa.', 'An apple costs kaksi euros.'),
      falseFact('Banaani maksaa viisi euroa.', 'A banana costs viisi euros.'),
      trueFact('Aino maksaa viisi euroa.', 'Aino pays viisi euros.'),
    ],
  },

  // What time is it? Eero and Dad wait at the station: half an hour to go.
  {
    id: 'math-train-time',
    titleFi: 'Milloin juna tulee?',
    titleEn: 'When does the train come?',
    icon: '🚆',
    tier: 3,
    pages: [
      page(sc('station', '👦 👨'), tell('Eero ja isä ovat asemalla.', 'Eero and Dad are at the station.')),
      page(
        sc('station', '👦 👨 🕒'),
        say('eero', 'Mitä kello on?', 'What time is it?'),
        say('isa', 'Kello on kolme.', 'It is kolme o’clock.'),
      ),
      page(
        sc('station', '👦 👨'),
        say('eero', 'Milloin juna tulee?', 'When does the train come?'),
        say('isa', 'Puolen tunnin päästä.', 'In half an hour.'),
      ),
      page(
        sc('station', '👦 👨 🕞 🚆'),
        say('eero', 'Nyt kello on puoli neljä!', 'Now it is half past kolme!'),
        tell('Juna tulee.', 'The train comes.'),
      ),
    ],
    questions: [
      ask(
        'Missä Eero ja isä ovat?',
        'Where are Eero and Dad?',
        right('asemalla', 'at the station', '🚉'),
        wrong('kaupassa', 'at the shop', '🏪'),
        wrong('rannalla', 'at the beach', '🐚'),
      ),
      ask(
        'Mikä tulee?',
        'What comes?',
        right('juna', 'the train', '🚆'),
        wrong('bussi', 'the bus', '🚌'),
        wrong('auto', 'the car', '🚗'),
      ),
      ask(
        'Kuka sanoo: "Mitä kello on?"',
        'Who says "What time is it?"',
        right('Eero', 'Eero', '👦'),
        wrong('isä', 'Dad', '👨'),
        wrong('Aino', 'Aino', '👧'),
      ),
    ],
    facts: [
      trueFact('Juna tulee puolen tunnin päästä.', 'The train comes in half an hour.'),
      falseFact('Juna tulee tunnin päästä.', 'The train comes in an hour.'),
      trueFact('Eero ja isä odottavat junaa.', 'Eero and Dad wait for the train.'),
    ],
  },
];
