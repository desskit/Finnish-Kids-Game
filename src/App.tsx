import { HashRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { badgeEnv, findSkill, renderSkill } from './game/path';
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

// Resolves a skill from the URL and runs its game full-screen. Progress is keyed
// by (chapter, skill); the ActivityContext hands down adaptive difficulty and
// lets the shared RoundComplete record the round + celebrate a level-up / badge.
function SkillRoute() {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const { activeChild, recordRound, activityDifficulty } = useProfile();
  const found = skillId ? findSkill(skillId) : undefined;

  if (!activeChild) return <Navigate to="/profiles" replace />;
  if (!found) return <Navigate to="/" replace />;
  const { chapter, skill } = found;
  if (skill.activity === 'review') return <Navigate to="/review" replace />;

  const difficulty = activityDifficulty(chapter.id, skill.id);
  const element = renderSkill(skill, difficulty.level, () => navigate('/'));
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

  return (
    <main className="app">
      <ActivityContext.Provider value={{ onRoundComplete, difficulty }}>
        {element}
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
      <Route path="/skill/:skillId" element={<SkillRoute />} />
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
