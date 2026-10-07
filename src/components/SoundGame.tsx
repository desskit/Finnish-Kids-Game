import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { buildSoundRound, soundWords, type SoundMode } from '../game/soundGames';
import { useProfile } from '../state/profile';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';
import WhyTip from './WhyTip';
import { SOUND_GAMES } from './SoundsHub';

const QUESTIONS = 8;

// One listening game from the Alphabet corner: hear a real word, see it with a
// gap, and pick the letter(s) that fill it. A short round, then a result card
// with "again" / "back to the alphabet". Recorded on its own (course.sounds) —
// it never touches course progress.
export default function SoundGame() {
  const { mode = '' } = useParams();
  const navigate = useNavigate();
  const { addStars, recordSoundsRound } = useProfile();
  const game = SOUND_GAMES.find((g) => g.mode === mode);

  const [runId, setRunId] = useState(0);
  const words = useMemo(() => soundWords(), []);
  const round = useMemo(
    () => (game ? buildSoundRound(game.mode as SoundMode, words, QUESTIONS) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game, words, runId],
  );
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [tipAt, setTipAt] = useState(-1);
  const [done, setDone] = useState(false);
  const missed = useRef(false);
  const firstTries = useRef(0);
  const q = round[index];

  useEffect(() => {
    if (!q || done) return;
    const t = setTimeout(() => speak(q.item.fi), 350);
    return () => clearTimeout(t);
  }, [q, done]);

  const choose = useCallback(
    (opt: string) => {
      if (!q || locked) return;
      if (opt === q.answer) {
        setLocked(true);
        playDing(true);
        speak(q.item.fi);
        addStars(1);
        if (!missed.current) firstTries.current += 1;
        setWrong(null);
        setTimeout(() => {
          missed.current = false;
          setLocked(false);
          if (index + 1 >= round.length) {
            recordSoundsRound(mode, firstTries.current, round.length);
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
    [q, locked, index, round.length, addStars, recordSoundsRound, mode],
  );

  if (!game) {
    navigate('/sounds', { replace: true });
    return null;
  }

  if (done) {
    const right = firstTries.current;
    return (
      <main className="app">
        <section className="screen checkpoint checkpoint--pass">
          <div className="checkpoint__badge" aria-hidden="true">
            {right / round.length >= 0.8 ? '🌟' : '👂'}
          </div>
          <h1 className="title">
            Hienoa! <span className="en">Nice listening!</span>
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
        <ActivityHeader
          title={game.fi}
          index={index}
          total={round.length}
          onExit={() => navigate('/sounds')}
        />
        <p className="prompt">
          Kuuntele! <span className="en">Listen, then fill the gap</span>
        </p>
        <div className="phrase-card">
          <span className="phrase-emoji" aria-hidden="true">
            {q.item.emoji}
          </span>
          <p className="sound-word" lang="fi">
            {q.before}
            <span className={'sound-gap' + (locked ? ' sound-gap--filled' : '')}>{locked ? q.answer : '?'}</span>
            {q.after}
          </p>
          <p className="en phrase-hint">{q.item.en}</p>
          <button className="speaker speaker--inline" onClick={() => speak(q.item.fi)} aria-label="Hear it again">
            🔊 <span className="en">Listen</span>
          </button>
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
              onClick={() => choose(o)}
              disabled={locked}
              lang="fi"
            >
              <span className="word-tile__num">{i + 1}</span>
              {o}
            </button>
          ))}
        </div>
        {tipAt === index && (
          <WhyTip
            why={{
              text: q.tip,
              example: [{ text: q.before }, { text: q.answer, mark: true }, { text: q.after }],
            }}
          />
        )}
      </section>
    </main>
  );
}
