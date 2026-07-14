// Gentle daily-practice streak — the "come back tomorrow" scaffolding that
// distributed-practice research says drives retention. Deliberately no
// loss-aversion: a missed day just quietly restarts the count on the next play,
// never a negative signal or guilt copy. Pure + time-injected like srs.ts so it
// stays trivially testable and never reads the clock itself.

const DAY = 86_400_000;

export interface Streak {
  /** Local calendar day of the most recent play, e.g. "2026-07-09". */
  lastPlayedDay: string;
  /** Consecutive days (including today) the child has practiced. */
  streakDays: number;
}

/** Local calendar day key for an epoch-ms instant, e.g. "2026-07-09". */
export function dayKey(now: number): string {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole calendar days between two day keys (`b - a`). */
function daysBetween(a: string, b: string): number {
  const pa = Date.parse(`${a}T00:00:00`);
  const pb = Date.parse(`${b}T00:00:00`);
  return Math.round((pb - pa) / DAY);
}

/**
 * Fold a play on `today` into the stored streak. Same day → count unchanged;
 * the very next day → +1; any longer gap (or first play ever) → restart at 1.
 */
export function bumpStreak(
  prevDay: string | undefined,
  prevStreak: number | undefined,
  today: string,
): Streak {
  if (!prevDay) return { lastPlayedDay: today, streakDays: 1 };
  const gap = daysBetween(prevDay, today);
  if (gap <= 0) return { lastPlayedDay: today, streakDays: Math.max(1, prevStreak ?? 1) };
  if (gap === 1) return { lastPlayedDay: today, streakDays: (prevStreak ?? 0) + 1 };
  return { lastPlayedDay: today, streakDays: 1 };
}

/**
 * The streak to *show* today. The stored count only counts as "live" if the last
 * play was today or yesterday; after a longer gap it reads as broken, so display
 * 0 (a quiet reset — the stored value isn't rewritten until the next play).
 */
export function displayStreak(
  prevDay: string | undefined,
  prevStreak: number | undefined,
  today: string,
): number {
  if (!prevDay || !prevStreak) return 0;
  return daysBetween(prevDay, today) <= 1 ? prevStreak : 0;
}

/** Has the child already practiced today? (drives the "done today" dot) */
export function playedToday(prevDay: string | undefined, today: string): boolean {
  return !!prevDay && prevDay === today;
}
