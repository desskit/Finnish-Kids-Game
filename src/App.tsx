import { HashRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { themes } from './content';
import { ACTIVITIES, activityById } from './game/activities';
import { ActivityContext, type RoundOutcome } from './game/activityContext';
import { recordRoundOnChild, activityLevel } from './game/progress';
import { earnedBadgeIds, earnedBadges } from './game/badges';
import { useProfile } from './state/profile';

// Content facts the badge rules measure against (stable for the app's lifetime).
const BADGE_ENV = {
  topicCount: themes.length,
  activityIds: ACTIVITIES.map((a) => a.id),
};
import AppShell from './components/AppShell';
import MapHome from './components/MapHome';
import TopicHub from './components/TopicHub';
import ProfilePicker from './components/ProfilePicker';
import ReviewActivity from './components/ReviewActivity';
import GrownUp from './components/GrownUp';
import ProgressView from './components/ProgressView';
import Profiles from './components/Profiles';
import Settings from './components/Settings';

// Routing shell. HashRouter gives real back-button/history (critical for the
// PWA + a future Capacitor hardware-back) and deep links, and it sidesteps
// base-path/redirect issues on GitHub Pages subpaths, Netlify, and Capacitor
// file:// — no server rewrites needed.
//
//   /                          → MapHome      (roam-free topic map)
//   /topic/:topicId            → TopicHub     (a topic's activities)
//   /topic/:topicId/:activityId→ Activity     (runs full-screen)
//   /profiles                  → ProfilePicker (kid-accessible switch/add)
//   /grown-up/*                → math-gated Progress / Profiles / Settings

// Resolves a topic + activity from the URL and runs the activity full-screen.
// Exiting returns to the topic hub it was launched from; the ActivityContext
// lets the shared RoundComplete record progress for the active child. Unknown
// ids (or no active child) redirect to a sensible parent instead of dead-ending.
function ActivityRoute() {
  const { topicId, activityId } = useParams();
  const navigate = useNavigate();
  const { activeChild, recordRound, activityDifficulty } = useProfile();
  const theme = themes.find((t) => t.id === topicId);
  const activity = activityId ? activityById(activityId) : undefined;

  if (!activeChild) return <Navigate to="/profiles" replace />;
  if (!theme) return <Navigate to="/" replace />;
  if (!activity || !activity.supports(theme)) {
    return <Navigate to={`/topic/${theme.id}`} replace />;
  }

  // Record the round AND report what changed (level-up, new badges) so the
  // shared RoundComplete can celebrate it. The look-ahead uses the same pure
  // reducer as the persisted update, diffing the child before vs. after.
  const onRoundComplete = (stars: number, total: number): RoundOutcome => {
    const before = activeChild;
    const after = recordRoundOnChild(before, theme.id, activity.id, stars, total);
    const leveledUp =
      before.adaptive !== false &&
      activityLevel(after, theme.id, activity.id) >
        activityLevel(before, theme.id, activity.id);
    const had = earnedBadgeIds(before, BADGE_ENV);
    const newBadges = earnedBadges(after, BADGE_ENV).filter((b) => !had.has(b.id));
    recordRound(theme.id, activity.id, stars, total);
    return { leveledUp, level: activityLevel(after, theme.id, activity.id), newBadges };
  };

  return (
    <main className="app">
      <ActivityContext.Provider
        value={{
          onRoundComplete,
          difficulty: activityDifficulty(theme.id, activity.id),
        }}
      >
        {activity.render(theme, () => navigate(`/topic/${theme.id}`))}
      </ActivityContext.Provider>
    </main>
  );
}

// Cross-topic spaced-repetition review. Runs full-screen like an activity, but
// isn't tied to a topic; needs an active child to have an SRS history to draw on.
function ReviewRoute() {
  const { activeChild } = useProfile();
  if (!activeChild) return <Navigate to="/profiles" replace />;
  return <ReviewActivity />;
}

// Route tree, separated from the router so it can be mounted in a MemoryRouter
// for tests (the Phase 4 smoke spec drives navigation through these routes).
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/profiles" element={<ProfilePicker />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<MapHome />} />
        <Route path="/topic/:topicId" element={<TopicHub />} />
      </Route>
      <Route path="/topic/:topicId/:activityId" element={<ActivityRoute />} />
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
