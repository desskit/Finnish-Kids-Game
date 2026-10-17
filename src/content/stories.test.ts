import { describe, it, expect } from 'vitest';
import { CAST, stories, storyById, toneOf, type SceneTone } from './stories';
import { rivals } from './apart';
import { BACKDROPS, GLYPH_ART } from '../art/generated/manifest';
import { glyphKey, splitEmoji } from '../art/glyph';
import { questionBank } from '../game/storyQuiz';

describe('story content integrity', () => {
  it('ships a non-empty registry with unique ids and valid tiers', () => {
    expect(stories.length).toBeGreaterThan(0);
    const ids = stories.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of stories) expect([1, 2, 3, 4, 5].includes(s.tier)).toBe(true);
    for (const id of ids) expect(storyById[id].id).toBe(id);
  });

  it('keeps every story a small picture book: 3–4 pages of 1–3 short lines, each page a scene', () => {
    for (const s of stories) {
      expect(s.pages.length, s.id).toBeGreaterThanOrEqual(3);
      expect(s.pages.length, s.id).toBeLessThanOrEqual(4);
      for (const p of s.pages) {
        expect(p.scene.fg.length, s.id).toBeGreaterThan(0);
        // its setting is drawn, in its light
        expect(BACKDROPS[p.scene.setting] as readonly string[], `${s.id}: ${p.scene.setting}`).toContain(toneOf(p.scene));
        expect(p.lines.length, s.id).toBeGreaterThanOrEqual(1);
        expect(p.lines.length, s.id).toBeLessThanOrEqual(3);
        for (const l of p.lines) {
          expect(l.fi.trim(), s.id).toBeTruthy();
          expect(l.en.trim(), s.id).toBeTruthy();
          // Short lines only — this is a beginner's connected input.
          expect(l.fi.split(/\s+/).length, `${s.id}: ${l.fi}`).toBeLessThanOrEqual(7);
          if (l.by) expect(CAST[l.by], `${s.id}: ${l.by}`).toBeDefined();
        }
      }
      if (s.narrator) expect(CAST[s.narrator]).toBeDefined();
    }
  });

  it('gives every picture question exactly ONE correct option, all distinct and pictured', () => {
    for (const s of stories) {
      for (const q of s.questions) {
        expect(q.promptFi.trim()).toBeTruthy();
        expect(q.promptEn.trim()).toBeTruthy();
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.options.filter((o) => o.correct), `${s.id}: ${q.promptFi}`).toHaveLength(1);
        expect(new Set(q.options.map((o) => o.fi)).size).toBe(q.options.length);
        for (const o of q.options) {
          expect(o.fi.trim()).toBeTruthy();
          expect(o.en.trim()).toBeTruthy();
          expect(o.emoji).toBeTruthy();
        }
      }
    }
  });

  it('has a bank deep enough that a re-read can ask other questions', () => {
    for (const s of stories) expect(questionBank(s).length, s.id).toBeGreaterThanOrEqual(6);
  });

  it('spans more than one tier', () => {
    expect(new Set(stories.map((s) => s.tier)).size).toBeGreaterThan(1);
  });
});

// A page's picture has to agree with its words: a child looks at the picture
// first.
describe('story pages agree with their pictures', () => {
  it('pictures everyone who speaks on a page', () => {
    for (const s of stories) {
      s.pages.forEach((p, i) => {
        for (const l of p.lines) {
          if (l.by) expect(p.scene.fg, `${s.id} page ${i + 1}: ${CAST[l.by].nameEn} speaks`).toContain(CAST[l.by].emoji);
        }
      });
    }
  });

  it('greets the morning in the morning light, and says "it rains" in the rain', () => {
    const wants: [RegExp, SceneTone[]][] = [
      [/huomenta/i, ['morning']],
      [/hyvää iltaa/i, ['evening']],
      [/hyvää yötä/i, ['evening', 'night']],
      [/\bsataa\b/i, ['rain']],
    ];
    for (const s of stories) {
      s.pages.forEach((p, i) => {
        for (const l of p.lines) {
          for (const [words, tones] of wants) {
            if (words.test(l.fi)) expect(tones, `${s.id} page ${i + 1}: "${l.fi}"`).toContain(toneOf(p.scene));
          }
        }
      });
    }
  });

  it('gives every answer to a question its own picture, and no wrong one that looks like the right one', () => {
    const pictures = (emoji: string) =>
      splitEmoji(emoji).map((piece) => ('glyph' in piece ? (GLYPH_ART[glyphKey(piece.glyph)] ?? piece.glyph) : piece.text.trim()));
    for (const s of stories) {
      for (const q of s.questions) {
        const drawn = q.options.map((o) => pictures(o.emoji));
        expect(new Set(drawn.map((d) => d.join(' '))).size, `${s.id}: ${q.promptFi}`).toBe(q.options.length);
        const right = drawn[q.options.findIndex((o) => o.correct)];
        // The cast are people, not words: Leo and Eero are two different boys.
        const cast = new Set(Object.values(CAST).map((c) => GLYPH_ART[glyphKey(c.emoji)]));
        for (const wrong of drawn) {
          if (wrong !== right && wrong.length === 1 && right.length === 1 && !cast.has(right[0]) && !cast.has(wrong[0])) {
            expect(rivals(right[0], wrong[0]), `${s.id}: ${q.promptFi} (${right[0]} / ${wrong[0]})`).toBe(false);
          }
        }
      }
    }
  });
});
