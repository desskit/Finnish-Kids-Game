import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import ParentGate from './ParentGate';

const TABS = [
  { to: '/grown-up/progress', icon: '📊', en: 'Progress', fi: 'Edistyminen' },
  { to: '/grown-up/stats', icon: '📈', en: 'Stats', fi: 'Tilastot' },
  { to: '/grown-up/profiles', icon: '👥', en: 'Players', fi: 'Pelaajat' },
  { to: '/grown-up/settings', icon: '⚙️', en: 'Settings', fi: 'Asetukset' },
  { to: '/grown-up/audit', icon: '🧪', en: 'Test games', fi: 'Testaus' },
];

// Grown-up area shell. Stays gated until the math challenge is solved; the
// unlocked flag is component-local, so it re-locks on a full reload. Hosts the
// Progress / Players / Settings / Test-games tabs via nested routes. English
// leads here (it's for the grown-ups); the Finnish rides along small.
export default function GrownUp() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <ParentGate onPass={() => setUnlocked(true)} />;

  return (
    <main className="app app--grownup">
      <section className="screen grownup">
        <header className="grownup__head">
          <Link className="icon-btn" to="/" aria-label="Back to the course">
            ⬅︎
          </Link>
          <div className="grownup__titles">
            <h1 className="grownup__title">Grown-ups</h1>
            <p className="grownup__subtitle" lang="fi">
              Aikuisille
            </p>
          </div>
        </header>

        <nav className="grownup__tabs" aria-label="Grown-up sections">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) => 'gtab' + (isActive ? ' gtab--on' : '')}
            >
              <span className="gtab__icon" aria-hidden="true">
                {t.icon}
              </span>
              <span className="gtab__label">{t.en}</span>
              <span className="gtab__fi" lang="fi">
                {t.fi}
              </span>
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </section>
    </main>
  );
}
