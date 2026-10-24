import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { difficultyFor } from '../../game/adapt';
import { ActivityContext } from '../../game/activityContext';
import { TODAY_LEVEL, todayBonus, todayDone, todayGames, todayPlan, todayStreak } from '../../game/mathCourse';
import { badgeEnv, type SkillNode } from '../../game/path';
import { earnedBadgeIds, earnedBadges } from '../../game/badges';
import { useProfile } from '../../state/profile';
import { playDing } from '../../audio/sfx';
import Art from '../../art/Art';
import { renderMathActivity } from './renderMath';
import '../../styles/math.css';

// /math/today — Päivän laskut (today's sums): once a day, a problem from each
// of a few games the child has begun, only heard, for bonus stars. The days in
// a row show as flames — never a number, like everything in math.

/** The flames for the days in a row (a week's worth at most). */
function Flames({ days }: { days: number }) {
  if (days <= 0) return null;
  return (
    <span className="math-today__flames" aria-hidden="true">
      {Array.from({ length: Math.min(days, 7) }, (_, i) => (
        <Art key={i} glyph="🔥" />
      ))}
    </span>
  );
}

/** The way in (the home card, the map): done today, or ready. */
export function TodayButton() {
  const { activeChild, settings } = useProfile();
  if (todayGames(activeChild, !!settings.unlockAll).length === 0) return null;
  const done = todayDone(activeChild);
  return (
    <Link className={'math-today' + (done ? ' math-today--done' : '')} to="/math/today">
      <span className="math-today__icon" aria-hidden="true">
        <Art glyph={done ? '✅' : '⚡'} />
      </span>
      <span className="math-today__label">
        Päivän laskut <span className="en">{done ? 'Done today — see you tomorrow' : "Today's sums · bonus stars"}</span>
      </span>
      <Flames days={todayStreak(activeChild)} />
    </Link>
  );
}

export default function MathToday() {
  const navigate = useNavigate();
  const { activeChild, settings, addStars, recordMathToday } = useProfile();
  const [phase, setPhase] = useState<'intro' | 'run' | 'result'>('intro');
  const [plan, setPlan] = useState<SkillNode[]>([]);
  const [part, setPart] = useState(0);
  const [right, setRight] = useState(0);
  const badgesBefore = useRef<Set<string> | null>(null);

  if (!activeChild) return <Navigate to="/profiles" replace />;
  const unlockAll = !!settings.unlockAll;
  if (todayGames(activeChild, unlockAll).length === 0) return <Navigate to="/math" replace />;
  const toMap = () => navigate('/math');

  if (phase === 'intro') {
    const done = todayDone(activeChild);
    return (
      <main className="app">
        <section className="screen checkpoint math-today-screen">
          <div className="checkpoint__badge" aria-hidden="true">
            <Art glyph={done ? '✅' : '⚡'} motion="loop" />
          </div>
          <h1 className="title">
            Päivän laskut <span className="en">Today’s sums</span>
          </h1>
          <Flames days={todayStreak(activeChild)} />
          <p className="checkpoint__text en">
            {done
              ? 'Done for today — come back tomorrow to keep the flames going!'
              : 'A few problems from your math games, only heard — listen well! Do them once a day for bonus stars.'}
          </p>
          <div className="button-row">
            {!done && (
              <button
                className="btn btn--primary"
                onClick={() => {
                  setPlan(todayPlan(activeChild, unlockAll));
                  setPart(0);
                  setRight(0);
                  setPhase('run');
                }}
                autoFocus
              >
                Aloita <span className="en">Start</span>
              </button>
            )}
            <Link className={'btn' + (done ? ' btn--primary' : '')} to="/math">
              Takaisin <span className="en">Back to the map</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (phase === 'result') {
    const total = plan.length;
    const bonus = todayBonus(right, total);
    const before = badgesBefore.current;
    const newBadges = before ? earnedBadges(activeChild, badgeEnv).filter((b) => !before.has(b.id)) : [];
    return (
      <main className="app">
        <section className="screen checkpoint math-today-screen checkpoint--pass">
          <div className="checkpoint__badge" aria-hidden="true">
            <Art id="fox" motion="loop" />
          </div>
          <h1 className="title">
            {right === total ? 'Hienoa!' : 'Hyvä yritys!'} <span className="en">{right === total ? 'All right!' : 'Good try!'}</span>
          </h1>
          <p className="checkpoint__score math-test__stars" aria-label={`${right} of ${total} right`}>
            {Array.from({ length: total }, (_, i) => (
              <Art key={i} glyph="⭐" className={i < right ? undefined : 'art--off'} />
            ))}
          </p>
          <p className="math-today__bonus">
            <span className="math-test__stars" aria-hidden="true">
              {Array.from({ length: bonus }, (_, i) => (
                <Art key={i} glyph="🌟" />
              ))}
            </span>
            <span className="en">Bonus stars for today’s sums</span>
          </p>
          <Flames days={todayStreak(activeChild)} />
          <p className="checkpoint__text en">Days in a row — come back tomorrow for another flame!</p>
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
            <button className="btn btn--primary" onClick={toMap} autoFocus>
              Jatka <span className="en">Continue</span>
            </button>
          </div>
        </section>
      </main>
    );
  }

  // Running: one problem from each game in turn.
  const step = plan[part];
  const onSegmentComplete = (correct: number) => {
    const sum = right + (correct > 0 ? 1 : 0);
    setRight(sum);
    if (part + 1 < plan.length) {
      setPart(part + 1);
      return;
    }
    // once a day: a second go the same day (another tab) adds nothing
    if (!todayDone(activeChild)) {
      badgesBefore.current = earnedBadgeIds(activeChild, badgeEnv);
      addStars(todayBonus(sum, plan.length));
      recordMathToday();
    }
    playDing(true);
    setPhase('result');
  };

  return (
    <main className="app app--barred">
      <div className="checkpoint-bar math-test__bar" aria-label="Today’s sums">
        <Art glyph="⚡" /> Päivän laskut{' '}
        <span className="math-test__parts" aria-hidden="true">
          {plan.map((_, i) => (
            <span key={i} className={'dot' + (i < part ? ' dot--done' : i === part ? ' dot--current' : '')} />
          ))}
        </span>
      </div>
      <ActivityContext.Provider
        value={{
          onSegmentComplete,
          difficulty: difficultyFor(TODAY_LEVEL),
          sessionStars: 0,
          roundQuestions: 1,
        }}
      >
        <div className="app__game" key={part}>
          {renderMathActivity(step, step.activity, toMap)}
        </div>
      </ActivityContext.Provider>
    </main>
  );
}
