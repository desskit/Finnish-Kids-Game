// The playground: a slide on the left, swings on the right (one of them
// swinging), a sandbox with a bucket in it, trees behind a low fence. The
// clouds drift.

import { cloud, sceneSky, tree } from './parts.mjs';
import { fence, grassland, sun } from './outdoors.mjs';

export default {
  id: 'playground',
  title: 'playground',
  tones: ['day'],
  motion: { frames: 2, fps: 1.5 },
  drift: (k) => cloud(k, 130, 36, 0.9) + cloud(k, 300, 22, 0.7),
  draw(k) {
    const c = k.P;
    const swing = k.frames > 1 && k.frame % 2 ? 12 : -12;
    const seat = (x, color) => k.line(`M${x - 7} 72V124M${x + 7} 72V124`, { color: c.charcoal, sw: 1.4 }) + k.rect(x - 11, 123, 22, 5, 1.4, c[color]);
    return [
      sceneSky(k, 'day'),
      sun(k, 356, 36),
      k.moving ? '' : cloud(k, 130, 36, 0.9) + cloud(k, 300, 22, 0.7),
      tree(k, 70, 124, 0.7),
      tree(k, 214, 116, 0.6),
      tree(k, 252, 120, 0.5),
      grassland(k, 120),
      fence(k, -4, 404, 132, 16),
      // the slide: its ladder, its top, the chute
      k.limb('M30 150V80M46 150V80', c.charcoal, 4.4),
      k.line('M30 94H46M30 106H46M30 118H46M30 130H46M30 142H46', { color: c.charcoal, sw: 2 }),
      k.rect(26, 76, 40, 6, 1.6, c.yellow),
      k.limb('M62 82Q78 96 90 120Q98 138 120 146', c.red, 11),
      k.limb('M100 146V132', c.charcoal, 4),
      // the swings: the frame, one still and one swinging
      k.limb('M282 150L300 70L318 150M362 150L380 70L398 150', c.blue, 5),
      seat(322, 'red'),
      k.g(`rotate(${swing} 356 72)`, seat(356, 'yellow')),
      k.limb('M294 70H386', c.blue, 6),
      // the sandbox, a bucket in it
      k.rect(8, 160, 86, 24, 2, c.wood),
      k.flat('M12 164H90V180H12Z', c.tan),
      k.path('M58 160H72L70 172H60Z', c.red),
      k.line('M58 162Q65 152 72 162', { color: c.charcoal, sw: 1.4 }),
    ].join('');
  },
};
