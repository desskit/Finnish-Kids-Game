import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { difficultyFor } from '../game/adapt';
import { ActivityContext } from '../game/activityContext';
import { renderActivity } from '../game/path';
import { actionHref, lessonForStep, nextAction } from '../game/course';
import { segmentMs } from '../game/stats';
import { activityLevel, recordRoundOnChild } from '../game/progress';
import { dayKey } from '../game/streak';
import { WARMUP_QUESTIONS, pickWarmupSubject, warmupActivity, warmupLevel } from '../game/warmup';
import { useProfile } from '../state/profile';
import { playDing } from '../audio/sfx';

/** A warm-up stops trying after this many segments, even if short (an empty game). */
const MAX_SEGMENTS = 6;

// /warmup — "Päivän lämmittely", the daily warm-up. The first Continue of a new
// day lands here: at least WARMUP_QUESTIONS questions on the child's weakest
// subject so far (see game/warmup.ts), played as that step's own games at the
// child's level for it, then a short result and back to the course. Every
// segment is real practice of the step, so it records like normal play (level,
// stats) — plus the warm-up log that makes today's Continue go back to normal.
export default function WarmupRoute() {
  const navigate = useNavigate();
  const { activeChild, recordRound, recordStats, recordWarmup, stars } = useProfile();
  // The subject is chosen once, on arrival — a warm-up never changes under the child.
  const [subject] = useState(() => (activeChild ? pickWarmupSubject(activeChild, Date.now()) : undefined));
  const [seg, setSeg] = useState(0);
  const [segLevel, setSegLevel] = useState(() =>
    activeChild && subject ? warmupLevel(activeChild, subject) : 1,
  );
  const [tally, setTally] = useState({ right: 0, total: 0 });
  const [phase, setPhase] = useState<'run' | 'result'>('run');
  const segStart = useRef(Date.now());
  const startStars = useRef(stars);

  if (!activeChild) return <Navigate to="/profiles" replace />;
  if (!subject) return <Navigate to="/" replace />;
  const { unit, step, unitNo } = subject;
  const exit = () => navigate('/');

  if (phase === 'result') {
    const ratio = tally.total > 0 ? tally.right / tally.total : 0;
    const next = nextAction(activeChild);
    return (
      <main className="app">
        <section className={'screen checkpoint warmup-result' + (ratio >= 0.8 ? ' checkpoint--pass' : '')}>
          <div className="checkpoint__badge" aria-hidden="true">
            {ratio >= 0.8 ? '🌞' : '💪'}
          </div>
          <h1 className="title">
            Lämmittely tehty! <span className="en">Warm-up done</span>
          </h1>
          <p className="checkpoint__score" aria-label={`${tally.right} of ${tally.total} right first time`}>
            {tally.right} / {tally.total}
          </p>
          <p className="checkpoint__text en">
            {ratio >= 0.8
              ? `“${step.titleEn}” is getting stronger. On with the course!`
              : `“${step.titleEn}” is a tricky one — it will come back to practise again.`}
          </p>
          <div className="button-row">
            <button className="btn btn--primary" onClick={() => navigate(actionHref(next))} autoFocus>
              Jatka <span className="en">Continue</span>
            </button>
            {ratio < 0.8 && (
              <Link className="btn" to={`/lesson/${lessonForStep(unit, step)}`} state={{ from: 'notebook' }}>
                📖 Oppitunti <span className="en">Read the lesson</span>
              </Link>
            )}
            <Link className="btn" to="/">
              Koti <span className="en">Home</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const remaining = Math.max(1, WARMUP_QUESTIONS - tally.total);
  const activity = warmupActivity(step, segLevel, seg);
  const element = renderActivity(step, activity, exit);
  if (!element) return <Navigate to="/" replace />;

  const onSegmentComplete = (right: number, total: number) => {
    const now = Date.now();
    // Real practice of the step: its level and its stats move as usual.
    const maxLevel = step.maxLevel ?? 4;
    recordRound(unit.id, step.id, right, total, maxLevel);
    // The next segment plays at the level this one leaves (the pure look-ahead;
    // the profile update lands after this commit). Manual mode keeps its pin.
    const after = recordRoundOnChild(activeChild, unit.id, step.id, right, total, maxLevel);
    const nextLevel = activeChild.adaptive === false ? segLevel : activityLevel(after, unit.id, step.id);
    recordStats({ subject: step.id, right, total, ms: segmentMs(segStart.current, now, total), source: 'warmup' });
    segStart.current = now;
    const sum = { right: tally.right + right, total: tally.total + total };
    setTally(sum);
    if (sum.total >= WARMUP_QUESTIONS || seg + 1 >= MAX_SEGMENTS || total === 0) {
      recordWarmup({ day: dayKey(now), subject: step.id, right: sum.right, total: sum.total, at: now });
      playDing(sum.total > 0 && sum.right / sum.total >= 0.8);
      setPhase('result');
      return;
    }
    setSegLevel(nextLevel);
    setSeg(seg + 1);
  };

  return (
    <main className="app app--barred">
      <div className="checkpoint-bar warmup-bar" aria-label={`Warm-up: ${tally.total} of ${WARMUP_QUESTIONS} questions`}>
        ☀️ Lämmittely{' '}
        <span className="en">
          Warm-up · Unit {unitNo}: {step.titleEn} · {Math.min(tally.total, WARMUP_QUESTIONS)}/{WARMUP_QUESTIONS}
        </span>
      </div>
      <ActivityContext.Provider
        value={{
          onSegmentComplete,
          difficulty: { ...difficultyFor(segLevel), ...step.pin },
          sessionStars: stars - startStars.current,
          roundQuestions: remaining,
          lessonId: lessonForStep(unit, step),
        }}
      >
        <div className="app__game" key={seg}>
          {element}
        </div>
      </ActivityContext.Provider>
    </main>
  );
}
