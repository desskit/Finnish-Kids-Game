import { describe, it, expect } from 'vitest';
import { SPOKEN_FOR_LESSON, SPOKEN_NOTE, SPOKEN_PAIRS, spokenPairById } from './spoken';
import { PRONOUNS } from './pronouns';
import { verbForm } from './types';
import { reviewItems, verbs } from '.';
import { lessonById, withSpoken } from './lessons';
import { lookupWord } from './wordIndex';
import ledger from '../../data/finnish-wiktionary-checked.json';

// Spoken Finnish, to recognise: each written form is one the course teaches,
// each spoken form one Wiktionary lists as colloquial, and none is ever asked for.

const olla = verbs.items.find((v) => v.fi === 'olla')!;
const TAUGHT = new Set([
  ...Object.values(PRONOUNS).flatMap((t) => Object.values(t)),
  verbForm(olla, 'present', 'positive', '1sg'),
  verbForm(olla, 'present', 'positive', '2sg'),
]);

describe('two ways to say it', () => {
  it('pairs a written form the course teaches with its spoken one, checked against Wiktionary', () => {
    const checked = (ledger as { checked: Record<string, { fi: string }> }).checked;
    for (const p of SPOKEN_PAIRS) {
      expect(TAUGHT.has(p.written), p.written).toBe(true);
      expect(checked[`spoken:${p.id}`]?.fi, p.id).toBe(`${p.written} → ${p.spoken}`);
    }
  });

  it('is never an answer: no game word is a spoken form', () => {
    const spoken = new Set(SPOKEN_PAIRS.map((p) => p.spoken));
    expect(reviewItems.filter((i) => spoken.has(i.fi)).map((i) => i.fi)).toEqual([]);
  });

  it('shows on its lessons, last, and a tap in a story says what it is', () => {
    for (const [lessonId, ids] of Object.entries(SPOKEN_FOR_LESSON)) {
      const lesson = lessonById[lessonId];
      expect(lesson, lessonId).toBeDefined();
      for (const id of ids) expect(spokenPairById[id], id).toBeDefined();
      const last = withSpoken(lesson).cards.at(-1)!;
      expect(last.kind).toBe('spoken');
    }
    expect(withSpoken(lessonById.sounds).cards).toEqual(lessonById.sounds.cards);
    // A lesson's own note goes only on a lesson that shows the card.
    for (const id of Object.keys(SPOKEN_NOTE)) expect(SPOKEN_FOR_LESSON[id], id).toBeDefined();
    expect(withSpoken(lessonById.possessive).cards.at(-1)).toMatchObject({ text: SPOKEN_NOTE.possessive });
    expect(lookupWord('mä')).toEqual({ base: 'minä', en: 'I (the spoken form of minä)' });
    expect(lookupWord('Oon')?.base).toBe('olen');
  });
});
