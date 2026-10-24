import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { difficultyFor } from '../../game/adapt';
import { ActivityContext } from '../../game/activityContext';
import { badgeEnv } from '../../game/path';
import { earnedBadgeIds, earnedBadges } from '../../game/badges';
import { findMathStage, mathPassRatio, mathTestPlan } from '../../game/mathPath';
import { mathTestStatus, stageAhead } from '../../game/mathCourse';
import { useProfile } from '../../state/profile';
import { playDing } from '../../audio/sfx';
import { segmentMs } from '../../game/stats';
import { nearPass } from '../../game/score';
import Art from '../../art/Art';
import { renderMathActivity } from './renderMath';
import { waitingNote } from './MathHome';
import '../../styles/math.css';

interface PartResult {
  correct: number;
  total: number;
}

// /math/test/:stageId — a stage's test, which wins its crown: each of its games
// for a few questions at the top of its ladder, first-try answers counted, as
// the course's checkpoints do. But with no digit on screen: the parts are dots,
// the score is stars. The crown goes in the child's math record, never among
// the course's checkpoints.
export default function MathTestRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const { activeChild, settings, recordMathTest, recordStats } = useProfile();
  const stage = stageId ? findMathStage(stageId) : undefined;
  const [phase, setPhase] = useState<'intro' | 'run' | 'result'>('intro');
  const [part, setPart] = useState(0);
  const [results, setResults] = useState<PartResult[]>([]);
  const [run, setRun] = useState(0);
  const badgesBefore = useRef<Set<string> | null>(null);
  const partStart = useRef(Date.now());

  if (!activeChild) return <Navigate to="/profiles" replace />;
  if (!stage) return <Navigate to="/math" replace />;
  if (phase === 'intro' && mathTestStatus(activeChild, stage, !!settings.unlockAll) === 'locked') {
    return <Navigate to="/math" replace />;
  }
  const plan = mathTestPlan(stage);
  const passRatio = mathPassRatio(stage);
  const toMap = () => navigate('/math');

  const start = () => {
    setPart(0);
    setResults([]);
    setRun((r) => r + 1);
    setPhase('run');
    partStart.current = Date.now();
  };

  if (phase === 'intro') {
    return (
      <main className="app">
        <section className="screen checkpoint math-test">
          <div className="checkpoint__badge" aria-hidden="true">
            <Art id={stage.crown} motion="loop" />
          </div>
          <h1 className="title">
            Välitesti <span className="en">Win the crown · {stage.titleEn}</span>
          </h1>
          <p className="checkpoint__text en">
            A few questions from each game in “{stage.titleEn}”, all in Finnish. Get almost all of them right on the
            first try to win the crown.
          </p>
          <div className="button-row">
            <button className="btn btn--primary" onClick={start} autoFocus>
              Aloita <span className="en">Start</span>
            </button>
            <Link className="btn" to="/math">
              Takaisin <span className="en">Back to the map</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (phase === 'result') {
    const correct = results.reduce((s, r) => s + r.correct, 0);
    const total = results.reduce((s, r) => s + r.total, 0);
    const passed = total > 0 && correct / total >= passRatio;
    const close = nearPass(correct, total, passRatio);
    let weakest = 0;
    results.forEach((r, i) => {
      const a = r.total ? r.correct / r.total : 1;
      const w = results[weakest].total ? results[weakest].correct / results[weakest].total : 1;
      if (a < w) weakest = i;
    });
    const weakStep = plan[weakest]?.step;
    // the stage ahead now this crown is won (the shop and the clock branch, so not always the next one along)
    const ahead = stageAhead(activeChild, !!settings.unlockAll);
    const before = badgesBefore.current;
    const newBadges = before ? earnedBadges(activeChild, badgeEnv).filter((b) => !before.has(b.id)) : [];
    return (
      <main className="app">
        <section className={'screen checkpoint math-test checkpoint--' + (passed ? 'pass' : 'fail')}>
          <div className="checkpoint__badge" aria-hidden="true">
            {passed ? <Art id={stage.crown} motion="loop" /> : <Art glyph="💪" motion="loop" />}
          </div>
          <h1 className="title">
            {passed ? 'Läpäisty!' : close ? 'Melkein!' : 'Hyvä yritys!'}{' '}
            <span className="en">{passed ? 'You won the crown!' : close ? 'Almost there' : 'Good try!'}</span>
          </h1>
          <p className="checkpoint__score math-test__stars" aria-label={`${correct} of ${total} right`}>
            {Array.from({ length: total }, (_, i) => (
              <Art key={i} glyph="⭐" className={i < correct ? undefined : 'art--off'} />
            ))}
          </p>
          <p className="checkpoint__text en">
            {passed
              ? ahead?.open
                ? `Next: “${ahead.stage.titleEn}”.`
                : waitingNote(activeChild, !!settings.unlockAll)
              : `Practice “${weakStep?.titleEn ?? stage.titleEn}” a little more, then try again.`}
          </p>
          {newBadges.length > 0 && (
            <ul className="checkpoint__new-badges" aria-label="New achievements">
              {newBadges.map((b) => (
                <li key={b.id}>
                  <span aria-hidden="true">
                    <Art glyph={b.emoji} />
                  </span>{' '}
                  Uusi saavutus! <span className="en">{b.titleEn}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="button-row">
            {passed ? (
              <button className="btn btn--primary" onClick={toMap} autoFocus>
                Jatka <span className="en">Continue</span>
              </button>
            ) : (
              <>
                {weakStep && (
                  <Link className="btn btn--primary" to={`/skill/${weakStep.id}`}>
                    Harjoittele <span className="en">Practice</span>
                  </Link>
                )}
                <button className="btn" onClick={start}>
                  Uudestaan <span className="en">Try again</span>
                </button>
              </>
            )}
            <Link className="btn" to="/math">
              Takaisin <span className="en">Back to the map</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // Running.
  const p = plan[part];
  const element = renderMathActivity(p.step, p.activity, toMap);
  const onSegmentComplete = (correct: number, total: number) => {
    const next = [...results, { correct, total }];
    setResults(next);
    const now = Date.now();
    recordStats({ subject: p.step.id, right: correct, total, ms: segmentMs(partStart.current, now, total), source: 'checkpoint' });
    partStart.current = now;
    if (part + 1 < plan.length) {
      setPart(part + 1);
      return;
    }
    const c = next.reduce((s, r) => s + r.correct, 0);
    const t = next.reduce((s, r) => s + r.total, 0);
    const ratio = t > 0 ? c / t : 0;
    const passed = ratio >= passRatio;
    badgesBefore.current = earnedBadgeIds(activeChild, badgeEnv);
    recordMathTest(stage.id, ratio, passed);
    playDing(passed);
    setPhase('result');
  };

  return (
    <main className="app app--barred">
      <div className="checkpoint-bar math-test__bar" aria-label="Win the crown">
        <Art id={stage.crown} /> Välitesti{' '}
        <span className="math-test__parts" aria-hidden="true">
          {plan.map((_, i) => (
            <span key={i} className={'dot' + (i < part ? ' dot--done' : i === part ? ' dot--current' : '')} />
          ))}
        </span>
      </div>
      <ActivityContext.Provider
        value={{
          onSegmentComplete,
          difficulty: difficultyFor(p.level),
          sessionStars: 0,
          roundQuestions: p.questions,
          lessonId: stage.lessonId,
        }}
      >
        <div className="app__game" key={`${run}-${part}`}>
          {element}
        </div>
      </ActivityContext.Provider>
    </main>
  );
}
