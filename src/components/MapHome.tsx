import { Link } from 'react-router-dom';
import { themes, reviewItems } from '../content';
import { useProfile } from '../state/profile';
import { isSpeechAvailable } from '../audio/speak';
import { activitiesForTheme } from '../game/activities';
import { isDue } from '../game/srs';

// Map home — a non-linear, roam-free grid of topic "places". Each node opens
// that topic's hub. Starts as a styled responsive grid that reads as a map;
// evolves into a fully illustrated map once Phase 1 art lands. Only rendered
// for an active child (AppShell redirects to the picker otherwise).
export default function MapHome() {
  const { name, level, setLevel, activeChild } = useProfile();

  // How many learned words are due for review right now (drives the badge).
  const srs = activeChild?.srs ?? {};
  const now = Date.now();
  const seenCount = reviewItems.filter((i) => srs[i.id]).length;
  const dueCount = reviewItems.filter((i) => srs[i.id] && isDue(srs[i.id], now)).length;

  return (
    <section className="screen map-home">
      <h1 className="greeting">
        Hei{name ? `, ${name}` : ''}! <span className="en">Choose a topic</span>
      </h1>

      <Link className="review-banner" to="/review">
        <span className="review-banner__emoji" aria-hidden="true">
          🔁
        </span>
        <span className="review-banner__text">
          Kertaus <span className="en">Review</span>
        </span>
        <span className="review-banner__meta">
          {seenCount === 0
            ? 'Aloita tästä · Start here'
            : dueCount > 0
              ? `${dueCount} kerrattavaa · ${dueCount} due`
              : 'Harjoittele · Practice'}
        </span>
      </Link>

      <div className="level-toggle" role="group" aria-label="Difficulty">
        <span className="level-label">Taso · Level:</span>
        <button
          className={'chip' + (level === 1 ? ' chip--on' : '')}
          onClick={() => setLevel(1)}
        >
          Helppo <span className="en">Easy</span>
        </button>
        <button
          className={'chip' + (level === 2 ? ' chip--on' : '')}
          onClick={() => setLevel(2)}
        >
          Vaikea <span className="en">Hard</span>
        </button>
      </div>

      <nav className="map" aria-label="Topics">
        {themes.map((t) => {
          const count = activitiesForTheme(t).length;
          return (
            <Link key={t.id} className="map-node" to={`/topic/${t.id}`}>
              <span className="map-node__emoji" aria-hidden="true">
                {t.emoji}
              </span>
              <span className="map-node__title">
                {t.fi} <span className="en">{t.en}</span>
              </span>
              <span className="map-node__meta">
                {count} peliä <span className="en">{count} games</span>
              </span>
            </Link>
          );
        })}
      </nav>

      {!isSpeechAvailable() && (
        <p className="audio-note">
          🔇 Audio isn't available in this browser. Words still show as pictures.
        </p>
      )}

      <p className="data-credit">
        Finnish word data from Wiktionary &amp; Tatoeba · CC BY-SA 4.0
      </p>
    </section>
  );
}
