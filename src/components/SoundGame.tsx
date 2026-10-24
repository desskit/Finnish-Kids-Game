import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { buildSoundRound, soundWords, type SoundMode } from '../game/soundGames';
import { useProfile } from '../state/profile';
import SoundRound from './SoundRound';
import { SOUND_GAMES } from './SoundsHub';
import LetterNameGame from './LetterNameGame';
import Art from '../art/Art';

const QUESTIONS = 8;

// One listening game from the Alphabet corner: hear a real word, see it with a
// gap, and pick the letter(s) that fill it. A short round, then a result card
// with "again" / "back to the alphabet". Recorded on its own (course.sounds) —
// it never touches course progress.
export default function SoundGame() {
  const { mode = '' } = useParams();
  // Letter names are their own game shape (hear a name / see a letter).
  return mode === 'names' ? <LetterNameGame /> : <WordSoundGame mode={mode} />;
}

function WordSoundGame({ mode }: { mode: string }) {
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
  const [result, setResult] = useState<number | null>(null);

  if (!game) {
    navigate('/sounds', { replace: true });
    return null;
  }

  if (result !== null) {
    const right = result;
    return (
      <main className="app">
        <section className="screen checkpoint checkpoint--pass">
          <div className="checkpoint__badge" aria-hidden="true">
            <Art glyph={right / round.length >= 0.8 ? '🌟' : '👂'} motion="loop" />
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
                setResult(null);
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

  return (
    <main className="app">
      <SoundRound
        key={runId}
        round={round}
        title={game.fi}
        onExit={() => navigate('/sounds')}
        onRight={() => addStars(1)}
        onFinish={(right, total) => {
          recordSoundsRound(mode, right, total);
          setResult(right);
        }}
      />
    </main>
  );
}
