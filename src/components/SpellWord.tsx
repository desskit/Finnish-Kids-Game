import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Construction, LexicalItem, Tier } from '../content/types';
import { buildSpellingRound, buildSpellingPhraseRound } from '../game/round';
import { familiarityWeigher, grammarSrsId } from '../game/srs';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { speak, speakEnglish } from '../audio/speak';
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
  /** GRAMMAR SRS id (`con:<id>`, inflected-phrase mode only). */
  grammarId?: string;
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
  const { maxTier, dictation } = ctx?.difficulty ?? difficultyFor(1);
  // Expert band (L9+): DICTATION. The audio alone is the prompt — the emoji
  // and English gloss (which give the answer away semantically) disappear, and
  // even sentence mode speaks the Finnish instead of glossing it. "Type what
  // you hear", for real.
  const speakFi = speakTarget || dictation;
  const showHint = !dictation;
  // Familiarity bias, snapshotted once per mount (see ListenAndTap).
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;

  // A wrong guess on the current word means it wasn't a first-try success.
  const missed = useRef(false);
  // First-try successes this segment — the real accuracy for the adaptive engine.
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo<SpellTarget[]>(() => {
    let full: SpellTarget[];
    if (buildRound) {
      full = buildRound(maxTier);
    } else if (constructions && constructions.length > 0) {
      full = buildSpellingPhraseRound(items ?? [], constructions, QUESTIONS, maxTier, weigh).map(
        (q) => ({
          id: q.item.id,
          grammarId: grammarSrsId(q.construction.id),
          text: q.target,
          emoji: q.item.emoji,
          gloss: q.construction.en,
        }),
      );
    } else {
      full = buildSpellingRound(items ?? [], QUESTIONS, weigh).map((it) => ({
        id: it.id,
        text: it.fi,
        emoji: it.emoji,
        gloss: it.en,
      }));
    }
    // `roundQuestions` (Audit harness) caps the round to stop after each answer.
    return full.slice(0, ctx?.roundQuestions);
    // buildRound is an inline closure (new identity each render); restart via runId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, constructions, maxTier, runId, ctx?.roundQuestions]);

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  // How many leading letters the child has revealed for THIS word (max 3), so a
  // stuck child gets un-stuck without being handed the whole answer.
  const [revealed, setRevealed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_REVEALS = 3;

  const target = round[index];
  // A forgotten trailing period/! /? shouldn't fail an otherwise-correct
  // sentence — strip it from both sides before comparing (bare-word targets
  // never have trailing punctuation, so this is a no-op there).
  const norm = (s: string) => s.trim().toLowerCase().replace(/[.!?]+$/, '');
  const correct = !!target && norm(input) === norm(target.text);

  // Say the target word (Finnish) when a new question appears, and keep focus
  // on the input so the device keyboard stays up between words. Finnish is
  // skipped for sentence typing (speakTarget=false) — hearing the sentence
  // would turn "produce it from the gloss" into dictation. That mode instead
  // narrates the ENGLISH gloss, which is otherwise silent text a pre-reader
  // can't access, and never previews the Finnish answer.
  useEffect(() => {
    if (!target || done) return;
    inputRef.current?.focus();
    const t = setTimeout(() => {
      if (speakFi) speak(target.text);
      else speakEnglish(target.gloss);
    }, 400);
    return () => clearTimeout(t);
  }, [target, done, index, speakFi]);

  const checkIfComplete = useCallback(
    (value: string) => {
      if (!target || locked) return;
      if (value.length < norm(target.text).length) return;
      if (norm(value) === norm(target.text)) {
        setLocked(true);
        playDing(true);
        if (speakFi) speak(target.text);
        addStars(1);
        if (target.id) recordAttempt(target.id, !missed.current);
        // Inflected-phrase mode also schedules the GRAMMAR for spaced review.
        if (target.grammarId) recordAttempt(target.grammarId, !missed.current);
        if (!missed.current) firstTries.current += 1;
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else {
            setIndex(next);
            setInput('');
            setRevealed(0);
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

  // Reveal the next needed letter (max 3 per word), stopping one short of the
  // full answer so there's always something left to type. It respects what the
  // child has already typed: one letter is appended past their correct prefix
  // (a wrong prefix is corrected to the right letters). Using a hint counts the
  // word as not-first-try (no clean SRS credit), so it stays a nudge, not a
  // freebie.
  function revealNext() {
    if (!target || locked || done || revealed >= MAX_REVEALS) return;
    const answer = target.text;
    let p = 0; // length of the child's correct (case-insensitive) leading prefix
    while (p < input.length && p < answer.length && input[p].toLowerCase() === answer[p].toLowerCase()) p++;
    const n = Math.min(p + 1, Math.max(0, answer.length - 1));
    if (n <= p) return; // already at the last letter — nothing new to show
    missed.current = true;
    setRevealed(revealed + 1);
    setInput(answer.slice(0, n));
    inputRef.current?.focus();
  }

  const advanceUnsolved = useCallback(() => {
    if (!target || locked || done) return;
    // Getting stuck records the item as not-recalled so the SRS brings it back
    // sooner — but it's never a punishment (no wrong buzz), just a way forward.
    if (target.id) recordAttempt(target.id, false);
    if (target.grammarId) recordAttempt(target.grammarId, false);
    const next = index + 1;
    missed.current = false;
    setInput('');
    setRevealed(0);
    setShake(false);
    if (next >= round.length) setDone(true);
    else setIndex(next);
  }, [target, locked, done, index, round.length, recordAttempt]);

  function restart() {
    setIndex(0);
    setInput('');
    setShake(false);
    setLocked(false);
    setDone(false);
    setRevealed(0);
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
        {speakFi ? (
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
        {showHint && target.emoji && (
          <span className="phrase-emoji" aria-hidden="true">
            {target.emoji}
          </span>
        )}
        {showHint && <p className="en phrase-hint">{target.gloss}</p>}
        <button
          className="speaker speaker--inline"
          onClick={() => (speakFi ? speak(target.text) : speakEnglish(target.gloss))}
          aria-label={speakFi ? 'Hear the word again' : 'Hear the prompt again'}
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

      {/* Stuck-child helpers: reveal up to 3 leading letters, or move on. Both
          keep the round from ever being a dead end. */}
      <div className="stuck-help">
        <button
          className="btn btn--ghost"
          onClick={revealNext}
          disabled={locked || revealed >= MAX_REVEALS}
        >
          💡 Kirjain <span className="en">Letter</span>
          <span className="stuck-help__count">{MAX_REVEALS - revealed}</span>
        </button>
        <button className="btn btn--ghost" onClick={advanceUnsolved} disabled={locked}>
          Ohita <span className="en">Skip</span> →
        </button>
      </div>
    </section>
  );
}
