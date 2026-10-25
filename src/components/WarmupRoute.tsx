import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { difficultyFor } from '../game/adapt';
import { ActivityContext, type SegmentMeta } from '../game/activityContext';
import { renderActivity } from '../game/path';
import { actionHref, lessonForStep, nextAction } from '../game/course';
import { segmentMs } from '../game/stats';
import { activityLevel, recordRoundOnChild } from '../game/progress';
import { dayKey } from '../game/streak';
import { WARMUP_QUESTIONS, pickWarmupSubject, warmupActivity, warmupLevel } from '../game/warmup';
import { dueStoryRevisit } from '../game/storyLog';
import { warmupReviewIds } from '../game/session';
import ReviewActivity from './ReviewActivity';
import { storyById } from '../content/stories';
import { useProfile } from '../state/profile';
import { playDing } from '../audio/sfx';
import StoryTime from './StoryTime';
import LearnedWords from './LearnedWords';
import Art from '../art/Art';

/** A warm-up stops trying after this many segments, even if short (an empty game). */
const MAX_SEGMENTS = 6;

// /warmup — "Päivän lämmittely", the daily warm-up. The first Continue of a new
// day lands here: at least WARMUP_QUESTIONS questions on the child's weakest
// subject so far (see game/warmup.ts), played as that step's own games at the
// child's level for it, then a short result and back to the course. Every
// segment is real practice of the step, so it records like normal play (level,
// stats) — plus the warm-up log that makes today's Continue go back to normal.
//
// When a finished story is due back (game/storyLog.ts), the warm-up opens with
// it: "Muistatko?" — its cover, a re-read if she likes, and two questions it
// hasn't asked before. When words and grammar are due back for review
// (game/session.ts), the warm-up asks those instead of drilling a subject.
export default function WarmupRoute() {
  const navigate = useNavigate();
  const { activeChild, recordRound, recordStats, recordStory, recordWarmup, stars } = useProfile();
  // Chosen once, on arrival — a warm-up never changes under the child.
  const [reviewIds] = useState(() => (activeChild ? warmupReviewIds(activeChild, Date.now()) : []));
  const [subject] = useState(() =>
    activeChild && reviewIds.length === 0 ? pickWarmupSubject(activeChild, Date.now()) : undefined,
  );
  const [revisitId] = useState(() => (activeChild ? dueStoryRevisit(activeChild, Date.now()) : undefined));
  const reviewing = reviewIds.length > 0;
  const [seg, setSeg] = useState(0);
  const [segLevel, setSegLevel] = useState(() =>
    activeChild && subject ? warmupLevel(activeChild, subject) : 1,
  );
  const [tally, setTally] = useState({ right: 0, total: 0 });
  const [storyTally, setStoryTally] = useState<{ right: number; total: number } | null>(null);
  const [phase, setPhase] = useState<'story' | 'review' | 'run' | 'result'>(() =>
    revisitId ? 'story' : reviewIds.length > 0 ? 'review' : 'run',
  );
  const segStart = useRef(Date.now());
  const startStars = useRef(stars);

  if (!activeChild) return <Navigate to="/profiles" replace />;
  const revisit = revisitId ? storyById[revisitId] : undefined;
  if (!subject && !revisit && !reviewing) return <Navigate to="/" replace />;
  const exit = () => navigate('/');

  if (phase === 'result') {
    const ratio = tally.total > 0 ? tally.right / tally.total : 0;
    const storyGood = storyTally ? storyTally.total > 0 && storyTally.right / storyTally.total >= 0.5 : true;
    const good = (subject || reviewing ? ratio >= 0.8 : true) && storyGood;
    const next = nextAction(activeChild);
    return (
      <main className="app">
        <section className={'screen checkpoint warmup-result' + (good ? ' checkpoint--pass' : '')}>
          <div className="checkpoint__badge" aria-hidden="true">
            <Art glyph={good ? '🌞' : '💪'} motion="loop" />
          </div>
          <h1 className="title">
            Lämmittely tehty! <span className="en">Warm-up done</span>
          </h1>
          <LearnedWords />
          {revisit && storyTally && (
            <p className="warmup-result__story" aria-label={`Story: ${storyTally.right} of ${storyTally.total} right first time`}>
              <Art glyph="📖" /> Muistatko? {revisit.titleFi} —{' '}
              <span className="nowrap">
                {storyTally.right} / {storyTally.total}
              </span>
            </p>
          )}
          {reviewing && (
            <>
              <p className="checkpoint__score" aria-label={`${tally.right} of ${tally.total} right first time`}>
                {tally.right} / {tally.total}
              </p>
              <p className="checkpoint__text en">
                {ratio >= 0.8
                  ? 'The words due back today are still there. On with the course!'
                  : 'A few words slipped — they will come back again soon.'}
              </p>
            </>
          )}
          {subject && (
            <>
              <p className="checkpoint__score" aria-label={`${tally.right} of ${tally.total} right first time`}>
                {tally.right} / {tally.total}
              </p>
              <p className="checkpoint__text en">
                {ratio >= 0.8
                  ? `“${subject.step.titleEn}” is getting stronger. On with the course!`
                  : `“${subject.step.titleEn}” is a tricky one — it will come back for more practice.`}
              </p>
            </>
          )}
          <div className="button-row">
            <button className="btn btn--primary" onClick={() => navigate(actionHref(next))} autoFocus>
              Jatka <span className="en">Continue</span>
            </button>
            {subject && ratio < 0.8 && (
              <Link className="btn" to={`/lesson/${lessonForStep(subject.unit, subject.step)}`} state={{ from: 'notebook' }}>
                <Art glyph="📖" /> Oppitunti <span className="en">Read the lesson</span>
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

  // "Muistatko?" — a finished story, back once.
  if (phase === 'story' && revisit) {
    const onStoryDone = (right: number, total: number, meta?: SegmentMeta) => {
      const now = Date.now();
      recordStory(revisit.id, right, total, meta?.story?.asked ?? [], 'revisit');
      // Counted in the day's practice; a story isn't a subject to rank.
      recordStats({ right, total, ms: segmentMs(segStart.current, now, total), source: 'warmup' });
      segStart.current = now;
      setStoryTally({ right, total });
      if (reviewing || subject) {
        setPhase(reviewing ? 'review' : 'run');
        return;
      }
      // Only the story today: that was the warm-up.
      recordWarmup({ day: dayKey(now), subject: `story:${revisit.id}`, right, total, at: now });
      playDing(total > 0 && right / total >= 0.5);
      setPhase('result');
    };
    return (
      <main className="app app--barred">
        <div className="checkpoint-bar warmup-bar" aria-label="Warm-up: a story to remember">
          <Art glyph="☀️" /> Lämmittely <span className="en">Warm-up · Muistatko? A story to remember</span>
        </div>
        <ActivityContext.Provider
          value={{ onSegmentComplete: onStoryDone, difficulty: difficultyFor(1), sessionStars: stars - startStars.current }}
        >
          <div className="app__game">
            <StoryTime mode="revisit" storyId={revisit.id} onExit={exit} />
          </div>
        </ActivityContext.Provider>
      </main>
    );
  }

  // Words and grammar due back: Review's own questions, on just those.
  if (phase === 'review' && reviewing) {
    const onReviewDone = (right: number, total: number) => {
      const now = Date.now();
      // (Review records its own practice stats.)
      setTally({ right, total });
      recordWarmup({ day: dayKey(now), subject: 'review', right, total, at: now });
      playDing(total > 0 && right / total >= 0.8);
      setPhase('result');
    };
    return (
      <main className="app app--barred">
        <div className="checkpoint-bar warmup-bar" aria-label={`Warm-up: ${reviewIds.length} words to review`}>
          <Art glyph="☀️" /> Lämmittely <span className="en">Warm-up · Kertaus: words due back today</span>
        </div>
        <div className="app__game">
          <ReviewActivity ids={reviewIds} onFinish={onReviewDone} onExit={exit} />
        </div>
      </main>
    );
  }

  if (!subject) return <Navigate to="/" replace />;
  const { unit, step, unitNo } = subject;

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
        <Art glyph="☀️" /> Lämmittely{' '}
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
