import { Link, Outlet } from 'react-router-dom';
import { useProfile } from '../state/profile';

// Persistent shell for the map + topic-hub screens: a slim top bar (mascot →
// home, running star total) above the routed content. Activities render
// full-screen outside this shell — they keep their own back + progress header.
export default function AppShell() {
  const { stars } = useProfile();

  return (
    <div className="app-shell">
      <header className="top-bar">
        <Link className="top-bar__brand" to="/" aria-label="Koti · Home">
          <span className="top-bar__mascot" aria-hidden="true">
            🦊
          </span>
          <span className="top-bar__name">
            Kielipesä <span className="en">Finnish for Kids</span>
          </span>
        </Link>
        <span className="top-bar__stars" aria-label={`${stars} stars earned`}>
          ⭐ {stars}
        </span>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
