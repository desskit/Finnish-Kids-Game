// A party at home: the living room with bunting strung across it and
// balloons tied to the bookshelf and the sofa. The balloons bob.

import { livingRoom } from './home.mjs';

/** A balloon on its string, its knot at the bottom; `bob` lifts it. */
function balloon(k, x, y, color, bob) {
  const c = k.P;
  const yy = y - bob;
  return [
    k.line(`M${x} ${yy + 12}Q${x - 5} ${yy + 24} ${x + 1} ${y + 40}`, { color: c.charcoal, sw: 1.2 }),
    k.poly([[x - 2.4, yy + 13], [x + 2.4, yy + 13], [x, yy + 9.6]], 0.4, c[color]),
    k.ellipse(x, yy, 9.4, 11.6, c[color]),
    k.flat(`M${x + 3} ${yy - 9}C${x + 8} ${yy - 5} ${x + 8} ${yy + 5} ${x + 2} ${yy + 10}C${x + 5} ${yy + 4} ${x + 5} ${yy - 3} ${x + 3} ${yy - 9}Z`, c[`${color}Shade`]),
    k.shine(`M${x - 5.4} ${yy - 1}Q${x - 5} ${yy - 6.4} ${x - 1.4} ${yy - 8}`, 2),
  ].join('');
}

/** Bunting: a sagging string of little flags from wall to wall. */
function bunting(k) {
  const c = k.P;
  const colors = ['red', 'yellow', 'blue', 'green', 'pink', 'orange'];
  const n = 16;
  const flags = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const [x, y] = [4 + 392 * t, 8 + 64 * t * (1 - t)];
    flags.push(k.poly([[x - 9, y], [x + 9, y], [x, y + 15]], [0.8, 0.8, 1], c[colors[i % colors.length]]));
  }
  return k.line('M4 8Q200 40 396 8', { color: c.charcoal, sw: 1.4 }) + flags.join('');
}

export default {
  id: 'party',
  title: 'a party at home',
  tones: ['inside'],
  motion: { frames: 2, fps: 1.5 },
  draw(k, tone) {
    const up = k.frames > 1 && k.frame % 2 === 1;
    const balloons = [
      [150, 66, 'red', up ? 2.6 : 0],
      [174, 56, 'blue', up ? 0 : 2.6],
      [362, 56, 'green', up ? 2.6 : 0],
      [386, 68, 'yellow', up ? 0 : 2.6],
    ].map(([x, y, col, bob]) => balloon(k, x, y, col, bob));
    return livingRoom(k, tone, bunting(k) + balloons.join(''));
  },
};
