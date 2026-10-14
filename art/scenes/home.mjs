// Home: the living room. A window with its curtains on the left, a little
// bookshelf, the clock on the wall, a floor lamp, the sofa with its cushions
// and a picture over it, a plant in the corner, a rug where the cast stands.
// It moves: the clock ticks; at night the stars in the window twinkle and the
// lamp's glow breathes.

import { floorLamp, roomLight, roomWindow, wallAndFloor } from './rooms.mjs';

/** The wall clock: its second hand on alternate frames points up, then right. */
function wallClock(k, x, y) {
  const c = k.P;
  const tick = k.frames > 1 && k.frame % 2 === 1;
  return [
    k.circle(x, y, 14, c.wood),
    k.circle(x, y, 10.6, c.white),
    k.line(`M${x} ${y}L${x - 5} ${y - 4}M${x} ${y}V${y - 8}`, { sw: 2 }),
    k.line(tick ? `M${x} ${y}H${x + 8}` : `M${x} ${y}L${x + 5.6} ${y + 5.6}`, { color: k.P.red, sw: 1 }),
  ].join('');
}

/** A low bookshelf against the wall, two rows of books. */
function bookshelf(k, x, gy) {
  const c = k.P;
  const books = (y, colors, widths) => {
    let bx = x + 5;
    return colors
      .map((col, i) => {
        const w = widths[i];
        const r = k.rect(bx, y - (i % 3 === 1 ? 15 : 17), w, i % 3 === 1 ? 15 : 17, 0.6, c[col]);
        bx += w + 0.6;
        return r;
      })
      .join('');
  };
  return [
    k.rect(x, gy - 48, 58, 48, 2, c.wood),
    k.flat(`M${x + 4} ${gy - 44}H${x + 54}V${gy - 4}H${x + 4}Z`, c.woodShade),
    books(gy - 26.4, ['red', 'blue', 'yellow', 'green', 'purple', 'teal'], [7, 6, 8, 6, 7, 8]),
    k.rect(x, gy - 27, 58, 4, 0.6, c.wood),
    books(gy - 4.4, ['teal', 'orange', 'blue', 'pink', 'yellow'], [8, 7, 9, 7, 9]),
  ].join('');
}

/** The sofa, facing us, its two cushions. */
function sofa(k, x, gy) {
  const c = k.P;
  return [
    k.rect(x + 8, gy - 4, 6, 6, 1, c.woodShade),
    k.rect(x + 118, gy - 4, 6, 6, 1, c.woodShade),
    k.rect(x + 10, gy - 56, 112, 36, 9, c.teal),
    k.flat(`M${x + 12} ${gy - 30}H${x + 120}V${gy - 22}H${x + 12}Z`, c.tealShade),
    k.rect(x + 22, gy - 50, 28, 22, 6, c.yellow),
    k.rect(x + 82, gy - 50, 28, 22, 6, c.coral),
    k.rect(x + 6, gy - 28, 120, 24, 7, c.teal),
    k.flat(`M${x + 8} ${gy - 12}H${x + 124}V${gy - 6}H${x + 8}Z`, c.tealShade),
    k.rect(x - 4, gy - 40, 20, 38, 8, c.teal),
    k.rect(x + 116, gy - 40, 20, 38, 8, c.teal),
  ].join('');
}

/** A framed picture of a sunny hill. */
function picture(k, x, y, w, h) {
  const c = k.P;
  return [
    k.rect(x, y, w, h, 1.4, c.wood),
    k.rect(x + 5, y + 5, w - 10, h - 10, 0.6, c.skyDay),
    k.flat(`M${x + 5} ${y + h - 13}Q${x + w * 0.35} ${y + h - 26} ${x + w * 0.6} ${y + h - 15}Q${x + w * 0.8} ${y + h - 20} ${x + w - 5} ${y + h - 16}V${y + h - 5}H${x + 5}Z`, c.green),
    k.flatCircle(x + w * 0.72, y + 15, 5, c.yellow),
  ].join('');
}

/** A plant in a pot. */
function plant(k, x, gy) {
  const c = k.P;
  return [
    k.limb(`M${x} ${gy - 20}Q${x - 12} ${gy - 34} ${x - 18} ${gy - 52}M${x} ${gy - 20}Q${x + 2} ${gy - 44} ${x - 2} ${gy - 62}M${x} ${gy - 20}Q${x + 12} ${gy - 36} ${x + 18} ${gy - 50}`, c.green, 6),
    k.ellipse(x - 18, gy - 54, 7, 4, c.green),
    k.ellipse(x - 2, gy - 64, 5, 7, c.green),
    k.ellipse(x + 18, gy - 52, 7, 4, c.green),
    k.path(`M${x - 13} ${gy - 22}H${x + 13}L${x + 10} ${gy}H${x - 10}Z`, c.orange),
    k.flat(`M${x + 5} ${gy - 21}H${x + 12}L${x + 9.6} ${gy - 1}H${x + 4}Z`, c.orangeShade),
  ].join('');
}

/** The living room in a tone; `extra` is laid over it before the light (the party's balloons). */
export function livingRoom(k, tone, extra = '') {
  const c = k.P;
  const lit = tone === 'evening' || tone === 'night';
  const floorY = 150;
  return [
    wallAndFloor(k, floorY),
    roomWindow(k, 44, 28, 74, 66, tone),
    bookshelf(k, 140, floorY),
    wallClock(k, 210, 46),
    picture(k, 292, 26, 64, 46),
    floorLamp(k, 240, floorY, lit),
    sofa(k, 262, floorY),
    plant(k, 20, floorY),
    k.ellipse(200, 178, 112, 15, c.purple),
    k.flatEllipse(200, 178, 100, 10, c.purpleShade),
    extra,
    roomLight(k, tone, 'M44 28H118L196 150H120Z'),
    lit ? floorLamp(k, 240, floorY, true, true) : '',
  ].join('');
}

export default {
  id: 'home',
  title: 'home (the living room)',
  tones: ['inside', 'morning', 'evening', 'night'],
  motion: { frames: 2, fps: 1 },
  draw: (k, tone) => livingRoom(k, tone),
};
