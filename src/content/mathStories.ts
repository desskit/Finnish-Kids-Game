// The math section's stories (Lasketaan!, see src/game/mathPath.tsx): one per
// stage, with the same people as the course's stories, where the counting
// happens in Finnish — buns eaten, cars compared, blueberries given away,
// stones found and a countdown to the jump.
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

  // Eleven, twelve…: stones on the beach, then a countdown and a jump.
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
];
