import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ALPHABET, SOUND_GUIDES, type Letter } from '../content/alphabet';
import { itemByFi } from '../content/lookup';
import { speak } from '../audio/speak';
import { useProfile } from '../state/profile';
import Prose from './Prose';

export const SOUND_GAMES = [
  { mode: 'first-letter', icon: '🔤', fi: 'Mikä kirjain?', en: 'Which letter does it start with?' },
  { mode: 'length', icon: '📏', fi: 'Yksi vai kaksi?', en: 'One letter or two?' },
  { mode: 'vowel', icon: '👄', fi: 'A vai Ä?', en: 'a or ä, o or ö, u or y?' },
] as const;

/** An example word with every copy of `ch` highlighted. */
function Marked({ word, ch }: { word: string; ch: string }) {
  return (
    <>
      {[...word].map((c, i) => (c === ch ? <mark key={i}>{c}</mark> : <span key={i}>{c}</span>))}
    </>
  );
}

function ExampleWord({ fi, ch }: { fi: string; ch?: string }) {
  const item = itemByFi(fi);
  if (!item) return null;
  return (
    <li className="lesson-row">
      <span className="lesson-row__emoji" aria-hidden="true">
        {item.emoji}
      </span>
      <span className="lesson-row__text">
        <span className="lesson-row__fi" lang="fi">
          {ch ? <Marked word={fi} ch={ch} /> : fi}
        </span>
        <span className="en lesson-row__en">{item.en}</span>
      </span>
      <button className="speaker speaker--inline lesson-row__speak" onClick={() => speak(fi)} aria-label={`Listen: ${fi}`}>
        🔊
      </button>
    </li>
  );
}

function LetterCard({ letter, onClose }: { letter: Letter; onClose: () => void }) {
  return (
    <section className="letter-card" aria-label={`Letter ${letter.ch}`}>
      <button className="letter-card__close" onClick={onClose} aria-label="Close">
        ✕
      </button>
      <div className="letter-card__big" lang="fi">
        {letter.ch.toUpperCase()}
        {letter.ch}
      </div>
      <button className="speaker speaker--inline" onClick={() => speak(letter.nameFi)}>
        🔊 <span className="en">Its name: “{letter.nameFi}”</span>
      </button>
      <p className="letter-card__tip">{letter.tip}</p>
      {letter.examples.length > 0 ? (
        <ul className="lesson-rows">
          {letter.examples.map((w) => (
            <ExampleWord key={w} fi={w} ch={letter.ch} />
          ))}
        </ul>
      ) : (
        <p className="gmuted">No Finnish words to show — you'll only see it in names.</p>
      )}
    </section>
  );
}

// Aakkoset — the optional Alphabet & sounds corner. Never part of the course
// (nothing here unlocks or blocks a unit): a place to explore the letters, the
// tricky sounds, and three short listening games, any time.
export default function SoundsHub() {
  const { activeChild } = useProfile();
  const [open, setOpen] = useState<Letter | null>(null);
  const played = activeChild?.course?.sounds ?? {};

  return (
    <section className="screen sounds">
      <div className="notebook__head">
        <Link className="icon-btn" to="/" aria-label="Koti · Home">
          ⬅︎
        </Link>
        <h1 className="title">
          🔤 Aakkoset <span className="en">Alphabet & sounds</span>
        </h1>
      </div>
      <p className="notebook__intro en">Explore the letters and how they sound — any time you like.</p>

      <h2 className="sounds__heading">
        Pelit <span className="en">Listening games</span>
      </h2>
      <div className="sounds__games">
        {SOUND_GAMES.map((g) => {
          const rec = played[g.mode];
          return (
            <Link key={g.mode} className="home-tile sounds__game" to={`/sounds/${g.mode}`}>
              <span className="home-tile__icon" aria-hidden="true">
                {g.icon}
              </span>
              <span className="home-tile__label">{g.fi}</span>
              <span className="home-tile__meta en">{g.en}</span>
              {rec && <span className="sounds__best">Best {Math.round(rec.best * 100)}%</span>}
            </Link>
          );
        })}
      </div>

      <h2 className="sounds__heading">
        Kirjaimet <span className="en">The letters — tap one</span>
      </h2>
      {open && <LetterCard letter={open} onClose={() => setOpen(null)} />}
      <div className="letter-grid">
        {ALPHABET.map((l) => (
          <button
            key={l.ch}
            className={
              'letter-tile' +
              (l.vowel ? ' letter-tile--vowel' : '') +
              (l.borrowed ? ' letter-tile--borrowed' : '') +
              (open?.ch === l.ch ? ' letter-tile--on' : '')
            }
            onClick={() => {
              setOpen(l);
              speak(l.nameFi);
            }}
            aria-label={`${l.ch.toUpperCase()}${l.borrowed ? ', only in borrowed words' : ''}`}
            lang="fi"
          >
            {l.ch.toUpperCase()}
            <span className="letter-tile__lower">{l.ch}</span>
          </button>
        ))}
      </div>
      <p className="sounds__legend en">
        <span className="letter-key letter-key--vowel" /> vowels · <span className="letter-key letter-key--borrowed" /> only in
        borrowed words and names
      </p>

      <h2 className="sounds__heading">
        Vinkit <span className="en">Tricky sounds</span>
      </h2>
      <div className="sounds__guides">
        {SOUND_GUIDES.map((g) => (
          <details key={g.id} className="sound-guide">
            <summary>
              <span aria-hidden="true">{g.icon}</span> {g.title}
            </summary>
            <Prose text={g.text} />
            <ul className="lesson-rows">
              {g.examples.map((w) => (
                <ExampleWord key={w} fi={w} />
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
