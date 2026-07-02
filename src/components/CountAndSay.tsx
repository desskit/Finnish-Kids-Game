import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LexicalItem } from '../content/types';
import { countingNounForm, countingPhrase } from '../content';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { familiarityWeigher } from '../game/srs';
import { buildCountingRound } from '../game/round';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';

const QUESTIONS = 6;

interface Props {
  nouns: LexicalItem[];
  numbers: LexicalItem[];
  onExit: () => void;
}

// Count & Say (two-slot): count the animals, then complete "number + noun".
// The noun's form (nominative for 1, partitive for 2+) is looked up from the
// sourced inflection table — never generated.
export default function CountAndSay({ nouns, numbers, onExit }: Props) {
  const { level, addStars, recordAttempt, activeChild } = useProfile();
  const ctx = useActivityContext();
  // Harder levels offer more tiles AND count higher (5 → 8 → 10).
  const { optionCount, maxCount, tricky } = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  // Familiarity bias, snapshotted once per mount (see ListenAndTap).
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;

  // Any wrong tap (number or noun) means this item wasn't a first-try success.
  const missed = useRef(false);
  // First-try successes this segment — the real accuracy for the adaptive engine.
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    () => buildCountingRound(numbers, nouns, QUESTIONS, optionCount, maxCount, tricky, weigh),
    [numbers, nouns, optionCount, maxCount, tricky, weigh, runId],
  );

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'number' | 'noun'>('number');
  const [pickedNumber, setPickedNumber] = useState<LexicalItem | null>(null);
  const [pickedNoun, setPickedNoun] = useState<LexicalItem | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const q = round[index];
  const count = q?.number.value ?? 0;
  const fullPhrase = q ? countingPhrase(q.number, q.noun) : '';

  const flashWrong = useCallback((id: string) => {
    setWrongId(id);
    setTimeout(() => setWrongId((cur) => (cur === id ? null : cur)), 600);
  }, []);

  const chooseNumber = useCallback(
    (item: LexicalItem) => {
      if (!q || locked || done || phase !== 'number') return;
      if (item.id === q.number.id) {
        playDing(true);
        speak(item.fi);
        setPickedNumber(item);
        setWrongId(null);
        setPhase('noun');
      } else {
        missed.current = true;
        playDing(false);
        flashWrong(item.id);
      }
    },
    [q, locked, done, phase, flashWrong],
  );

  const chooseNoun = useCallback(
    (item: LexicalItem) => {
      if (!q || locked || done || phase !== 'noun') return;
      if (item.id === q.noun.id) {
        setLocked(true);
        setPickedNoun(item);
        playDing(true);
        speak(fullPhrase);
        addStars(1);
        recordAttempt(q.noun.id, !missed.current);
        if (!missed.current) firstTries.current += 1;
        setWrongId(null);
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else {
            setIndex(next);
            setPhase('number');
            setPickedNumber(null);
            setPickedNoun(null);
          }
          missed.current = false;
          setLocked(false);
        }, 1200);
      } else {
        missed.current = true;
        playDing(false);
        flashWrong(item.id);
      }
    },
    [q, locked, done, phase, index, round.length, addStars, recordAttempt, fullPhrase, flashWrong],
  );

  // Keyboard: number keys pick from the current step's tiles.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!q || done) return;
      const options = phase === 'number' ? q.numberOptions : q.nounOptions;
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= options.length) {
        if (phase === 'number') chooseNumber(options[n - 1]);
        else chooseNoun(options[n - 1]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, done, phase, chooseNumber, chooseNoun]);

  function restart() {
    setIndex(0);
    setPhase('number');
    setPickedNumber(null);
    setPickedNoun(null);
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
  if (!q) return null;

  const options = phase === 'number' ? q.numberOptions : q.nounOptions;

  return (
    <section className="screen activity">
      <ActivityHeader
        title="Laske ja sano"
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <p className="prompt">
        {phase === 'number' ? 'Montako?' : 'Mikä eläin?'}{' '}
        <span className="en">{phase === 'number' ? 'How many?' : 'Which animal?'}</span>
      </p>

      <div className="count-scene" aria-label={`${count} ${q.noun.en}`}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className="count-emoji" aria-hidden="true">
            {q.noun.emoji}
          </span>
        ))}
      </div>

      <div className="phrase-line phrase-line--count">
        <span className={'phrase-slot' + (pickedNumber ? ' phrase-slot--filled' : '')}>
          {pickedNumber ? pickedNumber.fi : '​'}
        </span>
        <span className={'phrase-slot' + (pickedNoun ? ' phrase-slot--filled' : '')}>
          {pickedNoun ? countingNounForm(pickedNoun, count) : '​'}
        </span>
      </div>

      <div className="word-tiles">
        {options.map((opt, i) => (
          <button
            key={opt.id}
            className={'word-tile' + (wrongId === opt.id ? ' word-tile--wrong' : '')}
            onClick={() => (phase === 'number' ? chooseNumber(opt) : chooseNoun(opt))}
            disabled={locked}
          >
            <span className="word-tile__num">{i + 1}</span>
            {phase === 'number' ? opt.fi : countingNounForm(opt, count)}
          </button>
        ))}
      </div>
    </section>
  );
}
