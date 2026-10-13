// Adjective words. Feelings are one round face with the kit's eyes and mouths.

import { faceBase } from '../faces.mjs';

export default [
  {
    id: 'happy',
    title: 'happy',
    // a happy little bounce
    motion: { frames: 2, fps: 2.5 },
    draw: (k) =>
      k.g(
        `translate(0 ${k.frame % 2 ? -k.px : 0})`,
        faceBase(k),
        k.happyEye(24.4, 26.8, 6.4),
        k.happyEye(39.6, 26.8, 6.4),
        k.blush(17.6, 36.4, 3.6, 2.2),
        k.blush(46.4, 36.4, 3.6, 2.2),
        k.openSmile(32, 36, 15, 6.4),
      ),
  },
];
