import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../state/profile';
import type { Child } from '../state/storage';
import { statsOf, warmupDoneOn } from '../game/stats';
import { dayKey } from '../game/streak';
import { pickWarmupSubject, subjectRef } from '../game/warmup';
import {
  dayRows,
  daysCsv,
  hardWords,
  sourceTotals,
  subjectRows,
  subjectsCsv,
  summary,
  weakPatterns,
  type SubjectRow,
} from '../game/statsReport';
import PlayerSwitcher from './PlayerSwitcher';

// The grown-ups' Stats tab: how much was practised, how well, and exactly
// which subjects are shaky — every number derived from the per-subject stats
// the games record (game/stats.ts). Plain words, no symbols to decode; CSV
// downloads for anyone who wants to track it in a spreadsheet.

const DAY = 864e5;
const pct = (n: number | undefined) => (n === undefined ? '—' : `${Math.round(n * 100)}%`);
const minutes = (ms: number | undefined) => Math.round((ms ?? 0) / 60000);

function ago(ms: number | undefined, now: number): string {
  if (!ms) return 'not yet';
  const days = Math.floor((now - ms) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? 'a week ago' : `${weeks} weeks ago`;
}

const TREND: Record<string, string> = { up: '▲ improving', down: '▼ slipping', flat: '— steady' };

function download(name: string, text: string) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* no download support (tests, very old browsers) */
  }
}

const WEEKDAY = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function ActivityChart({ c, now }: { c: Child; now: number }) {
  const rows = dayRows(c, now, 14);
  const max = Math.max(1, ...rows.map((r) => r.bucket.n));
  const active = rows.filter((r) => r.bucket.n > 0).length;
  return (
    <section className="gsection">
      <h3 className="gsection__title">The last two weeks</h3>
      <p className="gmuted">
        Practised on {active} of the last 14 days. Each bar is one day's questions.
      </p>
      <ol className="gchart" aria-label="Questions answered per day, last 14 days">
        {rows.map(({ day, bucket }) => {
          const d = new Date(`${day}T12:00:00`);
          const label = `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}: ${
            bucket.n === 0
              ? 'no practice'
              : `${bucket.n} questions, ${pct(bucket.right / bucket.n)} right first time, ${minutes(bucket.ms)} min`
          }`;
          return (
            <li key={day} className="gchart__day" title={label} aria-label={label}>
              <span className="gchart__n" aria-hidden="true">
                {bucket.n > 0 ? bucket.n : ''}
              </span>
              <span
                className={'gchart__bar' + (bucket.n > 0 && bucket.right / bucket.n < 0.7 ? ' gchart__bar--shaky' : '')}
                style={{ height: `${Math.round((bucket.n / max) * 100)}%` }}
              />
              <span className="gchart__label" aria-hidden="true">
                {WEEKDAY[d.getDay()]}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="gmuted gchart__key">
        <span className="gchart__swatch" /> mostly right · <span className="gchart__swatch gchart__swatch--shaky" /> under
        70% right first time
      </p>
    </section>
  );
}

function SubjectLine({ r, now, note, practise }: { r: SubjectRow; now: number; note?: string; practise?: boolean }) {
  return (
    <li className="gstep">
      <span className="gstep__title">
        <span aria-hidden="true">{r.step.icon}</span> {r.step.titleEn}{' '}
        <span className="gmuted gstat__inline">
          · Unit {r.unitNo} {r.unit.titleEn}
        </span>
      </span>
      <span className={'gchip' + (r.lately >= 0.85 ? ' gchip--good' : r.lately < 0.65 ? ' gchip--warn' : '')}>
        {pct(r.lately)} lately
      </span>
      <span className="gstep__meta">
        {r.stats.n} questions · {pct(r.overall)} right first time overall · practised {ago(r.stats.last, now)}
        {r.trend && ` · ${TREND[r.trend]}`}
        {note && <strong className="gnote"> · {note}</strong>}
        {practise && (
          <>
            {' · '}
            <Link to={`/skill/${r.step.id}`} className="glink">
              Practise it →
            </Link>
          </>
        )}
      </span>
    </li>
  );
}

function ChildStats({ c }: { c: Child }) {
  const now = Date.now();
  const stats = statsOf(c);
  const s = summary(c, now);
  const rows = subjectRows(c, now);
  const today = dayKey(now);
  const warmedUp = warmupDoneOn(stats, today);
  // The warm-up coming next: today's if not done yet, else tomorrow's.
  const upcoming = pickWarmupSubject(c, warmedUp ? now + DAY : now);
  const weakest = [...rows]
    .filter((r) => r.stats.n >= 6)
    .sort((a, b) => a.lately - b.lately || b.daysSince - a.daysSince)
    .slice(0, 6);
  const sources = sourceTotals(c);
  const patterns = weakPatterns(c);
  const words = hardWords(c);
  const warmups = [...(stats.warmups ?? [])].reverse().slice(0, 7);
  const byUnit = new Map<string, SubjectRow[]>();
  for (const r of rows) byUnit.set(r.unit.id, [...(byUnit.get(r.unit.id) ?? []), r]);

  return (
    <article className="greport">
      <header className="greport__head">
        <span className="greport__avatar" aria-hidden="true">
          {c.avatar}
        </span>
        <div>
          <h2 className="greport__name">{c.name}</h2>
          <p className="greport__sub">Practice statistics · first try counts as right</p>
        </div>
      </header>

      <div className="gstats">
        <div className="gstat">
          <span className="gstat__value">{s.today.n}</span>
          <span className="gstat__label">
            questions today · {pct(s.today.n ? s.today.right / s.today.n : undefined)} right · {minutes(s.today.ms)} min
          </span>
        </div>
        <div className="gstat">
          <span className="gstat__value">{s.week.n}</span>
          <span className="gstat__label">
            this week · on {s.weekActiveDays} of 7 days · {minutes(s.week.ms)} min
          </span>
        </div>
        <div className="gstat">
          <span className="gstat__value">{pct(s.month.n ? s.month.right / s.month.n : undefined)}</span>
          <span className="gstat__label">right first time, last 30 days ({s.month.n} questions)</span>
        </div>
        <div className="gstat">
          <span className="gstat__value">{s.allTime}</span>
          <span className="gstat__label">questions answered in all</span>
        </div>
        <div className="gstat">
          <span className="gstat__value">{s.subjectsPractised}</span>
          <span className="gstat__label">subjects practised</span>
        </div>
        <div className="gstat">
          <span className="gstat__value">{s.warmupsThisWeek}</span>
          <span className="gstat__label">daily warm-ups this week</span>
        </div>
      </div>

      <ActivityChart c={c} now={now} />

      <section className="gsection">
        <h3 className="gsection__title">☀️ Daily warm-up</h3>
        <p className="gmuted">
          On a new day, the Continue button first gives {c.name} ten questions on the weakest subject so far, then
          goes back to the course.{' '}
          {upcoming
            ? `${warmedUp ? 'Tomorrow' : 'Today'}: “${upcoming.step.titleEn}” (Unit ${upcoming.unitNo}).`
            : 'It starts once there is enough practice to judge (a few rounds).'}
        </p>
        {warmups.length > 0 && (
          <ul className="gsteps gsteps--flat">
            {warmups.map((w) => (
              <li key={`${w.day}-${w.at}`} className="gstep">
                <span className="gstep__title">
                  {w.day} · {subjectRef(w.subject)?.step.titleEn ?? w.subject}
                </span>
                <span className={'gchip' + (w.total && w.right / w.total >= 0.8 ? ' gchip--good' : '')}>
                  {w.right}/{w.total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="gsection">
        <h3 className="gsection__title">Weakest right now</h3>
        {weakest.length === 0 ? (
          <p className="gmuted">Not enough practice yet — a subject needs a few rounds before it can be judged.</p>
        ) : (
          <>
            <p className="gmuted">
              “Lately” weighs recent answers most (an answer from two weeks ago counts half). “Practise it” opens
              the step, to try it together.
            </p>
            <ul className="gsteps gsteps--flat">
              {weakest.map((r) => (
                <SubjectLine
                  key={r.step.id}
                  r={r}
                  now={now}
                  practise
                  note={upcoming?.step.id === r.step.id ? `${warmedUp ? "tomorrow's" : "today's"} warm-up` : undefined}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      {patterns.length > 0 && (
        <section className="gsection">
          <h3 className="gsection__title">Sentence patterns to watch</h3>
          <p className="gmuted">The endings Finnish adds — the shakiest first.</p>
          <ul className="gsteps gsteps--flat">
            {patterns.map((p) => (
              <li key={p.id} className="gstep">
                <span className="gstep__title" lang="fi">
                  {p.skeleton}
                </span>
                <span className={'gchip' + (p.correct / p.seen >= 0.85 ? ' gchip--good' : '')}>
                  {p.correct}/{p.seen}
                </span>
                <span className="gstep__meta">{p.en}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {words.length > 0 && (
        <section className="gsection">
          <h3 className="gsection__title">Words to practise</h3>
          <p className="gbadges">
            {words.map((w) => (
              <span key={w.id} className="gbadge" title={`${w.correct} of ${w.seen} right first time`}>
                {w.emoji ? `${w.emoji} ` : ''}
                <span lang="fi">{w.fi}</span> · {w.en} · {w.correct}/{w.seen}
              </span>
            ))}
          </p>
        </section>
      )}

      <section className="gsection">
        <h3 className="gsection__title">Every subject, unit by unit</h3>
        {rows.length === 0 ? (
          <p className="gmuted">Nothing practised yet.</p>
        ) : (
          [...byUnit.values()].map((list) => (
            <details key={list[0].unit.id} className="gunit">
              <summary className="gunit__summary">
                <span className="gunit__icon" aria-hidden="true">
                  {list[0].unit.icon}
                </span>
                <span className="gunit__name">
                  <span className="gunit__n">Unit {list[0].unitNo}</span> {list[0].unit.titleEn}
                </span>
                <span className="gchip gchip--muted">
                  {list.reduce((a, r) => a + r.stats.n, 0)} questions
                </span>
              </summary>
              <ul className="gsteps">
                {list.map((r) => (
                  <SubjectLine key={r.step.id} r={r} now={now} />
                ))}
              </ul>
            </details>
          ))
        )}
      </section>

      <section className="gsection">
        <h3 className="gsection__title">Where the answers came from</h3>
        <p className="gmuted">
          {[
            ['practice', 'Practice'],
            ['mix', 'Mixed review (Kertaus)'],
            ['checkpoint', 'Checkpoints'],
            ['warmup', 'Warm-ups'],
            ['bonus', 'Typing bonus'],
          ]
            .filter(([k]) => sources[k as keyof typeof sources]?.n)
            .map(([k, label]) => {
              const b = sources[k as keyof typeof sources]!;
              return `${label}: ${b.n} (${pct(b.right / b.n)} right)`;
            })
            .join(' · ') || 'Nothing yet.'}
        </p>
        <div className="gdata">
          <button className="gbtn" onClick={() => download(`${c.name}-subjects.csv`, subjectsCsv(c, now))}>
            ⬇ Subjects (CSV)
          </button>
          <button className="gbtn" onClick={() => download(`${c.name}-days.csv`, daysCsv(c))}>
            ⬇ Daily log (CSV)
          </button>
        </div>
      </section>
    </article>
  );
}

export default function StatsView() {
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
      <PlayerSwitcher players={children} shownId={child.id} onPick={setPicked} label="Show stats for" />
      <ChildStats c={child} />
    </div>
  );
}
