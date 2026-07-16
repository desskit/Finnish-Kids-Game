import type { ActivityKind } from './path';

// The grown-up Audit harness walks this registry: one entry per distinct game
// FUNCTION in the app, each pinned to a representative skill node so it renders
// with real content. Order = the app's rough learning order. Labels are the
// clear "what is this?" the auditor sees above each game.
//
// `skillId` is the node whose content the game draws from (see path.tsx);
// `review` has no path node (its own route), so it renders standalone.

export interface AuditEntry {
  /** Stable id used as the grade key + localStorage key. */
  id: string;
  /** Which game to render. */
  kind: ActivityKind;
  /** Representative skill node id (null for review, which is standalone). */
  skillId: string | null;
  titleFi: string;
  titleEn: string;
  /** One line on what this game tests, shown under the label. */
  desc: string;
}

export const AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: 'listen',
    kind: 'listen',
    skillId: 'listen-animals',
    titleFi: 'Kuuntele ja osoita',
    titleEn: 'Listen & Tap',
    desc: 'Hear a Finnish word, tap its picture (recognition).',
  },
  {
    id: 'name',
    kind: 'name',
    skillId: 'listen-animals',
    titleFi: 'Nimeä se',
    titleEn: 'Name it',
    desc: 'See a picture, pick the Finnish word (production recall).',
  },
  {
    id: 'listen-sentence',
    kind: 'listen-sentence',
    skillId: 'listen-animals',
    titleFi: 'Kuuntele lause',
    titleEn: 'Listen to a sentence',
    desc: 'Hear a full carrier sentence, tap the picture it is about.',
  },
  {
    id: 'reading',
    kind: 'reading',
    skillId: 'reading',
    titleFi: 'Lue lause',
    titleEn: 'Read a sentence',
    desc: 'Read a real (kid-safe) example sentence, tap the matching picture.',
  },
  {
    id: 'match',
    kind: 'match',
    skillId: 'match',
    titleFi: 'Yhdistä sanat',
    titleEn: 'Describe it (agreement)',
    desc: 'Pick the adjective + noun that agree.',
  },
  {
    id: 'count',
    kind: 'count',
    skillId: 'count',
    titleFi: 'Laske ja sano',
    titleEn: 'Count & Say',
    desc: 'Count the objects, pick the right number word.',
  },
  {
    id: 'conjugate',
    kind: 'conjugate',
    skillId: 'conjugate',
    titleFi: 'Taivuta verbi',
    titleEn: 'Conjugate the verb',
    desc: 'Pick the right verb form for I / you / he.',
  },
  {
    id: 'command',
    kind: 'command',
    skillId: 'commands',
    titleFi: 'Tee näin!',
    titleEn: 'Commands (TPR)',
    desc: 'Hear an imperative ("Hyppää!"), tap the matching action picture.',
  },
  {
    id: 'yesno',
    kind: 'yesno',
    skillId: 'is-this',
    titleFi: 'Onko tämä…?',
    titleEn: 'Yes/no questions',
    desc: 'See a picture, hear a -ko question, answer Kyllä or Ei.',
  },
  {
    id: 'build',
    kind: 'build',
    skillId: 'i-have',
    titleFi: 'Rakenna lause',
    titleEn: 'Build a phrase',
    desc: 'Assemble a carrier phrase from word tiles.',
  },
  {
    id: 'order',
    kind: 'order',
    skillId: 'order',
    titleFi: 'Järjestä sanat',
    titleEn: 'Word order',
    desc: 'Put the words of a phrase in the right order.',
  },
  {
    id: 'spell',
    kind: 'spell',
    skillId: 'spell',
    titleFi: 'Kirjoita sana',
    titleEn: 'Spelling',
    desc: 'Type the sourced (inflected) Finnish form.',
  },
  {
    id: 'sentence',
    kind: 'sentence',
    skillId: 'full-sentences',
    titleFi: 'Järjestä lause',
    titleEn: 'Sentences (word order)',
    desc: 'Assemble a whole sentence from tiles.',
  },
  {
    id: 'sentence-type',
    kind: 'sentence-type',
    skillId: 'full-sentences',
    titleFi: 'Kirjoita lause',
    titleEn: 'Write the sentence',
    desc: 'Type a full sentence from the English gloss.',
  },
  {
    id: 'say',
    kind: 'say',
    skillId: 'listen-animals',
    titleFi: 'Sano se',
    titleEn: 'Say it (speaking)',
    desc: 'Repeat the Finnish aloud; mic scoring or a self-report fallback.',
  },
  {
    id: 'dialogue',
    kind: 'dialogue',
    skillId: 'greetings',
    titleFi: 'Tervehdykset',
    titleEn: 'Greetings (choose the reply)',
    desc: 'Hear a line, pick the fitting reply.',
  },
  {
    id: 'conversation',
    kind: 'conversation',
    skillId: 'small-talk',
    titleFi: 'Jutellaan',
    titleEn: 'Small talk',
    desc: 'Hold a short multi-turn conversation, turn by turn.',
  },
  {
    id: 'review',
    kind: 'review',
    skillId: null,
    titleFi: 'Kertaus',
    titleEn: 'Review (spaced repetition)',
    desc: 'SRS review across topics; format escalates with mastery.',
  },
];

export type Grade = 'pass' | 'needs-work';

export interface GradeRecord {
  grade: Grade;
  /** Epoch ms of the most recent grade. */
  at: number;
  /** How many rounds were played before grading (Next presses + the graded one). */
  tests: number;
  /** Optional free-text note (esp. useful for "needs work"). */
  note?: string;
  /**
   * The EFFECTIVE difficulty this function was graded at — the slider value
   * clamped to the game's own `maxLevel` (a node never reaches past its cap in
   * real play, so the audit shouldn't test above it). Optional for back-compat
   * with grades recorded before this was tracked.
   */
  level?: number;
}

/** Persisted audit state (localStorage `fkg.audit.v1`). */
export interface AuditState {
  startedAt: number;
  /** Which entry ids are IN this audit's scope (checkboxes). */
  scope: string[];
  /** Latest grade per entry id. */
  grades: Record<string, GradeRecord>;
}

export const AUDIT_KEY = 'fkg.audit.v1';

export function emptyAudit(): AuditState {
  return { startedAt: Date.now(), scope: AUDIT_ENTRIES.map((e) => e.id), grades: {} };
}

/** Build a human-readable Markdown audit report for download. */
export function auditReportMarkdown(state: AuditState, level: number): string {
  const inScope = AUDIT_ENTRIES.filter((e) => state.scope.includes(e.id));
  const passed = inScope.filter((e) => state.grades[e.id]?.grade === 'pass').length;
  const needs = inScope.filter((e) => state.grades[e.id]?.grade === 'needs-work').length;
  const ungraded = inScope.length - passed - needs;

  const lines: string[] = [];
  lines.push('# Finnish Kids Game — Audit report');
  lines.push('');
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push(`- Started: ${new Date(state.startedAt).toISOString()}`);
  // The slider value at export time — informational only. The level each
  // function was ACTUALLY graded at is per-row in the table below (it can differ
  // between functions, and is capped at each game's own max).
  lines.push(`- Difficulty slider at export: ${level}`);
  lines.push(`- In scope: ${inScope.length} of ${AUDIT_ENTRIES.length} game functions`);
  lines.push(`- **Pass: ${passed} · Needs work: ${needs} · Ungraded: ${ungraded}**`);
  lines.push('');
  lines.push('| Game function | Grade | Level | Times tested | Last graded | Notes |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const e of inScope) {
    const g = state.grades[e.id];
    const grade = g ? (g.grade === 'pass' ? '✅ Pass' : '⚠️ Needs work') : '—';
    const gradedLevel = g?.level != null ? `L${g.level}` : '—';
    const tested = g ? String(g.tests) : '—';
    const when = g ? new Date(g.at).toISOString() : '—';
    const note = g?.note ? g.note.replace(/\|/g, '\\|').replace(/\n/g, ' ') : '';
    lines.push(
      `| ${e.titleEn} (${e.titleFi}) | ${grade} | ${gradedLevel} | ${tested} | ${when} | ${note} |`,
    );
  }
  // Also list anything left out of scope, for completeness.
  const out = AUDIT_ENTRIES.filter((e) => !state.scope.includes(e.id));
  if (out.length > 0) {
    lines.push('');
    lines.push('_Out of scope this run: ' + out.map((e) => e.titleEn).join(', ') + '._');
  }
  lines.push('');
  return lines.join('\n');
}
