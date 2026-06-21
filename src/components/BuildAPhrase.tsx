import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Construction, LexicalItem, PhraseFill } from '../content/types';
import { sentenceFor } from '../content';
import { useProfile } from '../state/profile';
import { buildPhraseRound } from '../game/round';
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

// Build-a-Phrase (Tier 2–3): hear a full carrier phrase, then pick the right
// word to complete it. Choices are other human-authored forms (never generated).
export default function BuildAPhrase({ items, constructions, onExit }: Props) {
  const { level, addStars } = useProfile();
  const optionCount = level >= 2 ? 4 : 3;

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    () => buildPhraseRound(items, constructions, QUESTIONS, optionCount),
    [items, constructions, optionCount, runId],
  );

  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [chosen, setChosen] = useState<PhraseFill | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const question = round[index];
  const fullSentence = question
    ? sentenceFor(question.construction.prefix, question.answer.form, question.construction.suffix)
    : '';

  // Model the whole phrase out loud when a new question appears.
  useEffect(() => {
    if (!question || done) return;
    const t = setTimeout(() => speak(fullSentence), 400);
    return () => clearTimeout(t);
  }, [question, done, fullSentence]);

  const choose = useCallback(
    (fill: PhraseFill) => {
      if (!question || locked || done) return;
      if (fill.itemId === question.answer.itemId) {
        setLocked(true);
        setChosen(fill);
        playDing(true);
        speak(fullSentence);
        setStars((s) => s + 1);
        addStars(1);
        setWrongId(null);
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else {
            setIndex(next);
            setChosen(null);
          }
          setLocked(false);
        }, 1100);
      } else {
        playDing(false);
        setWrongId(fill.itemId);
        setTimeout(() => setWrongId((cur) => (cur === fill.itemId ? null : cur)), 600);
      }
    },
    [question, locked, done, index, round.length, addStars, fullSentence],
  );

  // Keyboard: number keys pick a word tile; Space/Enter replays the phrase.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!question || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speak(fullSentence);
        return;
      }
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= question.options.length) choose(question.options[n - 1]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, done, choose, fullSentence]);

  function restart() {
    setIndex(0);
    setStars(0);
    setChosen(null);
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
        title="Rakenna lause"
        index={index}
        total={round.length}
        onExit={onExit}
      />

      <p className="prompt">
        {question.construction.en} <span className="en">{question.item.en}</span>
      </p>

      <div className="phrase-card">
        <span className="phrase-emoji" aria-hidden="true">
          {question.item.emoji}
        </span>
        <div className="phrase-line">
          <span className="phrase-fixed">{question.construction.prefix}</span>
          <span className={'phrase-slot' + (chosen ? ' phrase-slot--filled' : '')}>
            {chosen ? chosen.form : '​'}
          </span>
          <span className="phrase-fixed">{question.construction.suffix}</span>
        </div>
        <button
          className="speaker speaker--inline"
          onClick={() => speak(fullSentence)}
          aria-label="Hear the sentence again"
        >
          🔊 <span className="en">Listen</span>
        </button>
      </div>

      <div className="word-tiles">
        {question.options.map((opt, i) => (
          <button
            key={opt.itemId}
            className={'word-tile' + (wrongId === opt.itemId ? ' word-tile--wrong' : '')}
            onClick={() => choose(opt)}
            disabled={locked}
          >
            <span className="word-tile__num">{i + 1}</span>
            {opt.form}
          </button>
        ))}
      </div>
    </section>
  );
}
