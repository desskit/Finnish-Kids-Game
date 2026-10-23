// The sauna, inside: walls of pale wooden boards, the benches in two steps,
// the stove (kiuas) with its pile of stones and the fire glowing in its door,
// steam (löyly) rising off the stones, the wooden bucket and its ladle on the
// bench, the thermometer and a towel on the wall, a small window.

import { SCENE_H, SCENE_W } from './parts.mjs';

/** Steam rising off the stones: puffs climbing a step on each frame. */
function steam(k) {
  const f = k.frames > 1 ? k.frame % 3 : 0;
  return [[84, 0], [100, 1], [116, 2]]
    .map(([x, i]) => {
      const s = (i + f) % 3;
      return k.circle(x + (s % 2) * 4, 82 - s * 16, 6 + s * 2.4, k.P.white, { sw: 1.5 });
    })
    .join('');
}

export default {
  id: 'sauna',
  title: 'the sauna (inside: the benches, the stove, steam)',
  tones: ['inside'],
  motion: { frames: 3, fps: 2 },
  draw(k) {
    const c = k.P;
    const floorY = 164;
    const boards = [];
    for (let x = 20; x < SCENE_W; x += 22) boards.push(`M${x} 0V${floorY}`);
    const slats = (x0, y, x1) => k.line(`M${x0} ${y}H${x1}`, { color: c.woodShade, sw: 1.4 });
    return [
      // the wall of boards, the floor
      k.flat(`M0 0H${SCENE_W}V${floorY}H0Z`, c.tan),
      k.line(boards.join(''), { color: c.tanShade, sw: 1.4 }),
      k.flat(`M0 ${floorY}H${SCENE_W}V${SCENE_H}H0Z`, c.woodShade),
      k.line(`M0 ${floorY}H${SCENE_W}`),
      // a small window, a birch outside it
      k.rect(36, 24, 52, 36, 1.4, c.wood),
      k.rect(41, 29, 42, 26, 0.6, c.skyDay),
      k.flat('M41 47Q52 40 62 47Q72 42 83 46V55H41Z', c.green),
      k.rect(66, 29, 4, 20, 0.6, c.white),
      // the thermometer, the towel on its hook
      k.rect(150, 30, 22, 32, 4, c.wood),
      k.circle(161, 42, 7, c.white),
      k.line('M161 42L165 37', { sw: 1.6 }),
      k.flatCircle(161, 56, 2.4, c.red),
      k.flatCircle(196, 48, 2.6, c.charcoal),
      k.rect(184, 50, 24, 40, 3, c.sky),
      k.flat('M184 78H208V82H184Z', c.skyShade),
      // the benches: the upper step at the back, the lower one in front
      k.rect(224, 74, 180, 10, 1.4, c.wood),
      slats(226, 79, 402),
      k.rect(224, 84, 180, 48, 0.6, c.woodShade),
      k.rect(196, 118, 208, 10, 1.4, c.wood),
      slats(198, 123, 402),
      k.rect(196, 128, 208, 36, 0.6, c.woodShade),
      k.line('M240 84V118M320 84V118M396 84V118M214 128V164M300 128V164M386 128V164', { color: c.brown, sw: 2 }),
      // the bucket and its ladle, on the lower bench
      k.limb('M246 112L262 88', c.wood, 4.4),
      k.ellipse(264, 86, 5, 3.4, c.wood),
      k.path('M226 100H252L248 119H230Z', c.wood),
      k.flat('M227 104H251L250.4 107H227.6ZM228.6 113H249.4L248.8 116H229.2Z', c.silver),
      k.flatEllipse(239, 100.6, 12, 2, c.water),
      // the stove: its body, the fire in its door, the stones piled on top
      k.rect(66, 100, 72, 64, 3, c.charcoal),
      k.flat('M126 103H134V161H126Z', c.charcoalShade),
      k.rect(80, 130, 36, 22, 2, c.charcoalShade),
      k.flat('M86 150C86 142 92 140 94 134C96 140 100 138 100 132C104 138 110 142 110 150Z', c.orange),
      k.flat('M92 150C92 146 96 144 98 140C100 145 104 146 104 150Z', c.yellow),
      ...[[74, 98, 8], [90, 94, 9], [108, 94, 9], [126, 98, 8], [82, 88, 7], [100, 84, 8], [118, 88, 7]].map(([x, y, r]) => k.circle(x, y, r, c.grey)),
      k.flat('M96 82C98 80 102 80 104 82', c.silver),
      steam(k),
    ].join('');
  },
};
