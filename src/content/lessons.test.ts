import { describe, it, expect } from 'vitest';
import { lessons, resolveRef, type LessonRef } from './lessons';
import { caseSegments, possessiveSegments, segmentsText, verbSegments } from './endings';
import { PERSONS } from './types';
import { ITEM_BY_ID } from './lookup';

function refsOf(): { lesson: string; ref: LessonRef }[] {
  const out: { lesson: string; ref: LessonRef }[] = [];
  for (const l of lessons) {
    for (const c of l.cards) {
      if (c.kind === 'examples') c.rows.forEach((ref) => out.push({ lesson: l.id, ref }));
      if (c.kind === 'check') c.options.forEach((o) => o.ref && out.push({ lesson: l.id, ref: o.ref }));
      if (c.kind === 'verbTable') {
        for (const p of PERSONS) {
          out.push({
            lesson: l.id,
            ref: { verb: c.verb, tense: c.tense, polarity: c.polarity, person: p.id },
          });
        }
      }
    }
  }
  return out;
}

describe('lessons', () => {
  it('have unique ids and 3–6 short cards each', () => {
    const ids = lessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of lessons) {
      expect(l.cards.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.cards.length, l.id).toBeLessThanOrEqual(6);
    }
  });

  it('resolve EVERY Finnish example to a looked-up form (no hand-typed Finnish)', () => {
    for (const { lesson, ref } of refsOf()) {
      const r = resolveRef(ref, 'Aino');
      expect(r, `${lesson}: ${JSON.stringify(ref)}`).not.toBeNull();
      expect(segmentsText(r!.segments).trim().length).toBeGreaterThan(0);
      // What is spoken is exactly what is shown.
      expect(r!.speak).toBe(segmentsText(r!.segments));
    }
  });

  it('only mark a SUFFIX of a looked-up form (the highlighter never builds a form)', () => {
    for (const { ref } of refsOf()) {
      if (!('word' in ref) || 'sentence' in ref || 'count' in ref || 'agree' in ref) continue;
      const item = ITEM_BY_ID[ref.word];
      const r = resolveRef(ref)!;
      const marked = r.segments.filter((s) => s.mark);
      expect(marked.length).toBeLessThanOrEqual(1);
      if (marked.length) expect(r.segments[r.segments.length - 1].mark, item.id).toBe(true);
    }
  });

  it('give every check card exactly one right answer', () => {
    for (const l of lessons) {
      for (const c of l.cards) {
        if (c.kind !== 'check') continue;
        expect(c.options.filter((o) => o.correct), l.id).toHaveLength(1);
        expect(c.explain.length).toBeGreaterThan(0);
      }
    }
  });

  it("fill the child's name into vetted phrase lines", () => {
    const r = resolveRef({ line: 'your-name', part: 'reply' }, 'Aino')!;
    expect(segmentsText(r.segments)).toBe('Nimeni on Aino.');
  });
});

describe('ending highlighter', () => {
  const split = (segs: { text: string; mark?: boolean }[]) =>
    segs.map((s) => (s.mark ? `[${s.text}]` : s.text)).join('');

  it('marks case endings, keeping vowel harmony', () => {
    expect(split(caseSegments('talossa', 'inessive'))).toBe('talo[ssa]');
    expect(split(caseSegments('metsässä', 'inessive'))).toBe('metsä[ssä]');
    expect(split(caseSegments('pöydällä', 'adessive'))).toBe('pöydä[llä]');
    expect(split(caseSegments('laatikkoon', 'illative'))).toBe('laatikk[oon]');
    expect(split(caseSegments('kirjan', 'genitive'))).toBe('kirja[n]');
  });

  it('marks the plural -i- along with the ending', () => {
    expect(split(caseSegments('laatikoissa', 'inessive', true))).toBe('laatiko[issa]');
    expect(split(caseSegments('kirjoja', 'partitive', true))).toBe('kirjo[ja]');
    expect(split(caseSegments('kirjat', 'nominative', true))).toBe('kirja[t]');
  });

  it('marks nothing it does not recognize — the plain form shows', () => {
    expect(split(caseSegments('kissa', 'nominative'))).toBe('kissa');
    expect(split(caseSegments('xyz', 'inessive'))).toBe('xyz');
  });

  it('marks verb person endings, the "not" verb, and the past -i-', () => {
    expect(split(verbSegments('syömme', 'present', 'positive', '1pl'))).toBe('syö[mme]');
    expect(split(verbSegments('en syö', 'present', 'negative', '1sg'))).toBe('[en] syö');
    expect(split(verbSegments('söin', 'past', 'positive', '1sg'))).toBe('sö[in]');
    expect(split(verbSegments('en syönyt', 'past', 'negative', '1sg'))).toBe('[en] syö[nyt]');
  });

  it('marks possessive suffixes', () => {
    expect(split(possessiveSegments('kirjani', '1sg'))).toBe('kirja[ni]');
    expect(split(possessiveSegments('kirjasi', '2sg'))).toBe('kirja[si]');
    expect(split(possessiveSegments('kirjansa', '3rd'))).toBe('kirja[nsa]');
  });
});
