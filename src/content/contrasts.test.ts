import { describe, it, expect } from 'vitest';
import { SLIPS, hasSlips, massCapable, slipForms } from './contrasts';
import { nounConstructions } from './constructions';
import { itemById } from './lookup';
import { formFor, suitsSlot, type Construction } from './types';
import { allSkills } from '../game/path';
import { caseFormOptions } from '../game/round';
import { themes } from '.';

const con = (id: string): Construction => nounConstructions.find((c) => c.id === id)!;
const item = (id: string) => itemById(id)!;

describe('the slips table', () => {
  it('only names real carriers, and covers every carrier', () => {
    const ids = new Set(nounConstructions.map((c) => c.id));
    for (const k of Object.keys(SLIPS)) expect(ids.has(k), k).toBe(true);
    for (const c of nounConstructions) expect(hasSlips(c), c.id).toBe(true);
  });

  it('never lists the carrier’s own case as a slip (same number)', () => {
    for (const [id, slips] of Object.entries(SLIPS)) {
      const c = con(id);
      for (const s of slips) {
        expect(s.case === c.case && (s.number ?? c.number) === c.number, `${id}: ${s.case}`).toBe(false);
      }
    }
  });
});

describe('slip forms', () => {
  it('are real forms of the word, never the right one', () => {
    for (const c of nounConstructions) {
      for (const it of themes.flatMap((t) => t.items)) {
        if (!formFor(it, c) || !suitsSlot(it, c)) continue;
        const right = formFor(it, c)!.toLowerCase();
        const slips = slipForms(it, c);
        expect(slips.map((f) => f.toLowerCase()), `${c.id}/${it.id}`).not.toContain(right);
        expect(new Set(slips).size).toBe(slips.length);
      }
    }
  });

  it('lead with the classic slip', () => {
    expect(slipForms(item('hat'), con('i-havent'))[0]).toBe('hattu'); // "Minulla ei ole hattu"
    expect(slipForms(item('pizza'), con('i-love'))[0]).toBe('pitsasta'); // the liking ending
    expect(slipForms(item('bus'), con('go-by'))[0]).toBe('bussiin'); // "Menen bussiin"
    expect(slipForms(item('tired'), con('i-am-not'))[0]).toBe('väsynyttä'); // "En ole väsynyttä"
    expect(slipForms(item('monday'), con('play-on-day'))[0]).toBe('maanantailla');
  });

  it('never call fine Finnish wrong: "some" words keep their -a', () => {
    expect(massCapable(item('water'))).toBe(true);
    expect(massCapable(item('bread'))).toBe(true);
    expect(massCapable(item('cat'))).toBe(false);
    // "Minulla on vettä" / "Näen vettä" are fine — never offered as wrong.
    expect(slipForms(item('water'), con('i-have'))).not.toContain('vettä');
    expect(slipForms(item('water'), con('i-see'))).not.toContain('vettä');
    expect(slipForms(item('cat'), con('i-have'))).toContain('kissaa');
    // "Katson elokuvan" (the whole film) is fine: watching never offers -n.
    expect(slipForms(item('movie'), con('i-watch'))).not.toContain('elokuvan');
    // "Tämä on isälle" (for Dad) is fine: never the owner slip.
    expect(slipForms(item('father'), con('owner-thing'))).not.toContain('isälle');
  });

  it('never call fine Finnish wrong: in / on where both work', () => {
    // Where YOU are: "Olen koululla" (at school) is fine.
    expect(slipForms(item('school'), con('i-am-in'))).not.toContain('koululla');
    expect(slipForms(item('school'), con('i-come-from-in'))).not.toContain('koululta');
    expect(slipForms(item('school'), con('i-go-into'))).not.toContain('koululle');
    // "Kissa on pihassa" is as fine as "pihalla".
    expect(slipForms(item('yard'), con('on-it'))).not.toContain('pihassa');
    // …but a box: in and on really differ — that contrast is the lesson.
    expect(slipForms(item('box'), con('in-it'))).toContain('laatikolla');
  });

  it('give "which verb?" rounds the other verbs’ endings first — only when they are wrong here', () => {
    expect(slipForms(item('cat'), con('i-love'), ['elative', 'genitive'])[0]).toBe('kissasta');
    // -n after "Katson" may be fine ("the whole film"), so it never jumps the queue.
    expect(slipForms(item('movie'), con('i-watch'), ['genitive'])).not.toContain('elokuvan');
  });

  it('offer verb carriers a finished verb, possessives the other owners', () => {
    expect(slipForms(item('play'), con('i-want-to'))).toEqual(expect.arrayContaining(['leikin', 'leikkii']));
    expect(slipForms(item('book'), con('this-is-mine'))).toEqual(expect.arrayContaining(['kirjasi', 'kirjansa', 'kirja']));
  });
});

describe('pick-the-ending rounds', () => {
  it('can ask about (nearly) every word a phrase step uses', () => {
    const thin: string[] = [];
    for (const { skill } of allSkills()) {
      if (!skill.activities?.includes('ending')) continue;
      const cons = nounConstructions.filter((c) => skill.content.constructionIds?.includes(c.id));
      const words = themes.flatMap((t) => t.items).filter((i) => !skill.content.wordIds || skill.content.wordIds.includes(i.id));
      let pairs = 0;
      let asked = 0;
      for (const c of cons) {
        for (const w of words) {
          if (!formFor(w, c) || !suitsSlot(w, c)) continue;
          pairs++;
          if (caseFormOptions(w, c, 4)) asked++;
        }
      }
      if (pairs > 0 && asked / pairs < 0.8) thin.push(`${skill.id}: ${asked}/${pairs}`);
    }
    expect(thin).toEqual([]);
  });

  it('show at most four tiles, one of them right', () => {
    const opts = caseFormOptions(item('box'), con('in-it'), 6)!;
    expect(opts.length).toBeLessThanOrEqual(4);
    expect(opts.filter((o) => o === 'laatikossa')).toHaveLength(1);
  });
});
