// Comparing — "Norsu on isompi kuin hiiri." (The elephant is bigger than the
// mouse.) / "Norsu on isoin." (The elephant is the biggest.)
//
// The FINNISH forms are all looked up: the nouns' basic forms and the
// adjective degrees (`item.degrees`, dictionary headwords "isompi" / "isoin"
// from the sourced data). What is AUTHORED here is (a) world knowledge — which
// thing really is bigger / faster / older, as rankings of item ids — and
// (b) the tiny frame words "on" (is), "kuin" (than), "Kumpi…?" (which of the
// two?), "Mikä / Kuka…?" (which / who?).
// ⚠️ NEEDS NATIVE FINNISH VETTING (the frames; listed in FINNISH_REVIEW.md).

import type { LexicalItem } from './types';
import type { Segment } from './endings';
import { itemById } from './lookup';

export type Degree = 'base' | 'comparative' | 'superlative';

/**
 * Rankings: for an adjective, groups of item ids from the MOST to the LEAST
 * (big: elephant first). Items in the same group are never compared with each
 * other, and neighbours are only compared when the gap is clear (see `minGap`).
 */
export interface Ranking {
  adj: string;
  /** Groups, most → least. */
  order: string[][];
  /** The adjective that reads the ranking backwards (big ↔ small). */
  opposite?: string;
  /** Groups apart a pair must be (default 1). */
  minGap?: number;
  /** People are asked about with "Kuka" (who), animals and things with "Mikä". */
  people?: boolean;
}

export const RANKINGS: Ranking[] = [
  {
    adj: 'big',
    opposite: 'small',
    order: [['elephant'], ['horse', 'cow', 'bear'], ['dog', 'sheep', 'pig'], ['cat', 'fox'], ['bunny', 'duck', 'chicken'], ['mouse', 'frog'], ['bee', 'butterfly']],
    minGap: 2,
  },
  {
    adj: 'big',
    opposite: 'small',
    order: [['house', 'school'], ['bus', 'train'], ['car'], ['bed', 'sofa'], ['chair'], ['ball', 'book'], ['pencil']],
    minGap: 2,
  },
  {
    adj: 'fast',
    order: [['train', 'car'], ['horse', 'lion'], ['dog', 'cat'], ['cow', 'pig', 'sheep'], ['frog', 'mouse']],
    minGap: 2,
  },
  {
    adj: 'old',
    opposite: 'young',
    order: [['grandfather', 'grandmother'], ['father', 'mother', 'teacher'], ['brother', 'sister', 'pupil'], ['baby']],
    people: true,
  },
  {
    adj: 'tall',
    order: [['elephant'], ['horse', 'cow'], ['dog', 'sheep'], ['cat', 'bunny'], ['mouse', 'frog']],
    minGap: 2,
  },
  {
    adj: 'strong',
    order: [['elephant'], ['bear', 'horse', 'lion'], ['dog', 'wolf'], ['cat', 'fox'], ['mouse', 'frog']],
    minGap: 2,
  },
];

/** The sourced form of an adjective at a degree. */
export function degreeForm(adj: LexicalItem, d: Degree): string | undefined {
  if (d === 'base') return adj.fi;
  return adj.degrees?.[d];
}

/** English for the degree: "big" / "bigger" / "biggest" (AGID). */
export function degreeEnglish(adj: LexicalItem, d: Degree): string | undefined {
  if (d === 'base') return adj.en;
  return adj.english?.[d];
}

/** Adjectives that can be compared (have both sourced degrees). */
export function comparable(adjectives: readonly LexicalItem[]): LexicalItem[] {
  return adjectives.filter((a) => a.degrees?.comparative && a.degrees?.superlative);
}

/**
 * The degree form with the part that MAKES the degree marked — "-mpi" in
 * "isompi", "-in" in "isoin" — only marking, never building. Irregular forms
 * that don't end that way ("paras") stay unmarked.
 */
export function degreeSegments(form: string, d: Degree): Segment[] {
  const end = d === 'comparative' ? 'mpi' : d === 'superlative' ? 'in' : '';
  if (end && form.endsWith(end)) return [{ text: form.slice(0, -end.length) }, { text: end, mark: true }];
  return [{ text: form }];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface Comparison {
  adj: LexicalItem;
  /** The one that IS more (bigger / older…) for `adj`. */
  more: LexicalItem;
  less: LexicalItem;
}

/** "Norsu on isompi kuin hiiri." — X on [comparative] kuin Y. */
export function comparisonSentence(adj: LexicalItem, x: LexicalItem, y: LexicalItem, d: Degree = 'comparative'): string | undefined {
  const f = degreeForm(adj, d);
  return f ? `${cap(x.fi)} on ${f} kuin ${y.fi}.` : undefined;
}

/** The same sentence as segments, the degree ending marked. */
export function comparisonSegments(adj: LexicalItem, x: LexicalItem, y: LexicalItem): Segment[] | undefined {
  const f = degreeForm(adj, 'comparative');
  if (!f) return undefined;
  return [{ text: `${cap(x.fi)} on ` }, ...degreeSegments(f, 'comparative'), { text: ` kuin ${y.fi}.` }];
}

/** "Norsu on isoin." */
export function superlativeSentence(adj: LexicalItem, x: LexicalItem): string | undefined {
  const f = degreeForm(adj, 'superlative');
  return f ? `${cap(x.fi)} on ${f}.` : undefined;
}

export function superlativeSegments(adj: LexicalItem, x: LexicalItem): Segment[] | undefined {
  const f = degreeForm(adj, 'superlative');
  if (!f) return undefined;
  return [{ text: `${cap(x.fi)} on ` }, ...degreeSegments(f, 'superlative'), { text: '.' }];
}

// Family members a child calls by name — "Grandpa", not "the grandfather".
const FAMILY_NAMES: Record<string, string> = {
  mother: 'Mom',
  father: 'Dad',
  grandmother: 'Grandma',
  grandfather: 'Grandpa',
};
/** "the elephant", "Grandma" — how the English names one of them. */
export const enName = (x: LexicalItem) => FAMILY_NAMES[x.id] ?? `the ${x.en}`;

/** "The elephant is bigger than the mouse." */
export function comparisonEnglish(adj: LexicalItem, x: LexicalItem, y: LexicalItem): string {
  return cap(`${enName(x)} is ${degreeEnglish(adj, 'comparative')} than ${enName(y)}.`);
}

export function superlativeEnglish(adj: LexicalItem, x: LexicalItem): string {
  return cap(`${enName(x)} is the ${degreeEnglish(adj, 'superlative')}.`);
}

/** "Kumpi on isompi?" — which of the two is bigger? */
export function whichOfTwo(adj: LexicalItem): string | undefined {
  const f = degreeForm(adj, 'comparative');
  return f && `Kumpi on ${f}?`;
}

/** "Mikä on isoin?" / "Kuka on vanhin?" */
export function whichIsMost(adj: LexicalItem, people: boolean): string | undefined {
  const f = degreeForm(adj, 'superlative');
  return f && `${people ? 'Kuka' : 'Mikä'} on ${f}?`;
}

/** A ranking's groups as items, keeping only words in `known` (all if unset). */
function groupsOf(r: Ranking, known?: ReadonlySet<string>): LexicalItem[][] {
  return r.order
    .map((g) => g.filter((id) => !known || known.has(id)).map((id) => itemById(id)).filter((x): x is LexicalItem => !!x))
    .filter((g) => g.length > 0);
}

/** Every true comparison the rankings allow, for these adjectives and words. */
export function comparisons(adjectives: readonly LexicalItem[], known?: ReadonlySet<string>): Comparison[] {
  const byId = new Map(comparable(adjectives).map((a) => [a.id, a]));
  const out: Comparison[] = [];
  for (const r of RANKINGS) {
    const groups = groupsOf(r, known);
    const gap = r.minGap ?? 1;
    // Group distance is measured in the ORIGINAL ranking, so dropping unknown
    // words never brings two close things "next to" each other.
    const rank = new Map(r.order.flatMap((g, i) => g.map((id) => [id, i] as const)));
    const flat = groups.flat();
    for (const a of flat) {
      for (const b of flat) {
        if ((rank.get(b.id) ?? 0) - (rank.get(a.id) ?? 0) < gap) continue;
        const adj = byId.get(r.adj);
        if (adj) out.push({ adj, more: a, less: b });
        const opp = r.opposite && byId.get(r.opposite);
        if (opp) out.push({ adj: opp, more: b, less: a });
      }
    }
  }
  return out;
}

export interface Contest {
  adj: LexicalItem;
  /** The winner (the biggest…), then the others. */
  winner: LexicalItem;
  others: LexicalItem[];
  people: boolean;
}

/** Three-way "which is the biggest?" contests: one item per well-separated group. */
export function contests(adjectives: readonly LexicalItem[], known?: ReadonlySet<string>): Contest[] {
  const byId = new Map(comparable(adjectives).map((a) => [a.id, a]));
  const out: Contest[] = [];
  for (const r of RANKINGS) {
    const groups = groupsOf(r, known);
    const rank = new Map(r.order.flatMap((g, i) => g.map((id) => [id, i] as const)));
    const gap = r.minGap ?? 1;
    // Every pick of three from groups pairwise ≥ gap apart.
    const flat = groups.flat();
    for (const a of flat) {
      for (const b of flat) {
        for (const c of flat) {
          const ra = rank.get(a.id)!;
          const rb = rank.get(b.id)!;
          const rc = rank.get(c.id)!;
          if (!(rb - ra >= gap && rc - rb >= gap)) continue;
          const adj = byId.get(r.adj);
          if (adj) out.push({ adj, winner: a, others: [b, c], people: !!r.people });
          const opp = r.opposite && byId.get(r.opposite);
          if (opp) out.push({ adj: opp, winner: c, others: [a, b], people: !!r.people });
        }
      }
    }
  }
  return out;
}
