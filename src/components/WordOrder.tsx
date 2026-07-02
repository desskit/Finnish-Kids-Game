import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Construction, LexicalItem, Tier } from '../content/types';
import { englishSentenceFor } from '../content';
import {
  buildWordOrderRound,
  type SentenceQuestion,
  type WordOrderToken,
} from '../game/round';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { familiarityWeigher } from '../game/srs';
import { speak, speakEnglish } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';

const QUESTIONS = 6;

interface Props {
  /** Phrase mode: build the round from a topic's items + carrier phrases. */
  items?: LexicalItem[];
  constructions?: Construction[];
  /**
   * Sentence mode: supply a pre-built round (e.g. multi-slot sentences). When
   * given, `items`/`constructions` are ignored. Receives the level's `maxTier`
   * so it can tier-gate templates the same way phrase mode gates carrier
   * phrases. Rebuilt on each round restart (and when the level changes).
   */
  buildRound?: (maxTier: Tier) => SentenceQuestion[];
  /** Header title (defaults to the carrier-phrase wording). */
  title?: string;
  /**
   * After this many wrong taps on the CURRENT word, nudge the child by
   * highlighting the correct next tile. Unset = no hints (the default, and
   * the Word Order capstone's existing behavior — only opted into for the
   * harder multi-slot sentence node so far).
   */
  hintAfterMisses?: number;
  onExit: () => void;
}

// Word Order (Tier 3+): a full sentence is shown as shuffled word chips; tap
// them back into the correct order. The target order is the human-authored
// construction/sentence template itself — nothing here generates or reorders
// Finnish by rule. Renders both single-slot carrier phrases and (when given a
// `buildRound`) multi-slot sentences, since both reduce to ordered word chips.
export default function WordOrder({
  items,
  constructions,
  buildRound,
  title,
  hintAfterMisses,
  onExit,
}: Props) {
  const { level, addStars, recordAttempt, activeChild } = useProfile();
  const ctx = useActivityContext();
  // Higher levels unlock higher-tier carrier phrases (longer, harder sentences).
  const { maxTier } = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  // Familiarity bias, snapshotted once per mount (see ListenAndTap).
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;

  // A mis-tap while assembling the sentence means it wasn't a first-try solve.
  const missed = useRef(false);
  // First-try solves this segment — the real accuracy for the adaptive engine.
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo<SentenceQuestion[]>(() => {
    if (buildRound) return buildRound(maxTier);
    return buildWordOrderRound(items ?? [], constructions ?? [], QUESTIONS, maxTier, weigh).map((q) => ({
      hintEn: englishSentenceFor(q.item, q.construction),
      sentence: q.sentence,
      tokens: q.tokens,
      shuffled: q.shuffled,
      attemptId: q.item.id,
      emoji: q.item.emoji,
    }));
    // buildRound is an inline closure (new identity each render); restart via runId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, constructions, maxTier, runId]);

  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState<WordOrderToken[]>([]);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  // Wrong taps toward the CURRENT tile (resets each time a tile lands
  // correctly, or a new question starts) — drives the hint nudge.
  const [wrongTaps, setWrongTaps] = useState(0);

  const q = round[index];
  const complete = !!q && placed.length === q.tokens.length;
  const showHint = hintAfterMisses !== undefined && wrongTaps >= hintAfterMisses;

  // Never FINNISH before an answer — hearing the sentence read aloud would
  // hand the child the word order for free. The ENGLISH hint, though, is
  // narrated up front (it's just the on-screen gloss read aloud, never a
  // preview of the Finnish). A single-slot carrier phrase also gets the
  // Finnish spoken once assembled correctly (confirms the pronunciation); a
  // multi-slot sentence (buildRound) stays Finnish-silent even after a
  // correct answer, since it has no single settled reading the way one
  // carrier phrase does.
  useEffect(() => {
    if (!q || done) return;
    const t = setTimeout(() => speakEnglish(q.hintEn), 350);
    return () => clearTimeout(t);
  }, [q, done]);

  const tap = useCallback(
    (tile: WordOrderToken) => {
      if (!q || locked || done || complete) return;
      if (tile.id === placed.length) {
        playDing(true);
        setPlaced((p) => [...p, tile]);
        setWrongId(null);
        setWrongTaps(0);
        if (placed.length + 1 === q.tokens.length) {
          setLocked(true);
          addStars(1);
          if (!buildRound) speak(q.sentence);
          if (q.attemptId) recordAttempt(q.attemptId, !missed.current);
          if (!missed.current) firstTries.current += 1;
          const next = index + 1;
          setTimeout(() => {
            if (next >= round.length) setDone(true);
            else {
              setIndex(next);
              setPlaced([]);
            }
            missed.current = false;
            setLocked(false);
          }, 1300);
        }
      } else {
        missed.current = true;
        playDing(false);
        setWrongId(tile.id);
        setWrongTaps((n) => n + 1);
        setTimeout(() => setWrongId((cur) => (cur === tile.id ? null : cur)), 500);
      }
    },
    [q, locked, done, complete, placed, index, round.length, addStars, recordAttempt, buildRound],
  );

  function restart() {
    setIndex(0);
    setPlaced([]);
    setWrongId(null);
    setLocked(false);
    setDone(false);
    setWrongTaps(0);
    missed.current = false;
    firstTries.current = 0;
    setRunId((r) => r + 1);
  }

  // Endless stream: silent segment handoff, no interstitial.
  useSegmentComplete(done, firstTries.current, round.length, restart);

  if (done) return null;
  if (!q) return null;

  const placedIds = new Set(placed.map((t) => t.id));

  return (
    <section className="screen activity">
      <ActivityHeader
        title={title ?? 'Järjestä sanat'}
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <p className="prompt">
        Laita sanat järjestykseen <span className="en">Put the words in order</span>
      </p>

      <div className="phrase-card">
        {q.emoji && (
          <span className="phrase-emoji" aria-hidden="true">
            {q.emoji}
          </span>
        )}
        <p className="en phrase-hint">{q.hintEn}</p>
      </div>

      <div className="word-order-assembled" aria-label="Your sentence so far">
        {q.tokens.map((t) => (
          <span
            key={t.id}
            className={'word-order-slot' + (placedIds.has(t.id) ? ' word-order-slot--filled' : '')}
          >
            {placedIds.has(t.id) ? t.text : ''}
          </span>
        ))}
      </div>

      <div className="word-tiles">
        {q.shuffled
          .filter((t) => !placedIds.has(t.id))
          .map((tile) => (
            <button
              key={tile.id}
              className={
                'word-tile' +
                (wrongId === tile.id ? ' word-tile--wrong' : '') +
                (showHint && tile.id === placed.length ? ' word-tile--hint' : '')
              }
              onClick={() => tap(tile)}
              disabled={locked}
            >
              {tile.text}
            </button>
          ))}
      </div>
    </section>
  );
}
