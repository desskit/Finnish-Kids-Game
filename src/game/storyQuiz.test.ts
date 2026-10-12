import { describe, it, expect } from 'vitest';
import { stories, storyById } from '../content/stories';
import { ORDER_CARDS, drawQuiz, questionBank, type QuizItem } from './storyQuiz';

const RUNS = 30;
const ids = (qs: QuizItem[]) => qs.map((q) => q.id);

describe('a story\'s question bank', () => {
  it('holds its picture questions, its statements, who-said-it lines and an order question', () => {
    const s = storyById['no-hat'];
    const bank = questionBank(s);
    expect(bank.filter((q) => q.kind === 'choice')).toHaveLength(s.questions.length);
    expect(bank.filter((q) => q.kind === 'truefalse')).toHaveLength(s.facts.length);
    expect(bank.filter((q) => q.kind === 'order')).toHaveLength(1);
    expect(bank.some((q) => q.kind === 'who')).toBe(true);
    expect(new Set(ids(bank)).size).toBe(bank.length);
  });

  it('never asks "who says" a line that names its own speaker, or one two people say', () => {
    for (const s of stories) {
      for (const q of questionBank(s)) {
        if (q.kind !== 'who') continue;
        const text = q.line.fi.toLowerCase().replace(/[.,!?…]/g, '');
        expect(text.split(/\s+/), `${s.id}: ${q.line.fi}`).not.toContain(q.speaker);
        expect(q.options).toContain(q.speaker);
        expect(new Set(q.options).size).toBe(q.options.length);
        const others = s.pages.flatMap((p) => p.lines).filter((l) => l.by && l.by !== q.speaker);
        for (const o of others) expect(o.fi, `${s.id}: ${q.line.fi}`).not.toBe(q.line.fi);
      }
    }
    // "Hyvää, kiitos!" is said by both Aino and Eero in the first story: not asked.
    const hello = questionBank(storyById['hello-eero']).filter((q) => q.kind === 'who');
    expect(hello.map((q) => (q.kind === 'who' ? q.line.fi : ''))).not.toContain('Hyvää, kiitos!');
  });

  it('builds order cards from each page, every card a different line', () => {
    for (const s of stories) {
      const order = questionBank(s).find((q) => q.kind === 'order');
      expect(order, s.id).toBeDefined();
      if (order?.kind !== 'order') continue;
      expect(order.cards.map((c) => c.page)).toEqual(s.pages.map((_, i) => i));
      expect(new Set(order.cards.map((c) => c.line.fi)).size, s.id).toBe(order.cards.length);
    }
  });
});

describe('drawing a read\'s questions', () => {
  it('asks four of mixed kinds — a picture, true or false, who said it, and the order last', () => {
    for (let r = 0; r < RUNS; r++) {
      const quiz = drawQuiz(storyById['what-we-like'], 4);
      expect(quiz).toHaveLength(4);
      expect(new Set(quiz.map((q) => q.kind))).toEqual(new Set(['choice', 'truefalse', 'who', 'order']));
      expect(quiz[quiz.length - 1].kind).toBe('order');
    }
  });

  it('keeps one right option per picture question, and shows three pages in story order', () => {
    for (const s of stories) {
      for (const q of drawQuiz(s, 4)) {
        if (q.kind === 'choice') expect(q.options.filter((o) => o.correct)).toHaveLength(1);
        if (q.kind === 'order') {
          expect(q.cards).toHaveLength(ORDER_CARDS);
          const pages = q.cards.map((c) => c.page);
          expect(pages).toEqual([...pages].sort((a, b) => a - b));
        }
      }
    }
  });

  it('asks other questions on a re-read whenever the bank has them', () => {
    for (const s of stories) {
      for (let r = 0; r < 5; r++) {
        const first = drawQuiz(s, 4);
        const again = drawQuiz(s, 4, ids(first));
        const repeats = ids(again).filter((id) => ids(first).includes(id));
        const fresh = questionBank(s).length - 4;
        expect(repeats.length, s.id).toBeLessThanOrEqual(Math.max(0, 4 - fresh));
      }
    }
  });

  it('a "Muistatko?" revisit asks two, never an order question, preferring ones never asked', () => {
    const s = storyById['sick-day'];
    const seen = ids(drawQuiz(s, 4));
    for (let r = 0; r < RUNS; r++) {
      const quiz = drawQuiz(s, 2, seen);
      expect(quiz).toHaveLength(2);
      expect(quiz.some((q) => q.kind === 'order')).toBe(false);
      for (const q of quiz) expect(seen).not.toContain(q.id);
    }
  });
});
