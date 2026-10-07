import { useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewItems } from '../content';
import { lessonById } from '../content/lessons';
import { useProfile } from '../state/profile';
import { isSpeechAvailable } from '../audio/speak';
import { isDue } from '../game/srs';
import { dayKey, displayStreak, playedToday } from '../game/streak';
import { BADGES, earnedBadgeIds } from '../game/badges';
import { badgeEnv } from '../game/path';
import {
  UNITS,
  actionHref,
  checkpointPlan,
  checkpointStatus,
  hasCheckpoint,
  lessonSeen,
  midLessonStatus,
  nextAction,
  stepLevel,
  stepStatus,
  unitStatus,
  unitsCompleted,
  topLevel,
  type NextAction,
  type Unit,
} from '../game/course';

// The course home: one big "Continue" button (the next lesson / step /
// checkpoint), Review and the Notebook, then the units in order — finished
// ones ticked, the current one opened up into its lesson → steps → checkpoint,
// later ones locked until the checkpoint before them is passed.
export default function CourseHome() {
  const { name, activeChild, settings } = useProfile();
  const unlockAll = !!settings.unlockAll;
  const next = nextAction(activeChild);

  const srs = activeChild?.srs ?? {};
  const now = Date.now();
  const dueCount = reviewItems.filter((i) => srs[i.id] && isDue(srs[i.id], now)).length;
  const seenCount = reviewItems.filter((i) => srs[i.id]).length;

  const today = dayKey(now);
  const streak = displayStreak(activeChild?.lastPlayedDay, activeChild?.streakDays, today);
  const doneToday = playedToday(activeChild?.lastPlayedDay, today);
  const earned = activeChild ? earnedBadgeIds(activeChild, badgeEnv) : new Set<string>();

  // The current unit starts expanded; others toggle open on tap.
  const [open, setOpen] = useState<Set<string>>(() => new Set([next.unit.id]));
  // Locked units far ahead fold away — a peek at the next two, then a button.
  const [showAll, setShowAll] = useState(false);
  const lastOpen = UNITS.reduce(
    (last, u, i) => (unitStatus(activeChild, u, unlockAll) !== 'locked' ? i : last),
    0,
  );
  const cutoff = showAll ? UNITS.length : lastOpen + 2;
  const hidden = UNITS.length - 1 - cutoff;
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const completed = unitsCompleted(activeChild);
  const total = UNITS.filter(hasCheckpoint).length;

  return (
    <section className="screen course-home">
      <h1 className="greeting">
        Hei{name ? `, ${name}` : ''}! <span className="en">Your Finnish course</span>
      </h1>

      <div className={'streak' + (doneToday ? ' streak--today' : '')} aria-label="Practice streak">
        <span className="streak__flame" aria-hidden="true">
          {streak >= 2 ? '🔥' : doneToday ? '🌟' : '👋'}
        </span>
        <span className="streak__text">
          {streak >= 2 ? (
            <>
              {streak} päivää putkeen! <span className="en">{streak}-day streak</span>
            </>
          ) : doneToday ? (
            <>
              Hienoa työtä tänään! <span className="en">Great work today</span>
            </>
          ) : (
            <>
              Pelataan tänään! <span className="en">Let's practice today</span>
            </>
          )}
        </span>
      </div>

      <Link className="continue-cta" to={actionHref(next)}>
        <span className="continue-cta__icon" aria-hidden="true">
          ▶
        </span>
        <span className="continue-cta__label">
          <span className="continue-cta__title">
            Jatka <span className="en">Continue</span>
          </span>
          <span className="continue-cta__what">{describe(next)}</span>
        </span>
      </Link>

      <div className="home-tiles">
        <Link className="home-tile" to="/review">
          <span className="home-tile__icon" aria-hidden="true">
            🔁
          </span>
          <span className="home-tile__label">
            Kertaus <span className="en">Review</span>
          </span>
          <span className="home-tile__meta en">
            {seenCount === 0 ? 'Nothing yet' : dueCount > 0 ? `${dueCount} due` : 'All caught up'}
          </span>
        </Link>
        <Link className="home-tile" to="/achievements">
          <span className="home-tile__icon" aria-hidden="true">
            🏅
          </span>
          <span className="home-tile__label">
            Saavutukset <span className="en">Achievements</span>
          </span>
          <span className="home-tile__meta en">
            {earned.size} of {BADGES.length} earned
          </span>
        </Link>
        <Link className="home-tile" to="/sounds">
          <span className="home-tile__icon" aria-hidden="true">
            🔤
          </span>
          <span className="home-tile__label">
            Aakkoset <span className="en">Alphabet</span>
          </span>
          <span className="home-tile__meta en">Letters & sounds</span>
        </Link>
        <Link className="home-tile" to="/notebook">
          <span className="home-tile__icon" aria-hidden="true">
            📓
          </span>
          <span className="home-tile__label">
            Vihko <span className="en">Notebook</span>
          </span>
          <span className="home-tile__meta en">Re-read the rules</span>
        </Link>
      </div>

      {earned.size > 0 && (
        <Link
          className="badge-strip"
          to="/achievements"
          aria-label={`Achievements: ${earned.size} of ${BADGES.length} earned`}
        >
          {BADGES.filter((b) => earned.has(b.id)).map((b) => (
            <span key={b.id} className="badge" title={`${b.titleEn} — earned`}>
              {b.emoji}
            </span>
          ))}
        </Link>
      )}

      <h2 className="course-progress en">
        {completed} of {total} units done
      </h2>

      <ol className="units">
        {UNITS.slice(0, cutoff + 1).map((unit, i) => {
          const status = unitStatus(activeChild, unit, unlockAll);
          const isCurrent = unit.id === next.unit.id;
          const expanded = status !== 'locked' && open.has(unit.id);
          const doneSteps = unit.skills.filter(
            (s) => stepStatus(activeChild, unit, s) === 'done',
          ).length;
          const pct =
            status === 'done' ? 100 : Math.round((doneSteps / Math.max(1, unit.skills.length)) * 100);
          return (
            <li
              key={unit.id}
              className={
                'unit unit--' + status + (isCurrent ? ' unit--current' : '') + (expanded ? ' unit--open' : '')
              }
              style={{ '--accent': unit.accent } as React.CSSProperties}
            >
              <button
                className="unit__head"
                onClick={() => status !== 'locked' && toggle(unit.id)}
                aria-expanded={status === 'locked' ? undefined : expanded}
                disabled={status === 'locked'}
              >
                <span className="unit__icon" aria-hidden="true">
                  {status === 'locked' ? '🔒' : status === 'done' ? '✓' : unit.icon}
                </span>
                <span className="unit__label">
                  <span className="unit__num en">Unit {i + 1}</span>
                  <span className="unit__title">
                    {unit.titleFi} <span className="en">{unit.titleEn}</span>
                  </span>
                  <span className="unit__blurb en">{unit.blurbEn}</span>
                </span>
                {status !== 'locked' && (
                  <span className="unit__bar" aria-label={`${doneSteps} of ${unit.skills.length} steps done`}>
                    <span style={{ width: `${pct}%` }} />
                  </span>
                )}
              </button>
              {expanded && <UnitSteps unit={unit} unlockAll={unlockAll} />}
            </li>
          );
        })}
      </ol>
      {hidden > 0 && (
        <button className="btn units-more" onClick={() => setShowAll(true)}>
          🔒 {hidden} more units <span className="en">Show them all</span>
        </button>
      )}

      {!isSpeechAvailable() && (
        <p className="audio-note">🔇 Audio isn't available in this browser. Words still show as text.</p>
      )}

      <p className="data-credit">
        Finnish word data from Wiktionary &amp; Tatoeba · CC BY-SA 4.0. English inflections from
        AGID (K. Atkinson).
      </p>
    </section>
  );
}

function UnitSteps({ unit, unlockAll }: { unit: Unit; unlockAll: boolean }) {
  const { activeChild } = useProfile();
  const lesson = lessonById[unit.lessonId];
  const read = lessonSeen(activeChild, unit.lessonId);
  const cp = checkpointStatus(activeChild, unit, unlockAll);
  const cpQuestions = checkpointPlan(unit).reduce((n, p) => n + p.questions, 0);

  return (
    <ol className="unit-steps">
      {lesson && (
        <li>
          <Link className={'unit-step' + (read ? ' unit-step--done' : ' unit-step--next')} to={`/lesson/${lesson.id}`}>
            <span className="unit-step__icon" aria-hidden="true">
              📖
            </span>
            <span className="unit-step__label">
              <span className="unit-step__title">
                Oppitunti <span className="en">Lesson: {lesson.titleEn}</span>
              </span>
            </span>
            <span className="unit-step__state" aria-hidden="true">
              {read ? '✓' : '•'}
            </span>
          </Link>
        </li>
      )}
      {unit.skills.map((step) => {
        const mid = unit.midLessons?.find((m) => m.before === step.id);
        const midRow = mid && <MidLessonRow key={mid.lessonId} unit={unit} lessonId={mid.lessonId} unlockAll={unlockAll} />;
        const st = stepStatus(activeChild, unit, step, unlockAll);
        const lvl = stepLevel(activeChild, unit, step);
        const top = topLevel(step);
        const body = (
          <>
            <span className="unit-step__icon" aria-hidden="true">
              {step.icon}
            </span>
            <span className="unit-step__label">
              <span className="unit-step__title">
                {step.titleFi} <span className="en">{step.titleEn}</span>
              </span>
              {st !== 'locked' && (
                <span className="unit-step__meta en">
                  {st === 'done'
                    ? `All ${top} levels passed`
                    : lvl >= top
                      ? `Top level ${top} — pass it to finish the step`
                      : `Level ${lvl} of ${top}`}
                </span>
              )}
              {step.exampleFi && st !== 'locked' && (
                <span className="unit-step__example" lang="fi">
                  {step.exampleFi}
                </span>
              )}
            </span>
            <span className="unit-step__state" aria-hidden="true">
              {st === 'done' ? '✓' : st === 'locked' ? '🔒' : '•'}
            </span>
          </>
        );
        return [
          midRow,
          <li key={step.id}>
            {st === 'locked' ? (
              <span className="unit-step unit-step--locked" aria-disabled="true" title="Read the lesson first">
                {body}
              </span>
            ) : (
              <Link className={'unit-step unit-step--' + st} to={`/skill/${step.id}`}>
                {body}
              </Link>
            )}
          </li>,
        ];
      })}
      {hasCheckpoint(unit) && (
        <li>
          {cp === 'locked' ? (
            <span className="unit-step unit-step--locked unit-step--checkpoint" aria-disabled="true">
              <span className="unit-step__icon" aria-hidden="true">
                🏁
              </span>
              <span className="unit-step__label">
                <span className="unit-step__title">
                  Välitesti <span className="en">Checkpoint</span>
                </span>
                <span className="unit-step__meta en">Finish every step to unlock</span>
              </span>
              <span className="unit-step__state" aria-hidden="true">
                🔒
              </span>
            </span>
          ) : (
            <Link
              className={'unit-step unit-step--checkpoint unit-step--' + cp}
              to={`/checkpoint/${unit.id}`}
            >
              <span className="unit-step__icon" aria-hidden="true">
                🏁
              </span>
              <span className="unit-step__label">
                <span className="unit-step__title">
                  Välitesti <span className="en">Checkpoint</span>
                </span>
                <span className="unit-step__meta en">
                  {cp === 'done' ? 'Passed — the next unit is open' : `${cpQuestions} questions to unlock the next unit`}
                </span>
              </span>
              <span className="unit-step__state" aria-hidden="true">
                {cp === 'done' ? '✓' : '•'}
              </span>
            </Link>
          )}
        </li>
      )}
    </ol>
  );
}

/** A lesson PART-WAY through a unit (e.g. the consonant-change lesson): opens
 *  once the steps above it are done; the steps below wait for it. */
function MidLessonRow({ unit, lessonId, unlockAll }: { unit: Unit; lessonId: string; unlockAll: boolean }) {
  const { activeChild } = useProfile();
  const lesson = lessonById[lessonId];
  const ml = unit.midLessons?.find((m) => m.lessonId === lessonId);
  if (!lesson || !ml) return null;
  const st = midLessonStatus(activeChild, unit, ml, unlockAll);
  const body = (
    <>
      <span className="unit-step__icon" aria-hidden="true">
        📖
      </span>
      <span className="unit-step__label">
        <span className="unit-step__title">
          Uusi oppitunti <span className="en">Lesson: {lesson.titleEn}</span>
        </span>
        {st === 'locked' && <span className="unit-step__meta en">Finish the steps above to open it</span>}
      </span>
      <span className="unit-step__state" aria-hidden="true">
        {st === 'done' ? '✓' : st === 'locked' ? '🔒' : '•'}
      </span>
    </>
  );
  return (
    <li>
      {st === 'locked' ? (
        <span className="unit-step unit-step--locked" aria-disabled="true">
          {body}
        </span>
      ) : (
        <Link className={'unit-step' + (st === 'done' ? ' unit-step--done' : ' unit-step--next')} to={`/lesson/${lesson.id}`}>
          {body}
        </Link>
      )}
    </li>
  );
}

/** "Unit 4 · Lesson: How to say "I have"" — the Continue button's subtitle. */
function describe(a: NextAction): string {
  const n = UNITS.indexOf(a.unit) + 1;
  switch (a.kind) {
    case 'lesson':
      return `Unit ${n} · Lesson: ${lessonById[a.lessonId]?.titleEn ?? a.unit.titleEn}`;
    case 'step':
      return `Unit ${n} · ${a.step.titleEn}`;
    case 'checkpoint':
      return `Unit ${n} · Checkpoint`;
  }
}
