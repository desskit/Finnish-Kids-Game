import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Construction, LexicalItem } from '../content/types';
import { buildSpellingRound, buildSpellingPhraseRound } from '../game/round';
import { useProfile } from '../state/profile';
import { useActivityContext } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
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
  /**
   * Grammar apex: when carrier phrases are given, the child types the INFLECTED
   * slot form (e.g. "laatikoissa"), shown with the phrase's English gloss,
   * instead of the bare nominative. Forms are sourced via formFor — never
   * generated. The tier gate comes from the adaptive difficulty (ActivityContext).
   */
  constructions?: Construction[];
  onExit: () => void;
}

/** One spelling prompt, normalized across bare-word and inflected-phrase modes. */
interface SpellTarget {
  /** SRS id (the item). */
  id: string;
  /** The Finnish string to type + hear (bare noun, or the inflected slot form). */
  text: string;
  emoji?: string;
  /** English hint: the word, or the carrier-phrase gloss ("The cat is on the ___."). */
  gloss: string;
}

// Spelling: see/hear a Finnish word, type it with an on-screen keyboard
// (including ä/ö, so it works the same on any device). By default the target is
// item.fi — the sourced nominative singular. As the grammar apex of a deeper
// node's ramp, passing `constructions` makes the child type the sourced
// INFLECTED form instead (e.g. "pöydällä"). Either way the target is looked up,
// never generated.
export default function SpellWord({ items, constructions, onExit }: Props) {
  const { addStars, recordAttempt } = useProfile();
  const ctx = useActivityContext();
  const { maxTier } = ctx?.difficulty ?? difficultyFor(1);

  // A wrong guess on the current word means it wasn't a first-try success.
  const missed = useRef(false);

  const [runId, setRunId] = useState(0);
  const round = useMemo<SpellTarget[]>(() => {
    if (constructions && constructions.length > 0) {
      return buildSpellingPhraseRound(items, constructions, QUESTIONS, maxTier).map((q) => ({
        id: q.item.id,
        text: q.target,
        emoji: q.item.emoji,
        gloss: q.construction.en,
      }));
    }
    return buildSpellingRound(items, QUESTIONS).map((it) => ({
      id: it.id,
      text: it.fi,
      emoji: it.emoji,
      gloss: it.en,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, constructions, maxTier, runId]);

  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const target = round[index];
  const correct = !!target && input.toLowerCase() === target.text.toLowerCase();

  // Say the target word when a new question appears.
  useEffect(() => {
    if (!target || done) return;
    const t = setTimeout(() => speak(target.text), 400);
    return () => clearTimeout(t);
  }, [target, done]);

  const checkIfComplete = useCallback(
    (value: string) => {
      if (!target || locked) return;
      if (value.length < target.text.length) return;
      if (value.toLowerCase() === target.text.toLowerCase()) {
        setLocked(true);
        playDing(true);
        speak(target.text);
        setStars((s) => s + 1);
        addStars(1);
        recordAttempt(target.id, !missed.current);
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else {
            setIndex(next);
            setInput('');
          }
          missed.current = false;
          setLocked(false);
        }, 1200);
      } else {
        missed.current = true;
        playDing(false);
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }
    },
    [target, locked, index, round.length, addStars, recordAttempt],
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
        speak(target.text);
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
    missed.current = false;
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
        <p className="en phrase-hint">{target.gloss}</p>
        <button
          className="speaker speaker--inline"
          onClick={() => speak(target.text)}
          aria-label="Hear the word again"
        >
          🔊 <span className="en">Listen</span>
        </button>
      </div>

      <div className={'spell-input' + (shake ? ' spell-input--wrong' : '') + (correct ? ' spell-input--correct' : '')}>
        {input || ' '}
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
