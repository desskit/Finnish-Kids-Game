import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Construction, LexicalItem, Tier } from '../content/types';
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
  items?: LexicalItem[];
  /**
   * Grammar apex: when carrier phrases are given, the child types the INFLECTED
   * slot form (e.g. "laatikoissa"), shown with the phrase's English gloss,
   * instead of the bare nominative. Forms are sourced via formFor — never
   * generated. The tier gate comes from the adaptive difficulty (ActivityContext).
   */
  constructions?: Construction[];
  /**
   * Sentence-typing mode: supply a pre-built round (e.g. full sentences) instead
   * of deriving one from `items`/`constructions`. Receives the level's `maxTier`
   * like WordOrder's `buildRound`, for the same tier-gating reasons.
   */
  buildRound?: (maxTier: Tier) => SpellTarget[];
  /** Header title (defaults to the vocabulary-speller wording). */
  title?: string;
  /**
   * Whether the target is spoken aloud (auto-play + the manual Listen button).
   * Default true. Set false for sentence typing: hearing the full sentence
   * would turn "produce it from the English gloss" into plain dictation.
   */
  speakTarget?: boolean;
  onExit: () => void;
}

/** One spelling prompt, normalized across bare-word, inflected-phrase, and
 *  sentence modes. */
interface SpellTarget {
  /** SRS id (the item). Sentences span several words, so none. */
  id?: string;
  /** The Finnish string to type (+ hear, unless speakTarget is false). */
  text: string;
  emoji?: string;
  /** English hint: the word, the carrier-phrase gloss, or the sentence gloss. */
  gloss: string;
}

// Spelling: see/hear a Finnish word, type it on the DEVICE keyboard (a real
// focused <input>, so phones raise their native keyboard — with the child's
// Finnish/locale layout and its ä/ö — and physical keyboards just work). By
// default the target is item.fi — the sourced nominative singular. As the
// grammar apex of a deeper node's ramp, passing `constructions` makes the child
// type the sourced INFLECTED form instead (e.g. "pöydällä"). Either way the
// target is looked up, never generated.
export default function SpellWord({
  items,
  constructions,
  buildRound,
  title,
  speakTarget = true,
  onExit,
}: Props) {
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
    if (buildRound) return buildRound(maxTier);
    if (constructions && constructions.length > 0) {
      return buildSpellingPhraseRound(items ?? [], constructions, QUESTIONS, maxTier, weigh).map(
        (q) => ({
          id: q.item.id,
          text: q.target,
          emoji: q.item.emoji,
          gloss: q.construction.en,
        }),
      );
    }
    return buildSpellingRound(items ?? [], QUESTIONS, weigh).map((it) => ({
      id: it.id,
      text: it.fi,
      emoji: it.emoji,
      gloss: it.en,
    }));
    // buildRound is an inline closure (new identity each render); restart via runId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, constructions, maxTier, runId]);

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const target = round[index];
  // A forgotten trailing period/! /? shouldn't fail an otherwise-correct
  // sentence — strip it from both sides before comparing (bare-word targets
  // never have trailing punctuation, so this is a no-op there).
  const norm = (s: string) => s.trim().toLowerCase().replace(/[.!?]+$/, '');
  const correct = !!target && norm(input) === norm(target.text);

  // Say the target word when a new question appears, and keep focus on the
  // input so the device keyboard stays up between words. Skipped for
  // sentence typing (speakTarget=false) — hearing the sentence would turn
  // "produce it from the gloss" into dictation.
  useEffect(() => {
    if (!target || done || !speakTarget) return;
    inputRef.current?.focus();
    const t = setTimeout(() => speak(target.text), 400);
    return () => clearTimeout(t);
  }, [target, done, index, speakTarget]);

  const checkIfComplete = useCallback(
    (value: string) => {
      if (!target || locked) return;
      if (value.length < norm(target.text).length) return;
      if (norm(value) === norm(target.text)) {
        setLocked(true);
        playDing(true);
        if (speakTarget) speak(target.text);
        addStars(1);
        if (target.id) recordAttempt(target.id, !missed.current);
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
    [target, locked, index, round.length, addStars, recordAttempt, speakTarget],
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
        title={title ?? 'Kirjoita sana'}
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <p className="prompt">
        {speakTarget ? (
          <>
            Kirjoita mitä kuulet <span className="en">Type what you hear</span>
          </>
        ) : (
          <>
            Kirjoita suomeksi <span className="en">Write it in Finnish</span>
          </>
        )}
      </p>

      <div className="phrase-card">
        {target.emoji && (
          <span className="phrase-emoji" aria-hidden="true">
            {target.emoji}
          </span>
        )}
        <p className="en phrase-hint">{target.gloss}</p>
        {speakTarget && (
          <button
            className="speaker speaker--inline"
            onClick={() => speak(target.text)}
            aria-label="Hear the word again"
          >
            🔊 <span className="en">Listen</span>
          </button>
        )}
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
