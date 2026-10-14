// The bus stop: across the street a block of flats and a little red house,
// on this side the stop's blue sign and its glass shelter with a bench, a
// birch. The clouds drift.

import { cloud, sceneSky } from './parts.mjs';
import { birch, sun } from './outdoors.mjs';

/** A block of flats: rows of windows, a door. */
function flats(k, x, gy, w, h) {
  const c = k.P;
  const out = [k.rect(x, gy - h, w, h, 1.4, c.cream), k.flat(`M${x + w - 12} ${gy - h + 2}H${x + w - 2}V${gy - 2}H${x + w - 12}Z`, c.creamShade)];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) out.push(k.rect(x + 10 + i * ((w - 26) / 4), gy - h + 10 + r * 20, 14, 12, 0.8, c.skyDay));
  out.push(k.rect(x + w / 2 - 9, gy - 22, 18, 22, 1, c.brown));
  out.push(k.rect(x - 4, gy - h - 6, w + 8, 7, 1, c.charcoal));
  return out.join('');
}

export default {
  id: 'bus-stop',
  title: 'bus stop',
  tones: ['day'],
  drift: (k) => cloud(k, 250, 34, 0.8) + cloud(k, 360, 18, 0.6),
  draw(k) {
    const c = k.P;
    const dashes = [];
    for (let x = 8; x < 400; x += 40) dashes.push(`M${x} 138H${x + 20}`);
    return [
      sceneSky(k, 'day'),
      sun(k, 176, 30, 12),
      k.moving ? '' : cloud(k, 250, 34, 0.8) + cloud(k, 360, 18, 0.6),
      flats(k, 26, 126, 124, 94),
      k.rect(176, 92, 60, 34, 1.4, c.red),
      k.poly([[170, 94], [206, 70], [242, 94]], 1.6, c.charcoal),
      k.rect(186, 102, 14, 14, 1, c.skyDay),
      k.rect(212, 104, 14, 22, 1, c.white),
      k.flat('M0 112H400V126H0Z', c.grass),
      birch(k, 268, 128, 82),
      // the street, the curb, the pavement we stand on
      k.flat('M0 126H400V152H0Z', c.grey),
      k.line(dashes.join(''), { color: c.white, sw: 2 }),
      k.rect(-4, 150, 408, 6, 0.6, c.silverShade),
      k.flat('M0 156H400V204H0Z', c.silver),
      k.line('M0 176H400M60 156V204M150 156V204M240 156V204M330 156V204', { color: c.silverShade, sw: 1 }),
      // the stop's sign
      k.limb('M66 196V110', c.grey, 4.4),
      k.rect(50, 86, 32, 28, 2, c.blue),
      k.rect(56, 92, 20, 13, 2, c.white),
      k.flat('M58 95H74V99H58Z', c.skyDay),
      k.flatCircle(60, 107, 1.8, c.charcoal),
      k.flatCircle(72, 107, 1.8, c.charcoal),
      // the shelter: its glass back, roof and bench
      k.rect(300, 112, 92, 58, 1.4, c.skyDayLow),
      k.line('M312 120L322 108M330 120L340 108', { color: c.white, sw: 2 }),
      k.limb('M300 170V108M392 170V108', c.charcoal, 4.4),
      k.rect(292, 100, 108, 9, 1.6, c.blue),
      k.rect(316, 150, 60, 6, 1.4, c.wood),
      k.limb('M322 156V168M370 156V168', c.charcoal, 3.8),
    ].join('');
  },
};
