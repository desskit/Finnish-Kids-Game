import { unlockAllFor } from '../../state/storage';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lessonById } from '../../content/lessons';
import { useProfile } from '../../state/profile';
import { findUnit, lessonSeen, stepLevel, topLevel } from '../../game/course';
import { MATH_STAGES, type MathStage } from '../../game/mathPath';
import {
  crownWon,
  mathActionHref,
  mathStepStatus,
  mathTestStatus,
  newStages,
  nextMathAction,
  stageAhead,
  stageStatus,
  waitingFor,
  type MathAction,
} from '../../game/mathCourse';
import Art from '../../art/Art';
import { uiBackdropUrl } from '../../art/backdrops';
import { useMotion } from '../../art/motion';
import { TodayButton } from './MathToday';
import '../../styles/math.css';

// /math — Lasketaan! (Let's count!): the math section's map. Math town's road
// runs past its stages: each a lesson, a few games, a story, and the test that
// wins the stage's crown. Like the course, one big "Continue" leads to the next
// thing to do. Nothing here shows a digit — a level is dots, a score is stars.

export default function MathHome() {
  const { activeChild, markMathStageSeen, look } = useProfile();
  const unlockAll = unlockAllFor(activeChild);
  const next = nextMathAction(activeChild, unlockAll);
  const moving = useMotion();
  const town = uiBackdropUrl('math-town', look, moving);

  // Seeing the map clears the home card's "Uusi!" for every stage open now.
  const fresh = newStages(activeChild, unlockAll);
  useEffect(() => {
    for (const s of fresh) markMathStageSeen(s.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per visit
  }, []);

  // The stage being worked on starts open; others open on tap.
  const current = next?.stage.id ?? MATH_STAGES.find((s) => stageStatus(activeChild, s, unlockAll) !== 'done')?.id;
  const [open, setOpen] = useState<Set<string>>(() => new Set(current ? [current] : []));
  const toggle = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <section className="screen math-home">
      <div className="hero-banner math-home__banner">
        {town && <img className="scenery" src={town} alt="" aria-hidden="true" draggable={false} />}
      </div>
      <h1 className="greeting">
        Lasketaan! <span className="en">Math in Finnish</span>
      </h1>
      <p className="math-home__intro en">
        Every number here is a Finnish word: hear it, say it, count with it. Win a crown in each stage.
      </p>

      {next ? (
        <Link className="continue-cta" to={mathActionHref(next)}>
          <span className="continue-cta__icon" aria-hidden="true">
            <Art glyph="▶" />
          </span>
          <span className="continue-cta__label">
            <span className="continue-cta__title">
              Jatka <span className="en">Continue</span>
            </span>
            <span className="continue-cta__what">{describe(next)}</span>
          </span>
        </Link>
      ) : (
        <p className="math-home__waiting en">{waitingNote(activeChild, unlockAll)}</p>
      )}

      <TodayButton />

      <Crowns />

      <ol className="units math-stages stagger">
        {MATH_STAGES.map((stage) => {
          const status = stageStatus(activeChild, stage, unlockAll);
          const expanded = status !== 'locked' && open.has(stage.id);
          const wait = status === 'locked' ? waitingFor(activeChild, stage) : {};
          const done = stage.skills.filter((s) => mathStepStatus(activeChild, stage, s) === 'done').length;
          const pct = status === 'done' ? 100 : Math.round((done / Math.max(1, stage.skills.length)) * 100);
          return (
            <li
              key={stage.id}
              className={'unit unit--' + status + (stage.id === current ? ' unit--current' : '') + (expanded ? ' unit--open' : '')}
              style={{ '--unit-accent': stage.accent } as React.CSSProperties}
            >
              <button
                className="unit__head"
                onClick={() => status !== 'locked' && toggle(stage.id)}
                aria-expanded={status === 'locked' ? undefined : expanded}
                disabled={status === 'locked'}
              >
                <span className="unit__icon" aria-hidden="true">
                  {status === 'done' ? <Art id={stage.crown} /> : <Art glyph={status === 'locked' ? '🔒' : stage.icon} />}
                </span>
                <span className="unit__label">
                  <span className="unit__title">
                    {stage.titleFi} <span className="en">{stage.titleEn}</span>
                  </span>
                  <span className="unit__blurb en">
                    {wait.stage
                      ? `Win the crown in “${wait.stage.titleEn}” first.`
                      : wait.unit
                        ? `Opens after “${findUnit(wait.unit)?.titleEn}” in the course.`
                        : stage.blurbEn}
                  </span>
                </span>
                {status !== 'locked' && (
                  <span className="unit__bar" aria-label="Steps done">
                    <span style={{ width: `${pct}%` }} />
                  </span>
                )}
              </button>
              {expanded && <StageSteps stage={stage} unlockAll={unlockAll} />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** The crowns won so far, in a row: one per stage, grey until it's won. */
function Crowns() {
  const { activeChild } = useProfile();
  return (
    <p className="math-crowns" aria-label="Crowns">
      {MATH_STAGES.map((s) => (
        <span key={s.id} className={'math-crowns__crown' + (crownWon(activeChild, s) ? ' math-crowns__crown--won' : '')} title={s.titleEn}>
          <Art id={s.crown} />
        </span>
      ))}
    </p>
  );
}

/** A level as dots — the ones passed filled — never "Level two of four" in digits. */
export function LevelDots({ level, top }: { level: number; top: number }) {
  return (
    <span className="math-level" aria-label="Level">
      {Array.from({ length: top }, (_, i) => (
        <span key={i} className={'math-level__dot' + (i < level ? ' math-level__dot--on' : '')} />
      ))}
    </span>
  );
}

function StageSteps({ stage, unlockAll }: { stage: MathStage; unlockAll: boolean }) {
  const { activeChild } = useProfile();
  const lesson = lessonById[stage.lessonId];
  const read = lessonSeen(activeChild, stage.lessonId);
  const test = mathTestStatus(activeChild, stage, unlockAll);
  return (
    <ol className="unit-steps stagger">
      {lesson && (
        <li>
          <Link className={'unit-step' + (read ? ' unit-step--done' : ' unit-step--next')} to={`/lesson/${lesson.id}`}>
            <span className="unit-step__icon" aria-hidden="true">
              <Art glyph="📖" />
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
      {stage.skills.map((step) => {
        const st = mathStepStatus(activeChild, stage, step, unlockAll);
        const top = topLevel(step);
        const body = (
          <>
            <span className="unit-step__icon" aria-hidden="true">
              <Art glyph={step.icon} />
            </span>
            <span className="unit-step__label">
              <span className="unit-step__title">
                {step.titleFi} <span className="en">{step.titleEn}</span>
              </span>
              {st !== 'locked' && step.activity !== 'story' && (
                <span className="unit-step__meta">
                  <LevelDots level={st === 'done' ? top : stepLevel(activeChild, stage, step) - 1} top={top} />
                </span>
              )}
            </span>
            <span className="unit-step__state" aria-hidden="true">
              {st === 'locked' ? <Art glyph="🔒" /> : st === 'done' ? '✓' : '•'}
            </span>
          </>
        );
        return (
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
          </li>
        );
      })}
      <li>
        {test === 'locked' ? (
          <span className="unit-step unit-step--locked unit-step--checkpoint" aria-disabled="true">
            <span className="unit-step__icon" aria-hidden="true">
              <Art id={stage.crown} />
            </span>
            <span className="unit-step__label">
              <span className="unit-step__title">
                Välitesti <span className="en">Win the crown</span>
              </span>
              <span className="unit-step__meta en">Finish every game to try for the crown</span>
            </span>
            <span className="unit-step__state" aria-hidden="true">
              <Art glyph="🔒" />
            </span>
          </span>
        ) : (
          <Link className={'unit-step unit-step--checkpoint unit-step--' + test} to={`/math/test/${stage.id}`}>
            <span className="unit-step__icon" aria-hidden="true">
              <Art id={stage.crown} />
            </span>
            <span className="unit-step__label">
              <span className="unit-step__title">
                Välitesti <span className="en">Win the crown</span>
              </span>
              <span className="unit-step__meta en">{test === 'done' ? 'Crown won!' : 'A few questions from each game'}</span>
            </span>
            <span className="unit-step__state" aria-hidden="true">
              {test === 'done' ? '✓' : '•'}
            </span>
          </Link>
        )}
      </li>
    </ol>
  );
}

/** "Plus ja miinus · Lesson" — the Continue button's subtitle. */
function describe(a: MathAction): string {
  switch (a.kind) {
    case 'lesson':
      return `${a.stage.titleFi} · Lesson: ${lessonById[a.stage.lessonId]?.titleEn ?? a.stage.titleEn}`;
    case 'step':
      return `${a.stage.titleFi} · ${a.step.titleEn}`;
    case 'test':
      return `${a.stage.titleFi} · Win the crown`;
  }
}

/** Nothing to do in math right now: every crown won, or what the next stage waits for in the course. */
export function waitingNote(child: Parameters<typeof crownWon>[0], unlockAll = false): string {
  const ahead = stageAhead(child, unlockAll);
  if (!ahead) return 'Every crown won — well done!';
  if (ahead.stage === MATH_STAGES[0]) return 'Math opens after the course’s Numbers unit.';
  const unit = ahead.unit ? findUnit(ahead.unit)?.titleEn : undefined;
  return unit ? `“${ahead.stage.titleEn}” opens after “${unit}” in the course.` : `Next: “${ahead.stage.titleEn}”.`;
}
