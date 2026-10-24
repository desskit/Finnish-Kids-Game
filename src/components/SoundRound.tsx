import { useCallback, useEffect, useRef, useState } from 'react';
import type { SoundQuestion } from '../game/soundGames';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';
import WhyTip from './WhyTip';
import Art from '../art/Art';
import SpeakerIcon from '../art/SpeakerIcon';

interface Props {
  round: SoundQuestion[];
  title: string;
  onExit: () => void;
  /** Every question answered: first-try right, out of the round. */
  onFinish: (firstTries: number, total: number) => void;
  /** A right answer (a star, for the host to count). */
  onRight?: () => void;
  stars?: number;
}

// One round of a Finnish-sounds game: hear a real word, see it with a gap, and
// pick the letter(s) that fill it. Shared by the Alphabet corner (SoundGame)
// and the course's sound steps (SoundStep).
export default function SoundRound({ round, title, onExit, onFinish, onRight, stars }: Props) {
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [tipAt, setTipAt] = useState(-1);
  const missed = useRef(false);
  const firstTries = useRef(0);
  const q = round[index];

  useEffect(() => {
    if (!q) return;
    const t = setTimeout(() => speak(q.item.fi), 350);
    return () => clearTimeout(t);
  }, [q]);

  const choose = useCallback(
    (opt: string) => {
      if (!q || locked) return;
      if (opt === q.answer) {
        setLocked(true);
        playDing(true);
        speak(q.item.fi);
        onRight?.();
        if (!missed.current) firstTries.current += 1;
        setWrong(null);
        setTimeout(() => {
          missed.current = false;
          setLocked(false);
          if (index + 1 >= round.length) onFinish(firstTries.current, round.length);
          else setIndex(index + 1);
        }, 900);
      } else {
        missed.current = true;
        setTipAt(index);
        playDing(false);
        setWrong(opt);
        setTimeout(() => setWrong((w) => (w === opt ? null : w)), 600);
      }
    },
    [q, locked, index, round.length, onFinish, onRight],
  );

  if (!q) return null;
  return (
    <section className="screen activity">
      <ActivityHeader title={title} index={index} total={round.length} stars={stars} onExit={onExit} />
      <p className="prompt">
        Kuuntele! <span className="en">Listen, then fill the gap</span>
      </p>
      <div className="phrase-card">
        <span className="phrase-emoji" aria-hidden="true">
          <Art item={q.item} motion="loop" />
        </span>
        <p className="sound-word" lang="fi">
          {q.before}
          <span className={'sound-gap' + (locked ? ' sound-gap--filled' : '')}>{locked ? q.answer : '?'}</span>
          {q.after}
        </p>
        <p className="en phrase-hint">{q.item.en}</p>
        <button className="speaker speaker--inline" onClick={() => speak(q.item.fi)} aria-label="Hear it again">
          <SpeakerIcon /> <span className="en">Listen</span>
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
  );
}
