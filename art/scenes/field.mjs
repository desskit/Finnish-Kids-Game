// The sports field: the stand with its benches behind, flags on its roof,
// floodlights at either end, the mown green field with its white lines and a
// goal. The flags flap; the clouds drift.

import { cloud, sceneSky } from './parts.mjs';
import { sun } from './outdoors.mjs';

export default {
  id: 'field',
  title: 'sports field',
  tones: ['day'],
  motion: { frames: 2, fps: 2 },
  drift: (k) => cloud(k, 150, 30, 0.8) + cloud(k, 330, 22, 0.6),
  draw(k) {
    const c = k.P;
    const flap = k.frames > 1 && k.frame % 2 === 1;
    const flag = (x, color) => k.limb(`M${x} 52V36`, c.charcoal, 3.8) + k.path(flap ? `M${x + 1} 36L${x + 16} 39L${x + 1} 44Z` : `M${x + 1} 36Q${x + 9} 34 ${x + 16} 40Q${x + 9} 41 ${x + 1} 44Z`, c[color]);
    const light = (x) => k.limb(`M${x} 150V34`, c.grey, 5) + k.rect(x - 12, 22, 24, 14, 1.6, c.silver) + k.flat(`M${x - 9} 25H${x + 9}V33H${x - 9}Z`, c.starlight);
    const stripes = [];
    for (let x = -20; x < 420; x += 56) stripes.push(`M${x} 126H${x + 28}L${x + 44} 204H${x + 4}Z`);
    return [
      sceneSky(k, 'day'),
      sun(k, 44, 32, 13),
      k.moving ? '' : cloud(k, 150, 30, 0.8) + cloud(k, 330, 22, 0.6),
      light(20),
      light(380),
      // the stand: its roof, flags, three rows of benches
      k.rect(60, 70, 280, 58, 1.6, c.white),
      k.poly([[52, 74], [348, 74], [338, 56], [62, 56]], 1.4, c.blue),
      flag(110, 'red'),
      flag(200, 'yellow'),
      flag(290, 'green'),
      k.rect(66, 82, 268, 9, 1, c.sky),
      k.rect(66, 96, 268, 9, 1, c.sky),
      k.rect(66, 110, 268, 9, 1, c.sky),
      // the field
      k.path('M-4 126H404V204H-4Z', c.grass),
      k.flat(stripes.join(''), c.grassShade, { opacity: 0.4 }),
      k.line('M-4 136H404M200 136V204M156 204A44 30 0 0 1 244 204', { color: c.white, sw: 2 }),
      // the goal
      k.line('M26 112L60 112M26 120H60M34 104V146M44 104V146M54 104V146', { color: c.silverShade, sw: 1 }),
      k.limb('M22 150V100H64V150', c.white, 4.4),
    ].join('');
  },
};
