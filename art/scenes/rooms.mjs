// Pieces for the backdrops indoors: the wall and its wooden floor, a window
// onto the sky of the tone (with its curtains), a floor lamp that's lit in the
// evening and at night, and the light of the room for each tone.
//
// Indoor tones: 'inside' (daytime), 'morning' (the sun coming up in the
// window), 'evening' and 'night' (the lamps on).

import { fmt, pt, roundPoly, starPoints } from '../kit.mjs';
import { cloud, crescentMoon, SCENE_H, SCENE_W } from './parts.mjs';

/**
 * The wall (a darker band along its foot, under a wooden rail) and the floor
 * from y = floorY. `wall` names the wall's color and the band's.
 */
export function wallAndFloor(k, floorY = 150, wall = ['wall', 'wallShade']) {
  const c = k.P;
  const [paint, band] = wall;
  const planks = [];
  for (let y = floorY + 13; y < SCENE_H; y += 14) planks.push(`M0 ${y}H${SCENE_W}`);
  const joints = [];
  for (let row = 0, y = floorY; y < SCENE_H; row++, y += 14) {
    for (let x = row % 2 ? 40 : 96; x < SCENE_W; x += 128) joints.push(`M${x} ${y}V${Math.min(y + 13, SCENE_H)}`);
  }
  return [
    k.flat(`M0 0H${SCENE_W}V${floorY}H0Z`, c[paint]),
    k.flat(`M0 ${floorY - 34}H${SCENE_W}V${floorY}H0Z`, c[band]),
    k.rect(-4, floorY - 37, SCENE_W + 8, 4, 0, c.wood),
    k.flat(`M0 ${floorY}H${SCENE_W}V${SCENE_H}H0Z`, c.floor),
    k.line(planks.join('') + joints.join(''), { color: c.floorShade, sw: 1 }),
    k.line(`M0 ${floorY}H${SCENE_W}`),
  ].join('');
}

/** The sky colors a window shows in each indoor tone. */
const WINDOW_SKY = {
  inside: ['skyDay', 'skyDayLow'],
  morning: ['skyEvening', 'skyEveningLow'],
  evening: ['skyEvening', 'skyEveningLow'],
  night: ['skyNight', 'skyNightLow'],
};

/**
 * A window onto the sky of the tone: a cloud by day, the sun low in the
 * morning and the evening, the moon and stars at night (they twinkle). The
 * curtains are drawn back to either side. (x, y) is the glass's top left.
 */
export function roomWindow(k, x, y, w, h, tone, curtain = 'coral') {
  const c = k.P;
  const [sky, low] = WINDOW_SKY[tone] ?? WINDOW_SKY.inside;
  const out = [
    k.rect(x - 5, y - 5, w + 10, h + 10, 2, c.white),
    k.rect(x, y, w, h, 0.6, c[sky]),
    k.flat(`M${x} ${fmt(y + h * 0.66)}H${x + w}V${y + h}H${x}Z`, c[low]),
  ];
  if (tone === 'night') {
    out.push(crescentMoon(k, x + w * 0.72, y + h * 0.3, 8));
    const stars = [[0.2, 0.2], [0.36, 0.58], [0.84, 0.72], [0.12, 0.8]];
    stars.forEach(([fx, fy], i) => {
      const dim = k.frames > 1 && (i + k.frame) % 2 === 1;
      out.push(k.flat(roundPoly(starPoints(x + w * fx, y + h * fy, dim ? 2.2 : 3.4, 1, 4), 0.3), c.starlight));
    });
  } else if (tone === 'morning' || tone === 'evening') {
    out.push(k.circle(x + w * (tone === 'morning' ? 0.3 : 0.7), y + h * 0.84, 9, tone === 'morning' ? c.yellow : c.orange));
  } else {
    out.push(cloud(k, x + w * 0.62, y + h * 0.34, 0.5));
  }
  // treetops outside, along the bottom of the glass
  out.push(k.flat(`M${x} ${y + h}V${fmt(y + h - 8)}Q${fmt(x + w * 0.16)} ${fmt(y + h - 16)} ${fmt(x + w * 0.32)} ${fmt(y + h - 8)}Q${fmt(x + w * 0.5)} ${fmt(y + h - 14)} ${fmt(x + w * 0.7)} ${fmt(y + h - 7)}Q${fmt(x + w * 0.86)} ${fmt(y + h - 13)} ${x + w} ${fmt(y + h - 6)}V${y + h}Z`, tone === 'night' ? c.navy : c.green));
  // the bars, the sill
  out.push(k.rect(x + w / 2 - 1.8, y, 3.6, h, 0, c.white), k.rect(x, y + h / 2 - 1.8, w, 3.6, 0, c.white));
  out.push(k.rect(x - 9, y + h + 4, w + 18, 5, 1.6, c.white));
  // the curtains, drawn back, and their rod
  const side = (s) => {
    const edge = s < 0 ? x : x + w;
    const pts = [
      [edge - s * 18, y - 11],
      [edge + s * 7, y - 11],
      [edge - s * 1, y + h * 0.55],
      [edge + s * 3, y + h + 14],
      [edge - s * 18, y + h + 14],
    ];
    return k.poly(pts, [1, 2, 3, 2, 1], c[curtain]) + k.flat(`M${pt([edge - s * 15, y - 9])}L${pt([edge - s * 12, y - 9])}L${pt([edge - s * 12, y + h + 12])}L${pt([edge - s * 15, y + h + 12])}Z`, c[`${curtain}Shade`]);
  };
  out.push(side(-1), side(1));
  out.push(k.limb(`M${x - 24} ${y - 12}H${x + w + 24}`, c.wood, 4));
  return out.join('');
}

/**
 * A floor lamp standing on (x, floorY). Lit in the evening and at night;
 * `glowOnly` draws just the lit shade and its glow, laid over the room's light.
 */
export function floorLamp(k, x, gy, lit = false, glowOnly = false) {
  const c = k.P;
  const top = gy - 84;
  const shade = k.poly([[x - 12, top + 14], [x + 12, top + 14], [x + 8, top], [x - 8, top]], 1.6, lit ? c.yellow : c.cream);
  if (glowOnly) {
    const r = k.frames > 1 && k.frame % 2 ? 0.88 : 1;
    return k.flatCircle(x, top + 10, 44 * r, c.starlight, { opacity: 0.12 }) + k.flatCircle(x, top + 10, 26 * r, c.starlight, { opacity: 0.2 }) + shade;
  }
  return [k.limb(`M${x} ${gy - 3}V${top + 12}`, c.charcoal, 4.4), k.ellipse(x, gy - 2, 11, 3.4, c.charcoal), shade].join('');
}

/** The light in the room for a tone: warm in the evening, dark blue at night, a sunbeam in the morning. */
export function roomLight(k, tone, beam) {
  const c = k.P;
  if (tone === 'evening') return k.tint(c.orange, 0.1, SCENE_W, SCENE_H);
  if (tone === 'night') return k.tint(c.navy, 0.3, SCENE_W, SCENE_H);
  if (tone === 'morning' && beam) return k.flat(beam, c.starlight, { opacity: 0.22 });
  return '';
}
