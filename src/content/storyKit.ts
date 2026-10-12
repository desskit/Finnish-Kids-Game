// The story kit: the recurring cast, the shape of a picture-book story, and the
// small helpers the story files are written with (stories.ts, unitStories.ts).
// Kept apart from both so they can share it without importing each other.
//
// A story is a little picture book: a cover, three or four pages — each a
// scene (a few emoji: where, then who and what) with one to three short lines —
// "Loppu!", and then questions about it. Lines are narration or a character
// talking (`by`), which plays in that character's voice and shows as a speech
// bubble. Every Finnish word is HUMAN-AUTHORED, never generated.

/** The recurring cast: Aino, her friend Eero, her family, her cat and his dog. */
export type CastId = 'aino' | 'eero' | 'aiti' | 'isa' | 'isoaiti' | 'mirri' | 'musti' | 'opettaja' | 'leo';

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
};

/** The narrator's voice (a story told by a character uses theirs). */
export const NARRATOR_PITCH = 1;

/** The light of a scene: it sets the picture's background. */
export type SceneTone = 'day' | 'evening' | 'night' | 'inside' | 'snow';

export interface StoryScene {
  /** The setting, drawn small across the back (🌳 ☀️ 🌳). */
  bg: string[];
  /** Who and what the page is about, drawn big in front. */
  fg: string[];
  tone?: SceneTone;
}

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

/** A scene: the setting, then who and what (space-separated emoji). */
export const sc = (bg: string, fg: string, tone?: SceneTone): StoryScene => ({ bg: emojis(bg), fg: emojis(fg), ...(tone ? { tone } : {}) });
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
