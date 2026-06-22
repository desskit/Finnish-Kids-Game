import { useState } from 'react';
import type { Theme } from '../content';
import { useProfile } from '../state/profile';
import { isSpeechAvailable } from '../audio/speak';

export type Activity = 'listen' | 'build' | 'count' | 'match' | 'conjugate' | 'order' | 'spell';

interface Props {
  themes: Theme[];
  activeThemeId: string;
  onSelectTheme: (id: string) => void;
  onPlay: (activity: Activity) => void;
}

export default function HomeScreen({ themes, activeThemeId, onSelectTheme, onPlay }: Props) {
  const { name, setName, stars, level, setLevel } = useProfile();
  const [editing, setEditing] = useState(!name);
  const [draft, setDraft] = useState(name);

  const activeTheme = themes.find((t) => t.id === activeThemeId) ?? themes[0];
  const canBuild = activeTheme.constructions.length > 0;
  const canCount = activeTheme.countable === true;
  // Adjective + noun agreement pairs the global adjectives with this theme's
  // nouns, so it needs a countable noun topic, like Count & Say.
  const canMatch = activeTheme.countable === true;

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

      <div className="theme-picker" role="group" aria-label="Topic">
        {themes.map((t) => (
          <button
            key={t.id}
            className={'theme-chip' + (t.id === activeTheme.id ? ' theme-chip--on' : '')}
            onClick={() => onSelectTheme(t.id)}
          >
            <span aria-hidden="true">{t.emoji}</span> {t.fi}{' '}
            <span className="en">{t.en}</span>
          </button>
        ))}
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

        <button
          className="activity-card"
          onClick={() => onPlay('build')}
          disabled={!canBuild}
          title={canBuild ? undefined : 'No phrases for this topic yet'}
        >
          <span className="activity-card__emoji" aria-hidden="true">
            🧩
          </span>
          <span className="activity-card__text">
            Rakenna lause
            <span className="en">Build a Phrase</span>
          </span>
        </button>

        <button
          className="activity-card"
          onClick={() => onPlay('count')}
          disabled={!canCount}
          title={canCount ? undefined : 'Pick a countable topic to count'}
        >
          <span className="activity-card__emoji" aria-hidden="true">
            🔢
          </span>
          <span className="activity-card__text">
            Laske ja sano
            <span className="en">Count &amp; Say</span>
          </span>
        </button>

        <button
          className="activity-card"
          onClick={() => onPlay('match')}
          disabled={!canMatch}
          title={canMatch ? undefined : 'Pick a countable topic to match words'}
        >
          <span className="activity-card__emoji" aria-hidden="true">
            🎨
          </span>
          <span className="activity-card__text">
            Yhdistä sanat
            <span className="en">Match the Words</span>
          </span>
        </button>

        <button className="activity-card" onClick={() => onPlay('conjugate')}>
          <span className="activity-card__emoji" aria-hidden="true">
            🏃
          </span>
          <span className="activity-card__text">
            Taivuta verbi
            <span className="en">Conjugate the Verb</span>
          </span>
        </button>

        <button
          className="activity-card"
          onClick={() => onPlay('order')}
          disabled={!canBuild}
          title={canBuild ? undefined : 'No phrases for this topic yet'}
        >
          <span className="activity-card__emoji" aria-hidden="true">
            🔀
          </span>
          <span className="activity-card__text">
            Järjestä sanat
            <span className="en">Word Order</span>
          </span>
        </button>

        <button className="activity-card" onClick={() => onPlay('spell')}>
          <span className="activity-card__emoji" aria-hidden="true">
            ⌨️
          </span>
          <span className="activity-card__text">
            Kirjoita sana
            <span className="en">Spelling</span>
          </span>
        </button>
      </div>

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
