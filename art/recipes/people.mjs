// People words. The family words are the story cast, so a character looks the
// same in a game card and in a story: sister = Aino, son = Eero, child = Leo,
// mother = Äiti, father = Isä, grandmother = Isoäiti, teacher = Opettaja.

import { baby, CAST, FAMILY, person } from '../people.mjs';

/** A person shrunk and placed: `x` is where their middle goes, `ground` where their feet go. */
const placed = (k, look, x, ground, s) => k.g(`translate(${x - 32 * s} ${ground - 60 * s}) scale(${s})`, person(k, look));

export default [
  { id: 'sister', title: 'Aino (sister)', draw: (k) => person(k, CAST.aino) },
  { id: 'son', title: 'Eero (son, boy)', draw: (k) => person(k, CAST.eero) },
  { id: 'child', title: 'Leo (child)', draw: (k) => person(k, CAST.leo) },
  { id: 'mother', title: 'Äiti (mom)', draw: (k) => person(k, CAST.aiti) },
  { id: 'father', title: 'Isä (dad)', draw: (k) => person(k, CAST.isa) },
  { id: 'grandmother', title: 'Isoäiti (grandmother)', draw: (k) => person(k, CAST.isoaiti) },
  { id: 'grandfather', title: 'grandfather', draw: (k) => person(k, FAMILY.grandfather) },
  { id: 'brother', title: 'brother', draw: (k) => person(k, FAMILY.brother) },
  { id: 'baby', title: 'baby', motion: { frames: 2, fps: 2.5 }, draw: baby },
  {
    id: 'family',
    title: 'family (Isä, Äiti and Aino)',
    draw: (k) => [placed(k, CAST.isa, 20, 56, 0.64), placed(k, CAST.aiti, 44, 56, 0.64), placed(k, CAST.aino, 32, 60, 0.5)].join(''),
  },
];
