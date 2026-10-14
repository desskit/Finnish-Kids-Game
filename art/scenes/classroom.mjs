// The classroom: the blackboard with chalk drawings on it, the window with a
// plant on its sill, the clock, pictures the class drew pinned up, the
// teacher's desk with an apple and books. The clock ticks.

import { polar, pt } from '../kit.mjs';
import { roomLight, roomWindow, wallAndFloor } from './rooms.mjs';

/** Chalk drawings: a sun, a house, a flower, a wavy line. */
function chalk(k) {
  const c = k.P;
  const ray = (a) => `M${pt(polar(148, 50, 12, a))}L${pt(polar(148, 50, 17, a))}`;
  return k.line(
    [
      'M139 50A9 9 0 1 0 157 50A9 9 0 1 0 139 50',
      [0, 45, 90, 135, 180, 225, 270, 315].map(ray).join(''),
      'M186 58H210V78H186ZM182 58L198 44L214 58M194 78V68H202V78',
      'M246 80V64M246 62A4 4 0 1 0 246 54A4 4 0 1 0 246 62M240 72Q246 68 246 74',
      'M126 92Q136 86 146 92Q156 98 166 92Q176 86 186 92',
    ].join(''),
    { color: c.white, sw: 1.4 },
  );
}

/** A picture the class drew, pinned to the wall: on cream paper, with a drawing. */
function drawing(k, x, y, w, h, art) {
  const c = k.P;
  return k.rect(x, y, w, h, 0.6, c.cream) + art + k.flatCircle(x + w / 2, y + 2.4, 1.8, c.red);
}

export default {
  id: 'classroom',
  title: 'classroom',
  tones: ['inside'],
  motion: { frames: 2, fps: 1 },
  draw(k, tone) {
    const c = k.P;
    const tick = k.frames > 1 && k.frame % 2 === 1;
    const floorY = 150;
    return [
      wallAndFloor(k, floorY, ['hillFar', 'hill']),
      roomWindow(k, 26, 30, 56, 58, tone, 'teal'),
      k.path('M47 84H61L59 95H49Z', c.orange),
      k.limb('M54 84Q50 78 46 76M54 84Q55 76 54 70M54 84Q58 79 62 77', c.green, 4.4),
      // the blackboard
      k.rect(110, 20, 180, 86, 2.4, c.wood),
      k.rect(116, 26, 168, 74, 0.8, c.charcoal),
      chalk(k),
      k.rect(108, 104, 184, 5, 1.4, c.wood),
      k.rect(130, 100.6, 10, 3.4, 1, c.white),
      k.rect(146, 100.6, 8, 3.4, 1, c.yellow),
      // the clock
      k.circle(338, 32, 14, c.wood),
      k.circle(338, 32, 10.6, c.white),
      k.line('M338 32L334 28M338 32V24', { sw: 2 }),
      k.line(tick ? 'M338 32H346' : 'M338 32L343.6 37.6', { color: c.red, sw: 1 }),
      // the class's drawings
      drawing(k, 304, 56, 24, 30, k.flat('M316 78C310 74 307 70 307 67C307 64 309 62 311.6 62C313.4 62 315 63 316 65C317 63 318.6 62 320.4 62C323 62 325 64 325 67C325 70 322 74 316 78Z', c.red)),
      drawing(k, 334, 60, 26, 26, k.flatEllipse(345, 74, 7, 4.4, c.blue) + k.flat('M351 74L357 69V79Z', c.blue)),
      drawing(k, 366, 54, 24, 32, k.flat('M376 80H380V72H376Z', c.brown) + k.flatCircle(378, 66, 7, c.green)),
      // the teacher's desk: its top, its legs, an apple and books on it
      k.rect(306, 120, 6, 30, 1, c.woodShade),
      k.rect(382, 120, 6, 30, 1, c.woodShade),
      k.rect(298, 112, 96, 9, 1.6, c.wood),
      k.circle(320, 106, 5.4, c.red),
      k.limb('M320 101V97', c.brown, 3.8),
      k.rect(352, 104, 26, 4.4, 1, c.blue),
      k.rect(354, 99.6, 22, 4.4, 1, c.yellow),
      k.rect(351, 95.2, 24, 4.4, 1, c.red),
      roomLight(k, tone),
    ].join('');
  },
};
