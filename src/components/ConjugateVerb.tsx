import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LexicalItem } from '../content/types';
import { useProfile } from '../state/profile';
import { useActivityContext } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { buildConjugationRound, type ConjugationOption } from '../game/round';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';
import RoundComplete from './RoundComplete';

const QUESTIONS = 6;

interface Props {
  verbs: LexicalItem[];
  onExit: () => void;
}

// Conjugate the Verb (Tier 3): hear a pronoun + see a verb, pick the form that
// agrees with the person (minä syön / hän syö). Distractors are the same verb
// in other persons, so the skill drilled is the personal ending itself. Every
// form is looked up from the sourced inflection tables via
// buildConjugationRound — never generated.
export default function ConjugateVerb({ verbs, onExit }: Props) {
  const { level, addStars, recordAttempt } = useProfile();
  const ctx = useActivityContext();
  // Higher levels add more tiles AND harder verb forms: present positive →
  // + present negative → + past. All forms are sourced, never generated.
  const { optionCount, verbCombos } = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);

  // A wrong tap means this verb wasn't a first-try success (for SRS).
  const missed = useRef(false);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    () => buildConjugationRound(verbs, QUESTIONS, optionCount, verbCombos),
    [verbs, optionCount, verbCombos, runId],
  );

  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [chosen, setChosen] = useState<ConjugationOption | null>(null);
  const [wrongForm, setWrongForm] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const q = round[index];

  // Say the pronoun prompt out loud when a new question appears.
  useEffect(() => {
    if (!q || done) return;
    const t = setTimeout(() => speak(q.pronoun), 400);
    return () => clearTimeout(t);
  }, [q, done]);

  const choose = useCallback(
    (opt: ConjugationOption) => {
      if (!q || locked || done) return;
      if (opt.correct) {
        setLocked(true);
        setChosen(opt);
        playDing(true);
        speak(q.clause);
        setStars((s) => s + 1);
        addStars(1);
        recordAttempt(q.verb.id, !missed.current);
        setWrongForm(null);
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else {
            setIndex(next);
            setChosen(null);
          }
          missed.current = false;
          setLocked(false);
        }, 1200);
      } else {
        missed.current = true;
        playDing(false);
        setWrongForm(opt.form);
        setTimeout(() => setWrongForm((cur) => (cur === opt.form ? null : cur)), 600);
      }
    },
    [q, locked, done, index, round.length, addStars, recordAttempt],
  );

  // Keyboard: number keys pick a tile; Space/Enter replays the prompt.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!q || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speak(chosen ? q.clause : q.pronoun);
        return;
      }
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= q.options.length) choose(q.options[n - 1]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, done, chosen, choose]);

  function restart() {
    setIndex(0);
    setStars(0);
    setChosen(null);
    setWrongForm(null);
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

  return (
    <section className="screen activity">
      <ActivityHeader
        title="Taivuta verbi"
        index={index}
        total={round.length}
        onExit={onExit}
      />

      <p className="prompt">
        Kuka tekee? <span className="en">Who's doing it?</span>
      </p>

      <div className="phrase-card">
        <div className="phrase-line">
          <span className="phrase-fixed">{q.pronoun}</span>
          <span className={'phrase-slot' + (chosen ? ' phrase-slot--filled' : '')}>
            {chosen ? chosen.form : '​'}
          </span>
        </div>
        <p className="en phrase-hint">
          {q.pronounEn} {q.verb.en}
        </p>
        <button
          className="speaker speaker--inline"
          onClick={() => speak(chosen ? q.clause : q.pronoun)}
          aria-label="Hear it again"
        >
          🔊 <span className="en">Listen</span>
        </button>
      </div>

      <div className="word-tiles">
        {q.options.map((opt, i) => (
          <button
            key={opt.person}
            className={'word-tile' + (wrongForm === opt.form ? ' word-tile--wrong' : '')}
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
