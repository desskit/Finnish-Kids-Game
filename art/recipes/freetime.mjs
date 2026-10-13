// Free-time words.

import { crescentPath, polar, pt, fmt } from '../kit.mjs';

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
];
