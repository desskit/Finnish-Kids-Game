// Christmas Eve: the living room with the Christmas tree all lit up and the
// presents under it, the candle arch (kynttelikkö) in the window and snow
// falling outside, a straw himmeli hanging from the ceiling, a little table
// with gingerbread and a candle. The tree's lights blink and the snow falls;
// in the evening the room is lit warm and the sky outside is dark.

import { pine } from '../nature.mjs';
import { christmasTree } from '../props.mjs';
import { present } from '../year.mjs';
import { snowOnPine } from './outdoors.mjs';
import { roomLight, wallAndFloor } from './rooms.mjs';

/** The window onto the snowy garden: the sky of the tone, a snowy spruce, the snow falling. */
function snowyWindow(k, x, y, w, h, tone) {
  const c = k.P;
  const dark = tone === 'evening';
  const f = k.frames > 1 ? k.frame % 2 : 0;
  const flakes = [[0.14, 0.18], [0.4, 0.1], [0.7, 0.24], [0.88, 0.12], [0.26, 0.44], [0.6, 0.5], [0.84, 0.46], [0.1, 0.66]];
  return [
    k.rect(x - 5, y - 5, w + 10, h + 10, 2, c.white),
    k.rect(x, y, w, h, 0.6, dark ? c.skyNight : c.skyRain),
    pine(k, x + w * 0.3, y + h - 4, h * 0.62),
    snowOnPine(k, x + w * 0.3, y + h - 4, h * 0.62),
    k.flat(`M${x} ${y + h}V${y + h - 10}Q${x + w * 0.5} ${y + h - 18} ${x + w} ${y + h - 9}V${y + h}Z`, c.white),
    ...flakes.map(([fx, fy]) => k.flatCircle(x + w * fx, y + h * fy + f * 5, 1.8, c.white)),
    k.rect(x + w / 2 - 1.8, y, 3.6, h, 0, c.white),
    k.rect(x, y + h / 2 - 1.8, w, 3.6, 0, c.white),
    k.rect(x - 9, y + h + 4, w + 18, 5, 1.6, c.white),
  ].join('');
}

/** The candle arch on the windowsill: a stepped wooden arch, seven candles glowing on it. */
function candleArch(k, cx, base) {
  const c = k.P;
  const steps = [0, 6, 12, 18, 12, 6, 0];
  const out = [k.path(`M${cx - 38} ${base}V${base - 8}L${cx - 6} ${base - 30}H${cx + 6}L${cx + 38} ${base - 8}V${base}Z`, c.white)];
  steps.forEach((up, i) => {
    const x = cx - 30 + i * 10;
    const top = base - 14 - up;
    out.push(k.rect(x - 2, top, 4, 7, 0.6, c.white, { sw: 1 }), k.flatEllipse(x, top - 2.6, 1.8, 2.6, c.amber));
  });
  return out.join('');
}

/** A himmeli: the straw mobile hanging from the ceiling, a diamond of straws. */
function himmeli(k, x) {
  const c = k.P;
  const straw = { color: c.amberShade, sw: 1.6 };
  return [
    k.line(`M${x} 0V14`, { color: c.charcoal, sw: 1.2 }),
    k.line(`M${x} 14L${x - 16} 34L${x} 54L${x + 16} 34ZM${x} 14L${x - 5} 34L${x} 54L${x + 5} 34ZM${x - 16} 34H${x + 16}`, straw),
  ].join('');
}

/** A low table with a plate of gingerbread and a candle. */
function table(k, x, gy) {
  const c = k.P;
  return [
    k.rect(x + 4, gy - 30, 5, 30, 1, c.woodShade),
    k.rect(x + 61, gy - 30, 5, 30, 1, c.woodShade),
    k.rect(x - 2, gy - 36, 74, 7, 1.6, c.wood),
    k.ellipse(x + 22, gy - 38, 16, 3.6, c.white),
    ...[[x + 14, gy - 41], [x + 22, gy - 42], [x + 30, gy - 41]].map(([px, py]) => k.circle(px, py, 3.6, c.brown)),
    k.rect(x + 50, gy - 54, 7, 18, 1, c.red),
    k.flatEllipse(x + 53.5, gy - 58, 2.4, 3.6, c.amber),
  ].join('');
}

export default {
  id: 'christmas',
  title: 'Christmas Eve (the living room with the tree)',
  tones: ['inside', 'evening'],
  motion: { frames: 2, fps: 2 },
  draw(k, tone) {
    const c = k.P;
    const floorY = 150;
    const glow = (x, y, r) => (tone === 'evening' ? k.flatCircle(x, y, r, c.starlight, { opacity: 0.16 }) : '');
    return [
      wallAndFloor(k, floorY),
      snowyWindow(k, 40, 30, 80, 64, tone),
      candleArch(k, 80, 103),
      himmeli(k, 200),
      table(k, 26, floorY + 14),
      // the rug, the tree and the presents under it
      k.ellipse(200, 180, 110, 14, c.red),
      k.flatEllipse(200, 180, 98, 9, c.redShade),
      k.g('translate(232 30) scale(2.2)', christmasTree(k)),
      present(k, 262, 140, 26, 22, 'blue', 'yellow'),
      present(k, 336, 146, 30, 20, 'red', 'white'),
      present(k, 300, 156, 22, 16, 'green', 'red'),
      roomLight(k, tone),
      glow(80, 86, 34),
      glow(302, 96, 60),
      glow(79, 108, 12),
    ].join('');
  },
};
