import { describe, it, expect } from 'vitest';
import { AUDIT_ENTRIES, auditReportMarkdown, emptyAudit, type AuditState } from './audit';
import { findSkill, renderActivity } from './path';

const noop = () => {};

describe('audit registry', () => {
  it('has unique ids and a real, renderable node for every non-review function', () => {
    const ids = AUDIT_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of AUDIT_ENTRIES) {
      expect(e.titleFi).toBeTruthy();
      expect(e.titleEn).toBeTruthy();
      expect(e.desc).toBeTruthy();
      if (e.kind === 'review') {
        expect(e.skillId).toBeNull();
        continue;
      }
      const found = findSkill(e.skillId!);
      expect(found, `skill ${e.skillId} for ${e.id}`).toBeTruthy();
      // Renders a real game element for its representative node.
      expect(renderActivity(found!.skill, e.kind, noop)).not.toBeNull();
    }
  });

  it('covers every playable ActivityKind the path can serve', () => {
    // Every activity a node actually uses should be auditable (review included).
    const audited = new Set(AUDIT_ENTRIES.map((e) => e.kind));
    for (const kind of ['listen', 'name', 'listen-sentence', 'reading', 'match', 'count', 'conjugate', 'build', 'order', 'spell', 'sentence', 'sentence-type', 'say', 'dialogue', 'conversation', 'review'] as const) {
      expect(audited.has(kind)).toBe(true);
    }
  });
});

describe('emptyAudit', () => {
  it('starts with every function in scope and no grades', () => {
    const a = emptyAudit();
    expect(a.scope).toHaveLength(AUDIT_ENTRIES.length);
    expect(Object.keys(a.grades)).toHaveLength(0);
  });
});

describe('auditReportMarkdown', () => {
  it('summarizes pass/needs/ungraded and lists each in-scope function', () => {
    const state: AuditState = {
      startedAt: 0,
      scope: ['listen', 'say', 'dialogue'],
      grades: {
        listen: { grade: 'pass', at: 1, tests: 2 },
        say: { grade: 'needs-work', at: 2, tests: 3, note: 'mic flaky' },
      },
    };
    const md = auditReportMarkdown(state, 4);
    expect(md).toContain('# Finnish Kids Game — Audit report');
    expect(md).toContain('Difficulty level tested: 4');
    expect(md).toContain('Pass: 1 · Needs work: 1 · Ungraded: 1');
    expect(md).toContain('✅ Pass');
    expect(md).toContain('⚠️ Needs work');
    expect(md).toContain('mic flaky');
    // Out-of-scope functions are noted, not graded in the table.
    expect(md).toContain('Out of scope this run');
  });
});
