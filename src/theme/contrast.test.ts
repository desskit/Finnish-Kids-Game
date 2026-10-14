// @vitest-environment node
// The three looks stay readable. This reads each look's tokens from
// src/styles/global.css and checks the contrast (WCAG) of the colors that sit
// on one another: text needs 4.5 : 1, a focus ring or a box's edge 3 : 1. It
// also checks that every color on a screen comes from the tokens, that each
// unit's own color shows up on the cards in every look, and that the browser
// bar matches each look's sky.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { UNITS } from '../game/course';
import { THEMES, type ThemeId } from './theme';

const ROOT = join(__dirname, '..', '..');
const CSS = readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const SELECTORS: Record<ThemeId, string> = {
  day: ':root',
  night: ":root[data-theme='night']",
  pink: ":root[data-theme='pink']",
};

/** Where a look's block starts and ends in the stylesheet. */
function blockSpan(id: ThemeId): [number, number] {
  const start = CSS.indexOf(SELECTORS[id] + ' {');
  if (start < 0) throw new Error(`no ${SELECTORS[id]} block`);
  return [start, CSS.indexOf('}', start) + 1];
}

/** The custom properties a look's block sets. */
function block(id: ThemeId): Record<string, string> {
  const [start, end] = blockSpan(id);
  const out: Record<string, string> = {};
  for (const m of CSS.slice(start, end).matchAll(/--([\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const DAY = block('day');
const LOOKS: Record<ThemeId, Record<string, string>> = {
  day: DAY,
  night: { ...DAY, ...block('night') },
  pink: { ...DAY, ...block('pink') },
};

type RGB = [number, number, number];

function rgb(hex: string): RGB {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`not a #rrggbb color: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255) as RGB;
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

const luminance = (c: RGB) => {
  const [r, g, b] = c.map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

function ratio(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// color-mix(in oklab, …), as the browser mixes a unit's color.
function toOklab(c: RGB): RGB {
  const [r, g, b] = c.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, a, b]: RGB): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((c) => Math.min(1, Math.max(0, toGamma(c)))) as RGB;
}

function mixOklab(a: RGB, b: RGB, amountOfB: number): RGB {
  const [x, y] = [toOklab(a), toOklab(b)];
  return fromOklab(x.map((v, i) => v + (y[i] - v) * amountOfB) as RGB);
}

/** Text: [the text's token, the token it sits on]. */
const TEXT: [string, string][] = [
  ['ink', 'page'],
  ['ink', 'page-top'],
  ['ink', 'surface'],
  ['ink', 'surface-sunk'],
  ['ink', 'brand-soft'],
  ['ink', 'accent-soft'],
  ['ink', 'highlight'],
  ['ink', 'good-soft'],
  ['ink', 'bad-soft'],
  ['ink', 'warn-soft'],
  ['ink-soft', 'page'],
  ['ink-soft', 'page-top'],
  ['ink-soft', 'surface'],
  ['ink-soft', 'surface-sunk'],
  ['ink-soft', 'brand-soft'],
  ['ink-soft', 'accent-soft'],
  ['brand', 'page'],
  ['brand', 'surface'],
  ['brand', 'surface-sunk'],
  ['brand', 'brand-soft'],
  ['brand-ink', 'brand'],
  ['brand-2-ink', 'brand-2'],
  ['warm-ink', 'warm-1'],
  ['warm-ink', 'warm-2'],
  ['accent-ink', 'page'],
  ['accent-ink', 'surface'],
  ['good', 'surface'],
  ['good', 'surface-sunk'],
  ['good', 'good-soft'],
  ['good-ink', 'good'],
  ['bad', 'surface'],
  ['bad', 'bad-soft'],
  ['bad-ink', 'bad'],
  ['warn', 'surface'],
  ['warn', 'warn-soft'],
  ['warn', 'accent-soft'],
];

/** Rings and edges: a focus ring, a text box's edge, a switch. */
const UI: [string, string][] = [
  ['focus', 'page'],
  ['focus', 'surface'],
  ['focus', 'brand-soft'],
  ['field', 'surface'],
  ['knob', 'field'],
  ['info', 'surface-sunk'],
];

const color = (look: ThemeId, token: string) => {
  const value = LOOKS[look][token];
  if (value === undefined) throw new Error(`${look} has no --${token}`);
  return rgb(value);
};

function failures(look: ThemeId, pairs: [string, string][], min: number): string[] {
  return pairs.flatMap(([fg, bg]) => {
    const r = ratio(color(look, fg), color(look, bg));
    return r < min ? [`--${fg} on --${bg}: ${r.toFixed(2)}`] : [];
  });
}

describe('the looks', () => {
  it('Night and Pink only change tokens Day has', () => {
    for (const look of ['night', 'pink'] as const) {
      expect(Object.keys(block(look)).filter((t) => !(t in DAY))).toEqual([]);
    }
  });

  for (const look of THEMES.map((t) => t.id)) {
    describe(look, () => {
      it('text is easy to read (4.5 : 1)', () => {
        expect(failures(look, TEXT, 4.5)).toEqual([]);
      });

      it('rings and edges stand out (3 : 1)', () => {
        expect(failures(look, UI, 3)).toEqual([]);
      });

      it("every unit's color shows on the cards", () => {
        const tint = color(look, 'unit-tint');
        const amount = parseFloat(LOOKS[look]['unit-tint-amount']) / 100;
        const surface = color(look, 'surface');
        const faint = UNITS.flatMap((u) => {
          const r = ratio(mixOklab(rgb(u.accent), tint, amount), surface);
          return r < 2 ? [`${u.id} ${u.accent}: ${r.toFixed(2)}`] : [];
        });
        expect(faint).toEqual([]);
      });

      it("the browser bar is the look's sky", () => {
        expect(THEMES.find((t) => t.id === look)?.bar).toBe(LOOKS[look]['page-top']);
      });
    });
  }

  it('the pre-paint script in index.html knows the same bar colors', () => {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
    const bars = /var bar = (\{[^}]+\})/.exec(html)?.[1].replace(/'/g, '"').replace(/(\w+):/g, '"$1":');
    expect(bars && JSON.parse(bars)).toEqual(Object.fromEntries(THEMES.map((t) => [t.id, t.bar])));
  });

  it('every color on a screen comes from the tokens', () => {
    // Outside the three look blocks, the only literal colors are art colors:
    // a story stage's sky while its backdrop loads, and the number tile's
    // numeral, which sit on pictures and are the same in every look.
    const ART = /^\.story-stage(--\w+)?$|^\.art-tile__text$/;
    const spans = THEMES.map((t) => blockSpan(t.id)).sort((a, b) => a[0] - b[0]);
    let rest = CSS;
    for (const [start, end] of [...spans].reverse()) rest = rest.slice(0, start) + rest.slice(end);
    const stray = [...rest.matchAll(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(|\b(?:white|black)\b(?!-)/gi)].flatMap((m) => {
      const before = rest.slice(0, m.index);
      const selector = before.slice(Math.max(before.lastIndexOf('}'), before.lastIndexOf(';')) + 1, before.lastIndexOf('{')).trim();
      const rule = before.slice(before.lastIndexOf('}') + 1, before.lastIndexOf('{')).trim();
      return rule.split(',').every((s) => ART.test(s.trim())) ? [] : [`${selector || rule}: ${m[0]}`];
    });
    expect(stray).toEqual([]);
  });
});
