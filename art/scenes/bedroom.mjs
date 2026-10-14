// The bedroom: a pale blue room, the bed along the left wall with its starry
// blanket, a little nightstand with a lamp, a shelf of toys, the window with
// blue curtains, a round pink rug. At night the lamp glows, and the stars stuck
// on the wall glow too; the stars in the window twinkle.

import { roundPoly, starPoints } from '../kit.mjs';
import { roomLight, roomWindow, wallAndFloor } from './rooms.mjs';

/** The bed, its head against the left wall. */
function bed(k, gy) {
  const c = k.P;
  return [
    k.rect(6, 78, 16, gy - 78, 3, c.wood),
    k.rect(146, 108, 12, gy - 108, 3, c.wood),
    k.rect(18, 112, 132, 22, 3, c.white),
    k.ellipse(40, 106, 18, 9, c.white),
    k.rect(56, 100, 98, 34, 7, c.blue),
    k.flat('M58 100H66V133H58Z', c.sky),
    ...[[84, 110], [108, 122], [130, 108], [96, 126]].map(([x, y]) => k.flat(roundPoly(starPoints(x, y, 4, 1.6, 5), 0.3), c.yellow)),
    k.rect(18, 134, 132, 8, 1.4, c.woodShade),
  ].join('');
}

/** A nightstand with a little lamp on it (lit at night). */
function nightstand(k, x, gy, lit) {
  const c = k.P;
  return [
    k.rect(x, gy - 34, 30, 34, 2, c.wood),
    k.flat(`M${x + 3} ${gy - 18}H${x + 27}V${gy - 16}H${x + 3}Z`, c.woodShade),
    k.flatCircle(x + 15, gy - 24, 1.6, c.woodShade),
    k.limb(`M${x + 15} ${gy - 35}V${gy - 46}`, c.charcoal, 3.8),
    k.poly([[x + 6, gy - 44], [x + 24, gy - 44], [x + 20, gy - 56], [x + 10, gy - 56]], 1.4, lit ? c.yellow : c.cream),
  ].join('');
}

/** A shelf on the wall with toys: a ball, blocks, a teddy. */
function toyShelf(k, x, y) {
  const c = k.P;
  return [
    k.circle(x + 12, y - 8, 8, c.red),
    k.flat(`M${x + 5} ${y - 9}H${x + 19}V${y - 7}H${x + 5}Z`, c.white),
    k.rect(x + 26, y - 12, 12, 12, 1, c.yellow),
    k.rect(x + 38, y - 12, 12, 12, 1, c.green),
    k.rect(x + 32, y - 24, 12, 12, 1, c.blue),
    k.circle(x + 62, y - 20, 4, c.brown),
    k.circle(x + 72, y - 20, 4, c.brown),
    k.circle(x + 67, y - 12, 9, c.brown),
    k.flatEllipse(x + 67, y - 9, 4, 3, c.tan),
    k.flatCircle(x + 64, y - 14, 1.2, c.ink),
    k.flatCircle(x + 70, y - 14, 1.2, c.ink),
    k.rect(x - 4, y, 90, 5, 1.4, c.wood),
  ].join('');
}

export default {
  id: 'bedroom',
  title: 'bedroom',
  tones: ['inside', 'morning', 'night'],
  motion: { frames: 2, fps: 1 },
  draw(k, tone) {
    const c = k.P;
    const floorY = 150;
    const night = tone === 'night';
    // stars stuck on the wall: they glow at night
    const wallStars = [[200, 22], [232, 34], [176, 40], [214, 54]].map(([x, y]) => k.flat(roundPoly(starPoints(x, y, 5, 2, 5), 0.4), night ? c.starlight : c.yellowShade));
    return [
      wallAndFloor(k, floorY, ['skyDayLow', 'skyDay']),
      roomWindow(k, 284, 30, 72, 64, tone, 'blue'),
      toyShelf(k, 176, 96),
      bed(k, floorY),
      nightstand(k, 162, floorY, night),
      k.ellipse(232, 178, 70, 14, c.pink),
      k.flatEllipse(232, 178, 58, 9, c.pinkShade),
      roomLight(k, tone, 'M284 30H356L300 150H236Z'),
      ...wallStars,
      night ? k.flatCircle(177, 100, 28, c.starlight, { opacity: 0.16 }) + k.poly([[168, 106], [186, 106], [182, 94], [172, 94]], 1.4, c.yellow) : '',
    ].join('');
  },
};
