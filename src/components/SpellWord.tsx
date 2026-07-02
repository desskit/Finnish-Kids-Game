import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Construction, LexicalItem } from '../content/types';
import { buildSpellingRound, buildSpellingPhraseRound } from '../game/round';
import { familiarityWeigher } from '../game/srs';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';

const QUESTIONS = 6;

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

// Spelling: see/hear a Finnish word, type it on the DEVICE keyboard (a real
// focused <input>, so phones raise their native keyboard — with the child's
// Finnish/locale layout and its ä/ö — and physical keyboards just work). By
// default the target is item.fi — the sourced nominative singular. As the
// grammar apex of a deeper node's ramp, passing `constructions` makes the child
// type the sourced INFLECTED form instead (e.g. "pöydällä"). Either way the
// target is looked up, never generated.
export default function SpellWord({ items, constructions, onExit }: Props) {
  const { addStars, recordAttempt, activeChild } = useProfile();
  const ctx = useActivityContext();
  const { maxTier } = ctx?.difficulty ?? difficultyFor(1);
  // Familiarity bias, snapshotted once per mount (see ListenAndTap).
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;

  // A wrong guess on the current word means it wasn't a first-try success.
  const missed = useRef(false);
  // First-try successes this segment — the real accuracy for the adaptive engine.
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo<SpellTarget[]>(() => {
    if (constructions && constructions.length > 0) {
      return buildSpellingPhraseRound(items, constructions, QUESTIONS, maxTier, weigh).map((q) => ({
        id: q.item.id,
        text: q.target,
        emoji: q.item.emoji,
        gloss: q.construction.en,
      }));
    }
    return buildSpellingRound(items, QUESTIONS, weigh).map((it) => ({
      id: it.id,
      text: it.fi,
      emoji: it.emoji,
      gloss: it.en,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, constructions, maxTier, runId]);

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const target = round[index];
  const correct = !!target && input.toLowerCase() === target.text.toLowerCase();

  // Say the target word when a new question appears, and keep focus on the
  // input so the device keyboard stays up between words.
  useEffect(() => {
    if (!target || done) return;
    inputRef.current?.focus();
    const t = setTimeout(() => speak(target.text), 400);
    return () => clearTimeout(t);
  }, [target, done, index]);

  const checkIfComplete = useCallback(
    (value: string) => {
      if (!target || locked) return;
      if (value.length < target.text.length) return;
      if (value.toLowerCase() === target.text.toLowerCase()) {
        setLocked(true);
        playDing(true);
        speak(target.text);
        addStars(1);
        recordAttempt(target.id, !missed.current);
        if (!missed.current) firstTries.current += 1;
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

  // The device keyboard drives the input directly; we just mirror its value
  // and check for completion on every change.
  function onInputChange(value: string) {
    if (!target || locked || done) return;
    setInput(value);
    checkIfComplete(value);
  }

  function restart() {
    setIndex(0);
    setInput('');
    setShake(false);
    setLocked(false);
    setDone(false);
    missed.current = false;
    firstTries.current = 0;
    setRunId((r) => r + 1);
  }

  // Endless stream: silent segment handoff, no interstitial.
  useSegmentComplete(done, firstTries.current, round.length, restart);

  if (done) return null;
  if (!target) return null;

  return (
    <section className="screen activity">
      <ActivityHeader
        title="Kirjoita sana"
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

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

      <input
        ref={inputRef}
        className={
          'spell-input' +
          (shake ? ' spell-input--wrong' : '') +
          (correct ? ' spell-input--correct' : '')
        }
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        readOnly={locked}
        autoFocus
        // Give the child a clean typing surface (no autocorrect fighting the
        // Finnish word) while still using their own device keyboard.
        type="text"
        inputMode="text"
        lang="fi"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        aria-label="Type the word you hear"
      />
    </section>
  );
}
