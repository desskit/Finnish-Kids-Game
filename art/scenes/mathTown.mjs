// Math town: the banner over the math map (/math), one picture in each look.
// A road runs through a little town past the math stages' places — the apple
// tree, the scale on its table, the fox's market stall, the town clock, the
// rocket on its pad — with a flag in each stage's color, while a train puffs along the line
// behind. Day is a summer morning, night has the windows lit under the stars,
// pink is candy-colored. No sign, price or clock shows a digit.
//
// A UI scene like the hero (600 × 200): keep what matters in the middle, as
// narrow frames crop the sides. It moves gently: the clouds bob, the train's
// smoke puffs, the tree sways, the rocket's flame flickers, the stars twinkle.

import { roundPoly, starPoints } from '../kit.mjs';
import * as math from '../math.mjs';
import { oclock } from '../props.mjs';
import { cloud, crescentMoon } from './parts.mjs';
import { redHouse, sun } from './outdoors.mjs';

const W = 600;
const H = 200;

/** The stages' flags along the road, in their crowns' colors and order. */
const FLAGS = [
  [24, 'red'],
  [104, 'orange'],
  [172, 'green'],
  [252, 'purple'],
  [312, 'teal'],
  [372, 'pink'],
  [436, 'amber'],
  [566, 'blue'],
];

export default {
  id: 'math-town',
  title: 'math town (the math map’s banner)',
  w: W,
  h: H,
  tones: ['day', 'night', 'pink'],
  motion: { frames: 2, fps: 1.2 },
  draw(k, tone) {
    const night = tone === 'night';
    const out = [sky(k, tone)];
    if (tone === 'day') out.push(sun(k, 64, 38, 15));
    if (tone === 'pink') out.push(sparkles(k));
    if (!night) out.push(clouds(k));
    out.push(hills(k, tone), railway(k), houses(k, tone), meadow(k, tone), road(k, tone));
    // the stages' places
    out.push(k.g('translate(30 82) scale(1.2)', math.appleTree(k)));
    out.push(scaleTable(k, 216, 168));
    out.push(k.g('translate(318 104) scale(1)', math.card(k)));
    out.push(k.g('translate(512 94) scale(1.15)', math.rocketOnPad(k)));
    out.push(townClock(k, 470, 176));
    for (const [x, color] of FLAGS) out.push(flag(k, x, 186, color));
    if (night) out.push(nightLight(k));
    return out.join('');
  },
};

function sky(k, tone) {
  const c = k.P;
  const [top, low] = { day: ['skyDay', 'skyDayLow'], night: ['skyNight', 'skyNightLow'], pink: ['skyPink', 'skyPinkLow'] }[tone];
  return k.flat(`M0 0H${W}V${H}H0Z`, c[top]) + k.flat(`M0 84C140 80 300 82 420 86C500 88 560 86 600 84V200H0Z`, c[low]);
}

function clouds(k) {
  const dy = k.frames > 1 && k.frame % 2 ? k.px : 0;
  return cloud(k, 196, 30 - dy, 0.9) + cloud(k, 400, 22 + dy, 0.8) + cloud(k, 560, 38 - dy, 0.75);
}

/** Round hills far off: green, or pink and lavender. */
function hills(k, tone) {
  const c = k.P;
  const colors = tone === 'pink' ? ['purple', 'pink'] : tone === 'night' ? ['greenShade', 'green'] : ['hillFar', 'hill'];
  const hill = (x, r, color) => k.path(`M${x - r} 128A${r} ${r * 0.5} 0 0 1 ${x + r} 128Z`, c[color]);
  return [hill(60, 90, colors[0]), hill(250, 110, colors[1]), hill(440, 96, colors[0]), hill(590, 80, colors[1])].join('');
}

/** The railway behind the town, and the train puffing along it. */
function railway(k) {
  const c = k.P;
  const out = [k.rect(-4, 124, W + 8, 4, 0, c.woodShade), k.flat(`M-4 127H${W + 4}V129H-4Z`, c.charcoal)];
  for (let x = 2; x < W; x += 14) out.push(k.flat(`M${x} 128H${x + 6}V131H${x}Z`, c.woodShade));
  // two wagons and the engine at the front, going right
  out.push(k.g('translate(380 88) scale(0.6)', math.wagon(k)));
  out.push(k.g('translate(418 88) scale(0.6)', math.wagon(k)));
  out.push(k.g('translate(456 88) scale(0.6)', math.engine(k)));
  return out.join('');
}

/** A row of little houses, each its own color. */
function houses(k, tone) {
  const pink = tone === 'pink';
  const night = tone === 'night';
  const sets = [
    { wall: pink ? 'pink' : 'red', wallShade: pink ? 'pinkShade' : 'redShade' },
    { wall: pink ? 'purple' : 'yellow', wallShade: pink ? 'purpleShade' : 'yellowShade', roof: 'charcoal', roofShade: 'charcoalShade' },
    { wall: pink ? 'coral' : 'sky', wallShade: pink ? 'coralShade' : 'skyShade', roof: 'navy', roofShade: 'charcoal' },
  ];
  const spots = [
    [120, 0.42],
    [262, 0.46],
    [430, 0.4],
  ];
  return spots
    .map(([x, s], i) => k.g(`translate(${x} ${150 - 110 * s}) scale(${s})`, redHouse(k, 0, 110, 120, 66, '', { ...sets[i], ...(night ? { window: 'yellow' } : {}) })))
    .join('');
}

/** The ground the town stands on. */
function meadow(k, tone) {
  const c = k.P;
  const [ground, shade] = { day: ['grass', 'grassShade'], night: ['grassShade', 'greenShade'], pink: ['mint', 'mintShade'] }[tone];
  return k.path(`M-4 146C120 142 260 146 380 146C480 146 560 142 604 142V204H-4Z`, c[ground]) + k.flat(`M-4 192C160 186 360 190 604 186V204H-4Z`, c[shade], { opacity: 0.5 });
}

/** The road through town, from the left edge to the right. */
function road(k, tone) {
  const c = k.P;
  const color = tone === 'pink' ? 'cream' : 'path';
  return (
    k.path(`M-4 176C80 168 160 182 260 180C360 178 420 168 500 172C540 174 580 176 604 172V196C560 200 520 198 480 194C400 188 360 200 260 202C160 204 80 190 -4 198Z`, c[color]) +
    k.flat(`M-4 192C80 186 160 196 260 196C360 196 420 186 500 190C540 192 580 194 604 190V196C560 200 520 198 480 194C400 188 360 200 260 202C160 204 80 190 -4 198Z`, c[`${color}Shade`] ?? c.pathShade)
  );
}

/** A little table with the scale on it: one pan down, one up. */
function scaleTable(k, x, gy) {
  const c = k.P;
  return [
    k.rect(x - 24, gy - 26, 3.4, 26, 0.6, c.woodShade),
    k.rect(x + 20.6, gy - 26, 3.4, 26, 0.6, c.woodShade),
    k.rect(x - 28, gy - 30, 56, 5, 1.4, c.wood),
    k.g(`translate(${x - 18} ${gy - 70}) scale(0.56)`, math.scaleStand(k)),
    k.g(`rotate(-8 ${x} ${gy - 66})`, k.rect(x - 32, gy - 68, 64, 4.4, 2, c.wood)),
    k.g(`translate(${x - 44} ${gy - 66}) scale(0.38)`, math.scalePan(k)),
    k.g(`translate(${x + 20} ${gy - 75}) scale(0.38)`, math.scalePan(k)),
    k.circle(x - 32, gy - 49, 3.4, c.red),
    k.circle(x - 26, gy - 50, 3.4, c.red),
    k.circle(x + 32, gy - 57, 3.4, c.red),
  ].join('');
}

/** The town clock on its post: hands only, no numerals (half past four). */
function townClock(k, x, gy) {
  const c = k.P;
  return k.rect(x - 2, gy - 40, 4, 40, 0.8, c.charcoal) + k.g(`translate(${x - 14} ${gy - 66}) scale(0.44)`, oclock(k, 4, 30));
}

/** A stage's flag on its post, by the road. */
function flag(k, x, gy, color) {
  const c = k.P;
  const wave = k.frames > 1 && k.frame % 2 ? 1.6 : 0;
  return k.rect(x - 1.6, gy - 34, 3.2, 34, 0.8, c.charcoal) + k.path(`M${x + 1.6} ${gy - 33}L${x + 20} ${gy - 27 + wave}L${x + 1.6} ${gy - 20}Z`, c[color]) + k.circle(x, gy - 35, 2.2, c.yellow);
}

function sparkles(k) {
  const spots = [[40, 24], [150, 60], [300, 18], [470, 52], [580, 20]];
  return spots
    .map(([x, y], i) => {
      const dim = k.frames > 1 && (i + k.frame) % 2 === 1;
      return k.flat(roundPoly(starPoints(x, y, dim ? 3 : 5, 1.2, 4), 0.4), k.P.white);
    })
    .join('');
}

/** Night: a dark blue wash, then the stars and the moon. */
function nightLight(k) {
  const c = k.P;
  const out = [k.tint(c.navy, 0.3, W, H)];
  const stars = [[30, 20], [96, 56], [170, 26], [250, 54], [330, 16], [400, 60], [470, 24], [540, 58], [588, 18]];
  stars.forEach(([x, y], i) => {
    const R = i % 3 ? 3.2 : 4.6;
    const dim = k.frames > 1 && (i + k.frame) % 2 === 1;
    out.push(k.flat(roundPoly(starPoints(x, y, dim ? R * 0.6 : R, 1.3, 4), 0.4), c.starlight));
  });
  out.push(crescentMoon(k, 66, 40, 15));
  return out.join('');
}
