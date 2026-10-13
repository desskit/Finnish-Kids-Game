// People words. The family words are the story cast, so a character looks the
// same in a game card and in a story: sister = Aino, son = Eero, child = Leo,
// mother = Äiti, father = Isä, grandmother = Isoäiti, teacher = Opettaja.

import { CAST, person } from '../people.mjs';

export default [
  { id: 'sister', title: 'Aino (sister)', draw: (k) => person(k, CAST.aino) },
];
