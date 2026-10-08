import { describe, it, expect } from 'vitest';
import { reviewEntries, reviewSections } from './reviewEntries';
import { UNIT_STORIES } from '../content/unitStories';
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

  it('include every unit story and the forms each pattern marks wrong', () => {
    for (const s of UNIT_STORIES) expect(e(`story:${s.id}:page-1`)?.fi).toBe(s.pages[0].fi);
    expect(e('slip:i-havent').fi).toMatch(/✓ — marked wrong: .*/);
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
