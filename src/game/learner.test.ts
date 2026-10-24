import { describe, it, expect } from 'vitest';
import type { Child } from '../state/storage';
import { englishHelpOf, learnerKnobs, readerBandOf, showsEnglish, speaksEnglishPrompt } from './learner';

const child = (over: Partial<Child> = {}) =>
  ({ id: 'k', name: 'Aino', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {}, ...over }) as Child;

describe('who is learning', () => {
  it('counts a player from before reader bands as a younger reader', () => {
    expect(readerBandOf(child())).toBe('younger');
    expect(readerBandOf(child({ readerBand: 'older' }))).toBe('older');
    expect(readerBandOf(null)).toBe('younger');
  });

  it('gives younger readers short cards read aloud and a shorter session; older readers the full lessons', () => {
    const young = learnerKnobs(child());
    const old = learnerKnobs(child({ readerBand: 'older' }));
    expect(young.fullLessons).toBe(false);
    expect(young.readAloud).toBe(true);
    expect(old.fullLessons).toBe(true);
    expect(old.readAloud).toBe(false);
    expect(young.sessionRounds).toBeLessThan(old.sessionRounds);
    expect(young.syllables).toBe(true);
    expect(old.syllables).toBe(false);
  });
});

describe('English help', () => {
  it('fades by default', () => {
    expect(englishHelpOf({})).toBe('fade');
    expect(englishHelpOf(undefined)).toBe('fade');
    expect(englishHelpOf({ englishHelp: 'off' })).toBe('off');
  });

  it('shows a line’s English on the first rung when fading, always when asked, never when off or Finnish-only', () => {
    expect(showsEnglish('fade', 1, true)).toBe(true);
    expect(showsEnglish('fade', 2, true)).toBe(false);
    expect(showsEnglish('always', 4, true)).toBe(true);
    expect(showsEnglish('off', 1, true)).toBe(false);
    // the game's own Finnish-only rung wins
    expect(showsEnglish('always', 5, false)).toBe(false);
  });

  it('reads an English prompt unasked only for a younger reader on the first rung', () => {
    expect(speaksEnglishPrompt(child(), 1, 'fade')).toBe(true);
    expect(speaksEnglishPrompt(child(), 2, 'fade')).toBe(false);
    expect(speaksEnglishPrompt(child({ readerBand: 'older' }), 1, 'fade')).toBe(false);
    expect(speaksEnglishPrompt(child(), 1, 'off')).toBe(false);
  });
});
