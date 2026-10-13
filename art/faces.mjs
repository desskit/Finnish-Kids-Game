// The round yellow face the feeling words are drawn on: verbs like smile and
// cry, adjectives like happy and sad. One face, so a feeling always looks like
// the same little person having it.

import { crescentPath, polar, pt } from './kit.mjs';

/** The round face every feeling is drawn on. */
export function faceBase(k) {
  const c = k.P;
  return [
    k.circle(32, 32, 24, c.yellow),
    k.flat(crescentPath(32, 32, 24, -10, 120, 0.2), c.yellowShade),
    k.shine(`M${pt(polar(32, 32, 19, 200))}A19 19 0 0 1 ${pt(polar(32, 32, 19, 238))}`, 2.6),
  ].join('');
}

/** Rosy cheeks on the face. */
export const cheeks = (k) => k.blush(17.6, 36.4, 3.6, 2.2) + k.blush(46.4, 36.4, 3.6, 2.2);

/** A teardrop, its round end at (x, y), its point up. */
export const tear = (k, x, y, r = 2.6) =>
  k.path(
    `M${pt([x, y - r * 2.4])}C${pt([x + r * 0.4, y - r * 1.4])} ${pt([x + r, y - r * 0.6])} ${pt([x + r, y])}A${r} ${r} 0 0 1 ${pt([x - r, y])}C${pt([x - r, y - r * 0.6])} ${pt([x - r * 0.4, y - r * 1.4])} ${pt([x, y - r * 2.4])}Z`,
    k.P.sky,
  );
