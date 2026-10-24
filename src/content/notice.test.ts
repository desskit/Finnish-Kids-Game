import { describe, it, expect } from 'vitest';
import { lessons, noticeCardIndexes, noticeLesson, NOTICE_MAX, type LessonCard } from './lessons';
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

  it('use no grammar terms', () => {
    const bad = course.flatMap((l) =>
      noticeLesson(l).cards.filter((c) => JARGON.test(textOf(c))).map((c) => `${l.id}: ${textOf(c).match(JARGON)?.[0]}`),
    );
    expect(bad).toEqual([]);
  });
});
