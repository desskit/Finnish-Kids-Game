import { Link, Navigate, Outlet } from 'react-router-dom';
import { useProfile } from '../state/profile';

// Persistent shell for the map + topic-hub screens: a slim top bar with the
// active child's avatar (→ switch player), their running star total, and a
// math-gated grown-up button. Activities render full-screen outside this shell.
// With no active child we bounce to the profile picker (first-run / fresh data).
export default function AppShell() {
  const { activeChild, stars } = useProfile();
  if (!activeChild) return <Navigate to="/profiles" replace />;

  return (
    <div className="app-shell">
      <header className="top-bar">
        <Link
          className="top-bar__profile"
          to="/profiles"
          aria-label="Vaihda pelaaja · Switch player"
        >
          <span className="top-bar__avatar" aria-hidden="true">
            {activeChild.avatar}
          </span>
          <span className="top-bar__name">
            {activeChild.name} <span className="en">switch player</span>
          </span>
        </Link>
        <span className="top-bar__stars" aria-label={`${stars} stars earned`}>
          ⭐ {stars}
        </span>
        <Link
          className="icon-btn top-bar__grownup"
          to="/grown-up"
          aria-label="Aikuisille · Grown-ups"
        >
          ⚙
        </Link>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
