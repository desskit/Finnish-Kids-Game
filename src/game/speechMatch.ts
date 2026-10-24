// Generous, deterministic matching of a child's speech against a Finnish target.
// Pure (no browser APIs) so it's trivially unit-testable and shared by the game
// + tests. Child-voice speech recognition is unreliable, and this drill must
// NEVER feel punishing — so the bar is deliberately low: any recognition
// alternative that is exactly, contains, or is a near-miss of the target counts.
//
// A recognizer often writes a spoken number as digits ("7", "3 kissaa"), so a
// number it wrote that way is read back as its Finnish word before comparing:
// a child who said "kolme kissaa" said it right.

import { mathWords, numbers } from '../content';

/** A number a recognizer may write as digits → its sourced Finnish word. */
const NUMBER_WORDS = new Map<string, string>(
  [...mathWords.items, ...numbers.items]
    .filter((n) => typeof n.value === 'number')
    .map((n) => [String(n.value), n.fi]),
);

/** Digits a recognizer wrote ("7", "3 kissaa") read back as Finnish words. */
export function spokenDigits(s: string): string {
  return s.replace(/\d+/g, (d) => NUMBER_WORDS.get(String(Number(d))) ?? d);
}

/** Each number word → its value. */
const NUMBER_VALUES = new Map<string, number>([...NUMBER_WORDS].map(([v, fi]) => [fi, Number(v)]));

/** Lowercase, drop punctuation, collapse whitespace. Keeps Finnish ä/ö/å. */
export function normalizeSpoken(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:'"’”“()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Levenshtein edit distance (iterative, two-row). */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Edit-distance tolerance for a target: ~1/4 of its length, at least 1. */
export function matchTolerance(target: string): number {
  return Math.max(1, Math.floor(normalizeSpoken(target).length / 4));
}

/**
 * The runs of words in `heard` about as long as the target (one word fewer to
 * one more): where the attempt sits when a noisy room or an "öö" adds words
 * around it.
 */
function windowsOf(heard: string, targetWords: number): string[] {
  const words = heard.split(' ');
  const out: string[] = [];
  for (let k = Math.max(1, targetWords - 1); k <= targetWords + 1; k++) {
    for (let i = 0; i + k <= words.length; i++) out.push(words.slice(i, i + k).join(' '));
  }
  return out;
}

/**
 * Does any recognition alternative acceptably match the Finnish target? Accepts
 * an exact match, an alternative that CONTAINS the target (the child said it
 * plus filler), or one within the edit-distance tolerance (mispronunciation /
 * ASR slip) — as a whole, or in a run of words about the target's length (a
 * slip plus background words). Intentionally lenient — see the module note.
 */
export function matchSpeech(heard: readonly string[], target: string): boolean {
  const t = normalizeSpoken(target);
  if (!t) return false;
  const tol = matchTolerance(target);
  const targetWords = t.split(' ').length;
  return heard.some((raw) => {
    const h = normalizeSpoken(spokenDigits(raw));
    if (!h) return false;
    if (h === t) return true;
    if (h.includes(t)) return true; // said the target plus extra words
    if (editDistance(h, t) <= tol) return true;
    return windowsOf(h, targetWords).some((w) => editDistance(w, t) <= tol);
  });
}

/**
 * The number a heard word most likely was: its number word, or the one nearest
 * it when that is near enough and nearer than every other ("viis" and "kuus",
 * as children say them, are viisi and kuusi; "kuusitoista" is never
 * kaksitoista).
 */
function numberIn(word: string): number | undefined {
  const exact = NUMBER_VALUES.get(word);
  if (exact !== undefined) return exact;
  let best: number | undefined;
  let bestFi = '';
  let bestD = Infinity;
  let tie = false;
  for (const [fi, v] of NUMBER_VALUES) {
    const d = editDistance(word, fi);
    if (d < bestD) {
      [best, bestFi, bestD, tie] = [v, fi, d, false];
    } else if (d === bestD) {
      tie = true;
    }
  }
  return best !== undefined && !tie && bestD <= matchTolerance(bestFi) ? best : undefined;
}

/**
 * Was this number the answer said? The last number heard counts ("viisi",
 * "5", "se on viisi", "kolme plus kaksi on viisi"), read as whole words: the
 * looser `matchSpeech` would hear "kolme" inside "kolmetoista". A number said
 * in two pieces ("kolme toista") is put back together.
 */
export function matchNumberSpeech(heard: readonly string[], value: number): boolean {
  return heard.some((raw) => {
    const words = normalizeSpoken(spokenDigits(raw)).split(' ').filter(Boolean);
    for (let i = words.length - 1; i >= 0; i--) {
      const joined = i > 0 ? NUMBER_VALUES.get(words[i - 1] + words[i]) : undefined;
      const v = joined ?? numberIn(words[i]);
      if (v !== undefined) return v === value;
    }
    return false;
  });
}
