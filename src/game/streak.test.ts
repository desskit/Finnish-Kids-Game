import { describe, it, expect } from 'vitest';
import { bumpStreak, dayKey, displayStreak, playedToday } from './streak';

const at = (iso: string) => Date.parse(`${iso}T12:00:00`);

describe('dayKey', () => {
  it('formats a local calendar day as YYYY-MM-DD', () => {
    expect(dayKey(at('2026-07-09'))).toBe('2026-07-09');
    expect(dayKey(at('2026-01-05'))).toBe('2026-01-05');
  });
});

describe('bumpStreak', () => {
  it('starts a streak at 1 on the first play ever', () => {
    expect(bumpStreak(undefined, undefined, '2026-07-09')).toEqual({
      lastPlayedDay: '2026-07-09',
      streakDays: 1,
    });
  });

  it('leaves the count unchanged for another play the same day', () => {
    expect(bumpStreak('2026-07-09', 4, '2026-07-09')).toEqual({
      lastPlayedDay: '2026-07-09',
      streakDays: 4,
    });
  });

  it('increments the count on the very next day', () => {
    expect(bumpStreak('2026-07-09', 4, '2026-07-10')).toEqual({
      lastPlayedDay: '2026-07-10',
      streakDays: 5,
    });
  });

  it('quietly restarts at 1 after a missed day (no loss-aversion)', () => {
    expect(bumpStreak('2026-07-09', 4, '2026-07-12')).toEqual({
      lastPlayedDay: '2026-07-12',
      streakDays: 1,
    });
  });

  it('spans a month boundary', () => {
    expect(bumpStreak('2026-07-31', 2, '2026-08-01')).toEqual({
      lastPlayedDay: '2026-08-01',
      streakDays: 3,
    });
  });
});

describe('displayStreak', () => {
  it('shows the stored count when the last play was today or yesterday', () => {
    expect(displayStreak('2026-07-09', 5, '2026-07-09')).toBe(5);
    expect(displayStreak('2026-07-09', 5, '2026-07-10')).toBe(5);
  });

  it('reads as broken (0) after a longer gap, without rewriting storage', () => {
    expect(displayStreak('2026-07-09', 5, '2026-07-12')).toBe(0);
  });

  it('is 0 when nothing has ever been played', () => {
    expect(displayStreak(undefined, undefined, '2026-07-09')).toBe(0);
  });
});

describe('playedToday', () => {
  it('is true only when the last play is today', () => {
    expect(playedToday('2026-07-09', '2026-07-09')).toBe(true);
    expect(playedToday('2026-07-08', '2026-07-09')).toBe(false);
    expect(playedToday(undefined, '2026-07-09')).toBe(false);
  });
});
