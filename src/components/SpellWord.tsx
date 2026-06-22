import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LexicalItem } from '../content/types';
import { buildSpellingRound } from '../game/round';
import { useProfile } from '../state/profile';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';
import RoundComplete from './RoundComplete';

const QUESTIONS = 6;

const KEY_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'ä'],
];

interface Props {
  items: LexicalItem[];
  onExit: () => void;
}

// Spelling (Tier 4): see/hear a word, type it with an on-screen keyboard
// (including ä/ö, so it works the same on any device). The target is always
// item.fi — the sourced nominative singular — never generated.
export default function SpellWord({ items, onExit }: Props) {
  const { addStars } = useProfile();

  const [runId, setRunId] = useState(0);
  const round = useMemo(() => buildSpellingRound(items, QUESTIONS), [items, runId]);

  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const target = round[index];
  const correct = !!target && input.toLowerCase() === target.fi.toLowerCase();

  // Say the target word when a new question appears.
  useEffect(() => {
    if (!target || done) return;
    const t = setTimeout(() => speak(target.fi), 400);
    return () => clearTimeout(t);
  }, [target, done]);

  const checkIfComplete = useCallback(
    (value: string) => {
      if (!target || locked) return;
      if (value.length < target.fi.length) return;
      if (value.toLowerCase() === target.fi.toLowerCase()) {
        setLocked(true);
        playDing(true);
        speak(target.fi);
        setStars((s) => s + 1);
        addStars(1);
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else {
            setIndex(next);
            setInput('');
          }
          setLocked(false);
        }, 1200);
      } else {
        playDing(false);
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }
    },
    [target, locked, index, round.length, addStars],
  );

  function pressKey(letter: string) {
    if (!target || locked || done) return;
    setInput((prev) => {
      const next = prev + letter;
      checkIfComplete(next);
      return next;
    });
  }

  function backspace() {
    if (locked || done) return;
    setInput((prev) => prev.slice(0, -1));
  }

  // Physical keyboard support: letters, backspace, Space/Enter replays.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!target || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speak(target.fi);
        return;
      }
      if (e.key === 'Backspace') {
        backspace();
        return;
      }
      if (/^[a-zäöA-ZÄÖ]$/.test(e.key)) pressKey(e.key.toLowerCase());
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, done, locked]);

  function restart() {
    setIndex(0);
    setStars(0);
    setInput('');
    setShake(false);
    setLocked(false);
    setDone(false);
    setRunId((r) => r + 1);
  }

  if (done) {
    return (
      <RoundComplete stars={stars} total={round.length} onAgain={restart} onHome={onExit} />
    );
  }
  if (!target) return null;

  return (
    <section className="screen activity">
      <ActivityHeader title="Kirjoita sana" index={index} total={round.length} onExit={onExit} />

      <p className="prompt">
        Kirjoita mitä kuulet <span className="en">Type what you hear</span>
      </p>

      <div className="phrase-card">
        <span className="phrase-emoji" aria-hidden="true">
          {target.emoji}
        </span>
        <p className="en phrase-hint">{target.en}</p>
        <button
          className="speaker speaker--inline"
          onClick={() => speak(target.fi)}
          aria-label="Hear the word again"
        >
          🔊 <span className="en">Listen</span>
        </button>
      </div>

      <div className={'spell-input' + (shake ? ' spell-input--wrong' : '') + (correct ? ' spell-input--correct' : '')}>
        {input || ' '}
      </div>

      <div className="kid-keyboard">
        {KEY_ROWS.map((row, i) => (
          <div className="kid-keyboard__row" key={i}>
            {row.map((letter) => (
              <button
                key={letter}
                className="kid-key"
                onClick={() => pressKey(letter)}
                disabled={locked}
              >
                {letter}
              </button>
            ))}
          </div>
        ))}
        <div className="kid-keyboard__row">
          <button className="kid-key kid-key--wide" onClick={backspace} disabled={locked}>
            ⌫
          </button>
        </div>
      </div>
    </section>
  );
}
