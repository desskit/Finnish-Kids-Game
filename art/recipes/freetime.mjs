// Free-time words.

import { crescentPath, polar, pt, fmt } from '../kit.mjs';
import * as freetime from '../freetime.mjs';
import { drum } from '../lesson-icons.mjs';

export default [
  {
    id: 'football',
    title: 'soccer ball',
    draw: (k) => {
      const c = k.P;
      const [cx, cy, R] = [32, 32.6, 22];
      const r = R - 1.25;
      const out = [k.ground(32, 58.6, 16, 2.2), k.circle(cx, cy, R, c.white), k.flat(crescentPath(cx, cy, R, -10, 125, 0.2), c.silver)];
      const pent = [0, 1, 2, 3, 4].map((i) => polar(cx, cy, 6.8, -90 + 72 * i));
      for (let i = 0; i < 5; i++) {
        const a = -90 + 72 * i;
        const inner = polar(cx, cy, 13.4, a);
        const s1 = polar(cx, cy, 16.8, a - 21);
        const s2 = polar(cx, cy, 16.8, a + 21);
        const o1 = polar(cx, cy, r, a - 27);
        const o2 = polar(cx, cy, r, a + 27);
        out.push(k.line(`M${pt(pent[i])}L${pt(inner)}M${pt(s2)}L${pt(polar(cx, cy, 16.8, a + 51))}`, { sw: 1.5 }));
        out.push(k.path(`M${pt(inner)}L${pt(s2)}L${pt(o2)}A${fmt(r)} ${fmt(r)} 0 0 0 ${pt(o1)}L${pt(s1)}Z`, c.charcoal, { sw: 1.5 }));
      }
      out.push(k.poly(pent, 1.2, c.charcoal, { sw: 1.5 }));
      out.push(k.shineDot(30.2, 29.6, 1.1));
      out.push(k.circle(cx, cy, R, 'none'));
      return out.join('');
    },
  },
  { id: 'ball', title: 'ball (a beach ball, bouncing)', motion: { frames: 4, fps: 6 }, draw: freetime.ball },
  { id: 'bike', title: 'bike (wheels spinning)', motion: { frames: 2, fps: 6 }, draw: freetime.bike },
  { id: 'game', title: 'game (a controller)', draw: freetime.game },
  { id: 'guitar', title: 'guitar', motion: { frames: 2, fps: 2 }, draw: freetime.guitar },
  { id: 'piano', title: 'piano (a keyboard)', motion: { frames: 2, fps: 2 }, draw: freetime.piano },
  { id: 'music', title: 'music (two notes, bobbing)', motion: { frames: 2, fps: 2.5 }, draw: freetime.music },
  { id: 'movie', title: 'movie (a clapperboard)', motion: { frames: 2, fps: 2 }, draw: freetime.movie },
  { id: 'phone', title: 'phone', draw: freetime.phone },
  { id: 'computer', title: 'computer (a laptop)', draw: freetime.computer },
  { id: 'spoon', title: 'spoon', draw: freetime.spoon },
  { id: 'key', title: 'key', draw: freetime.key },
  { id: 'balloon', title: 'balloon (swaying)', motion: { frames: 2, fps: 1.5 }, draw: freetime.balloon },
  { id: 'candle', title: 'candle (flickering)', motion: { frames: 3, fps: 5 }, draw: freetime.candle },
  // Play: toys, instruments and games
  { id: 'teddy', title: 'teddy bear (a golden plush, tilting its head)', motion: { frames: 2, fps: 1.2 }, draw: freetime.teddy },
  { id: 'doll', title: 'doll (a rag doll, waving)', motion: { frames: 2, fps: 2 }, draw: freetime.doll },
  { id: 'toy', title: 'toy (a wooden pull-along train)', motion: { frames: 2, fps: 3 }, draw: freetime.toy },
  // the alphabet corner's beat is this drum too
  { id: 'drum', title: 'drum (the sticks taking turns)', motion: { frames: 2, fps: 4 }, draw: drum },
  { id: 'violin', title: 'violin (the bow drawing)', motion: { frames: 2, fps: 2 }, draw: freetime.violin },
  { id: 'card', title: 'card (three playing cards)', draw: freetime.cards },
  { id: 'chess', title: 'chess set (a white pawn steps)', motion: { frames: 2, fps: 1.2 }, draw: freetime.chess },
  { id: 'hockey', title: 'hockey puck (the stick, the puck sliding)', motion: { frames: 2, fps: 2.5 }, draw: freetime.hockey },
  // Money
  { id: 'euro', title: 'euro (a coin)', draw: freetime.euro },
];
