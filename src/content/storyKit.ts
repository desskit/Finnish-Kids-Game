// The story kit: the recurring cast, the shape of a picture-book story, and the
// small helpers the story files are written with (stories.ts, unitStories.ts).
// Kept apart from both so they can share it without importing each other.
//
// A story is a little picture book: a cover, three or four pages — each a
// scene (a drawn setting, with who and what in front of it) with one to three
// short lines —
// "Loppu!", and then questions about it. Lines are narration or a character
// talking (`by`), which plays in that character's voice and shows as a speech
// bubble. Every Finnish word is HUMAN-AUTHORED, never generated.

import type { BackdropId } from '../art/generated/manifest';

/** The recurring cast: Aino, her friend Eero, her family, her cat and his dog
 *  — and, once a year, joulupukki. */
export type CastId = 'aino' | 'eero' | 'aiti' | 'isa' | 'isoaiti' | 'mirri' | 'musti' | 'opettaja' | 'leo' | 'joulupukki';

export interface CastMember {
  nameFi: string;
  nameEn: string;
  emoji: string;
  /** Speech pitch for this character's lines: the one Finnish voice, a little higher or lower. */
  pitch: number;
}

export const CAST: Record<CastId, CastMember> = {
  aino: { nameFi: 'Aino', nameEn: 'Aino', emoji: '👧', pitch: 1.3 },
  eero: { nameFi: 'Eero', nameEn: 'Eero', emoji: '👦', pitch: 1.15 },
  aiti: { nameFi: 'Äiti', nameEn: 'Mom', emoji: '👩', pitch: 1.05 },
  isa: { nameFi: 'Isä', nameEn: 'Dad', emoji: '👨', pitch: 0.8 },
  isoaiti: { nameFi: 'Isoäiti', nameEn: 'Grandma', emoji: '👵', pitch: 0.9 },
  mirri: { nameFi: 'Mirri', nameEn: 'Mirri the cat', emoji: '🐱', pitch: 1.6 },
  musti: { nameFi: 'Musti', nameEn: 'Musti the dog', emoji: '🐶', pitch: 0.7 },
  opettaja: { nameFi: 'Opettaja', nameEn: 'The teacher', emoji: '🧑‍🏫', pitch: 1 },
  leo: { nameFi: 'Leo', nameEn: 'Leo', emoji: '🧒', pitch: 1.2 },
  joulupukki: { nameFi: 'Joulupukki', nameEn: 'Santa', emoji: '🎅', pitch: 0.7 },
};

/** Cast members called by a word, not a name ("Äiti", Mom): in a story, tapping
 *  the word shows the word ("äidille" → to Mom), not "(a name)". */
export const CALLED_BY_A_WORD: ReadonlySet<CastId> = new Set<CastId>(['aiti', 'isa', 'isoaiti', 'opettaja', 'joulupukki']);

/** The narrator's voice (a story told by a character uses theirs). */
export const NARRATOR_PITCH = 1;

/** Where a page happens: one of the drawn backdrops (art/scenes/). */
export type SettingId = BackdropId;

/** The light of a scene: daytime outdoors or indoors, the morning, the evening, the night, the rain, the snow. */
export type SceneTone = 'day' | 'inside' | 'morning' | 'evening' | 'night' | 'rain' | 'snow';

export interface StoryScene {
  /** Where it happens: drawn right across the back of the page. */
  setting: SettingId;
  /** Who and what the page is about, drawn big in front. */
  fg: string[];
  /** The light, if not the setting's usual one (see toneOf). */
  tone?: SceneTone;
}

/** The settings indoors (their usual light is 'inside'; outdoors it's the 'day'). */
const INDOORS: ReadonlySet<SettingId> = new Set<SettingId>(['home', 'kitchen', 'bedroom', 'bathroom', 'party', 'classroom', 'library', 'shop', 'cafe', 'christmas', 'sauna']);

/** The light a scene is in: its own, or its setting's usual one. */
export const toneOf = (scene: StoryScene): SceneTone => scene.tone ?? (INDOORS.has(scene.setting) ? 'inside' : 'day');

export interface StoryLine {
  fi: string;
  en: string;
  /** Who says it (a speech bubble, in their voice); unset = narration. */
  by?: CastId;
}

export interface StoryPage {
  scene: StoryScene;
  /** One to three short lines. */
  lines: StoryLine[];
}

export interface StoryOption {
  fi: string;
  en: string;
  emoji: string;
  /** Exactly one option per question carries this. */
  correct?: boolean;
}

/** A picture question about the story ("Mitä Mirri juo?"). */
export interface StoryQuestion {
  promptFi: string;
  promptEn: string;
  options: StoryOption[];
}

/** A true-or-false statement about the story ("Isoäiti tykkää jäätelöstä."). */
export interface StoryFact {
  fi: string;
  en: string;
  isTrue: boolean;
}

export interface Story {
  id: string;
  titleFi: string;
  titleEn: string;
  /** Cover emoji. */
  icon: string;
  tier: number;
  /** A first-person story ("Minä herään.") is told in this character's voice. */
  narrator?: CastId;
  pages: StoryPage[];
  /** Picture questions — with `facts`, the bank a read's questions are drawn from. */
  questions: StoryQuestion[];
  /** True-or-false statements (an early unit's story may have none). */
  facts: StoryFact[];
}

// --- Authoring helpers ------------------------------------------------------

const emojis = (s: string): string[] => s.split(/\s+/).filter(Boolean);

/** A scene: the setting, then who and what (space-separated emoji), and the light if it isn't the usual. */
export const sc = (setting: SettingId, fg: string, tone?: SceneTone): StoryScene => ({ setting, fg: emojis(fg), ...(tone ? { tone } : {}) });
export const page = (scene: StoryScene, ...lines: StoryLine[]): StoryPage => ({ scene, lines });
/** Narration. */
export const tell = (fi: string, en: string): StoryLine => ({ fi, en });
/** A character talking. */
export const say = (by: CastId, fi: string, en: string): StoryLine => ({ fi, en, by });
export const ask = (promptFi: string, promptEn: string, ...options: StoryOption[]): StoryQuestion => ({
  promptFi,
  promptEn,
  options,
});
export const right = (fi: string, en: string, emoji: string): StoryOption => ({ fi, en, emoji, correct: true });
export const wrong = (fi: string, en: string, emoji: string): StoryOption => ({ fi, en, emoji });
export const trueFact = (fi: string, en: string): StoryFact => ({ fi, en, isTrue: true });
export const falseFact = (fi: string, en: string): StoryFact => ({ fi, en, isTrue: false });

/** Every line of a story, in reading order. */
export function storyLines(story: Story): StoryLine[] {
  return story.pages.flatMap((p) => p.lines);
}
