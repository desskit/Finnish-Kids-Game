import { useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewItems } from '../content';
import { useProfile } from '../state/profile';
import type { Child } from '../state/storage';
import { isDue, isMastered, wordSchedules } from '../game/srs';
import { windowAccuracy } from '../game/adapt';
import { BADGES, earnedBadges } from '../game/badges';
import { canDoSummary } from '../game/cando';
import { badgeEnv } from '../game/path';
import { UNITS, nextAction, stepDone, topLevel, unitsCompleted, type Unit } from '../game/course';

// Parent dashboard. One player at a time (a switcher when there are several):
// the headline numbers a grown-up actually wants, what needs a little help, the
// plain-English "can do" claims, and a unit-by-unit breakdown in words — never
// a row of symbols to decode.

const DAY = 864e5;

function ago(ms: number | undefined): string {
  if (!ms) return 'never';
  const days = Math.floor((Date.now() - ms) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? 'a week ago' : `${weeks} weeks ago`;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

interface Help {
  key: string;
  text: string;
  href: string;
}

/** Steps and checkpoints that look stuck — where a grown-up can help. */
function needsHelp(c: Child): Help[] {
  const out: Help[] = [];
  for (const unit of UNITS) {
    for (const step of unit.skills) {
      const p = c.progress?.[unit.id]?.[step.id];
      if (!p || p.topProvenAt) continue;
      const recent = p.recent ?? [];
      if (recent.length >= 2 && windowAccuracy(recent) < 0.6) {
        out.push({
          key: `${unit.id}/${step.id}`,
          text: `“${step.titleEn}” (${unit.titleEn}) — only ${pct(windowAccuracy(recent))} right first time lately. Re-reading the lesson together may help.`,
          href: `/lesson/${unit.lessonId}`,
        });
      }
    }
    const cp = c.course?.checkpoints?.[unit.id];
    if (cp && !cp.passedAt && cp.attempts >= 2) {
      out.push({
        key: `${unit.id}/checkpoint`,
        text: `The “${unit.titleEn}” checkpoint — ${cp.attempts} tries, best ${pct(cp.best)} (80% passes).`,
        href: `/lesson/${unit.lessonId}`,
      });
    }
  }
  return out.slice(0, 4);
}

function lastPlayed(c: Child): number | undefined {
  let last = 0;
  for (const topic of Object.values(c.progress ?? {})) {
    for (const p of Object.values(topic ?? {})) last = Math.max(last, p?.lastPlayed ?? 0);
  }
  return last || undefined;
}

function UnitBreakdown({ c, unit, n, open }: { c: Child; unit: Unit; n: number; open: boolean }) {
  const cp = c.course?.checkpoints?.[unit.id];
  const done = unit.skills.filter((s) => stepDone(c, unit, s)).length;
  return (
    <details className="gunit" open={open}>
      <summary className="gunit__summary">
        <span className="gunit__icon" aria-hidden="true">
          {unit.icon}
        </span>
        <span className="gunit__name">
          <span className="gunit__n">Unit {n}</span> {unit.titleEn}
        </span>
        <span className={'gchip' + (cp?.passedAt ? ' gchip--good' : '')}>
          {cp?.passedAt ? '✓ Passed' : `${done}/${unit.skills.length} steps`}
        </span>
      </summary>
      <ul className="gsteps">
        {unit.skills.map((s) => {
          const p = c.progress?.[unit.id]?.[s.id];
          const top = topLevel(s);
          const finished = stepDone(c, unit, s);
          const acc = p?.totalPossible ? p.totalStars / p.totalPossible : 0;
          const recent = p?.recent ?? [];
          return (
            <li key={s.id} className="gstep">
              <span className="gstep__title">
                <span aria-hidden="true">{s.icon}</span> {s.titleEn}
              </span>
              <span className={'gchip' + (finished ? ' gchip--good' : p ? '' : ' gchip--muted')}>
                {finished ? '✓ Done' : p ? `Level ${p.level ?? 1} of ${top}` : 'Not started'}
              </span>
              {p && (
                <span className="gstep__meta">
                  {p.plays} {p.plays === 1 ? 'round' : 'rounds'} · {pct(acc)} right first time
                  {recent.length > 0 && ` (lately ${pct(windowAccuracy(recent))})`}
                  {p.bonus && ` · ⌨️ ${p.bonus.right} typed`}
                </span>
              )}
            </li>
          );
        })}
        <li className="gstep gstep--checkpoint">
          <span className="gstep__title">
            <span aria-hidden="true">🏁</span> Checkpoint
          </span>
          <span className={'gchip' + (cp?.passedAt ? ' gchip--good' : ' gchip--muted')}>
            {cp?.passedAt ? `✓ Passed · ${pct(cp.best)}` : cp ? `Best ${pct(cp.best)}` : 'Not tried'}
          </span>
          {cp && (
            <span className="gstep__meta">
              {cp.attempts} {cp.attempts === 1 ? 'try' : 'tries'} · 80% right first time passes
            </span>
          )}
        </li>
      </ul>
    </details>
  );
}

function ChildReport({ c }: { c: Child }) {
  const now = Date.now();
  const schedules = wordSchedules(c.srs);
  const practiced = schedules.length;
  const mastered = schedules.filter(isMastered).length;
  const due = reviewItems.filter((i) => c.srs?.[i.id] && isDue(c.srs[i.id], now)).length;
  const seen = schedules.reduce((n, s) => n + s.seen, 0);
  const right = schedules.reduce((n, s) => n + s.correct, 0);

  const unitsDone = unitsCompleted(c);
  const unitsTotal = UNITS.filter((u) => u.checkpoint !== false).length;
  const next = nextAction(c);
  const currentN = UNITS.indexOf(next.unit) + 1;
  const badges = earnedBadges(c, badgeEnv);
  const cando = canDoSummary(c);
  const help = needsHelp(c);
  // Units the child has touched, plus the current one.
  const shown = UNITS.map((u, i) => ({ u, i })).filter(
    ({ u }) =>
      u === next.unit ||
      c.course?.checkpoints?.[u.id] ||
      u.skills.some((s) => c.progress?.[u.id]?.[s.id]),
  );

  return (
    <article className="greport">
      <header className="greport__head">
        <span className="greport__avatar" aria-hidden="true">
          {c.avatar}
        </span>
        <div>
          <h2 className="greport__name">{c.name}</h2>
          <p className="greport__sub">
            Last practised {ago(lastPlayed(c))} · difficulty{' '}
            {c.adaptive === false ? `fixed at level ${c.level}` : 'adapts automatically'}
          </p>
        </div>
        <span className="greport__stars">⭐ {c.stars}</span>
      </header>

      <div className="gstats">
        <div className="gstat">
          <span className="gstat__value">
            {unitsDone}
            <small>/{unitsTotal}</small>
          </span>
          <span className="gstat__label">units passed</span>
        </div>
        <div className="gstat">
          <span className="gstat__value gstat__value--text">
            {next.unit.icon} Unit {currentN}
          </span>
          <span className="gstat__label">{next.unit.titleEn}</span>
        </div>
        <div className="gstat">
          <span className="gstat__value">{practiced}</span>
          <span className="gstat__label">
            words met · {mastered} mastered (of {reviewItems.length})
          </span>
        </div>
        <div className="gstat">
          <span className="gstat__value">{due}</span>
          <span className="gstat__label">words due for review</span>
        </div>
        <div className="gstat">
          <span className="gstat__value">{seen ? pct(right / seen) : '—'}</span>
          <span className="gstat__label">words right first time</span>
        </div>
        <div className="gstat">
          <span className="gstat__value">🔥 {c.streakDays ?? 0}</span>
          <span className="gstat__label">day streak · best {Math.max(c.bestStreakDays ?? 0, c.streakDays ?? 0)}</span>
        </div>
      </div>

      {help.length > 0 && (
        <section className="gsection gsection--help">
          <h3 className="gsection__title">💡 Could use a little help</h3>
          <ul className="ghelp">
            {help.map((h) => (
              <li key={h.key}>
                {h.text}{' '}
                <Link to={h.href} state={{ from: 'notebook' }}>
                  Open the lesson
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="gsection">
        <h3 className="gsection__title">What {c.name} can do in Finnish</h3>
        {cando.achieved.length === 0 ? (
          <p className="gmuted">Nothing yet — the first one comes when Unit 1's checkpoint is passed.</p>
        ) : (
          <ul className="gcando">
            {cando.achieved.map((s) => (
              <li key={s.id} className="gcando__row" title={`Based on: ${s.basisEn}`}>
                <span aria-hidden="true">{s.emoji}</span> {s.en}
              </li>
            ))}
          </ul>
        )}
        {cando.upNext.length > 0 && (
          <>
            <h4 className="gsection__sub">Next up</h4>
            <ul className="gcando">
              {cando.upNext.slice(0, 2).map((s) => (
                <li key={s.id} className="gcando__row gcando__row--next" title={`Unlocks with: ${s.basisEn}`}>
                  <span aria-hidden="true">{s.emoji}</span> {s.en}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="gsection">
        <h3 className="gsection__title">
          Achievements · {badges.length} of {BADGES.length}
        </h3>
        {badges.length === 0 ? (
          <p className="gmuted">None yet.</p>
        ) : (
          <p className="gbadges">
            {badges.map((b) => (
              <span key={b.id} className="gbadge" title={`${b.titleEn}: ${b.hintEn}`}>
                {b.emoji} {b.titleEn}
              </span>
            ))}
          </p>
        )}
      </section>

      <section className="gsection">
        <h3 className="gsection__title">Unit by unit</h3>
        <p className="gmuted">
          A step is done when its top level is passed. Typing (⌨️) is a bonus and never holds a step
          back.
        </p>
        {shown.map(({ u, i }) => (
          <UnitBreakdown key={u.id} c={c} unit={u} n={i + 1} open={u === next.unit} />
        ))}
      </section>
    </article>
  );
}

export default function ProgressView() {
  const { children, activeId } = useProfile();
  const [picked, setPicked] = useState<string | null>(null);

  if (children.length === 0) {
    return (
      <div className="grownup__panel">
        <p className="gmuted">No players yet — add one in Players.</p>
      </div>
    );
  }
  const shownId = picked ?? activeId ?? children[0].id;
  const child = children.find((c) => c.id === shownId) ?? children[0];

  return (
    <div className="grownup__panel">
      {children.length > 1 && (
        <div className="gswitch" role="tablist" aria-label="Show progress for">
          {children.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={c.id === child.id}
              className={'gswitch__btn' + (c.id === child.id ? ' gswitch__btn--on' : '')}
              onClick={() => setPicked(c.id)}
            >
              <span aria-hidden="true">{c.avatar}</span> {c.name}
            </button>
          ))}
        </div>
      )}
      <ChildReport c={child} />
    </div>
  );
}
