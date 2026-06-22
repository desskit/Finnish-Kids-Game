import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Construction, LexicalItem } from '../content/types';
import { buildWordOrderRound, type WordOrderToken } from '../game/round';
import { useProfile } from '../state/profile';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';
import RoundComplete from './RoundComplete';

const QUESTIONS = 6;

interface Props {
  items: LexicalItem[];
  constructions: Construction[];
  onExit: () => void;
}

// Word Order (Tier 3): a full carrier-phrase sentence is shown as shuffled
// word chips; tap them back into the correct order. Reuses the same
// construction + sourced slot-form data as Build a Phrase — nothing here
// generates or reorders Finnish by rule, the target order is the
// human-authored construction itself.
export default function WordOrder({ items, constructions, onExit }: Props) {
  const { addStars, recordAttempt } = useProfile();

  // A mis-tap while assembling the sentence means it wasn't a first-try solve.
  const missed = useRef(false);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    () => buildWordOrderRound(items, constructions, QUESTIONS),
    [items, constructions, runId],
  );

  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [placed, setPlaced] = useState<WordOrderToken[]>([]);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const q = round[index];
  const complete = !!q && placed.length === q.tokens.length;

  // Say the target sentence when a new question appears.
  useEffect(() => {
    if (!q || done) return;
    const t = setTimeout(() => speak(q.sentence), 400);
    return () => clearTimeout(t);
  }, [q, done]);

  const tap = useCallback(
    (tile: WordOrderToken) => {
      if (!q || locked || done || complete) return;
      if (tile.id === placed.length) {
        playDing(true);
        setPlaced((p) => [...p, tile]);
        setWrongId(null);
        if (placed.length + 1 === q.tokens.length) {
          setLocked(true);
          speak(q.sentence);
          setStars((s) => s + 1);
          addStars(1);
          recordAttempt(q.item.id, !missed.current);
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
        setTimeout(() => setWrongId((cur) => (cur === tile.id ? null : cur)), 500);
      }
    },
    [q, locked, done, complete, placed, index, round.length, addStars, recordAttempt],
  );

  function restart() {
    setIndex(0);
    setStars(0);
    setPlaced([]);
    setWrongId(null);
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
  if (!q) return null;

  const placedIds = new Set(placed.map((t) => t.id));

  return (
    <section className="screen activity">
      <ActivityHeader title="Järjestä sanat" index={index} total={round.length} onExit={onExit} />

      <p className="prompt">
        Laita sanat järjestykseen <span className="en">Put the words in order</span>
      </p>

      <div className="phrase-card">
        <p className="en phrase-hint">{q.construction.en}</p>
        <button
          className="speaker speaker--inline"
          onClick={() => speak(q.sentence)}
          aria-label="Hear the sentence again"
        >
          🔊 <span className="en">Listen</span>
        </button>
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
              className={'word-tile' + (wrongId === tile.id ? ' word-tile--wrong' : '')}
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
