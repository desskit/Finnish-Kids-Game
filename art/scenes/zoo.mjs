// The zoo: over the wooden fence a giraffe looks out (its ear flicks) and an
// elephant stands by its tree; a signpost with a paw print on it, the path in
// front. The clouds drift.

import { bush, cloud, sceneSky, tree } from './parts.mjs';
import { grassland, sun } from './outdoors.mjs';

export default {
  id: 'zoo',
  title: 'zoo',
  tones: ['day'],
  motion: { frames: 2, fps: 1.5 },
  drift: (k) => cloud(k, 110, 30, 0.8) + cloud(k, 270, 20, 0.6),
  draw(k) {
    const c = k.P;
    const flick = k.frames > 1 && k.frame % 2 ? -18 : 0;
    const posts = [];
    for (let x = 6; x < 400; x += 48) posts.push(k.rect(x, 96, 8, 46, 1, c.woodShade));
    return [
      sceneSky(k, 'day'),
      sun(k, 196, 32),
      k.moving ? '' : cloud(k, 110, 30, 0.8) + cloud(k, 270, 20, 0.6),
      grassland(k, 104, 'grass'),
      tree(k, 236, 118, 0.9),
      bush(k, 30, 112, 0.9),
      // the elephant, side on, behind the fence
      k.limb('M74 112V128M110 112V128', c.greyShade, 9),
      k.rect(60, 70, 66, 46, 18, c.grey),
      k.limb('M126 98Q138 106 136 124', c.grey, 9),
      k.ellipse(126, 84, 16, 16, c.grey),
      k.ellipse(116, 86, 9, 13, c.greyShade),
      k.eye(132, 80, 2.2),
      // the giraffe: its neck and head over the fence
      k.path('M318 128V60C318 50 322 40 328 32L338 36C334 44 332 52 332 62V128Z', c.yellow),
      k.flat('M320 84H328L327 92H320ZM322 106H330L329 114H322ZM324 62H331L330 69H324Z', c.brown),
      k.limb('M332 30V22M342 30V22', c.brown, 3.8),
      k.g(`rotate(${flick} 330 32)`, k.ellipse(322, 32, 6, 3, c.yellow)),
      k.path('M326 30C326 24 332 22 338 24L352 28C358 30 360 35 358 39C356 43 351 44 346 42L334 38C329 36 326 34 326 30Z', c.yellow),
      k.flat('M347 30C351 31 355 33 358 37C357 41 352 42.6 347 41.4Z', c.tan),
      k.eye(337, 29, 2.2),
      // the fence in front of them
      ...posts,
      k.rect(-4, 102, 408, 7, 1, c.wood),
      k.rect(-4, 124, 408, 7, 1, c.wood),
      // the path, a signpost with a paw on it
      k.path('M-4 150C100 142 300 142 404 150V204H-4Z', c.path),
      k.limb('M40 196V128', c.wood, 5.4),
      k.rect(18, 106, 44, 28, 2, c.green),
      k.flatEllipse(40, 124, 6, 5, c.white),
      k.flatCircle(31, 114, 2.6, c.white),
      k.flatCircle(37.6, 111, 2.6, c.white),
      k.flatCircle(44.4, 111, 2.6, c.white),
      k.flatCircle(51, 114, 2.6, c.white),
    ].join('');
  },
};
