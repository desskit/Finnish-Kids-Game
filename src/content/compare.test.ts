import { describe, expect, it } from 'vitest';
import { adjectives } from '.';
import { ITEM_BY_ID } from './lookup';
import {
  RANKINGS,
  comparable,
  comparisonSentence,
  comparisons,
  contests,
  degreeForm,
  superlativeSentence,
} from './compare';
import { lessons } from './lessons';
import { buildChooseRound, choosePoolsFor } from '../game/formChoice';
import { findSkill } from '../game/path';

const adj = (id: string) => adjectives.items.find((a) => a.id === id)!;

describe('comparing', () => {
  it('uses the sourced degree headwords', () => {
    expect([degreeForm(adj('big'), 'comparative'), degreeForm(adj('big'), 'superlative')]).toEqual(['isompi', 'isoin']);
    expect([degreeForm(adj('good'), 'comparative'), degreeForm(adj('good'), 'superlative')]).toEqual(['parempi', 'paras']);
    expect([degreeForm(adj('tall'), 'comparative'), degreeForm(adj('tall'), 'superlative')]).toEqual(['pidempi', 'pisin']);
    expect(comparable(adjectives.items).map((a) => a.fi).sort()).toEqual(
      ['hauska', 'hyvä', 'iso', 'nopea', 'nuori', 'pieni', 'pitkä', 'vahva', 'vanha'].sort(),
    );
  });

  it('ranks only real words, and every ranked adjective can be compared', () => {
    for (const r of RANKINGS) {
      for (const id of r.order.flat()) expect(ITEM_BY_ID[id], `${r.adj}: ${id}`).toBeTruthy();
      expect(adj(r.adj).degrees, r.adj).toBeTruthy();
      if (r.opposite) expect(adj(r.opposite).degrees, r.opposite).toBeTruthy();
    }
  });

  it('builds TRUE sentences only: the elephant is bigger than the mouse, never the reverse', () => {
    const all = comparisons(adjectives.items);
    const said = all.map((c) => comparisonSentence(c.adj, c.more, c.less));
    expect(said).toContain('Norsu on isompi kuin hiiri.');
    expect(said).toContain('Hiiri on pienempi kuin norsu.');
    expect(said).not.toContain('Hiiri on isompi kuin norsu.');
    expect(said).not.toContain('Norsu on pienempi kuin hiiri.');
    // Close neighbours are never compared (a cow vs a bear).
    expect(said.some((x) => /^Lehmä on isompi kuin karhu/.test(x!))).toBe(false);
    const tops = contests(adjectives.items).map((c) => superlativeSentence(c.adj, c.winner));
    expect(tops).toContain('Norsu on isoin.');
    expect(tops).not.toContain('Hiiri on isoin.');
  });

  it("the lesson's examples are true too", () => {
    const truth = new Set(comparisons(adjectives.items).map((c) => `${c.adj.id}:${c.more.id}>${c.less.id}`));
    const lesson = lessons.find((l) => l.id === 'comparing')!;
    for (const c of lesson.cards) {
      const rows = c.kind === 'examples' ? c.rows : c.kind === 'check' ? c.options.filter((o) => o.correct).map((o) => o.ref!) : [];
      for (const r of rows) if (r && 'compare' in r) expect(truth.has(`${r.compare}:${r.a}>${r.b}`), JSON.stringify(r)).toBe(true);
    }
  });

  it('plays full rounds in the unit, with only words met so far', () => {
    for (const [id, mode] of [['degrees', 'degree'], ['compare-two', 'compare'], ['the-most', 'superlative']] as const) {
      const step = findSkill(id)!.skill;
      const known = new Set(step.content.wordIds);
      const pools = choosePoolsFor(step.content.wordIds);
      for (let r = 0; r < 15; r++) {
        const round = buildChooseRound(mode, pools, 6, 3);
        expect(round.length, id).toBe(6);
        for (const q of round) {
          expect(q.options).toContain(q.answer);
          expect(new Set(q.options).size).toBe(q.options.length);
          for (const o of q.options.filter((x) => x !== q.answer)) expect(q.whyFor?.[o], `${id}: ${o}`).toBeTruthy();
          // Every noun in the sentence is a known word.
          for (const w of q.answer.replace(/[.?]/g, '').toLowerCase().split(' ')) {
            const item = Object.values(ITEM_BY_ID).find((i) => i.fi === w && i.topic !== 'adjectives');
            if (item && item.topic !== 'numbers') expect(known.has(item.id), `${id}: ${w}`).toBe(true);
          }
        }
      }
    }
  });
});
