import { HashRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { themes } from './content';
import { activityById } from './game/activities';
import AppShell from './components/AppShell';
import MapHome from './components/MapHome';
import TopicHub from './components/TopicHub';

// Routing shell. HashRouter gives real back-button/history (critical for the
// PWA + a future Capacitor hardware-back) and deep links, and it sidesteps
// base-path/redirect issues on GitHub Pages subpaths, Netlify, and Capacitor
// file:// — no server rewrites needed.
//
//   /                          → MapHome      (roam-free topic map)
//   /topic/:topicId            → TopicHub     (a topic's activities)
//   /topic/:topicId/:activityId→ Activity     (runs full-screen)

// Resolves a topic + activity from the URL and runs the activity full-screen.
// Exiting (back / Home / finishing) returns to the topic hub it was launched
// from. Unknown ids redirect to a sensible parent instead of dead-ending.
function ActivityRoute() {
  const { topicId, activityId } = useParams();
  const navigate = useNavigate();
  const theme = themes.find((t) => t.id === topicId);
  const activity = activityId ? activityById(activityId) : undefined;

  if (!theme) return <Navigate to="/" replace />;
  if (!activity || !activity.supports(theme)) {
    return <Navigate to={`/topic/${theme.id}`} replace />;
  }

  return (
    <main className="app">
      {activity.render(theme, () => navigate(`/topic/${theme.id}`))}
    </main>
  );
}

// Route tree, separated from the router so it can be mounted in a MemoryRouter
// for tests (the Phase 4 smoke spec drives navigation through these routes).
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<MapHome />} />
        <Route path="/topic/:topicId" element={<TopicHub />} />
      </Route>
      <Route path="/topic/:topicId/:activityId" element={<ActivityRoute />} />
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
