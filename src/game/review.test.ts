import { describe, it, expect } from 'vitest';
import { placeRank, reviewEntries, reviewSections } from './reviewEntries';
import { UNIT_STORIES } from '../content/unitStories';
import { PATH } from './path';
import {
  applyReviewToLedger,
  entryStatus,
  mergeReview,
  parseReviewFile,
  reviewCounts,
  reviewFile,
} from './review';

const entries = reviewEntries();
const e = (key: string) => entries.find((x) => x.key === key)!;

describe('review entries', () => {
  it('have unique, stable keys across every section', () => {
    const keys = entries.map((x) => x.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(reviewSections().map((s) => s.id)).toEqual(
      expect.arrayContaining(['stories', 'conversations', 'carriers', 'slips', 'lessons', 'pronouns']),
    );
  });

  it('key a wrong reply by its own words, so adding or removing another never moves it', () => {
    const lines = entries.filter((x) => x.key.startsWith('line:'));
    expect(lines.length).toBeGreaterThan(20);
    for (const x of lines) expect(x.key).toBe(`line:${x.fi}`);
  });

  it('include every unit story and the forms each pattern marks wrong', () => {
    for (const s of UNIT_STORIES) expect(e(`story:${s.id}:page-1`)?.fi).toContain(s.pages[0].lines[0].fi);
    expect(e('slip:i-havent').fi).toMatch(/✓ — marked wrong: .*/);
  });

  // The Finnish check runs in course order, so a reviewer checks first what
  // the children meet first.
  it('each say where a child first meets it', () => {
    const unitOf = (id: string) => PATH.findIndex((u) => u.id === id) + 1;
    for (const x of entries) {
      expect(typeof x.where === 'number' ? x.where >= 1 && x.where <= PATH.length : ['everywhere', 'grown-ups', 'not-yet'].includes(x.where), x.key).toBe(true);
    }
    expect(e('dialogue:how-are-you').where).toBe(unitOf('hello'));
    expect(e('lesson:sounds:2').where).toBe(unitOf('hello'));
    expect(e('carrier:this-is').where).toBe(unitOf('people'));
    expect(e('slip:i-havent').where).toBe(unitOf('not-having'));
    expect(e('story:what-we-have:page-1').where).toBe(unitOf('having'));
    expect(e('conversation:whose-thing:1').where).toBe(unitOf('owners'));
    expect(e('pronoun-frame:help').where).toBe(unitOf('me-you'));
    expect(e('pattern:compare').where).toBe(unitOf('comparing'));
    expect(e('ordinal:eleventh').where).toBe(unitOf('birthdays'));
    // "Syötkö?" is asked from the asking unit on; a verb met only later is never asked
    expect(e('question:eat').where).toBe(unitOf('asking'));
    expect(e('question:need').where).toBe('not-yet');
    // the screens' own words come first, the grown-ups' section last
    expect(e('letter:a').where).toBe('everywhere');
    expect(e('ui:Jatka').where).toBe('everywhere');
    expect(e('ui:Mykistä äänet').where).toBe('grown-ups');
    expect(placeRank('everywhere')).toBeLessThan(placeRank(1));
    expect(placeRank(PATH.length)).toBeLessThan(placeRank('not-yet'));
  });
});

describe('decisions', () => {
  const ledger = new Set(['dialogue:thanks']);
  const story = e('story:hello-eero:page-1');

  it('a decision holds only while the Finnish reads the same', () => {
    expect(entryStatus(story, {}, ledger)).toBe('todo');
    expect(entryStatus(e('dialogue:thanks'), {}, ledger)).toBe('ledger');
    expect(entryStatus(story, { [story.key]: { status: 'ok', fi: story.fi, at: 1 } }, ledger)).toBe('ok');
    expect(entryStatus(story, { [story.key]: { status: 'ok', fi: 'Hei! Minä olin Aino.', at: 1 } }, ledger)).toBe('changed');
    const counts = reviewCounts([story, e('dialogue:thanks')], { [story.key]: { status: 'fix', fi: story.fi, at: 1 } }, ledger);
    expect(counts).toMatchObject({ total: 2, fix: 1, ledger: 1, todo: 0 });
  });

  it('round-trips through the downloaded file, and merges with the newer answer winning', () => {
    const state = {
      reviewer: 'Maija',
      decisions: { [story.key]: { status: 'fix' as const, fi: story.fi, at: 5, note: 'Luonnoton' } },
    };
    const file = reviewFile(state, entries, Date.UTC(2026, 9, 8));
    expect(file.decisions[0]).toMatchObject({ key: story.key, status: 'fix', note: 'Luonnoton', en: story.en });
    const parsed = parseReviewFile(JSON.stringify(file))!;
    expect(parsed.reviewer).toBe('Maija');
    expect(parseReviewFile('{"kind":"backup"}')).toBeNull();
    expect(parseReviewFile('not json')).toBeNull();
    // Another device approved it later → the newer decision wins.
    const merged = mergeReview(state, {
      ...file,
      decisions: [{ key: story.key, status: 'ok', fi: story.fi, at: 9 }],
    });
    expect(merged.decisions[story.key].status).toBe('ok');
    expect(mergeReview(merged, file).decisions[story.key].status).toBe('ok');
  });

  it('folds approvals into the ledger, flags fixes, and skips changed text', () => {
    const page2 = e('story:hello-eero:page-2');
    const page3 = e('story:hello-eero:page-3');
    const file = reviewFile(
      {
        reviewer: 'Maija',
        decisions: {
          [story.key]: { status: 'ok', fi: story.fi, at: 1 },
          [page2.key]: { status: 'fix', fi: page2.fi, at: 1, note: 'Parempi: Moi!', suggestion: 'Moi! Minä olen Eero.' },
          [page3.key]: { status: 'ok', fi: 'vanha teksti', at: 1 },
          'story:gone:page-1': { status: 'ok', fi: 'x', at: 1 },
        },
      },
      entries,
      0,
    );
    const out = applyReviewToLedger(['dialogue:thanks', page2.key], file, entries);
    expect(out.vetted).toEqual(['dialogue:thanks', story.key].sort());
    expect(out.flags[page2.key]).toMatchObject({ note: 'Parempi: Moi!', suggestion: 'Moi! Minä olen Eero.', reviewer: 'Maija' });
    expect(out.stale).toEqual([page3.key]);
    expect(out.unknown).toEqual(['story:gone:page-1']);
  });
});
