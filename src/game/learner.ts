// Who's learning, and what that changes (docs/LEARNING_RESEARCH.md).
//
// The app is for readers aged about 6–10, and the evidence splits them:
// younger children (about 6–7) learn mostly from phrases they hear and use,
// with a rule shown only briefly and read aloud; older ones (about 8–10) can
// take a short explicit lesson. A grown-up picks the band per player; a player
// from before bands existed counts as younger.
//
// Pure: no React, no storage writes.

import type { Child, EnglishHelp, ReaderBand, Settings } from '../state/storage';

export type { ReaderBand, EnglishHelp };

export const READER_BANDS: readonly { id: ReaderBand; label: string; hint: string }[] = [
  { id: 'younger', label: 'Younger reader', hint: 'about 6–7: short pattern cards, read aloud' },
  { id: 'older', label: 'Older reader', hint: 'about 8–10: the full lessons' },
];

export const readerBandOf = (child: Child | null | undefined): ReaderBand => child?.readerBand ?? 'younger';

export interface LearnerKnobs {
  band: ReaderBand;
  /** The whole lesson (older), or only its pattern cards (younger). */
  fullLessons: boolean;
  /** Explanations are read aloud on their own (the 🔊 is always there). */
  readAloud: boolean;
  /** Rounds in a day's session before a natural stop (src/game/session.ts). */
  sessionRounds: number;
  /** New words shown in syllables the first times they're met. */
  syllables: boolean;
}

export function learnerKnobs(child: Child | null | undefined): LearnerKnobs {
  const band = readerBandOf(child);
  return band === 'older'
    ? { band, fullLessons: true, readAloud: false, sessionRounds: 6, syllables: false }
    : { band, fullLessons: false, readAloud: true, sessionRounds: 4, syllables: true };
}

export const englishHelpOf = (settings: Pick<Settings, 'englishHelp'> | null | undefined): EnglishHelp =>
  settings?.englishHelp ?? 'fade';

/**
 * Does a Finnish line show its English beside it? `level` is the step's level
 * (1 = its first rung): 'fade' keeps the English for the first rung only;
 * 'always' keeps it until the game's own Finnish-only rung (`ladderShows`);
 * 'off' never shows it. The English stays a tap away whatever this says.
 */
export function showsEnglish(help: EnglishHelp, level: number, ladderShows: boolean): boolean {
  if (!ladderShows || help === 'off') return false;
  return help === 'always' || level <= 1;
}

/**
 * Is a drill's English prompt read aloud on its own? The prompt always shows
 * as text with a button to hear it; only a younger reader on a step's first
 * rung hears it unasked, so Finnish — not English — is what a game opens with.
 */
export function speaksEnglishPrompt(child: Child | null | undefined, level: number, help: EnglishHelp): boolean {
  return help !== 'off' && readerBandOf(child) === 'younger' && level <= 1;
}
