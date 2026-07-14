import { describe, it, expect } from 'vitest';
import { segmentFinnish, alignSounds, scorePronunciation, band } from './phonemes';

const letters = (t: string) => segmentFinnish(t).map((s) => s.text);
const statuses = (target: string, heard: string) =>
  alignSounds(segmentFinnish(target), segmentFinnish(heard)).sounds.map((s) => s.status);

describe('segmentFinnish', () => {
  it('splits a word into single sounds', () => {
    expect(letters('kissa')).toEqual(['k', 'i', 'ss', 'a']);
    expect(letters('koira')).toEqual(['k', 'o', 'i', 'r', 'a']);
  });

  it('treats a doubled letter as ONE long sound', () => {
    expect(letters('kukka')).toEqual(['k', 'u', 'kk', 'a']);
    expect(letters('tuuli')).toEqual(['t', 'uu', 'l', 'i']);
    expect(segmentFinnish('kukka').find((s) => s.text === 'kk')!.long).toBe(true);
    expect(segmentFinnish('kuka').every((s) => !s.long)).toBe(true);
  });

  it('strips punctuation and tracks word boundaries for phrases', () => {
    const s = segmentFinnish('Tämä on kissa.');
    expect(s.map((x) => x.text).join('')).toBe('tämäonkissa');
    expect(new Set(s.map((x) => x.word))).toEqual(new Set([0, 1, 2]));
  });

  it('tags vowels vs consonants', () => {
    const s = segmentFinnish('äiti');
    expect(s.map((x) => x.vowel)).toEqual([true, true, false, true]); // ä, i, t, i
  });
});

describe('alignSounds', () => {
  it('marks every sound good for an exact match', () => {
    expect(statuses('kissa', 'kissa')).toEqual(['good', 'good', 'good', 'good']);
  });

  it('flags a LENGTH error when the base sound is right but the length is wrong', () => {
    // kukka [k,u,kk,a] vs kuka [k,u,k,a]: the long kk was said short.
    const res = alignSounds(segmentFinnish('kukka'), segmentFinnish('kuka'));
    expect(res.sounds.map((s) => s.status)).toEqual(['good', 'good', 'length', 'good']);
    // ...and the reverse (short said long).
    expect(statuses('kuka', 'kukka')).toEqual(['good', 'good', 'length', 'good']);
    // tuli vs tuuli — the classic vowel-length pair.
    expect(statuses('tuuli', 'tuli')).toEqual(['good', 'length', 'good', 'good']);
  });

  it('marks a wrong sound off and a skipped sound missing', () => {
    expect(statuses('kissa', 'kassa')).toEqual(['good', 'off', 'good', 'good']); // i→a
    // Dropped the whole ss: kissa vs kia.
    const res = alignSounds(segmentFinnish('kissa'), segmentFinnish('kia'));
    expect(res.sounds.map((s) => s.status)).toEqual(['good', 'good', 'missing', 'good']);
  });

  it('collects extra sounds the child added', () => {
    const res = alignSounds(segmentFinnish('kissa'), segmentFinnish('kissat'));
    expect(res.sounds.map((s) => s.status)).toEqual(['good', 'good', 'good', 'good']);
    expect(res.extras.map((s) => s.text)).toEqual(['t']);
  });
});

describe('scorePronunciation', () => {
  it('scores an exact match 1.0 with no length error', () => {
    const s = scorePronunciation('kissa', ['kissa']);
    expect(s.accuracy).toBe(1);
    expect(s.hasLengthError).toBe(false);
  });

  it('gives half credit for a length error and flags it', () => {
    const s = scorePronunciation('kukka', ['kuka']); // one of four sounds is a length slip
    expect(s.hasLengthError).toBe(true);
    expect(s.accuracy).toBeCloseTo((3 + 0.5) / 4); // 0.875
    expect(band(s.accuracy)).not.toBe('again'); // still a kind pass — flagged, not failed
  });

  it('keeps the most charitable alternative', () => {
    const s = scorePronunciation('kissa', ['koira', 'kassa', 'kissa']);
    expect(s.accuracy).toBe(1);
    expect(s.heard).toBe('kissa');
  });

  it('scores a genuinely different word low (below the pass bar)', () => {
    const s = scorePronunciation('kissa', ['talo']); // shares almost no sounds
    expect(band(s.accuracy)).toBe('again');
  });

  it('is lenient for words sharing a sound skeleton (transcript-based, by design)', () => {
    // koira shares k · i · a with kissa, so it scores partial — this is why the
    // phoneme score is FEEDBACK; matchSpeech stays the pass/fail gate in the game.
    const s = scorePronunciation('kissa', ['koira']);
    expect(s.accuracy).toBeGreaterThan(0.5);
    expect(s.accuracy).toBeLessThan(1);
  });

  it('handles an empty / no-speech result without throwing', () => {
    expect(scorePronunciation('kissa', []).accuracy).toBe(0);
    expect(scorePronunciation('kissa', ['']).accuracy).toBe(0);
  });
});

describe('band', () => {
  it('bands accuracy into great / good / again', () => {
    expect(band(1)).toBe('great');
    expect(band(0.85)).toBe('great');
    expect(band(0.7)).toBe('good');
    expect(band(0.6)).toBe('good');
    expect(band(0.59)).toBe('again');
    expect(band(0)).toBe('again');
  });
});
