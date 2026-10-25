import { describe, it, expect } from 'vitest';
import { lessons, noticeCardIndexes, noticeLesson, resolveRef, NOTICE_MAX, type LessonCard, type LessonRef } from './lessons';
import { PERSONS } from './types';
import { stageForLesson } from '../game/mathPath';

// A younger reader meets a course lesson as its "notice" cards: the pattern
// shown — a short line, examples to hear, one try — not the rule laid out.

/** Grammar words a 6–7-year-old shouldn't need (the full lesson may use them). */
const JARGON = /\b(partitive|genitive|nominative|accusative|adessive|inessive|elative|illative|allative|ablative|essive|translative|conjugat\w*|infinitive|suffix\w*|grammatical|declension|consonant gradation)\b/i;

const textOf = (c: LessonCard): string => {
  switch (c.kind) {
    case 'explain':
      return [c.title, c.text].join(' ');
    case 'check':
      return [c.title, c.question, c.explain].join(' ');
    default:
      return [c.title, c.text].join(' ');
  }
};

const course = lessons.filter((l) => !stageForLesson(l.id));

const refText = (ref: LessonRef | undefined): string =>
  (ref && resolveRef(ref)?.segments.map((s) => s.text).join('')) ?? '';
const words = (s: string): string[] => s.toLowerCase().match(/[a-zåäö]+/g) ?? [];
const PRONOUNS = new Set(['minä', 'sinä', 'tämä']);
/** The ending is on the cards, after a different letter: -a in hattua, -n in bussin. */
const CHECKED_BY_HAND = new Set(['negation-object:pyörää', 'total-object:auton']);
const fold = (w: string) => w.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/y/g, 'u');

/** Every Finnish form a card puts in front of the child, with its prose. */
const cardForms = (c: LessonCard): string => {
  switch (c.kind) {
    case 'explain':
      return c.text;
    case 'examples':
      return [c.text, ...c.rows.map((r) => `${resolveRef(r)?.base ?? ''} ${refText(r)}`)].join(' ');
    case 'verbTable':
      return [c.text, ...PERSONS.map((p) => refText({ verb: c.verb, tense: c.tense, polarity: c.polarity, person: p.id }))].join(' ');
    case 'pairs':
      return [c.text, ...c.ids.flatMap((id) => [refText({ line: id, part: 'prompt' }), refText({ line: id, part: 'reply' })])].join(' ');
    default:
      return '';
  }
};

describe("a younger reader's notice cards", () => {
  it(`are at most ${NOTICE_MAX} of the lesson's own cards, in order, with something to hear or try`, () => {
    for (const l of course) {
      const idx = noticeCardIndexes(l);
      expect(idx.length, l.id).toBeGreaterThan(0);
      expect(idx.length, l.id).toBeLessThanOrEqual(NOTICE_MAX);
      expect([...idx].sort((a, b) => a - b), l.id).toEqual(idx);
      for (const i of idx) expect(l.cards[i], `${l.id} #${i}`).toBeDefined();
      expect(noticeLesson(l).cards.some((c) => c.kind !== 'explain'), l.id).toBe(true);
    }
  });

  it('show what their check asks for', () => {
    // A notice check must be answerable from the cards beside it: each word
    // that sets the right answer apart from the wrong ones ends the way some
    // word on those cards ends (a/ä, o/ö, u/y counted the same).
    const bad = course.flatMap((l) => {
      const shown = noticeLesson(l).cards;
      const seen = shown.flatMap((c) => words(cardForms(c)));
      return shown.flatMap((c) => {
        if (c.kind !== 'check') return [];
        const said = (o: (typeof c.options)[number]) => o.text ?? refText(o.ref);
        const right = c.options.find((o) => o.correct);
        const wrong = new Set(c.options.filter((o) => !o.correct).flatMap((o) => words(said(o))));
        const telling = words(right ? said(right) : '').filter(
          (w) => w.length >= 4 && !wrong.has(w) && !PRONOUNS.has(w) && !CHECKED_BY_HAND.has(`${l.id}:${w}`),
        );
        return telling
          .filter((w) => !seen.some((s) => s === w || (s.length >= 3 && fold(s).slice(-2) === fold(w).slice(-2))))
          .map((w) => `${l.id}: "${w}" (${c.question})`);
      });
    });
    expect(bad).toEqual([]);
  });

  it('use no grammar terms', () => {
    const bad = course.flatMap((l) =>
      noticeLesson(l).cards.filter((c) => JARGON.test(textOf(c))).map((c) => `${l.id}: ${textOf(c).match(JARGON)?.[0]}`),
    );
    expect(bad).toEqual([]);
  });
});
