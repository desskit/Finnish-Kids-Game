import { describe, it, expect } from 'vitest';
import { UNIT_STORIES, UNIT_STORY_IDS } from './unitStories';
import { stories } from './stories';
import { conversations } from './conversations';
import { dialogues } from './dialogues';
import { finnishLexicon, unknownWords } from '../test/finnishLexicon';
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
      ...s.pages.map((p): [string, string] => [s.id, p.fi]),
      ...s.questions.flatMap((q) => [[s.id, q.promptFi] as [string, string], ...q.options.map((o): [string, string] => [s.id, o.fi])]),
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

  it('ask two or three questions, each with one right answer that the story says', () => {
    for (const s of UNIT_STORIES) {
      expect(s.questions.length).toBeGreaterThanOrEqual(2);
      expect(s.questions.length).toBeLessThanOrEqual(3);
      const text = s.pages.map((p) => p.fi.toLowerCase()).join(' ');
      for (const q of s.questions) {
        const right = q.options.find((o) => o.correct)!;
        // The right answer's key word appears in the story (no outside knowledge needed).
        const key = right.fi.toLowerCase().replace(/[.!?]/g, '').split(' ').filter((w) => w.length >= 2);
        expect(key.some((w) => text.includes(w)), `${s.id}: ${q.promptFi} → ${right.fi}`).toBe(true);
      }
    }
  });
});
