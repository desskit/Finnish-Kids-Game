// Pieces every backdrop is built from: the sky and its light for each tone,
// clouds, trees, bushes, flowers, a lamp post, the moon. Backdrops are drawn
// on a 400×200 canvas with a slightly finer outline than the pictures, so
// the cast in front of them stands out.

import { crescentPath, fmt, polar, pt, scallops, starPoints, roundPoly } from '../kit.mjs';

export const SCENE_W = 400;
export const SCENE_H = 200;
/** Scenery outline width. */
export const SW = 2;

const SKY = {
  day: ['skyDay', 'skyDayLow'],
  evening: ['skyEvening', 'skyEveningLow'],
  night: ['skyNight', 'skyNightLow'],
  rain: ['skyRain', 'skyDayLow'],
  snow: ['skyDay', 'skyDayLow'],
};

/** The sky for a tone: a flat color with a paler band near the horizon. */
export function sceneSky(k, tone) {
  const [top, low] = SKY[tone] ?? SKY.day;
  return k.flat(`M0 0H${SCENE_W}V${SCENE_H}H0Z`, k.P[top]) + k.flat('M0 86C90 80 170 82 250 86C320 89 370 86 400 82V200H0Z', k.P[low]);
}

/** The light over everything for a tone: warm in the evening, dark blue and starry at night. */
export function sceneLight(k, tone) {
  const c = k.P;
  if (tone === 'evening') return k.flat(`M0 0H${SCENE_W}V${SCENE_H}H0Z`, c.orange, { opacity: 0.12 });
  if (tone === 'night') {
    const stars = [[40, 30], [120, 58], [170, 22], [214, 64], [262, 26], [390, 70], [76, 76], [236, 40]]
      .map(([x, y], i) => k.flat(roundPoly(starPoints(x, y, i % 3 ? 3.6 : 5, 1.3, 4), 0.4), c.starlight))
      .join('');
    return k.flat(`M0 0H${SCENE_W}V${SCENE_H}H0Z`, c.navy, { opacity: 0.34 }) + stars;
  }
  return '';
}

/** A crescent moon (lit side on the left). */
export function crescentMoon(k, cx, cy, r) {
  const c = k.P;
  // the dark circle that bites the moon: offset up-right
  const [bx, by, br] = [cx + r * 0.5, cy - r * 0.32, r * 0.86];
  const d = Math.hypot(bx - cx, by - cy);
  const a = (r * r - br * br + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r * r - a * a));
  const [mx, my] = [cx + (a * (bx - cx)) / d, cy + (a * (by - cy)) / d];
  const p1 = [mx + (h * (by - cy)) / d, my - (h * (bx - cx)) / d];
  const p2 = [mx - (h * (by - cy)) / d, my + (h * (bx - cx)) / d];
  const moon = `M${pt(p1)}A${fmt(r)} ${fmt(r)} 0 1 0 ${pt(p2)}A${fmt(br)} ${fmt(br)} 0 0 1 ${pt(p1)}Z`;
  return k.path(moon, c.starlight, { sw: SW });
}

/** A puffy cloud centred on (x, y); `s` sizes it (outlines stay the same width). */
export function cloud(k, x, y, s = 1) {
  const P = (dx, dy) => pt([x + dx * s, y + dy * s]);
  const r = (n) => fmt(n * s);
  return k.path(
    `M${P(-30, 10)}H${fmt(x + 30 * s)}A${r(9)} ${r(9)} 0 0 0 ${P(24, -4)}A${r(12)} ${r(12)} 0 0 0 ${P(4, -12)}A${r(14)} ${r(14)} 0 0 0 ${P(-20, -4)}A${r(10)} ${r(10)} 0 0 0 ${P(-30, 10)}Z`,
    k.P.white,
    { sw: SW },
  );
}

/** A round leafy tree standing on (x, groundY). */
export function tree(k, x, gy, s = 1) {
  const c = k.P;
  const cy = gy - 44 * s;
  const R = 22 * s;
  const canopy = `M${pt(polar(x, cy, R, -90))}${scallops(x, cy, R, -90, 270, 9, 1.1)}Z`;
  return [
    k.rect(x - 4.5 * s, gy - 30 * s, 9 * s, 31 * s, 2 * s, c.wood, { sw: SW }),
    k.path(canopy, c.green, { sw: SW }),
    k.flat(crescentPath(x, cy, R - 1, -20, 110, 0.22), c.greenShade),
    k.shine(`M${pt(polar(x, cy, R * 0.66, 200))}A${fmt(R * 0.66)} ${fmt(R * 0.66)} 0 0 1 ${pt(polar(x, cy, R * 0.66, 240))}`, 2.2),
  ].join('');
}

/** A low round bush sitting on (x, groundY). */
export function bush(k, x, gy, s = 1) {
  const R = 15 * s;
  return k.path(`M${pt([x - R, gy])}${scallops(x, gy, R, 180, 360, 5, 1.1)}Z`, k.P.green, { sw: SW });
}

/** A small flower in the grass. */
export function flower(k, x, y, color) {
  return k.circle(x, y, 2.8, color, { sw: 1.5 }) + k.flatCircle(x, y, 1, k.P.amber);
}

/**
 * A park lamp post on (x, groundY). Lit at night; `glowOnly` draws just the
 * lit lamp and its glow (laid on top of the night light).
 */
export function lampPost(k, x, gy, lit = false, glowOnly = false) {
  const c = k.P;
  const top = gy - 64;
  const head = [
    k.poly([[x - 6.5, top + 1], [x + 6.5, top + 1], [x + 5, top - 10], [x - 5, top - 10]], 1.4, lit ? c.yellow : c.cream, { sw: SW }),
    k.poly([[x - 8, top - 9], [x + 8, top - 9], [x, top - 15]], 1.4, c.charcoal, { sw: SW }),
  ].join('');
  if (glowOnly) return k.flatCircle(x, top - 4, 30, c.starlight, { opacity: 0.12 }) + k.flatCircle(x, top - 4, 18, c.starlight, { opacity: 0.2 }) + head;
  return k.limb(`M${pt([x, gy])}L${pt([x, top])}`, c.charcoal, 7) + k.rect(x - 4.5, gy - 3, 9, 4, 1.5, c.charcoal, { sw: SW }) + head;
}
