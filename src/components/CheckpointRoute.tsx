import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { difficultyFor } from '../game/adapt';
import { ActivityContext } from '../game/activityContext';
import { renderActivity } from '../game/path';
import {
  UNITS,
  checkpointPassRatio,
  checkpointPlan,
  checkpointStatus,
  findUnit,
  unitIndex,
} from '../game/course';
import { useProfile } from '../state/profile';
import { playDing } from '../audio/sfx';

interface PartResult {
  correct: number;
  total: number;
}

// /checkpoint/:unitId — the short test at the end of a unit. It plays each of
// the unit's steps for a few questions (at the step's "done" level), counting
// FIRST-TRY answers. Pass (≥ 80% by default) and the next unit opens; otherwise
// it points at the step to practise and offers another go. Uses the same
// round-capping hook as the grown-up Audit harness (`roundQuestions`).
export default function CheckpointRoute() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { activeChild, settings, recordCheckpoint, stars } = useProfile();
  const unit = unitId ? findUnit(unitId) : undefined;
  const [phase, setPhase] = useState<'intro' | 'run' | 'result'>('intro');
  const [part, setPart] = useState(0);
  const [results, setResults] = useState<PartResult[]>([]);
  const [run, setRun] = useState(0);
  const [startStars, setStartStars] = useState(stars);

  if (!activeChild) return <Navigate to="/profiles" replace />;
  if (!unit) return <Navigate to="/" replace />;
  const plan = checkpointPlan(unit);
  if (plan.length === 0) return <Navigate to="/" replace />;
  if (checkpointStatus(activeChild, unit, !!settings.unlockAll) === 'locked') {
    return <Navigate to="/" replace />;
  }

  const n = unitIndex(unit.id) + 1;
  const nextUnit = UNITS[unitIndex(unit.id) + 1];
  const passRatio = checkpointPassRatio(unit);
  const questions = plan.reduce((s, p) => s + p.questions, 0);

  const start = () => {
    setPart(0);
    setResults([]);
    setRun((r) => r + 1);
    setStartStars(stars);
    setPhase('run');
  };

  if (phase === 'intro') {
    return (
      <main className="app">
        <section className="screen checkpoint">
          <div className="checkpoint__badge" aria-hidden="true">
            🏁
          </div>
          <h1 className="title">
            Välitesti <span className="en">Checkpoint · Unit {n}</span>
          </h1>
          <p className="checkpoint__text en">
            {questions} questions from everything in “{unit.titleEn}”. Get {Math.round(passRatio * 100)}% right
            on the first try to unlock {nextUnit ? `Unit ${n + 1}` : 'the next part'}.
          </p>
          <div className="button-row">
            <button className="btn btn--primary" onClick={start} autoFocus>
              Aloita <span className="en">Start</span>
            </button>
            <Link className="btn" to="/">
              Koti <span className="en">Home</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (phase === 'result') {
    const correct = results.reduce((s, r) => s + r.correct, 0);
    const total = results.reduce((s, r) => s + r.total, 0);
    const ratio = total > 0 ? correct / total : 0;
    const passed = ratio >= passRatio;
    // The weakest part — where to practise before trying again.
    let weakest = 0;
    results.forEach((r, i) => {
      const a = r.total ? r.correct / r.total : 1;
      const w = results[weakest].total ? results[weakest].correct / results[weakest].total : 1;
      if (a < w) weakest = i;
    });
    const weakStep = plan[weakest]?.step;
    return (
      <main className="app">
        <section className={'screen checkpoint checkpoint--' + (passed ? 'pass' : 'fail')}>
          <div className="checkpoint__badge" aria-hidden="true">
            {passed ? '🏆' : '💪'}
          </div>
          <h1 className="title">
            {passed ? 'Läpäisty!' : 'Melkein!'}{' '}
            <span className="en">{passed ? 'Checkpoint passed!' : 'Almost there'}</span>
          </h1>
          <p className="checkpoint__score" aria-label={`${correct} of ${total} right`}>
            {correct} / {total}
          </p>
          {passed ? (
            <p className="checkpoint__text en">
              {nextUnit ? `Unit ${n + 1} · ${nextUnit.titleEn} is open!` : 'You finished the course!'}
            </p>
          ) : (
            <p className="checkpoint__text en">
              You need {Math.ceil(passRatio * total)} to pass.
              {weakStep && <> Practise “{weakStep.titleEn}” a little more, then try again.</>}
            </p>
          )}
          <div className="button-row">
            {passed ? (
              <button
                className="btn btn--primary"
                onClick={() => navigate(nextUnit ? `/lesson/${nextUnit.lessonId}` : '/')}
                autoFocus
              >
                Jatka <span className="en">Continue</span>
              </button>
            ) : (
              <>
                {weakStep && (
                  <Link className="btn btn--primary" to={`/skill/${weakStep.id}`}>
                    Harjoittele <span className="en">Practise</span>
                  </Link>
                )}
                <button className="btn" onClick={start}>
                  Uudestaan <span className="en">Try again</span>
                </button>
              </>
            )}
            <Link className="btn" to="/">
              Koti <span className="en">Home</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // Running.
  const p = plan[part];
  const element = renderActivity(p.step, p.activity, () => navigate('/'));
  const onSegmentComplete = (correct: number, total: number) => {
    const next = [...results, { correct, total }];
    setResults(next);
    if (part + 1 < plan.length) {
      setPart(part + 1);
      return;
    }
    const c = next.reduce((s, r) => s + r.correct, 0);
    const t = next.reduce((s, r) => s + r.total, 0);
    const ratio = t > 0 ? c / t : 0;
    const passed = ratio >= passRatio;
    recordCheckpoint(unit.id, ratio, passed);
    playDing(passed);
    setPhase('result');
  };

  return (
    <main className="app">
      <div className="checkpoint-bar" aria-label={`Checkpoint part ${part + 1} of ${plan.length}`}>
        🏁 <span className="en">Checkpoint · part {part + 1}/{plan.length}</span>
      </div>
      <ActivityContext.Provider
        value={{
          onSegmentComplete,
          difficulty: { ...difficultyFor(p.level), ...p.step.pin },
          sessionStars: stars - startStars,
          roundQuestions: p.questions,
          lessonId: unit.lessonId,
        }}
      >
        <div key={`${run}-${part}`}>{element}</div>
      </ActivityContext.Provider>
    </main>
  );
}
