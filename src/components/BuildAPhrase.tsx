import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Construction, LexicalItem } from '../content/types';
import { englishSentenceFor, formFor, sentenceFor } from '../content';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { familiarityWeigher } from '../game/srs';
import { buildPhraseRound } from '../game/round';
import { speak, speakEnglish } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';

const QUESTIONS = 6;

interface Props {
  items: LexicalItem[];
  constructions: Construction[];
  onExit: () => void;
}

// Build-a-Phrase (Tier 2–3): hear a full carrier phrase, then pick the word
// (in its correct sourced case form) that completes it.
export default function BuildAPhrase({ items, constructions, onExit }: Props) {
  const { level, addStars, recordAttempt, activeChild } = useProfile();
  const ctx = useActivityContext();
  // Harder levels add more options AND unlock higher-tier carrier phrases.
  const { optionCount, maxTier, tricky } = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  // Familiarity bias, snapshotted once per mount (see ListenAndTap).
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;

  // Tracks a wrong tap on the current question, so SRS only credits a first-try
  // correct answer.
  const missed = useRef(false);
  // First-try successes this segment — the real accuracy for the adaptive engine.
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    () => buildPhraseRound(items, constructions, QUESTIONS, optionCount, maxTier, tricky, weigh),
    [items, constructions, optionCount, maxTier, tricky, weigh, runId],
  );

  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<LexicalItem | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const question = round[index];
  const fullSentence = question ? sentenceFor(question.item, question.construction) : '';
  const englishPrompt = question ? englishSentenceFor(question.item, question.construction) : '';

  // No FINNISH before an answer: reading the target phrase aloud would hand
  // the child the completing word for free. The ENGLISH prompt, though, is
  // narrated up front — it's just the on-screen gloss read aloud for a
  // pre-reader, and never previews the Finnish. Finnish is spoken once they
  // choose correctly, below.
  useEffect(() => {
    if (!question || done) return;
    const t = setTimeout(() => speakEnglish(englishPrompt), 350);
    return () => clearTimeout(t);
  }, [question, done, englishPrompt]);

  const choose = useCallback(
    (item: LexicalItem) => {
      if (!question || locked || done) return;
      if (item.id === question.item.id) {
        setLocked(true);
        setChosen(item);
        playDing(true);
        speak(fullSentence);
        addStars(1);
        recordAttempt(question.item.id, !missed.current);
        if (!missed.current) firstTries.current += 1;
        setWrongId(null);
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else {
            setIndex(next);
            setChosen(null);
          }
          missed.current = false;
          setLocked(false);
        }, 1100);
      } else {
        missed.current = true;
        playDing(false);
        setWrongId(item.id);
        setTimeout(() => setWrongId((cur) => (cur === item.id ? null : cur)), 600);
      }
    },
    [question, locked, done, index, round.length, addStars, recordAttempt, fullSentence],
  );

  // Keyboard: number keys pick a word tile; Space/Enter replays the phrase —
  // but only once it's been answered (chosen), never as a pre-answer hint.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!question || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (chosen) speak(fullSentence);
        return;
      }
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= question.options.length) choose(question.options[n - 1]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, done, choose, fullSentence, chosen]);

  function restart() {
    setIndex(0);
    setChosen(null);
    setWrongId(null);
    setLocked(false);
    setDone(false);
    missed.current = false;
    firstTries.current = 0;
    setRunId((r) => r + 1);
  }

  // Endless stream: silent segment handoff, no interstitial.
  useSegmentComplete(done, firstTries.current, round.length, restart);

  if (done) return null;
  if (!question) return null;

  const { construction, item } = question;
  const chosenForm = chosen ? formFor(chosen, construction) : null;

  return (
    <section className="screen activity">
      <ActivityHeader
        title="Rakenna lause"
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <p className="prompt">
        {construction.en} <span className="en">{item.en}</span>
      </p>

      <div className="phrase-card">
        <span className="phrase-emoji" aria-hidden="true">
          {item.emoji}
        </span>
        <div className="phrase-line">
          {construction.before && <span className="phrase-fixed">{construction.before}</span>}
          <span className={'phrase-slot' + (chosenForm ? ' phrase-slot--filled' : '')}>
            {chosenForm ?? '​'}
          </span>
          {construction.after && <span className="phrase-fixed">{construction.after}</span>}
          {construction.punct && <span className="phrase-fixed">{construction.punct}</span>}
        </div>
        {chosen && (
          <button
            className="speaker speaker--inline"
            onClick={() => speak(fullSentence)}
            aria-label="Hear the sentence again"
          >
            🔊 <span className="en">Listen</span>
          </button>
        )}
      </div>

      <div className="word-tiles">
        {question.options.map((opt, i) => (
          <button
            key={opt.id}
            className={
              'word-tile' +
              (wrongId === opt.id ? ' word-tile--wrong' : '') +
              (locked && opt.id === question.item.id ? ' word-tile--correct' : '')
            }
            onClick={() => choose(opt)}
            disabled={locked}
          >
            <span className="word-tile__num">{i + 1}</span>
            {formFor(opt, construction)}
          </button>
        ))}
      </div>
    </section>
  );
}
