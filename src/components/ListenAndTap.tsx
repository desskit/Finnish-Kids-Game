import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LexicalItem } from '../content/types';
import { useProfile } from '../state/profile';
import { buildListenRound } from '../game/round';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';
import RoundComplete from './RoundComplete';

const QUESTIONS = 6;

interface Props {
  items: LexicalItem[];
  onExit: () => void;
}

// Listen & Tap (Tier 1): hear a Finnish word, tap the matching picture.
export default function ListenAndTap({ items, onExit }: Props) {
  const { level, addStars } = useProfile();
  const optionCount = level >= 2 ? 4 : 3;

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    () => buildListenRound(items, QUESTIONS, optionCount),
    [items, optionCount, runId],
  );

  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const question = round[index];

  // Say the target word when a new question appears.
  useEffect(() => {
    if (!question || done) return;
    const t = setTimeout(() => speak(question.target.fi), 350);
    return () => clearTimeout(t);
  }, [question, done]);

  const choose = useCallback(
    (item: LexicalItem) => {
      if (!question || locked || done) return;
      if (item.id === question.target.id) {
        setLocked(true);
        playDing(true);
        speak(item.fi);
        setStars((s) => s + 1);
        addStars(1);
        setWrongId(null);
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else setIndex(next);
          setLocked(false);
        }, 750);
      } else {
        playDing(false);
        setWrongId(item.id);
        setTimeout(() => setWrongId((cur) => (cur === item.id ? null : cur)), 600);
      }
    },
    [question, locked, done, index, round.length, addStars],
  );

  // Keyboard: number keys pick a card; Space/Enter replays the word.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!question || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speak(question.target.fi);
        return;
      }
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= question.options.length) choose(question.options[n - 1]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, done, choose]);

  function restart() {
    setIndex(0);
    setStars(0);
    setWrongId(null);
    setLocked(false);
    setDone(false);
    setRunId((r) => r + 1);
  }

  if (done) {
    return (
      <RoundComplete stars={stars} total={round.length} onAgain={restart} onHome={onExit} />
    );
  }
  if (!question) return null;

  return (
    <section className="screen activity">
      <ActivityHeader
        title="Kuuntele ja osoita"
        index={index}
        total={round.length}
        onExit={onExit}
      />

      <p className="prompt">
        Mikä tämä on? <span className="en">Which one did you hear?</span>
      </p>

      <button
        className="speaker speaker--hero"
        onClick={() => speak(question.target.fi)}
        aria-label="Hear the word again"
      >
        🔊
        <span className="speaker__hint">Kuuntele · Listen</span>
      </button>

      <div className={`card-grid card-grid--${question.options.length}`}>
        {question.options.map((opt, i) => (
          <button
            key={opt.id}
            className={'pic-card' + (wrongId === opt.id ? ' pic-card--wrong' : '')}
            onClick={() => choose(opt)}
            disabled={locked}
          >
            <span className="pic-card__num">{i + 1}</span>
            <span className="pic-card__emoji" aria-hidden="true">
              {opt.emoji}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
