import { describe, it, expect } from 'vitest';
import { normalizeSpoken, editDistance, matchTolerance, matchSpeech } from './speechMatch';

describe('normalizeSpoken', () => {
  it('lowercases, strips punctuation, collapses whitespace, keeps ä/ö', () => {
    expect(normalizeSpoken('  Tämä on KISSA. ')).toBe('tämä on kissa');
    expect(normalizeSpoken('Isä, äiti!')).toBe('isä äiti');
  });
});

describe('editDistance', () => {
  it('is 0 for equal strings and the length for empty comparisons', () => {
    expect(editDistance('kissa', 'kissa')).toBe(0);
    expect(editDistance('', 'kissa')).toBe(5);
    expect(editDistance('kissa', '')).toBe(5);
  });
  it('counts single edits', () => {
    expect(editDistance('kissa', 'kisa')).toBe(1); // deletion
    expect(editDistance('kissa', 'kissaa')).toBe(1); // insertion
    expect(editDistance('kissa', 'kessa')).toBe(1); // substitution
  });
});

describe('matchTolerance', () => {
  it('is ~1/4 the target length, at least 1', () => {
    expect(matchTolerance('on')).toBe(1); // floor(2/4)=0 → min 1
    expect(matchTolerance('kissa')).toBe(1); // floor(5/4)=1
    expect(matchTolerance('tämä on iso kissa')).toBe(4); // floor(17/4)=4
  });
});

describe('matchSpeech', () => {
  it('accepts an exact match (case/punctuation-insensitive)', () => {
    expect(matchSpeech(['Kissa.'], 'kissa')).toBe(true);
  });
  it('accepts a near-miss within tolerance (child mispronunciation / ASR slip)', () => {
    expect(matchSpeech(['kisa'], 'kissa')).toBe(true); // 1 edit ≤ tol 1
    expect(matchSpeech(['kissaa'], 'kissa')).toBe(true);
  });
  it('accepts an alternative that contains the target (said extra words)', () => {
    expect(matchSpeech(['se on kissa'], 'kissa')).toBe(true);
  });
  it('accepts a full phrase spoken correctly', () => {
    expect(matchSpeech(['Tämä on kissa'], 'Tämä on kissa.')).toBe(true);
  });
  it('accepts if ANY alternative matches, even when the first is wrong', () => {
    expect(matchSpeech(['koira', 'pissa', 'kissa'], 'kissa')).toBe(true);
  });
  it('rejects a genuinely different word', () => {
    expect(matchSpeech(['koira'], 'kissa')).toBe(false);
    expect(matchSpeech([], 'kissa')).toBe(false);
    expect(matchSpeech([''], 'kissa')).toBe(false);
  });
  it('does not accept one short word as a whole phrase (only heard⊇target)', () => {
    expect(matchSpeech(['on'], 'tämä on kissa')).toBe(false);
  });
});
