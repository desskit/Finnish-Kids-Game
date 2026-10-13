import { describe, it, expect } from 'vitest';
import { UNIT_STORIES, UNIT_STORY_IDS } from './unitStories';
import { CAST, stories } from './stories';
import { conversations } from './conversations';
import { dialogues } from './dialogues';
import { finnishLexicon, unknownWords } from '../test/finnishLexicon';
import { lookupWord } from './wordIndex';
import { PATH } from '../game/path';

// Hand-written Finnish is the one place a wrong form can slip in. Every word of
// every story, scene and dialogue must be a REAL form — found in the vendored
// Wiktionary tables (695k forms) or the short function-word list. (Whether it's
// the right form for the sentence is the native reviewer's call.)
describe('authored Finnish uses only real word forms', () => {
  const lex = finnishLexicon();
  const check = (lines: [string, string][]) =>
    lines.flatMap(([where, line]) => unknownWords(line, lex).map((w) => `${where}: "${w}" in "${line}"`));

  it('stories', () => {
    const lines: [string, string][] = stories.flatMap((s) => [
      [s.id, s.titleFi] as [string, string],
      ...s.pages.flatMap((p) => p.lines.map((l): [string, string] => [s.id, l.fi])),
      ...s.questions.flatMap((q) => [[s.id, q.promptFi] as [string, string], ...q.options.map((o): [string, string] => [s.id, o.fi])]),
      ...s.facts.map((f): [string, string] => [s.id, f.fi]),
    ]);
    expect(check(lines)).toEqual([]);
  }, 60_000);

  it('scenes and dialogues', () => {
    const lines: [string, string][] = [
      ...conversations.flatMap((c) =>
        c.turns.flatMap((t) => [t.partner, t.reply, ...t.distractors].map((l): [string, string] => [c.id, l.fi])),
      ),
      ...dialogues.flatMap((d) => [d.prompt, d.reply, ...d.distractors].map((l): [string, string] => [d.id, l.fi])),
    ];
    expect(check(lines)).toEqual([]);
  }, 60_000);
});

describe('the story glossary', () => {
  it('explains every word a child can tap in a story', () => {
    const missing = stories.flatMap((s) =>
      s.pages.flatMap((p) =>
        p.lines.flatMap((l) =>
          // The words StoryTime makes tappable.
          (l.fi.match(/[\p{L}-]+/gu) ?? []).filter((w) => !lookupWord(w)).map((w) => `${s.id}: "${w}" in "${l.fi}"`),
        ),
      ),
    );
    expect(missing).toEqual([]);
  });

  it('reads a pronoun as a pronoun, and knows the endings on top of a form', () => {
    expect(lookupWord('heitä')?.en).toMatch(/them/);
    expect(lookupWord('laulatko')?.en).toMatch(/sing.*asking/);
    expect(lookupWord('sinäkin')?.en).toMatch(/you.*too/);
    expect(lookupWord('nopeampi')?.en).toBe('faster');
    expect(lookupWord('repussani')?.en).toBe('in my backpack');
  });
});

describe('unit stories', () => {
  it('give most units a story of their own, used by that unit', () => {
    const units = PATH.filter((u) => u.checkpoint !== false);
    expect(Object.keys(UNIT_STORY_IDS).length).toBeGreaterThanOrEqual(units.length * 0.75);
    for (const [unitId, storyId] of Object.entries(UNIT_STORY_IDS)) {
      const unit = PATH.find((u) => u.id === unitId);
      expect(unit, unitId).toBeDefined();
      const step = unit!.skills.find((s) => s.activity === 'story');
      expect(step?.content.ids, unitId).toEqual([storyId]);
    }
    expect(new Set(UNIT_STORIES.map((s) => s.id)).size).toBe(UNIT_STORIES.length);
  });

  it('ask at least three picture questions, each with one right answer that the story says', () => {
    for (const s of stories) {
      expect(s.questions.length, s.id).toBeGreaterThanOrEqual(3);
      // The story as read: who says each line counts too ("Eero: Minulla on koira.").
      const text = s.pages
        .flatMap((p) => p.lines.map((l) => (l.by ? `${CAST[l.by].nameFi}: ` : '') + l.fi))
        .join(' ')
        .toLowerCase();
      const names = Object.values(CAST).map((c) => c.nameFi.toLowerCase());
      for (const q of s.questions) {
        const right = q.options.find((o) => o.correct)!;
        // The right answer's key word appears in the story — no outside knowledge
        // needed. (Its stem: the answer may be another form, "kuvan" for "kuva",
        // or a name's, "Eerolla" for Eero.)
        const words = right.fi
          .toLowerCase()
          .replace(/[.,!?]/g, '')
          .split(' ')
          .filter((w) => w.length >= 2);
        const found = words.some(
          (w) => text.includes(w.slice(0, Math.max(3, w.length - 2))) || names.some((n) => w.startsWith(n) && text.includes(n)),
        );
        expect(found, `${s.id}: ${q.promptFi} → ${right.fi}`).toBe(true);
      }
    }
  });

  it('give every story after the first a few true-or-false statements, both true and false', () => {
    for (const s of stories) {
      if (s.id === 'hello-eero') continue; // unit 1: greetings only
      expect(s.facts.length, s.id).toBeGreaterThanOrEqual(2);
      expect(s.facts.some((f) => f.isTrue), s.id).toBe(true);
      expect(s.facts.some((f) => !f.isTrue), s.id).toBe(true);
    }
  });
});
