// Parser for AGID (data/english-agid/infl.txt) — turns the vendored English
// inflection database into per-word morphology the build attaches to each item.
//
// AGID line format: `word POS: <slots>` where POS is N | V | A | Av (optionally
// with ? / ! quality marks), slots are separated by " | ", and each slot may
// list comma-separated variants with annotations:
//   child N: children
//   fish N: fish, fishes {:1}                 # take the first variant → "fish"
//   eat V: ate | eaten | eating | eats        # past | pastPart | presPart | 3sg
//   answer V: answered | answering | answers  # regular: past==pastPart → 3 slots
//   good A: better | best                     # comparative | superlative
//
// Multiword lemmas ("wake up", "ice cream") aren't in AGID as such; we decompose
// them — phrasal verbs conjugate the head verb + keep the particle; compound
// nouns pluralize the final word.

import { readFileSync } from 'node:fs';

/** Strip AGID annotations from a single form token, keeping the primary variant. */
function cleanForm(slot) {
  let s = String(slot).split(',')[0]; // primary variant (before first comma)
  s = s.replace(/\{[^}]*\}/g, ''); // {usage notes}, {:1}
  s = s.replace(/[?!<>~]/g, ''); // quality / provenance marks
  s = s.replace(/\s+\d+\s*$/, ''); // trailing rank " 1" / " 2"
  return s.trim();
}

/**
 * Load AGID into `Map<lowerWord, Map<POS, rawSlotString>>`. When the same
 * (word, POS) appears more than once (e.g. "cat" and "CAT"), prefer the
 * all-lowercase common-word line.
 */
export function loadAgid(path) {
  const byLower = new Map();
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const m = line.match(/^(.+?)\s+(N|V|A|Av)[?!]*:\s*(.*)$/);
    if (!m) continue;
    const [, word, pos, raw] = m;
    const key = word.toLowerCase();
    let posMap = byLower.get(key);
    if (!posMap) byLower.set(key, (posMap = new Map()));
    const isLower = word === word.toLowerCase();
    if (!posMap.has(pos) || (isLower && posMap.get(pos).word !== word)) {
      // store raw + the source word so we can prefer the lowercase spelling
      if (!posMap.has(pos) || isLower) posMap.set(pos, { raw, word });
    }
  }
  return byLower;
}

function rawFor(agid, lemma, pos) {
  const posMap = agid.get(lemma.toLowerCase());
  return posMap?.get(pos)?.raw ?? null;
}

/** Verb slots → normalized forms (3 slots = regular, 4 = irregular past≠pastPart). */
function verbFormsFromRaw(raw) {
  const slots = raw.split('|').map(cleanForm).filter(Boolean);
  if (slots.length === 4) {
    return { past: slots[0], pastParticiple: slots[1], gerund: slots[2], thirdSg: slots[3] };
  }
  if (slots.length === 3) {
    return { past: slots[0], pastParticiple: slots[0], gerund: slots[1], thirdSg: slots[2] };
  }
  return null; // suppletive (e.g. "be", 8 slots) — caller special-cases
}

// The one suppletive verb; its person forms are handled in the runtime copula
// path, but we attach the canonical (3sg-ish) forms so every verb resolves.
const BE = { thirdSg: 'is', past: 'was', pastParticiple: 'been', gerund: 'being' };

/**
 * English morphology for one vocabulary word, sourced from AGID.
 * `pos` is 'N' | 'V' | 'A'. Returns null if unresolved (build should fail loud).
 */
export function englishFormsFor(agid, lemma, pos) {
  if (pos === 'V' && lemma.toLowerCase() === 'be') return { ...BE };

  // Multiword: decompose rather than hardcode forms.
  if (lemma.includes(' ')) {
    const words = lemma.split(' ');
    if (pos === 'V') {
      const head = words[0];
      const particle = words.slice(1).join(' ');
      const hv = englishFormsFor(agid, head, 'V');
      if (!hv) return null;
      return {
        past: `${hv.past} ${particle}`,
        pastParticiple: `${hv.pastParticiple} ${particle}`,
        gerund: `${hv.gerund} ${particle}`,
        thirdSg: `${hv.thirdSg} ${particle}`,
      };
    }
    if (pos === 'N') {
      const last = words[words.length - 1];
      const prefix = words.slice(0, -1).join(' ');
      const nf = englishFormsFor(agid, last, 'N');
      if (!nf) return null;
      return { plural: `${prefix} ${nf.plural}` };
    }
    return null;
  }

  if (pos === 'N') {
    const raw = rawFor(agid, lemma, 'N');
    const plural = raw ? cleanForm(raw.split('|')[0]) : null;
    return plural ? { plural } : null;
  }
  if (pos === 'V') {
    const raw = rawFor(agid, lemma, 'V');
    return raw ? verbFormsFromRaw(raw) : null;
  }
  if (pos === 'A') {
    const raw = rawFor(agid, lemma, 'A');
    if (!raw) return null;
    const slots = raw.split('|').map(cleanForm).filter(Boolean);
    if (slots.length < 2) return null;
    return { comparative: slots[0], superlative: slots[1] };
  }
  return null;
}
