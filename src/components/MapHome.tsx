import { useState } from 'react';
import { Link } from 'react-router-dom';
import { themes } from '../content';
import { useProfile } from '../state/profile';
import { isSpeechAvailable } from '../audio/speak';
import { activitiesForTheme } from '../game/activities';

// Map home — a non-linear, roam-free grid of topic "places". Each node opens
// that topic's hub. Starts as a styled responsive grid that reads as a map;
// evolves into a fully illustrated map once Phase 1 art lands.
export default function MapHome() {
  const { name, setName, level, setLevel } = useProfile();
  const [editing, setEditing] = useState(!name);
  const [draft, setDraft] = useState(name);

  function saveName() {
    setName(draft.trim());
    setEditing(false);
  }

  return (
    <section className="screen map-home">
      {editing ? (
        <form
          className="name-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveName();
          }}
        >
          <label htmlFor="name">
            Mikä sinun nimesi on? <span className="en">What's your name?</span>
          </label>
          <div className="name-row">
            <input
              id="name"
              className="name-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={16}
              autoFocus
              autoComplete="off"
            />
            <button className="btn btn--primary" type="submit">
              OK
            </button>
          </div>
        </form>
      ) : (
        <h1 className="greeting">
          Hei{name ? `, ${name}` : ''}! <span className="en">Choose a topic</span>
          <button
            className="text-btn"
            onClick={() => {
              setDraft(name);
              setEditing(true);
            }}
          >
            (change name)
          </button>
        </h1>
      )}

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
