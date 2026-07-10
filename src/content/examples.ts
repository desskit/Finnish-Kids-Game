// Authentic input — surfacing the sourced example sentences (from Tatoeba) that
// are safe + simple enough for young children. The raw examples are a mix: some
// are perfect ("Pidän kissoista." — I like cats.), others are archaic, garbled,
// off-topic, or touch grown-up themes. This is a CONSERVATIVE automated filter,
// not a substitute for a human pass — it errs heavily toward excluding.
//
// A caregiver-review workflow can later promote borderline cases; for now we
// only ever show sentences that clear every gate below.

import type { Example, LexicalItem } from './types';

const MAX_WORDS = 6;

// Only plain modern Finnish letters + basic punctuation (rejects archaic/garbled
// spellings like "Cauattacat teitenne Coirilda", which carry stray letters).
const FINNISH_ONLY = /^[a-zàäöåA-ZÄÖÅ0-9 ,.!?'’-]+$/;

// Grown-up / scary / unkind themes, matched as stems so inflections are caught.
// Deliberately broad — a false exclude just means one fewer sentence.
const DENY =
  /\b(kuol|kuole|kuoli|tapp|veri|verta|ase|aseen|sota|sodan|metsäst|humal|viina|olut|kalja|alkohol|huume|seks|alaston|paha|pahan|ilke|väkival|paska|vittu|perkele|helvet|saatan|kusi|perse|pelk|pelo|kammo|itke|kyyne|sairas|kipu|vihaa|inhoa|tyhmä|typerä|kirot)/i;
// English-side deny too, so an off-theme translation is caught even if the
// Finnish stem slips through.
const DENY_EN = /\b(die|dead|death|kill|blood|gun|weapon|war|hunt|drunk|alcohol|beer|wine|drug|sex|naked|hate|evil|stupid|scary|afraid|cry|sick|hurt)/i;

/** Does a sentence look like a clean, kid-appropriate one-liner featuring the word? */
function isKidSafe(fi: string, en: string, stem: string): boolean {
  const f = fi.trim();
  if (!f || !en.trim()) return false;
  if (f.split(/\s+/).length > MAX_WORDS) return false; // short only
  if (!FINNISH_ONLY.test(f)) return false; // modern Finnish only
  if (!/[.?!]$/.test(f)) return false; // a complete sentence
  if (!f.toLowerCase().includes(stem)) return false; // actually features the word
  if (DENY.test(f) || DENY_EN.test(en)) return false; // no grown-up/scary/unkind themes
  return true;
}

/** The word's stem for a "features the word" check (first few letters). */
function stemOf(item: LexicalItem): string {
  return item.fi.slice(0, Math.min(4, item.fi.length)).toLowerCase();
}

/** The subset of an item's sourced examples that pass every kid-safety gate. */
export function kidSafeExamples(item: LexicalItem): Example[] {
  const stem = stemOf(item);
  const seen = new Set<string>();
  const out: Example[] = [];
  for (const e of item.examples ?? []) {
    if (!isKidSafe(e.fi, e.en, stem)) continue;
    const key = e.fi.trim().toLowerCase();
    if (seen.has(key)) continue; // drop duplicate translations
    seen.add(key);
    out.push({ fi: e.fi.trim(), en: e.en.trim() });
  }
  return out;
}

/** Items (from the given pools) that have at least one kid-safe example. */
export function itemsWithExamples(items: readonly LexicalItem[]): LexicalItem[] {
  return items.filter((i) => i.emoji && kidSafeExamples(i).length > 0);
}
