import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buildNameRound } from '../game/soundGames';
import { useProfile } from '../state/profile';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';
import WhyTip from './WhyTip';

const QUESTIONS = 10;

// Kirjainten nimet — what each letter is CALLED (j is "jii", l is "äl"), the way
// Finnish children spell out loud. Questions alternate: HEAR a name → tap the
// letter; SEE a letter → pick its name. A wrong pick shows the right name and
// how the letter sounds.
export default function LetterNameGame() {
  const navigate = useNavigate();
  const { addStars, recordSoundsRound } = useProfile();
  const [runId, setRunId] = useState(0);
  const round = useMemo(
    () => buildNameRound(QUESTIONS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runId],
  );
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [tipAt, setTipAt] = useState(-1);
  const [done, setDone] = useState(false);
  const missed = useRef(false);
  const firstTries = useRef(0);
  const q = round[index];

  // A "hear" question speaks the name; a "see" question stays quiet (the
  // child reads the letter and recalls its name).
  useEffect(() => {
    if (!q || done || q.ask !== 'hear') return;
    const t = setTimeout(() => speak(q.letter.nameFi), 350);
    return () => clearTimeout(t);
  }, [q, done]);

  const choose = useCallback(
    (opt: string) => {
      if (!q || locked) return;
      if (opt === q.answer) {
        setLocked(true);
        playDing(true);
        speak(q.letter.nameFi);
        addStars(1);
        if (!missed.current) firstTries.current += 1;
        setWrong(null);
        setTimeout(() => {
          missed.current = false;
          setLocked(false);
          if (index + 1 >= round.length) {
            recordSoundsRound('names', firstTries.current, round.length);
            setDone(true);
          } else setIndex(index + 1);
        }, 900);
      } else {
        missed.current = true;
        setTipAt(index);
        playDing(false);
        setWrong(opt);
        setTimeout(() => setWrong((w) => (w === opt ? null : w)), 600);
      }
    },
    [q, locked, index, round.length, addStars, recordSoundsRound],
  );

  if (done) {
    const right = firstTries.current;
    return (
      <main className="app">
        <section className="screen checkpoint checkpoint--pass">
          <div className="checkpoint__badge" aria-hidden="true">
            {right / round.length >= 0.8 ? '🌟' : '🔤'}
          </div>
          <h1 className="title">
            Hienoa! <span className="en">You know your letters!</span>
          </h1>
          <p className="checkpoint__score" aria-label={`${right} of ${round.length} right first time`}>
            {right} / {round.length}
          </p>
          <div className="button-row">
            <button
              className="btn btn--primary"
              onClick={() => {
                setIndex(0);
                setDone(false);
                setTipAt(-1);
                firstTries.current = 0;
                missed.current = false;
                setRunId((r) => r + 1);
              }}
              autoFocus
            >
              Uudestaan <span className="en">Play again</span>
            </button>
            <Link className="btn" to="/sounds">
              Aakkoset <span className="en">Back to the alphabet</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!q) return null;
  return (
    <main className="app">
      <section className="screen activity">
        <ActivityHeader title="Kirjainten nimet" index={index} total={round.length} onExit={() => navigate('/sounds')} />
        <p className="prompt">
          {q.ask === 'hear' ? 'Mikä kirjain?' : 'Mikä sen nimi on?'}{' '}
          <span className="en">
            {q.ask === 'hear' ? 'Listen to the name — which letter is it?' : 'What is this letter called?'}
          </span>
        </p>
        <div className="phrase-card">
          {q.ask === 'hear' ? (
            <button className="speaker name-speaker" onClick={() => speak(q.letter.nameFi)} aria-label="Hear the name again">
              🔊
            </button>
          ) : (
            <p className="letter-card__big" lang="fi">
              {q.letter.ch.toUpperCase()}
              {q.letter.ch}
            </p>
          )}
        </div>
        <div className="word-tiles">
          {q.options.map((o, i) => (
            <button
              key={o}
              className={
                'word-tile sound-tile' +
                (wrong === o ? ' word-tile--wrong' : '') +
                (locked && o === q.answer ? ' word-tile--correct' : '')
              }
              onClick={() => {
                // Tapping a NAME lets the child hear it too.
                if (q.ask === 'see' && !locked) speak(o);
                choose(o);
              }}
              disabled={locked}
              lang="fi"
            >
              <span className="word-tile__num">{i + 1}</span>
              {q.ask === 'hear' ? o.toUpperCase() + o : o}
            </button>
          ))}
        </div>
        {tipAt === index && <WhyTip why={{ text: q.tip }} />}
      </section>
    </main>
  );
}
