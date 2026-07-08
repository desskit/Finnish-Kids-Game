// Finnish-specific pronunciation scoring — the "phoneme-level" feedback for the
// speaking game. This is TRANSCRIPT-based, not acoustic: it aligns what the
// recognizer heard against the target Finnish spelling and flags which sounds
// were right, wrong, or (the big one for Finnish) the wrong LENGTH. It works as
// well as it does because Finnish orthography is nearly perfectly phonemic —
// one letter ≈ one sound, and a doubled letter is a single LONG sound
// (kuka/kukka, tuli/tuuli). Pure + deterministic, so it's fully unit-tested.
//
// Limitation (see the parent disclosure): it can only judge what the recognizer
// transcribes. When a mispronunciation still maps to the target word it reads as
// correct; when it maps to a different real word the length/sound error shows.

import { normalizeSpoken } from './speechMatch';

const VOWELS = new Set('aeiouyäöå');

/** One Finnish "sound": a single grapheme, or a doubled (long) one. */
export interface Sound {
  /** The grapheme(s) as written: 'k' or 'kk'. */
  text: string;
  /** Base letter (the sound's identity, ignoring length). */
  letter: string;
  /** A doubled letter — a long sound, phonemically distinct in Finnish. */
  long: boolean;
  /** Vowel vs consonant (for friendlier hints). */
  vowel: boolean;
  /** Which whitespace-separated word this sound belongs to (for display). */
  word: number;
}

export type SoundStatus = 'good' | 'length' | 'off' | 'missing';

export interface ScoredSound {
  /** The TARGET sound this result is for. */
  sound: Sound;
  status: SoundStatus;
}

export interface PronunciationScore {
  /** Per-target-sound results, in reading order. */
  sounds: ScoredSound[];
  /** Sounds the child added that aren't in the target. */
  extras: Sound[];
  /** 0..1 — long-length errors count as half-credit (right sound, wrong length). */
  accuracy: number;
  /** Any vowel/consonant length mistakes — the Finnish teaching focus. */
  hasLengthError: boolean;
  /** The recognition alternative that was scored (normalized). */
  heard: string;
}

/**
 * Split Finnish text into length-aware sound tokens: a doubled letter becomes
 * ONE long sound (so "kukka" → k · u · kk · a). Punctuation is stripped and
 * whitespace splits words (tracked on each sound for display).
 */
export function segmentFinnish(text: string): Sound[] {
  const words = normalizeSpoken(text).split(' ').filter(Boolean);
  const out: Sound[] = [];
  words.forEach((w, wi) => {
    let i = 0;
    while (i < w.length) {
      const ch = w[i];
      const long = i + 1 < w.length && w[i + 1] === ch;
      out.push({ text: long ? ch + ch : ch, letter: ch, long, vowel: VOWELS.has(ch), word: wi });
      i += long ? 2 : 1;
    }
  });
  return out;
}

// A same-letter length mismatch is a SOFT error (the child made the right sound,
// just short/long) — cheaper than a wrong sound, so alignment prefers to line
// length pairs up and report them as such.
const LENGTH_COST = 0.5;

function subCost(a: Sound, b: Sound): number {
  if (a.letter !== b.letter) return 1;
  return a.long === b.long ? 0 : LENGTH_COST;
}

/**
 * Needleman–Wunsch alignment of target vs heard sounds → a status for every
 * target sound (good / length / off / missing) plus any extra heard sounds.
 */
export function alignSounds(
  target: readonly Sound[],
  heard: readonly Sound[],
): { sounds: ScoredSound[]; extras: Sound[] } {
  const n = target.length;
  const m = heard.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) dp[i][0] = i;
  for (let j = 1; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + subCost(target[i - 1], heard[j - 1]),
        dp[i - 1][j] + 1, // deletion — a target sound the child skipped
        dp[i][j - 1] + 1, // insertion — an extra heard sound
      );
    }
  }

  const sounds: ScoredSound[] = [];
  const extras: Sound[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      dp[i][j] === dp[i - 1][j - 1] + subCost(target[i - 1], heard[j - 1])
    ) {
      const t = target[i - 1];
      const h = heard[j - 1];
      const status: SoundStatus =
        t.letter !== h.letter ? 'off' : t.long === h.long ? 'good' : 'length';
      sounds.push({ sound: t, status });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      sounds.push({ sound: target[i - 1], status: 'missing' });
      i--;
    } else {
      extras.push(heard[j - 1]);
      j--;
    }
  }
  sounds.reverse();
  extras.reverse();
  return { sounds, extras };
}

/**
 * Score a spoken attempt: align the target against EACH recognition alternative
 * and keep the most charitable (highest-accuracy) one — child speech + ASR are
 * noisy, so we give the benefit of the doubt (matches the game's kind design).
 */
export function scorePronunciation(
  target: string,
  heardAlternatives: readonly string[],
): PronunciationScore {
  const tSounds = segmentFinnish(target);
  const total = tSounds.length || 1;
  const alts = heardAlternatives.length > 0 ? heardAlternatives : [''];

  let best: PronunciationScore | null = null;
  for (const alt of alts) {
    const { sounds, extras } = alignSounds(tSounds, segmentFinnish(alt));
    const good = sounds.filter((s) => s.status === 'good').length;
    const length = sounds.filter((s) => s.status === 'length').length;
    const accuracy = (good + length * 0.5) / total;
    const score: PronunciationScore = {
      sounds,
      extras,
      accuracy,
      hasLengthError: length > 0,
      heard: normalizeSpoken(alt),
    };
    if (!best || score.accuracy > best.accuracy) best = score;
  }
  return best!;
}

export type Band = 'great' | 'good' | 'again';

/** Friendly banding of an accuracy score. `again` = below the (kind) pass bar. */
export function band(accuracy: number): Band {
  if (accuracy >= 0.85) return 'great';
  if (accuracy >= 0.6) return 'good';
  return 'again';
}
