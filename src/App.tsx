import { HashRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { themes } from './content';
import { activityById } from './game/activities';
import { ActivityContext } from './game/activityContext';
import { useProfile } from './state/profile';
import AppShell from './components/AppShell';
import MapHome from './components/MapHome';
import TopicHub from './components/TopicHub';
import ProfilePicker from './components/ProfilePicker';
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
  const { activeChild, recordRound } = useProfile();
  const theme = themes.find((t) => t.id === topicId);
  const activity = activityId ? activityById(activityId) : undefined;

  if (!activeChild) return <Navigate to="/profiles" replace />;
  if (!theme) return <Navigate to="/" replace />;
  if (!activity || !activity.supports(theme)) {
    return <Navigate to={`/topic/${theme.id}`} replace />;
  }

  return (
    <main className="app">
      <ActivityContext.Provider
        value={{
          onRoundComplete: (stars, total) =>
            recordRound(theme.id, activity.id, stars, total),
        }}
      >
        {activity.render(theme, () => navigate(`/topic/${theme.id}`))}
      </ActivityContext.Provider>
    </main>
  );
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
