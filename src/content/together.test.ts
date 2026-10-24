import { describe, it, expect } from 'vitest';
import { AT_HOME, SONG_LINKS, sceneTogether, storyTogether } from './together';
import { UNITS } from '../game/course';
import { lookupWord } from './wordIndex';
import { courseStories, storyLines } from './stories';
import { conversations } from './conversations';
import { dialogues } from './dialogues';

// Together mode writes no Finnish of its own: its lines come from the content,
// and an at-home idea's *italic* Finnish is course words or lines it already has.

const said = new Set<string>([
  ...conversations.flatMap((c) => [c.titleFi, ...c.turns.flatMap((t) => [t.partner.fi, t.reply.fi])]),
  ...dialogues.flatMap((d) => [d.prompt.fi, d.reply.fi]),
  ...courseStories.flatMap((s) => storyLines(s).map((l) => l.fi)),
]);
const clean = (s: string) => s.replace(/[!?.,]+$/g, '').trim();
const saidClean = new Set([...said].map(clean));

describe('Together mode', () => {
  it('has a try-at-home idea for every unit', () => {
    for (const u of UNITS) expect(AT_HOME[u.id], u.id).toBeTruthy();
    for (const id of Object.keys(AT_HOME)) expect(UNITS.some((u) => u.id === id), id).toBe(true);
  });

  it("an idea's Finnish is a line the course says, or words it teaches", () => {
    const bad: string[] = [];
    for (const [id, text] of Object.entries(AT_HOME)) {
      for (const [, fi] of text.matchAll(/\*([^*]+)\*/g)) {
        if (saidClean.has(clean(fi))) continue;
        const words = fi.match(/[\p{L}-]+/gu) ?? [];
        if (!words.every((w) => lookupWord(w))) bad.push(`${id}: ${fi}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("a story's or scene's prompt plays a line it already has", () => {
    for (const s of courseStories) {
      const p = storyTogether(s);
      expect(p.fi && storyLines(s).some((l) => l.fi === p.fi), s.id).toBe(true);
    }
    for (const c of conversations) expect(sceneTogether(c).fi, c.id).toBe(c.turns[0].partner.fi);
  });

  it('links only to real https pages', () => {
    for (const l of SONG_LINKS) expect(l.href).toMatch(/^https:\/\//);
  });
});
