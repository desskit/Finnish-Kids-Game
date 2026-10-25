import { Suspense, cloneElement, lazy, useRef, useState } from 'react';
import { HashRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  badgeEnv,
  findSkill,
  renderActivity,
  activityForRound,
  isBonusRound,
  mixStepFor,
} from './game/path';
import { difficultyFor } from './game/adapt';
import { findMathSkill, isMathId } from './game/mathPath';
import { renderMathActivity } from './components/math/renderMath';
import { actionHref, findUnit, lessonForStep, nextAction, openerStoryId } from './game/course';
import { isSpeechRecognitionAvailable } from './audio/speech';
import { ActivityContext, type RoundOutcome, type SegmentMeta } from './game/activityContext';
import { recordRoundOnChild, activityLevel } from './game/progress';
import { recordStoryOnChild, storyStepDone } from './game/storyLog';
import { stories, storyById } from './content/stories';
import StoryTime from './components/StoryTime';
import { earnedBadgeIds, earnedBadges } from './game/badges';
import { segmentMs } from './game/stats';
import { questionsToday, reachesBudget, sessionBudget } from './game/session';
import { surpriseStory } from './game/learned';
import LearnedWords from './components/LearnedWords';
import { useProfile } from './state/profile';
import AppShell from './components/AppShell';
import RewardToast from './components/RewardToast';
import CourseHome from './components/CourseHome';
import LessonRoute from './components/LessonRoute';
import Achievements from './components/Achievements';
import Notebook from './components/Notebook';
import SoundsHub from './components/SoundsHub';
import SoundGame from './components/SoundGame';
import CheckpointRoute from './components/CheckpointRoute';
import ProfilePicker from './components/ProfilePicker';
import ReviewActivity from './components/ReviewActivity';
import GrownUp from './components/GrownUp';
import ProgressView from './components/ProgressView';
import Profiles from './components/Profiles';
import Settings from './components/Settings';
import AuditView from './components/AuditView';
import WarmupRoute from './components/WarmupRoute';
import StatsView from './components/StatsView';
// the Finnish check carries every reviewable line and both ledgers: loaded only when opened
const FinnishReview = lazy(() => import('./components/FinnishReview'));
import MathHome from './components/math/MathHome';
import MathTestRoute from './components/math/MathTestRoute';
import MathToday from './components/math/MathToday';
import Art from './art/Art';

// Content facts the badge rules measure against (derived from the path).
const BADGE_ENV = badgeEnv;

// Routing shell. HashRouter gives real back-button/history (critical for the
// PWA + a future Capacitor hardware-back) and deep links, and it sidesteps
// base-path/redirect issues on GitHub Pages subpaths, Netlify, and Capacitor
// file:// — no server rewrites needed.
//
//   /                   → CourseHome    (the guided course: units, Continue, Review)
//   /opener/:unitId     → Opener        (a unit's story, heard before any practice)
//   /lesson/:lessonId   → Lesson        (a unit's short "how it works" lesson)
//   /notebook           → Notebook      (re-read any opened unit's lesson)
//   /skill/:skillId     → Activity      (a step's game, runs full-screen)
//   /checkpoint/:unitId → Checkpoint    (the unit test that unlocks the next unit)
//   /math               → MathHome      (Lasketaan!: the optional math-in-Finnish map)
//   /math/test/:stageId → MathTest      (a math stage's test, which wins its crown)
//   /math/today         → MathToday     (Päivän laskut: today's sums, once a day)
//   /warmup             → Warm-up       (a new day's first Continue: the weakest subject)
//   /review             → Review        (cross-topic spaced repetition)
//   /profiles           → ProfilePicker (kid-accessible switch/add)
//   /grown-up/*         → math-gated Progress / Profiles / Settings

// Remounts the session per skill: React Router reuses the element across
// :skillId changes, which would otherwise carry one skill's round counter/level
// into the next. Keying by skillId gives each skill a fresh session.
function SkillRouteHost() {
  const { skillId } = useParams();
  return <SkillRoute key={skillId} />;
}

// Resolves a skill from the URL and runs its game full-screen as ONE unbroken
// stream of challenges: the games report each finished question segment
// silently, the level adapts in the background, and the next segment (possibly
// a different game type) mounts with no interstitial. Level-ups/badges surface
// as a small self-dismissing toast; the only stop is the child tapping Koti.
function SkillRoute() {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const { activeChild, recordRound, recordStory, recordStats, activityDifficulty, stars, settings } = useProfile();
  // a math step (Lasketaan!) plays through here too, kept apart from the course
  const found = skillId ? findSkill(skillId) ?? findMathSkill(skillId) : undefined;
  const math = !!found && isMathId(found.skill.id);

  // `round.no` counts segments (drives game-type rotation); `round.level` is
  // the level FROZEN at the segment's start, so a mid-segment level change
  // never hot-swaps the game underneath the child.
  const liveLevel = activityDifficulty(found?.chapter.id ?? '', found?.skill.id ?? '').level;
  const [round, setRound] = useState({ no: 0, level: liveLevel });
  const [toast, setToast] = useState<{ outcome: RoundOutcome; id: number } | null>(null);
  // The day's practice has reached this player's budget (game/session.ts): a
  // natural place to stop — home is offered first, going on is a choice.
  const [stopHere, setStopHere] = useState(false);

  // Stars earned this sitting: the games call addStars per correct answer, so
  // the profile total ticks live; the ref pins the count at entry. (SkillRoute
  // is keyed per skillId — survives segment remounts, resets per skill.)
  const startStars = useRef(stars);
  const sessionStars = stars - startStars.current;
  // When the current segment began — its practice time goes into the stats.
  const segmentStart = useRef(Date.now());

  if (!activeChild) return <Navigate to="/profiles" replace />;
  if (!found) return <Navigate to="/" replace />;
  const { chapter, skill } = found;
  if (skill.activity === 'review') return <Navigate to="/review" replace />;

  // A Kertaus (mixed review) step replays a different EARLIER step each
  // segment — that step's own game, words and pins — while progress still
  // records under the Kertaus step itself.
  const mix = mixStepFor(skill, round.no);
  const play = mix ?? { chapter, skill };
  // A course step may pin some knobs (its grammar tier, its verb tense) over
  // the level's own — the level still drives tiles/trickiness/production.
  const difficulty = { ...difficultyFor(round.level), ...play.skill.pin };
  // Speaking is folded into the rotation only where the browser can hear it AND
  // a grown-up hasn't switched it off.
  const speechOn = isSpeechRecognitionAvailable() && settings.speakingEnabled !== false;
  const activity = activityForRound(play.skill, round.level, round.no, speechOn);
  // A bonus round (typing in later units, and speaking): scored, never levelled.
  const bonus = isBonusRound(play.skill, round.level, round.no, activity);
  const onExit = () => navigate(math ? '/math' : '/');
  const element = math ? renderMathActivity(play.skill, activity, onExit) : renderActivity(play.skill, activity, onExit);
  if (!element) return <Navigate to="/" replace />;

  // Silent segment recording + advance, in one commit: fold the segment's
  // first-try accuracy into the adaptive level, queue a toast if something was
  // earned, and bump the segment counter — the key change below swaps the
  // finished game for the next one instantly. (A story records its read too,
  // and stays on screen for its own result: `meta.stay`.)
  const onSegmentComplete = (segStars: number, total: number, meta?: SegmentMeta) => {
    const before = activeChild;
    const now = Date.now();
    if (!math && !meta?.stay && reachesBudget(questionsToday(before, now), total, sessionBudget(before))) {
      setStopHere(true);
    }
    // This node's own ladder depth caps the adaptive climb (default 4).
    const maxLevel = skill.maxLevel ?? 4;
    // A story step is done once each of its stories has had one good read.
    const read = meta?.story;
    const logged = read ? recordStoryOnChild(before, read.id, segStars, total, read.asked, now) : before;
    const proven = read ? storyStepDone(logged, play.skill.content.ids ?? stories.map((s) => s.id)) : false;
    const after = recordRoundOnChild(logged, chapter.id, skill.id, segStars, total, maxLevel, bonus, proven);
    const afterLevel = activityLevel(after, chapter.id, skill.id);
    const leveledUp =
      before.adaptive !== false && afterLevel > activityLevel(before, chapter.id, skill.id);
    const had = earnedBadgeIds(before, BADGE_ENV);
    const newBadges = earnedBadges(after, BADGE_ENV).filter((b) => !had.has(b.id));
    if (read) recordStory(read.id, segStars, total, read.asked);
    recordRound(chapter.id, skill.id, segStars, total, maxLevel, bonus, proven);
    // Stats go to the subject actually practised: a Kertaus segment counts for
    // the earlier step it replayed.
    recordStats({
      subject: play.skill.id,
      right: segStars,
      total,
      ms: segmentMs(segmentStart.current, now, total),
      source: bonus ? 'bonus' : mix ? 'mix' : 'practice',
    });
    segmentStart.current = now;
    if (leveledUp || newBadges.length > 0) {
      setToast((t) => ({
        outcome: { leveledUp, level: afterLevel, newBadges },
        id: (t?.id ?? 0) + 1,
      }));
    }
    // A game showing its own result stays put; it moves on itself.
    if (meta?.stay) return;
    // Manual mode keeps its pinned level; adaptive uses the just-recorded one
    // (the pure look-ahead — the context re-render lands after this commit).
    const nextLevel = before.adaptive === false ? round.level : afterLevel;
    setRound((r) => ({ no: r.no + 1, level: nextLevel }));
  };

  if (stopHere) {
    // Now and then, unannounced: a story finished a while ago, to read again.
    const surprise = surpriseStory(activeChild, Date.now());
    return (
      <main className="app">
        <section className="screen checkpoint checkpoint--pass session-done">
          <div className="checkpoint__badge" aria-hidden="true">
            <Art glyph="🌟" motion="loop" />
          </div>
          <h1 className="title">
            Hienoa työtä tänään! <span className="en">That's today's practice done</span>
          </h1>
          <LearnedWords />
          <p className="checkpoint__text en">
            A little every day works best — this is a good place to stop. Come back tomorrow, or keep going if you
            like.
          </p>
          {surprise && (
            <Link className="book book--surprise" to={`/story/${surprise.id}`}>
              <span className="book__icon" aria-hidden="true">
                <Art glyph={surprise.icon} />
              </span>
              <span className="book__title">{surprise.titleFi}</span>
              <span className="book__en en">
                <Art glyph="🎁" /> Lue uudestaan · Read it again
              </span>
            </Link>
          )}
          <div className="button-row">
            <button className="btn btn--primary" onClick={() => navigate('/')} autoFocus>
              Koti <span className="en">Home</span>
            </button>
            <button className="btn" onClick={() => setStopHere(false)}>
              Jatka <span className="en">Keep going</span>
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={'app' + (mix ? ' app--barred' : '')}>
      {mix && (
        <div className="checkpoint-bar" aria-label={`Mixed review: ${mix.skill.titleEn}`}>
          <Art glyph="🔁" /> <span className="en">Kertaus · {mix.skill.titleEn}</span>
        </div>
      )}
      <ActivityContext.Provider
        value={{ onSegmentComplete, difficulty, sessionStars, lessonId: lessonForStep(play.chapter, play.skill) }}
      >
        {/* Key by segment so each one mounts fresh — switching game type cleanly. */}
        {cloneElement(element, { key: round.no })}
      </ActivityContext.Provider>
      {/* Outside the keyed child so it survives the segment swap; keyed per
          reward so back-to-back rewards restart the timer. */}
      {toast && (
        <RewardToast key={toast.id} outcome={toast.outcome} math={math} onDismiss={() => setToast(null)} />
      )}
    </main>
  );
}

// Cross-topic spaced-repetition review. Runs full-screen like an activity, but
// isn't a path step; needs an active child to have an SRS history to draw on.
function ReviewRoute() {
  const { activeChild } = useProfile();
  if (!activeChild) return <Navigate to="/profiles" replace />;
  return <ReviewActivity />;
}

// "Continue" from inside a game that ends with its own result (a story): on
// to whatever the course offers next.
function NextRoute() {
  const { activeChild } = useProfile();
  if (!activeChild) return <Navigate to="/profiles" replace />;
  return <Navigate to={actionHref(nextAction(activeChild))} replace />;
}

// A story from the bookshelf, read just for the joy of it: no questions, no score.
function StoryRoute() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { activeChild } = useProfile();
  if (!activeChild) return <Navigate to="/profiles" replace />;
  if (!storyId || !storyById[storyId]) return <Navigate to="/notebook" replace />;
  return (
    <main className="app">
      <StoryTime key={storyId} mode="free" storyId={storyId} onExit={() => navigate('/notebook')} />
    </main>
  );
}

// A unit's opener ("Kuuntele ensin"): its story heard before any practice —
// no questions, no score. Hearing it to the end opens the unit's first steps;
// "Jatka" goes on to whatever the course offers next.
function OpenerRoute() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { activeChild, markOpenerHeard } = useProfile();
  if (!activeChild) return <Navigate to="/profiles" replace />;
  const unit = unitId ? findUnit(unitId) : undefined;
  const storyId = unit && openerStoryId(unit);
  if (!unit || !storyId || !storyById[storyId]) return <Navigate to="/" replace />;
  return (
    <main className="app">
      <StoryTime
        key={unit.id}
        mode="listen"
        storyId={storyId}
        onHeard={() => markOpenerHeard(unit.id)}
        onDone={() => navigate('/next')}
        onExit={() => navigate('/')}
      />
    </main>
  );
}

// Route tree, separated from the router so it can be mounted in a MemoryRouter
// for tests (the smoke spec drives navigation through these routes).
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/profiles" element={<ProfilePicker />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<CourseHome />} />
        <Route path="/notebook" element={<Notebook />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/sounds" element={<SoundsHub />} />
        <Route path="/math" element={<MathHome />} />
      </Route>
      <Route path="/lesson/:lessonId" element={<LessonRoute />} />
      <Route path="/skill/:skillId" element={<SkillRouteHost />} />
      <Route path="/checkpoint/:unitId" element={<CheckpointRoute />} />
      <Route path="/math/test/:stageId" element={<MathTestRoute />} />
      <Route path="/math/today" element={<MathToday />} />
      <Route path="/warmup" element={<WarmupRoute />} />
      <Route path="/review" element={<ReviewRoute />} />
      <Route path="/next" element={<NextRoute />} />
      <Route path="/story/:storyId" element={<StoryRoute />} />
      <Route path="/opener/:unitId" element={<OpenerRoute />} />
      <Route path="/sounds/:mode" element={<SoundGame />} />
      <Route path="/grown-up" element={<GrownUp />}>
        <Route index element={<Navigate to="progress" replace />} />
        <Route path="progress" element={<ProgressView />} />
        <Route path="stats" element={<StatsView />} />
        <Route path="profiles" element={<Profiles />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit" element={<AuditView />} />
        <Route
          path="review"
          element={
            <Suspense fallback={<p className="gmuted">Loading…</p>}>
              <FinnishReview />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
