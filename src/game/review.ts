// The native reviewer's in-app "Finnish check": pure helpers over the review
// entries (game/reviewEntries.ts), the decisions made on this device, and
// the reviewer's ledger (data/finnish-vetted.json).
//
// A decision remembers the Finnish AS IT READ when it was made. If the text
// later changes, the decision lapses (the entry needs checking again) — an old
// "correct" never vouches for new words.

import type { ReviewDecision, ReviewState } from '../state/storage';
import type { ReviewEntry } from './reviewEntries';

export type EntryStatus =
  /** Approved in the reviewer's ledger (data/finnish-vetted.json). */
  | 'ledger'
  /** Marked correct on this device. */
  | 'ok'
  /** Marked as needing a fix on this device. */
  | 'fix'
  /** Decided before, but the Finnish has changed since. */
  | 'changed'
  /** Not checked yet. */
  | 'todo';

export function entryStatus(
  entry: ReviewEntry,
  decisions: Readonly<Record<string, ReviewDecision>> | undefined,
  ledger: ReadonlySet<string>,
): EntryStatus {
  const d = decisions?.[entry.key];
  if (d) return d.fi === entry.fi ? d.status : 'changed';
  return ledger.has(entry.key) ? 'ledger' : 'todo';
}

export interface ReviewCounts {
  total: number;
  ledger: number;
  ok: number;
  fix: number;
  changed: number;
  todo: number;
}

export function reviewCounts(
  entries: readonly ReviewEntry[],
  decisions: Readonly<Record<string, ReviewDecision>> | undefined,
  ledger: ReadonlySet<string>,
): ReviewCounts {
  const c: ReviewCounts = { total: entries.length, ledger: 0, ok: 0, fix: 0, changed: 0, todo: 0 };
  for (const e of entries) c[entryStatus(e, decisions, ledger)] += 1;
  return c;
}

/** The file a reviewer downloads and sends to the developer. */
export interface ReviewFile {
  app: 'finnish-kids-game';
  kind: 'finnish-review';
  version: 1;
  reviewer?: string;
  exportedAt: string;
  decisions: (ReviewDecision & { key: string; en?: string })[];
}

export function reviewFile(state: ReviewState | undefined, entries: readonly ReviewEntry[], now: number): ReviewFile {
  const en = new Map(entries.map((e) => [e.key, e.en]));
  return {
    app: 'finnish-kids-game',
    kind: 'finnish-review',
    version: 1,
    reviewer: state?.reviewer || undefined,
    exportedAt: new Date(now).toISOString(),
    decisions: Object.entries(state?.decisions ?? {})
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, d]) => ({ key, ...d, en: en.get(key) })),
  };
}

/** Read a downloaded review file back (another device's work); null if it isn't one. */
export function parseReviewFile(text: string): ReviewFile | null {
  try {
    const f = JSON.parse(text) as Partial<ReviewFile>;
    if (f.kind !== 'finnish-review' || !Array.isArray(f.decisions)) return null;
    const ok = f.decisions.every(
      (d) => d && typeof d.key === 'string' && (d.status === 'ok' || d.status === 'fix') && typeof d.fi === 'string',
    );
    return ok ? (f as ReviewFile) : null;
  } catch {
    return null;
  }
}

/** Merge another device's decisions in: for each entry, the newer decision wins. */
export function mergeReview(mine: ReviewState | undefined, file: ReviewFile): ReviewState {
  const decisions = { ...(mine?.decisions ?? {}) };
  for (const { key, status, fi, note, suggestion, at } of file.decisions) {
    const prev = decisions[key];
    if (!prev || (at ?? 0) > prev.at) {
      decisions[key] = { status, fi, at: at ?? 0, ...(note ? { note } : {}), ...(suggestion ? { suggestion } : {}) };
    }
  }
  return { reviewer: mine?.reviewer || file.reviewer, decisions };
}

export interface LedgerUpdate {
  /** The new ledger list (sorted, deduplicated). */
  vetted: string[];
  /** Entries flagged as needing a fix: key → the reviewer's note / suggestion. */
  flags: Record<string, { fi: string; note?: string; suggestion?: string; reviewer?: string }>;
  /** Approvals skipped because the Finnish has changed since it was reviewed. */
  stale: string[];
  /** Keys in the file that no longer exist. */
  unknown: string[];
}

/**
 * Fold a downloaded review into the reviewer's ledger (the developer's side:
 * `npm run review:import`). An approval counts only if the entry still reads
 * exactly as reviewed; a "needs a fix" removes the key from the ledger and
 * records the note.
 */
export function applyReviewToLedger(
  vetted: readonly string[],
  file: ReviewFile,
  entries: readonly ReviewEntry[],
  existingFlags: LedgerUpdate['flags'] = {},
): LedgerUpdate {
  const current = new Map(entries.map((e) => [e.key, e.fi]));
  const ledger = new Set(vetted);
  const flags = { ...existingFlags };
  const stale: string[] = [];
  const unknown: string[] = [];
  for (const d of file.decisions) {
    const fi = current.get(d.key);
    if (fi === undefined) {
      unknown.push(d.key);
      continue;
    }
    if (fi !== d.fi) {
      stale.push(d.key);
      continue;
    }
    if (d.status === 'ok') {
      ledger.add(d.key);
      delete flags[d.key];
    } else {
      ledger.delete(d.key);
      flags[d.key] = {
        fi: d.fi,
        ...(d.note ? { note: d.note } : {}),
        ...(d.suggestion ? { suggestion: d.suggestion } : {}),
        ...(file.reviewer ? { reviewer: file.reviewer } : {}),
      };
    }
  }
  return { vetted: [...ledger].sort(), flags, stale, unknown };
}
