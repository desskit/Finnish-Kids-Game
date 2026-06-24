import { cloneElement, useRef, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { badgeEnv, findSkill, renderActivity, activityForRound } from './game/path';
import { difficultyFor } from './game/adapt';
import { ActivityContext, type RoundOutcome } from './game/activityContext';
import { recordRoundOnChild, activityLevel } from './game/progress';
import { earnedBadgeIds, earnedBadges } from './game/badges';
import { useProfile } from './state/profile';
import AppShell from './components/AppShell';
import MapHome from './components/MapHome';
import ProfilePicker from './components/ProfilePicker';
import ReviewActivity from './components/ReviewActivity';
import GrownUp from './components/GrownUp';
import ProgressView from './components/ProgressView';
import Profiles from './components/Profiles';
import Settings from './components/Settings';

// Content facts the badge rules measure against (derived from the path).
const BADGE_ENV = badgeEnv;

// Routing shell. HashRouter gives real back-button/history (critical for the
// PWA + a future Capacitor hardware-back) and deep links, and it sidesteps
// base-path/redirect issues on GitHub Pages subpaths, Netlify, and Capacitor
// file:// — no server rewrites needed.
//
//   /                   → MapHome       (the journey path of chapters + skills)
//   /skill/:skillId     → Activity      (a skill's game, runs full-screen)
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

// Resolves a skill from the URL and runs its game full-screen. Progress is keyed
// by (chapter, skill); the ActivityContext hands down adaptive difficulty and
// lets the shared RoundComplete record the round + celebrate a level-up / badge.
function SkillRoute() {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const { activeChild, recordRound, activityDifficulty } = useProfile();
  const found = skillId ? findSkill(skillId) : undefined;

  // The continuous session lives HERE, not inside the game component, so each
  // round can serve a DIFFERENT game type (in-session variety). `round.no`
  // counts rounds; `round.level` is the level FROZEN at the round's start, so a
  // level-up recorded during the celebration doesn't hot-swap the game out from
  // under RoundComplete — the next round (Jatka) re-reads the live level.
  const liveLevel = activityDifficulty(found?.chapter.id ?? '', found?.skill.id ?? '').level;
  const liveLevelRef = useRef(liveLevel);
  liveLevelRef.current = liveLevel;
  const [round, setRound] = useState({ no: 0, level: liveLevel });

  if (!activeChild) return <Navigate to="/profiles" replace />;
  if (!found) return <Navigate to="/" replace />;
  const { chapter, skill } = found;
  if (skill.activity === 'review') return <Navigate to="/review" replace />;

  const difficulty = difficultyFor(round.level);
  const activity = activityForRound(skill, round.level, round.no);
  const element = renderActivity(skill, activity, () => navigate('/'));
  if (!element) return <Navigate to="/" replace />;

  const onRoundComplete = (stars: number, total: number): RoundOutcome => {
    const before = activeChild;
    // This node's own ladder depth caps the adaptive climb (default 4).
    const maxLevel = skill.maxLevel ?? 4;
    const after = recordRoundOnChild(before, chapter.id, skill.id, stars, total, maxLevel);
    const leveledUp =
      before.adaptive !== false &&
      activityLevel(after, chapter.id, skill.id) > activityLevel(before, chapter.id, skill.id);
    const had = earnedBadgeIds(before, BADGE_ENV);
    const newBadges = earnedBadges(after, BADGE_ENV).filter((b) => !had.has(b.id));
    recordRound(chapter.id, skill.id, stars, total, maxLevel);
    return { leveledUp, level: activityLevel(after, chapter.id, skill.id), newBadges };
  };

  // Next round: bump the counter and re-read the (possibly just-leveled) level.
  const onAdvance = () => setRound((r) => ({ no: r.no + 1, level: liveLevelRef.current }));

  return (
    <main className="app">
      <ActivityContext.Provider value={{ onRoundComplete, difficulty, onAdvance }}>
        {/* Key by round so each round mounts fresh — switching game type cleanly. */}
        {cloneElement(element, { key: round.no })}
      </ActivityContext.Provider>
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
        <Route path="/" element={<MapHome />} />
      </Route>
      <Route path="/skill/:skillId" element={<SkillRouteHost />} />
      <Route path="/review" element={<ReviewRoute />} />
      <Route path="/grown-up" element={<GrownUp />}>
        <Route index element={<Navigate to="progress" replace />} />
        <Route path="progress" element={<ProgressView />} />
        <Route path="profiles" element={<Profiles />} />
        <Route path="settings" element={<Settings />} />
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
