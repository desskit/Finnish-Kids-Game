// The app's own scenery, one picture in each look (src/theme): a cottage by a
// lake with the fox sitting on the shore. Day is a Finnish summer, the red
// cottage, birches and a dock. Night is a snowy winter night under the northern
// lights, the windows lit. Pink is a candy-colored world, the cottage pink,
// the birches in blossom, heart balloons and a rainbow.
//
// It's wider than a story backdrop (600 × 200, the same size of pixel) and a
// UI scene (UI_SCENES in art/index.mjs): the home screen, the player screen and
// the look picker show it; stories can't pick it. Keep what matters in the
// middle: narrow frames crop the sides, short ones the top of the sky.
// It moves gently: the clouds bob (they stay inside the frame), the fox's tail
// swings, the lake glints, the stars twinkle and the northern lights shimmer,
// the balloons bob.

import { heartPath, roundPoly, starPoints } from '../kit.mjs';
import { fox } from '../animals-sitting.mjs';
import { cloud, crescentMoon } from './parts.mjs';
import { birch, redHouse, smoke, sun } from './outdoors.mjs';

const W = 600;
const H = 200;

/** The house: where it stands and how big it is. */
const HOUSE = { x: 330, gy: 158, w: 120, h: 66 };

export default {
  id: 'hero',
  title: 'the cottage by the lake (the app’s scenery)',
  w: W,
  h: H,
  tones: ['day', 'night', 'pink'],
  motion: { frames: 2, fps: 1.2 },
  draw(k, tone) {
    const c = k.P;
    const night = tone === 'night';
    const pink = tone === 'pink';
    const out = [sky(k, tone)];
    if (tone === 'day') out.push(sun(k, 92, 46, 17));
    if (pink) out.push(rainbow(k), sparkles(k));
    if (!night) out.push(clouds(k));
    out.push(pink ? candyHills(k) : farForest(k));
    out.push(lake(k, tone));
    out.push(meadow(k, tone));
    out.push(dock(k));
    // the cottage and its birches
    const house = { day: {}, night: { window: 'yellow' }, pink: { wall: 'pink', wallShade: 'pinkShade', roof: 'purple', roofShade: 'purpleShade', door: 'coral' } }[tone];
    const crown = { day: 'lime', night: 'silver', pink: 'pink' }[tone];
    out.push(birch(k, 44, 170, 104, crown));
    out.push(redHouse(k, HOUSE.x, HOUSE.gy, HOUSE.w, HOUSE.h, night && k.moving ? smoke(k, HOUSE.x + HOUSE.w - 28, HOUSE.gy - HOUSE.h - 42) : '', house));
    if (night) out.push(snowOnRoof(k));
    out.push(birch(k, 506, 164, 106, crown), birch(k, 566, 168, 86, crown));
    if (night) out.push(snowman(k, 532, 182));
    // flowers in the grass, the fox on the shore
    if (!night) {
      const petals = pink ? ['white', 'coral', 'yellow'] : ['pink', 'yellow', 'white'];
      for (const [i, [x, y]] of [[26, 188], [96, 194], [166, 186], [330, 190], [418, 184], [462, 192], [588, 190]].entries()) {
        out.push(bloom(k, x, y, c[petals[i % 3]]));
      }
    }
    // the fox on the shore (in Pink, holding three heart balloons)
    if (pink) out.push(balloons(k));
    out.push(k.g('translate(232 118) scale(1)', fox(k)));
    if (night) out.push(nightLight(k));
    return out.join('');
  },
};

/** The sky: a flat color with a paler band near the horizon. */
function sky(k, tone) {
  const c = k.P;
  const [top, low] = { day: ['skyDay', 'skyDayLow'], night: ['skyNight', 'skyNightLow'], pink: ['skyPink', 'skyPinkLow'] }[tone];
  return k.flat(`M0 0H${W}V${H}H0Z`, c[top]) + k.flat(`M0 88C120 82 230 84 330 88C430 92 520 88 600 84V200H0Z`, c[low]);
}

/** The clouds, all well inside the frame; when the scene moves they bob a pixel. */
function clouds(k) {
  const dy = k.frames > 1 && k.frame % 2 ? k.px : 0;
  return cloud(k, 200, 34 - dy, 1) + cloud(k, 420, 26 + dy, 0.8) + cloud(k, 538, 42 - dy, 0.85);
}

/** The lake on the left, from the far shore to the near one. */
function lake(k, tone) {
  const c = k.P;
  const [water, shade] = tone === 'night' ? ['silver', 'silverShade'] : ['water', 'waterShade'];
  const out = [k.path('M-4 132C60 128 140 128 210 131C250 133 268 138 262 146C250 154 180 156 100 155C50 154 10 153 -4 152Z', c[water])];
  out.push(k.flat('M-4 147C60 149 150 151 230 149C246 148 254 146 258 143C258 150 240 153 200 154C140 156 60 155 -4 153Z', c[shade]));
  // glints on the water (they move along), or the lines in the ice
  const glints = tone === 'night' ? [[40, 139, 22], [130, 143, 16], [190, 137, 14]] : k.frame % 2 ? [[58, 138, 12], [150, 145, 10], [214, 136, 8]] : [[34, 141, 10], [118, 136, 12], [186, 146, 8]];
  for (const [x, y, w] of glints) out.push(k.flat(`M${x} ${y}H${x + w}V${y + 1.4}H${x}Z`, c.white));
  return out.join('');
}

/** The ground in front: summer grass, snow, or mint. */
function meadow(k, tone) {
  const c = k.P;
  const [ground, shade] = { day: ['grass', 'grassShade'], night: ['white', 'silverShade'], pink: ['mint', 'mintShade'] }[tone];
  return (
    k.path('M262 150C300 146 360 150 420 152C480 154 540 150 604 148V204H-4V160C60 162 150 166 220 160C246 158 256 154 262 150Z', c[ground]) +
    k.flat('M-4 184C80 178 170 182 260 186C350 190 450 182 604 180V204H-4Z', c[shade], { opacity: 0.5 })
  );
}

/** A little wooden dock from the shore out into the lake, on its posts. */
function dock(k) {
  const c = k.P;
  const posts = [140, 170, 200].map((x) => k.rect(x, 150, 4.4, 7, 0.6, c.woodShade)).join('');
  return posts + k.poly([[134, 145], [240, 145], [244, 151], [134, 151]], 0.8, c.wood);
}

/** The forest on the far shore: pointed treetops, small with distance. */
function farForest(k) {
  const c = k.P;
  let top = '';
  for (let x = -6, i = 0; x < W + 12; x += 13, i++) {
    const h = 16 + ((i * 7) % 5) * 4;
    top += `L${x + 6.5} ${132 - h}L${x + 13} 127`;
  }
  return k.path(`M-6 136L-6 127${top}V136Z`, c.green) + k.flat(`M-6 133H${W + 14}V137H-6Z`, c.greenShade);
}

/** A flower in the grass, a little bigger than the backdrops' (the scene is often shown small). */
function bloom(k, x, y, color) {
  return k.circle(x, y, 3.8, color, { sw: 1.5 }) + k.flatCircle(x, y, 1.4, k.P.amber);
}

/** Pink's far hills: round, in pink and lavender, each shaded on its right. */
function candyHills(k) {
  const c = k.P;
  const hill = (x, r, color) =>
    k.path(`M${x - r} 138A${r} ${r * 0.6} 0 0 1 ${x + r} 138Z`, c[color]) +
    k.flat(`M${x + r * 0.25} 138A${r * 0.75} ${r * 0.5} 0 0 1 ${x + r} 138Z`, c[`${color}Shade`]);
  return [hill(70, 64, 'purple'), hill(196, 72, 'pink'), hill(470, 90, 'purple'), hill(590, 60, 'pink')].join('');
}

/** A rainbow behind the hills on the left. */
function rainbow(k) {
  const c = k.P;
  const bands = ['coral', 'orange', 'yellow', 'lime', 'sky', 'purple'];
  const [cx, cy, r0, t] = [150, 150, 96, 5.6];
  return bands
    .map((b, i) => {
      const R = r0 - i * t;
      const r = R - t;
      return k.flat(`M${cx - R} ${cy}A${R} ${R} 0 0 1 ${cx + R} ${cy}H${cx + r}A${r} ${r} 0 0 0 ${cx - r} ${cy}Z`, c[b]);
    })
    .join('');
}

/** Little four-point sparkles in Pink's sky; they twinkle (half of them shrink in turn). */
function sparkles(k) {
  const spots = [[44, 30], [168, 24], [300, 18], [352, 62], [478, 20], [588, 70]];
  return spots
    .map(([x, y], i) => {
      const dim = k.frames > 1 && (i + k.frame) % 2 === 1;
      return k.flat(roundPoly(starPoints(x, y, dim ? 3 : 5, 1.2, 4), 0.4), k.P.white);
    })
    .join('');
}

/** Three heart balloons, their strings down to the fox's paws; they bob. */
function balloons(k) {
  const c = k.P;
  const bob = k.frames > 1 && k.frame % 2 ? -2.6 : 0;
  return [
    [236, 64, 'coral'],
    [264, 46, 'pinkShade'],
    [292, 66, 'purple'],
  ]
    .map(([x, y, color], i) => {
      const dy = i === 1 ? -bob : bob;
      return k.line(`M${x} ${y + 10 + dy}Q${x + (264 - x) * 0.2} ${y + 50} 262 160`, { color: c.charcoal, sw: 1.4 }) + k.path(heartPath(x, y + dy - 12, 25, 22), c[color]);
    })
    .join('');
}

/** Snow lying on the cottage's roof. */
function snowOnRoof(k) {
  const c = k.P;
  const { x, gy, w, h } = HOUSE;
  const top = gy - h;
  const roofTop = top - 36;
  return k.path(`M${x - 11} ${top + 1}L${x + w / 2} ${roofTop - 1}L${x + w + 11} ${top + 1}L${x + w + 6} ${top + 5}L${x + w / 2} ${roofTop + 7}L${x - 6} ${top + 5}Z`, c.white);
}

/** A snowman with a carrot nose and stick arms. */
function snowman(k, x, gy) {
  const c = k.P;
  return [
    k.limb(`M${x - 10} ${gy - 26}L${x - 22} ${gy - 34}`, c.brown, 3.8),
    k.limb(`M${x + 10} ${gy - 26}L${x + 22} ${gy - 36}`, c.brown, 3.8),
    k.circle(x, gy - 13, 14, c.white),
    k.circle(x, gy - 34, 10, c.white),
    k.flatCircle(x - 3.6, gy - 36, 1.4, c.ink),
    k.flatCircle(x + 3.6, gy - 36, 1.4, c.ink),
    k.path(`M${x} ${gy - 33}L${x + 9} ${gy - 31}L${x} ${gy - 30}Z`, c.orange),
    k.rect(x - 9, gy - 47, 18, 4, 1, c.red),
  ].join('');
}

/** The night: dark blue light over everything, then the stars, the moon, the northern lights and the lit windows. */
function nightLight(k) {
  const c = k.P;
  const out = [k.tint(c.navy, 0.3, W, H)];
  const stars = [[30, 22], [74, 70], [150, 30], [196, 62], [262, 18], [320, 46], [372, 74], [412, 20], [456, 54], [530, 24], [588, 62], [240, 84]];
  stars.forEach(([x, y], i) => {
    const R = i % 3 ? 3.4 : 4.8;
    const dim = k.frames > 1 && (i + k.frame) % 2 === 1;
    out.push(k.flat(roundPoly(starPoints(x, y, dim ? R * 0.6 : R, 1.3, 4), 0.4), c.starlight));
  });
  out.push(aurora(k));
  out.push(crescentMoon(k, 92, 44, 16));
  // the windows glow
  const { x, gy, w, h } = HOUSE;
  const top = gy - h;
  for (const wx of [x + 14, x + w - 32]) {
    out.push(k.flatCircle(wx + 9, top + 26, 20, c.starlight, { opacity: 0.12 }));
    out.push(k.flat(`M${wx + 1} ${top + 17}H${wx + 17}V${top + 35}H${wx + 1}Z`, c.yellow));
    out.push(k.line(`M${wx + 9} ${top + 16}V${top + 36}M${wx} ${top + 26}H${wx + 18}`, { color: c.white, sw: 2 }));
  }
  return out.join('');
}

/**
 * The northern lights: soft curtains across the sky, each tapering out to
 * nothing at both ends. A wavy top and a bright lower edge, brighter in the
 * middle, with fainter streaks down through it that move along to shimmer.
 */
function aurora(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 2 : 0;
  const out = [];
  const curtain = (x0, x1, lift, tall, color, opacity) => {
    // 0 at the ends, 1 in the middle
    const taper = (x) => Math.max(0, Math.sin((Math.PI * (x - x0)) / (x1 - x0))) ** 0.8;
    const edge = (x) => 78 - lift - (x - x0) * 0.08 + Math.sin(x / 40) * 7;
    const height = (x) => taper(x) * (tall + Math.sin(x / 23 + 1) * 9 + Math.sin(x / 9) * 3);
    const xs = [];
    for (let x = x0; x < x1; x += 6) xs.push(x);
    xs.push(x1);
    const band = (upper, lower) => `M${xs.map((x) => `${x} ${upper(x)}`).join('L')}L${[...xs].reverse().map((x) => `${x} ${lower(x)}`).join('L')}Z`;
    // the curtain, and its middle again on top, so it fades toward the ends
    out.push(k.flat(band((x) => edge(x) - height(x), edge), c[color], { opacity: opacity * 0.6 }));
    out.push(k.flat(band((x) => edge(x) - height(x) * taper(x), edge), c[color], { opacity: opacity * 0.6 }));
    // streaks down through it, moving along, fainter toward the ends
    for (let x = x0 + 10 + f * 5; x < x1 - 10; x += 13) {
      const t = taper(x + 1);
      if (t > 0.3) out.push(k.flat(`M${x} ${edge(x + 1) - height(x + 1) + 2}H${x + 3}V${edge(x + 1)}H${x}Z`, c[color], { opacity: opacity * 0.7 * t }));
    }
    // the bright lower edge, thinning out with the curtain
    out.push(k.flat(band((x) => edge(x) - 1 - 3 * taper(x), (x) => edge(x) + taper(x)), c.lime, { opacity: opacity * 1.5 }));
  };
  curtain(236, 590, 22, 22, 'teal', 0.18);
  curtain(132, 566, 0, 30, 'green', 0.24);
  return out.join('');
}

