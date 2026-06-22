import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import ParentGate from './ParentGate';

// Grown-up area shell. Stays gated until the math challenge is solved; the
// unlocked flag is component-local, so it re-locks on a full reload. Hosts the
// Progress / Profiles / Settings tabs via nested routes.
export default function GrownUp() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <ParentGate onPass={() => setUnlocked(true)} />;

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    'tab' + (isActive ? ' tab--on' : '');

  return (
    <main className="app">
      <section className="screen grownup">
        <header className="grownup__head">
          <Link className="icon-btn" to="/" aria-label="Back to app">
            ⬅︎
          </Link>
          <h1 className="grownup__title">
            Aikuisille <span className="en">Grown-ups</span>
          </h1>
        </header>

        <nav className="grownup__tabs">
          <NavLink to="/grown-up/progress" className={tabClass}>
            Edistyminen <span className="en">Progress</span>
          </NavLink>
          <NavLink to="/grown-up/profiles" className={tabClass}>
            Pelaajat <span className="en">Profiles</span>
          </NavLink>
          <NavLink to="/grown-up/settings" className={tabClass}>
            Asetukset <span className="en">Settings</span>
          </NavLink>
        </nav>

        <Outlet />
      </section>
    </main>
  );
}
