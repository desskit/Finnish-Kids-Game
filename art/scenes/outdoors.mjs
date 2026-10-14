// Pieces for the backdrops outdoors (the sky, clouds and trees are in
// parts.mjs): the sun, a Finnish red house, a birch, a wooden fence, the
// grass, a far forest line.

import { polar, pt } from '../kit.mjs';
import { pine } from '../nature.mjs';
import { SCENE_W } from './parts.mjs';

/** The sun with its rays (low suns, for morning and evening, are just the disc). */
export function sun(k, x, y, r = 16, rays = true, color = 'yellow') {
  const c = k.P;
  const out = [];
  if (rays) {
    for (let i = 0; i < 8; i++) {
      const a = i * 45 - 90;
      out.push(k.limb(`M${pt(polar(x, y, r + 4.5, a))}L${pt(polar(x, y, r + (i % 2 ? 9 : 11.5), a))}`, c.amber, 6.6));
    }
  }
  out.push(k.circle(x, y, r, c[color]));
  return out.join('');
}

/** The sky colors for a tone outdoors (the morning borrows the evening's pinks). */
export const skyTone = (tone) => (tone === 'morning' ? 'evening' : tone);

/** The light over everything: the morning gets a soft warm wash; the rest is parts.mjs's sceneLight. */
export function morningLight(k, tone) {
  return tone === 'morning' ? k.tint(k.P.yellow, 0.08, SCENE_W, 200) : '';
}

/** A red Finnish wooden house with white corners and window frames, a dark roof and a chimney; door at the front. */
export function redHouse(k, x, gy, w = 120, h = 66, smoke = '') {
  const c = k.P;
  const top = gy - h;
  const roofTop = top - 36;
  const win = (wx) => k.rect(wx, top + 16, 18, 20, 1, c.skyDay) + k.line(`M${wx + 9} ${top + 16}V${top + 36}M${wx} ${top + 26}H${wx + 18}`, { color: c.white, sw: 2 });
  return [
    k.rect(x + w - 34, roofTop - 6, 12, 26, 1, c.charcoal),
    smoke,
    k.rect(x, top, w, h, 1.4, c.red),
    k.flat(`M${x + w - 14} ${top + 2}H${x + w - 2}V${gy - 2}H${x + w - 14}Z`, c.redShade),
    k.rect(x - 2, top, 6, h, 0.6, c.white),
    k.rect(x + w - 4, top, 6, h, 0.6, c.white),
    k.poly([[x - 10, top + 2], [x + w / 2, roofTop], [x + w + 10, top + 2]], [1.6, 2, 1.6], c.charcoal),
    k.flat(`M${x - 6} ${top}L${x + w / 2} ${roofTop + 4}L${x + w / 2 + 6} ${roofTop + 8}L${x + 4} ${top}Z`, c.charcoalShade),
    win(x + 14),
    win(x + w - 32),
    k.rect(x + w / 2 - 11, gy - 34, 22, 34, 1.4, c.white),
    k.rect(x + w / 2 - 8, gy - 31, 16, 31, 1, c.blue),
    k.flatCircle(x + w / 2 + 4.6, gy - 15, 1.4, c.yellow),
    k.rect(x + w / 2 - 15, gy - 3, 30, 5, 1, c.grey),
  ].join('');
}

/** A birch: a white trunk with black marks, a light round crown. */
export function birch(k, x, gy, h = 92) {
  const c = k.P;
  const top = gy - h;
  return [
    k.rect(x - 4, top + 30, 8, h - 30, 1.6, c.white),
    k.flat(`M${x - 3} ${top + 46}H${x + 1}V${top + 49}H${x - 3}ZM${x} ${top + 64}H${x + 3}V${top + 67}H${x}ZM${x - 3} ${top + 80}H${x}V${top + 83}H${x - 3}Z`, c.charcoal),
    k.ellipse(x, top + 24, 26, 30, c.lime),
    k.flatEllipse(x + 8, top + 32, 14, 18, c.limeShade),
  ].join('');
}

/** A wooden fence along y = base, from x0 to x1. */
export function fence(k, x0, x1, base, h = 24, color = 'wood') {
  const c = k.P;
  const out = [k.rect(x0, base - h + 5, x1 - x0, 4, 0.6, c[color]), k.rect(x0, base - 10, x1 - x0, 4, 0.6, c[color])];
  for (let x = x0 + 2; x < x1 - 4; x += 14) out.push(k.poly([[x, base], [x, base - h + 4], [x + 3.5, base - h], [x + 7, base - h + 4], [x + 7, base]], 0.6, c[color]));
  return out.join('');
}

/** The grass from y downward, gently curved, with a darker band at the very front. */
export function grassland(k, y = 140, color = 'grass') {
  const c = k.P;
  return k.path(`M-4 ${y + 6}C80 ${y - 6} 160 ${y - 2} 220 ${y + 2}C290 ${y - 4} 350 ${y - 4} 404 ${y}V204H-4Z`, c[color]) + k.flat(`M-4 ${y + 36}C80 ${y + 28} 150 ${y + 32} 210 ${y + 36}C290 ${y + 30} 350 ${y + 28} 404 ${y + 32}V204H-4Z`, c[`${color}Shade`], { opacity: 0.5 });
}

/** A far line of forest along the horizon: pines of different heights. */
export function forestLine(k, y, x0 = 0, x1 = SCENE_W) {
  const out = [];
  for (let x = x0 + 6, i = 0; x < x1; x += 15, i++) out.push(pine(k, x, y, 30 + ((i * 7) % 4) * 6));
  return out.join('');
}

/** Wisps of smoke from a chimney top at (x, y), drifting up each frame. */
export function smoke(k, x, y) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 3 : 0;
  return [0, 1, 2]
    .map((i) => {
      const s = (i + f) % 3;
      return k.circle(x + s * 4, y - 6 - s * 9, 3.4 + s * 1.6, c.silver);
    })
    .join('');
}

