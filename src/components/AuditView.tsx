import { cloneElement, useCallback, useEffect, useMemo, useState } from 'react';
import { ProfileProvider } from '../state/profile';
import { ActivityContext, type ActivityContextValue } from '../game/activityContext';
import { difficultyFor, MAX_LEVEL } from '../game/adapt';
import { findSkill, renderActivity } from '../game/path';
import { reviewItems } from '../content';
import type { ItemSchedule } from '../game/srs';
import type { ProfilesData } from '../state/storage';
import { DEFAULT_SETTINGS } from '../state/storage';
import {
  AUDIT_ENTRIES,
  AUDIT_KEY,
  auditReportMarkdown,
  emptyAudit,
  type AuditEntry,
  type AuditState,
  type Grade,
} from '../game/audit';
import ReviewActivity from './ReviewActivity';

// Grown-up → Audit. A QA harness: pick which game functions to review (left
// checklist), play each real game in the middle (rendered from a representative
// skill node, at a chosen difficulty), and grade it Pass / Needs work — with a
// "Next" to replay the same feature a few times before deciding. Everything the
// games do runs in a SANDBOX profile (ephemeral ProfileProvider) so auditing
// never touches the family's real stars, SRS, or progress. Grades persist to
// localStorage and export to a downloadable Markdown report.

const noop = () => {};

/** A sandbox child pre-seeded with some due SRS items so the Review game has
 *  something to show (boxes 1/3/5 exercise its three escalating formats). */
function makeSeed(): ProfilesData {
  const now = Date.now();
  const srs: Record<string, ItemSchedule> = {};
  reviewItems.slice(0, 12).forEach((it, i) => {
    const box = i % 3 === 0 ? 1 : i % 3 === 1 ? 3 : 5;
    srs[it.id] = { box, due: now - 1000, seen: 3, correct: 3, lastSeenAt: now - 1000 };
  });
  return {
    version: 2,
    children: [
      { id: 'audit-sandbox', name: 'Audit', avatar: '🧪', level: 1, adaptive: true, stars: 0, createdAt: 0, progress: {}, srs },
    ],
    activeId: 'audit-sandbox',
    settings: { ...DEFAULT_SETTINGS },
  };
}

function loadAudit(): AuditState {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuditState;
      if (parsed && Array.isArray(parsed.scope) && parsed.grades) return parsed;
    }
  } catch {
    /* ignore corrupt/unavailable storage */
  }
  return emptyAudit();
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AuditView() {
  const seed = useMemo(makeSeed, []);
  const [audit, setAudit] = useState<AuditState>(loadAudit);
  const [activeId, setActiveId] = useState<string>(() => audit.scope[0] ?? AUDIT_ENTRIES[0].id);
  const [level, setLevel] = useState(3);

  // Per-active-entry transient audit state.
  const [attempts, setAttempts] = useState(1); // "tests" so far this grading cycle
  const [roundComplete, setRoundComplete] = useState(false);
  const [gameKey, setGameKey] = useState(0); // bump to remount a fresh round
  const [note, setNote] = useState('');
  // True while actively testing a function. Cleared when the whole in-scope list
  // is graded, so the stage shows a "done" summary instead of a stuck game.
  const [reviewing, setReviewing] = useState(false);

  // Persist grades + scope.
  useEffect(() => {
    try {
      localStorage.setItem(AUDIT_KEY, JSON.stringify(audit));
    } catch {
      /* ignore */
    }
  }, [audit]);

  const entry = AUDIT_ENTRIES.find((e) => e.id === activeId) ?? AUDIT_ENTRIES[0];

  // Clamp the slider to THIS game's own ceiling: a node never climbs past its
  // `maxLevel` in real play, so testing above it would exercise a difficulty a
  // child can't actually reach here. review (no path node) has no cap.
  const entrySkill = entry.skillId ? findSkill(entry.skillId)?.skill : undefined;
  const entryCap = entrySkill?.maxLevel ?? MAX_LEVEL;
  const effectiveLevel = Math.min(level, entryCap);
  const clamped = effectiveLevel < level;

  // When the active entry changes, reset the cycle + preload any saved note.
  const selectEntry = useCallback(
    (id: string) => {
      setActiveId(id);
      setAttempts(1);
      setRoundComplete(false);
      setReviewing(true); // picking a function means we're testing it
      setGameKey((k) => k + 1);
      setNote(loadAudit().grades[id]?.note ?? '');
    },
    [],
  );

  // The game element for the active entry (built outside the sandbox providers;
  // its hooks run once mounted inside them).
  const gameEl = useMemo(() => {
    if (entry.kind === 'review') return <ReviewActivity embedded />;
    const skill = entry.skillId ? findSkill(entry.skillId)?.skill : undefined;
    if (!skill) return null;
    return renderActivity(skill, entry.kind, noop);
  }, [entry]);

  // Audit context: freeze on segment-complete instead of advancing to another
  // round; the auditor decides via the grading bar.
  const ctxValue = useMemo<ActivityContextValue>(
    () => ({
      onSegmentComplete: () => setRoundComplete(true),
      difficulty: difficultyFor(effectiveLevel),
      sessionStars: 0,
      // One question per round: the game stops after each answer for grading,
      // instead of auto-advancing through a whole round.
      roundQuestions: 1,
    }),
    [effectiveLevel],
  );

  const nextRound = useCallback(() => {
    setAttempts((a) => a + 1);
    setRoundComplete(false);
    setGameKey((k) => k + 1);
  }, []);

  const grade = useCallback(
    (g: Grade) => {
      const record = {
        grade: g,
        at: Date.now(),
        tests: attempts,
        note: note.trim() || undefined,
        level: effectiveLevel,
      };
      const scope = audit.scope.includes(entry.id) ? audit.scope : [...audit.scope, entry.id];
      const grades = { ...audit.grades, [entry.id]: record };
      setAudit({ ...audit, scope, grades });

      // STAY on this function — the auditor changes game type manually via the
      // left list. Just reset for another test of the same function so the
      // stage is ready (grade chip on the left reflects what was recorded).
      setAttempts(1);
      setRoundComplete(false);
      setGameKey((k) => k + 1);
    },
    [entry, attempts, note, audit, effectiveLevel],
  );

  const toggleScope = useCallback((id: string) => {
    setAudit((prev) => {
      const inScope = prev.scope.includes(id);
      return { ...prev, scope: inScope ? prev.scope.filter((x) => x !== id) : [...prev.scope, id] };
    });
  }, []);

  const clearAll = useCallback(() => {
    if (!confirm('Clear all audit grades and scope? This cannot be undone.')) return;
    const fresh = emptyAudit();
    setAudit(fresh);
    setNote('');
    setAttempts(1);
    setRoundComplete(false);
    setGameKey((k) => k + 1);
  }, []);

  const doDownload = useCallback(() => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    download(`finnish-kids-audit-${stamp}.md`, auditReportMarkdown(audit, level));
  }, [audit, level]);

  const gradeChip = (e: AuditEntry) => {
    const g = audit.grades[e.id];
    if (!g) return null;
    return (
      <span className={'audit-chip audit-chip--' + g.grade}>
        {g.grade === 'pass' ? '✅' : '⚠️'} {g.tests}×
      </span>
    );
  };

  const summary = {
    pass: AUDIT_ENTRIES.filter((e) => audit.grades[e.id]?.grade === 'pass').length,
    needs: AUDIT_ENTRIES.filter((e) => audit.grades[e.id]?.grade === 'needs-work').length,
    total: AUDIT_ENTRIES.length,
  };

  // Every in-scope function graded → show a "done" summary rather than a game.
  const scoped = AUDIT_ENTRIES.filter((e) => audit.scope.includes(e.id));
  const allGraded = scoped.length > 0 && scoped.every((e) => audit.grades[e.id]);
  const showComplete = allGraded && !reviewing;

  return (
    <div className="audit">
      <div className="audit-toolbar">
        <label className="audit-level">
          Level
          <input
            type="range"
            min={1}
            max={MAX_LEVEL}
            value={level}
            onChange={(e) => {
              setLevel(Number(e.target.value));
              setRoundComplete(false);
              setGameKey((k) => k + 1);
            }}
          />
          <span className="audit-level__val">{level}</span>
        </label>
        <span className="audit-summary">
          ✅ {summary.pass} · ⚠️ {summary.needs} · {summary.total - summary.pass - summary.needs} left
        </span>
        <button className="btn btn--sm" onClick={doDownload}>
          ⬇︎ Download report
        </button>
        <button className="btn btn--sm btn--ghost" onClick={clearAll}>
          🗑 Clear data
        </button>
      </div>

      <div className="audit-body">
        <aside className="audit-list" aria-label="Game functions">
          {AUDIT_ENTRIES.map((e) => (
            <div
              key={e.id}
              className={'audit-row' + (e.id === activeId ? ' audit-row--active' : '')}
            >
              <input
                type="checkbox"
                checked={audit.scope.includes(e.id)}
                onChange={() => toggleScope(e.id)}
                aria-label={`Include ${e.titleEn} in audit`}
              />
              <button className="audit-row__label" onClick={() => selectEntry(e.id)}>
                <span className="audit-row__en">{e.titleEn}</span>
                <span className="audit-row__fi">{e.titleFi}</span>
              </button>
              {gradeChip(e)}
            </div>
          ))}
        </aside>

        <div className="audit-stage">
          {showComplete ? (
            <div className="audit-complete">
              <p className="audit-complete__title">✅ Audit complete</p>
              <p>
                All {scoped.length} in-scope function{scoped.length === 1 ? '' : 's'} graded.
              </p>
              <p className="audit-complete__stats">
                ✅ {summary.pass} Pass · ⚠️ {summary.needs} Needs work
              </p>
              <div className="audit-buttons">
                <button className="btn btn--sm" onClick={doDownload}>
                  ⬇︎ Download report
                </button>
                <button className="btn btn--sm btn--ghost" onClick={clearAll}>
                  🗑 Clear &amp; restart
                </button>
              </div>
              <p className="en">Pick a function on the left to re-test it.</p>
            </div>
          ) : (
            <>
              <div className="audit-label">
                <h2>
                  {entry.titleEn} <span className="audit-label__fi">· {entry.titleFi}</span>
                </h2>
                <p>{entry.desc}</p>
                <p className="audit-label__meta">
                  Difficulty L{effectiveLevel}
                  {clamped && ` (slider L${level} · capped at this game’s max L${entryCap})`}
                  {' · '}Test #{attempts}
                  {roundComplete && ' · answered — grade it or Next'}
                </p>
              </div>

              <div className="audit-game">
                <ProfileProvider ephemeral seed={seed}>
                  <ActivityContext.Provider value={ctxValue}>
                    {roundComplete ? (
                      <div className="audit-roundcomplete">
                        <p>✓ Answered</p>
                        <p className="en">Grade it, or press Next for another.</p>
                      </div>
                    ) : gameEl ? (
                      cloneElement(gameEl, { key: `${entry.id}-${effectiveLevel}-${gameKey}` })
                    ) : (
                      <p className="audit-missing">No representative node for “{entry.titleEn}”.</p>
                    )}
                  </ActivityContext.Provider>
                </ProfileProvider>
              </div>

              <div className="audit-grade-bar">
                <textarea
                  className="audit-note"
                  placeholder="Notes (optional — especially for Needs work)…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
                <div className="audit-buttons">
                  <button className="btn audit-btn--needs" onClick={() => grade('needs-work')}>
                    Needs work
                  </button>
                  <button className="btn btn--ghost" onClick={nextRound}>
                    Next
                  </button>
                  <button className="btn audit-btn--pass" onClick={() => grade('pass')}>
                    Pass
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
