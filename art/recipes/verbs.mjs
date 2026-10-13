// Verb words. Actions are Leo (the "action kid") doing them; a few verbs keep
// the object their emoji showed (close = a shut padlock).

import { CAST, person, POSES } from '../people.mjs';

export default [
  { id: 'run', title: 'run', draw: (k) => person(k, CAST.leo, POSES.run) },
  {
    id: 'close',
    title: 'close (a shut padlock)',
    draw: (k) => {
      const c = k.P;
      return [
        k.limb('M22.6 30.4V22.6A9.4 9.4 0 0 1 41.4 22.6V30.4', c.silver, 8.6),
        k.poly([[14.4, 28.4], [49.6, 28.4], [49.6, 55.4], [14.4, 55.4]], 5.4, c.amber),
        k.flat('M15.8 47.6H48.2V50.4C48.2 52.4 46.8 54.1 44.8 54.1H19.2C17.2 54.1 15.8 52.4 15.8 50.4Z', c.amberShade),
        k.shine('M19.6 34.6V40.6', 2.4),
        k.flatCircle(32, 38.8, 3.4, c.ink),
        k.flat('M30.4 40.4L29.4 47H34.6L33.6 40.4Z', c.ink),
      ].join('');
    },
  },
];
