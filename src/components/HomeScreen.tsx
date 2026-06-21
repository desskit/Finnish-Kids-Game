import { useState } from 'react';
import { useProfile } from '../state/profile';
import { theme } from '../content';
import { isSpeechAvailable } from '../audio/speak';

export type Activity = 'listen' | 'build';

interface Props {
  onPlay: (activity: Activity) => void;
}

export default function HomeScreen({ onPlay }: Props) {
  const { name, setName, stars, level, setLevel } = useProfile();
  const [editing, setEditing] = useState(!name);
  const [draft, setDraft] = useState(name);

  function saveName() {
    setName(draft.trim());
    setEditing(false);
  }

  return (
    <section className="screen home">
      <div className="mascot" aria-hidden="true">
        🦊
      </div>

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
          Hei{name ? `, ${name}` : ''}! <span className="en">Let's learn Finnish</span>
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

      <p className="stars-total" aria-label={`${stars} stars earned`}>
        ⭐ {stars}
      </p>

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

      <div className="theme-banner">
        <span aria-hidden="true">{theme.emoji}</span> {theme.fi}{' '}
        <span className="en">{theme.en}</span>
      </div>

      <div className="activity-list">
        <button className="activity-card" onClick={() => onPlay('listen')}>
          <span className="activity-card__emoji" aria-hidden="true">
            🔊
          </span>
          <span className="activity-card__text">
            Kuuntele ja osoita
            <span className="en">Listen &amp; Tap</span>
          </span>
        </button>

        <button className="activity-card" onClick={() => onPlay('build')}>
          <span className="activity-card__emoji" aria-hidden="true">
            🧩
          </span>
          <span className="activity-card__text">
            Rakenna lause
            <span className="en">Build a Phrase</span>
          </span>
        </button>
      </div>

      {!isSpeechAvailable() && (
        <p className="audio-note">
          🔇 Audio isn't available in this browser. Words still show as pictures.
        </p>
      )}
    </section>
  );
}
