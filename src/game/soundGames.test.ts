import { describe, it, expect } from 'vitest';
import { buildSoundRound, soundWords, type SoundMode } from './soundGames';

const RUNS = 30;
const words = soundWords();

describe('Alphabet-corner listening games', () => {
  it('draw only real one-word Finnish words with a picture', () => {
    expect(words.length).toBeGreaterThan(80);
    for (const w of words) {
      expect(w.emoji).toBeTruthy();
      expect(w.fi).toMatch(/^[a-zåäö]+$/);
    }
  });

  it.each<SoundMode>(['first-letter', 'length', 'vowel'])('%s: the gap + answer spell the real word', (mode) => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildSoundRound(mode, words, 8);
      expect(round).toHaveLength(8);
      for (const q of round) {
        expect(q.before + q.answer + q.after).toBe(q.item.fi);
        expect(q.options).toContain(q.answer);
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.tip.length).toBeGreaterThan(0);
      }
    }
  });

  it('length: the choice is always one letter vs the same letter twice, mixing long and short', () => {
    let long = 0;
    let short = 0;
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildSoundRound('length', words, 8)) {
        const [a, b] = [...q.options].sort((x, y) => x.length - y.length);
        expect(b).toBe(a + a);
        if (q.answer.length === 2) long++;
        else short++;
      }
    }
    expect(long).toBeGreaterThan(0);
    expect(short).toBeGreaterThan(0);
  });

  it('vowel: the choice is a / ä, o / ö or u / y — never splitting a long vowel', () => {
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildSoundRound('vowel', words, 8)) {
        const opts = [...q.options].map((o) => o[0]).sort().join('');
        expect(['aä', 'oö', 'uy']).toContain(opts);
        expect(q.before.slice(-1)).not.toBe(q.answer[0]);
        expect(q.after[0]).not.toBe(q.answer[0]);
      }
    }
  });

  it('first-letter: offers a confusable letter when there is one (a → ä)', () => {
    const auto = words.filter((w) => w.fi === 'auto');
    const [q] = buildSoundRound('first-letter', auto, 1, 4);
    expect(q.answer).toBe('a');
    expect(q.options).toContain('ä');
  });
});
