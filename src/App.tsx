import { cloneElement, useRef, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  badgeEnv,
  findSkill,
  renderActivity,
  activityForRound,
  isMinorRound,
  mixStepFor,
} from './game/path';
import { difficultyFor } from './game/adapt';
import { isSpeechRecognitionAvailable } from './audio/speech';
import { ActivityContext, type RoundOutcome } from './game/activityContext';
import { recordRoundOnChild, activityLevel } from './game/progress';
import { earnedBadgeIds, earnedBadges } from './game/badges';
import { useProfile } from './state/profile';
import AppShell from './components/AppShell';
import RewardToast from './components/RewardToast';
import CourseHome from './components/CourseHome';
import LessonRoute from './components/LessonRoute';
import Achievements from './components/Achievements';
import Notebook from './components/Notebook';
import CheckpointRoute from './components/CheckpointRoute';
import ProfilePicker from './components/ProfilePicker';
import ReviewActivity from './components/ReviewActivity';
import GrownUp from './components/GrownUp';
import ProgressView from './components/ProgressView';
import Profiles from './components/Profiles';
import Settings from './components/Settings';
import AuditView from './components/AuditView';

// Content facts the badge rules measure against (derived from the path).
const BADGE_ENV = badgeEnv;

// Routing shell. HashRouter gives real back-button/history (critical for the
// PWA + a future Capacitor hardware-back) and deep links, and it sidesteps
// base-path/redirect issues on GitHub Pages subpaths, Netlify, and Capacitor
// file:// — no server rewrites needed.
//
//   /                   → CourseHome    (the guided course: units, Continue, Review)
//   /lesson/:lessonId   → Lesson        (a unit's short "how it works" lesson)
//   /notebook           → Notebook      (re-read any opened unit's lesson)
//   /skill/:skillId     → Activity      (a step's game, runs full-screen)
//   /checkpoint/:unitId → Checkpoint    (the unit test that unlocks the next unit)
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
  const { activeChild, recordRound, activityDifficulty, stars, settings } = useProfile();
  const found = skillId ? findSkill(skillId) : undefined;

  // `round.no` counts segments (drives game-type rotation); `round.level` is
  // the level FROZEN at the segment's start, so a mid-segment level change
  // never hot-swaps the game underneath the child.
  const liveLevel = activityDifficulty(found?.chapter.id ?? '', found?.skill.id ?? '').level;
  const [round, setRound] = useState({ no: 0, level: liveLevel });
  const [toast, setToast] = useState<{ outcome: RoundOutcome; id: number } | null>(null);

  // Stars earned this sitting: the games call addStars per correct answer, so
  // the profile total ticks live; the ref pins the count at entry. (SkillRoute
  // is keyed per skillId — survives segment remounts, resets per skill.)
  const startStars = useRef(stars);
  const sessionStars = stars - startStars.current;

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
  // A minor bonus round (typing in later units): scored, never levelled.
  const bonus = isMinorRound(play.skill, round.level, round.no);
  const onExit = () => navigate('/');
  const element = renderActivity(play.skill, activity, onExit);
  if (!element) return <Navigate to="/" replace />;

  // Silent segment recording + advance, in one commit: fold the segment's
  // first-try accuracy into the adaptive level, queue a toast if something was
  // earned, and bump the segment counter — the key change below swaps the
  // finished game for the next one instantly.
  const onSegmentComplete = (segStars: number, total: number) => {
    const before = activeChild;
    // This node's own ladder depth caps the adaptive climb (default 4).
    const maxLevel = skill.maxLevel ?? 4;
    const after = recordRoundOnChild(before, chapter.id, skill.id, segStars, total, maxLevel, bonus);
    const afterLevel = activityLevel(after, chapter.id, skill.id);
    const leveledUp =
      before.adaptive !== false && afterLevel > activityLevel(before, chapter.id, skill.id);
    const had = earnedBadgeIds(before, BADGE_ENV);
    const newBadges = earnedBadges(after, BADGE_ENV).filter((b) => !had.has(b.id));
    recordRound(chapter.id, skill.id, segStars, total, maxLevel, bonus);
    if (leveledUp || newBadges.length > 0) {
      setToast((t) => ({
        outcome: { leveledUp, level: afterLevel, newBadges },
        id: (t?.id ?? 0) + 1,
      }));
    }
    // Manual mode keeps its pinned level; adaptive uses the just-recorded one
    // (the pure look-ahead — the context re-render lands after this commit).
    const nextLevel = before.adaptive === false ? round.level : afterLevel;
    setRound((r) => ({ no: r.no + 1, level: nextLevel }));
  };

  return (
    <main className="app">
      {mix && (
        <div className="checkpoint-bar" aria-label={`Mixed review: ${mix.skill.titleEn}`}>
          🔁 <span className="en">Kertaus · {mix.skill.titleEn}</span>
        </div>
      )}
      <ActivityContext.Provider
        value={{ onSegmentComplete, difficulty, sessionStars, lessonId: play.chapter.lessonId }}
      >
        {/* Key by segment so each one mounts fresh — switching game type cleanly. */}
        {cloneElement(element, { key: round.no })}
      </ActivityContext.Provider>
      {/* Outside the keyed child so it survives the segment swap; keyed per
          reward so back-to-back rewards restart the timer. */}
      {toast && (
        <RewardToast key={toast.id} outcome={toast.outcome} onDismiss={() => setToast(null)} />
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
      </Route>
      <Route path="/lesson/:lessonId" element={<LessonRoute />} />
      <Route path="/skill/:skillId" element={<SkillRouteHost />} />
      <Route path="/checkpoint/:unitId" element={<CheckpointRoute />} />
      <Route path="/review" element={<ReviewRoute />} />
      <Route path="/grown-up" element={<GrownUp />}>
        <Route index element={<Navigate to="progress" replace />} />
        <Route path="progress" element={<ProgressView />} />
        <Route path="profiles" element={<Profiles />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit" element={<AuditView />} />
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
