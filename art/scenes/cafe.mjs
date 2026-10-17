// The café: a window and a little round table with two chairs, a chalkboard
// menu with an ice cream and a cup on it, lamps hanging from the ceiling, and
// the counter: a glass case of buns and cake, and the coffee machine.
// It moves: steam rises from the cup on the table.

import { roomWindow, wallAndFloor } from './rooms.mjs';

/** A café chair on (x, gy), its back on the `side` (-1 left, 1 right). */
function chair(k, x, gy, side) {
  const c = k.P;
  const back = x + side * 10;
  return [
    k.limb(`M${back} ${gy - 1}V${gy - 50}`, c.teal, 5),
    k.limb(`M${x - side * 10} ${gy - 1}V${gy - 22}`, c.teal, 5),
    k.rect(x - 13, gy - 26, 26, 6, 1.6, c.teal),
  ].join('');
}

export default {
  id: 'cafe',
  title: 'café',
  tones: ['inside'],
  motion: { frames: 2, fps: 1.4 },
  draw(k) {
    const c = k.P;
    const floorY = 150;
    const puff = k.frames > 1 && k.frame % 2 ? -3 : 0;
    return [
      wallAndFloor(k, floorY, ['cream', 'creamShade']),
      roomWindow(k, 24, 28, 70, 54, 'inside', 'teal'),
      // the chalkboard menu: an ice cream, a cup, and the prices in chalk
      k.rect(140, 14, 86, 56, 2, c.wood),
      k.rect(145, 19, 76, 46, 1, c.charcoal),
      k.path('M157 38H171L164 56Z', c.amber),
      k.line('M160 43L168 47M161 48L166 51', { color: c.amberShade, sw: 1.4 }),
      k.circle(164, 33, 7, c.pink),
      k.flatCircle(161.5, 30.5, 1.8, c.white),
      k.rect(186, 36, 18, 15, 3, c.white),
      k.limb('M204 40Q211 43 204 47', c.white, 4.4),
      k.line('M191 32Q189 28 192 25M199 32Q197 28 200 25', { color: c.white, sw: 1.4 }),
      k.line('M151 60H173M183 60H213', { color: c.white, sw: 1.4 }),
      // lamps hanging from the ceiling
      k.line('M262 0V12M336 0V12', { color: c.charcoal, sw: 1.4 }),
      k.path('M251 22Q262 6 273 22Z', c.yellow),
      k.path('M325 22Q336 6 347 22Z', c.yellow),
      // the counter, its top and front
      k.rect(234, 104, 170, 46, 2, c.wood),
      k.flat('M236 124H402V128H236Z', c.woodShade),
      k.rect(228, 98, 176, 8, 1.6, c.tan),
      // the glass case on it: two buns and a slice of cake
      k.rect(240, 66, 74, 32, 2, c.skyDayLow, { opacity: 0.85 }),
      k.ellipse(254, 90, 9, 6, c.amber),
      k.flatEllipse(254, 87, 5, 2, c.cream),
      k.ellipse(274, 90, 9, 6, c.amber),
      k.flatEllipse(274, 87, 5, 2, c.cream),
      k.path('M288 96V84L306 88V96Z', c.cream),
      k.flat('M289 90L305 92V94L289 92Z', c.pink),
      k.path('M288 84L306 88L301 82Z', c.pink),
      // the coffee machine, a cup under its spout
      k.rect(336, 52, 50, 8, 2, c.charcoal),
      k.rect(340, 60, 42, 38, 3, c.silver),
      k.flatCircle(374, 68, 2.6, c.red),
      k.rect(354, 66, 10, 10, 1, c.charcoal),
      k.rect(353, 86, 12, 11, 2.4, c.white),
      // the table by the window, its chairs, a cup with steam
      chair(k, 70, floorY, -1),
      chair(k, 146, floorY, 1),
      k.limb(`M108 ${floorY - 2}V118`, c.charcoal, 5),
      k.ellipse(108, floorY - 1, 13, 3, c.charcoal),
      k.ellipse(108, 116, 30, 5, c.white),
      k.rect(98, 102, 12, 11, 2.4, c.coral),
      k.limb('M110 105Q116 107 110 111', c.coral, 4.4),
      k.line(`M101 ${98 + puff}Q99 ${93 + puff} 102 ${89 + puff}M107 ${98 - puff}Q105 ${93 - puff} 108 ${89 - puff}`, { color: c.white, sw: 1.6 }),
    ].join('');
  },
};
