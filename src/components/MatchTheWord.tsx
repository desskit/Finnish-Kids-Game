import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LexicalItem } from '../content/types';
import { agreementPhrase } from '../content';
import { useProfile } from '../state/profile';
import { buildAgreementRound, type AgreementOption } from '../game/round';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';
import RoundComplete from './RoundComplete';

const QUESTIONS = 6;

interface Props {
  adjectives: LexicalItem[];
  nouns: LexicalItem[];
  onExit: () => void;
}

// Match the Words (two-slot agreement): the adjective is shown in some case
// (the context, e.g. "isossa"); pick the noun form that AGREES — same case
// ending ("kissassa"). Distractors are the same noun in OTHER cases, so the
// skill practised is the agreement itself. Every form is looked up from the
// sourced inflection tables via buildAgreementRound — never generated.
export default function MatchTheWord({ adjectives, nouns, onExit }: Props) {
  const { level, addStars } = useProfile();
  const optionCount = level >= 2 ? 4 : 3;

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    () => buildAgreementRound(adjectives, nouns, QUESTIONS, optionCount),
    [adjectives, nouns, optionCount, runId],
  );

  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [chosen, setChosen] = useState<AgreementOption | null>(null);
  const [wrongForm, setWrongForm] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const q = round[index];
  const fullPhrase = q
    ? agreementPhrase(q.adjective, q.noun, q.case, q.number) ?? `${q.adjForm} ${q.answer}`
    : '';

  // Say the adjective context out loud when a new question appears.
  useEffect(() => {
    if (!q || done) return;
    const t = setTimeout(() => speak(q.adjForm), 400);
    return () => clearTimeout(t);
  }, [q, done]);

  const choose = useCallback(
    (opt: AgreementOption) => {
      if (!q || locked || done) return;
      if (opt.correct) {
        setLocked(true);
        setChosen(opt);
        playDing(true);
        speak(fullPhrase);
        setStars((s) => s + 1);
        addStars(1);
        setWrongForm(null);
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else {
            setIndex(next);
            setChosen(null);
          }
          setLocked(false);
        }, 1200);
      } else {
        playDing(false);
        setWrongForm(opt.form);
        setTimeout(() => setWrongForm((cur) => (cur === opt.form ? null : cur)), 600);
      }
    },
    [q, locked, done, index, round.length, addStars, fullPhrase],
  );

  // Keyboard: number keys pick a tile; Space/Enter replays the prompt.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!q || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speak(chosen ? fullPhrase : q.adjForm);
        return;
      }
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= q.options.length) choose(q.options[n - 1]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, done, chosen, fullPhrase, choose]);

  function restart() {
    setIndex(0);
    setStars(0);
    setChosen(null);
    setWrongForm(null);
    setLocked(false);
    setDone(false);
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
        title="Yhdistä sanat"
        index={index}
        total={round.length}
        onExit={onExit}
      />

      <p className="prompt">
        Mikä sopii yhteen?{' '}
        <span className="en">Pick the word with the matching ending</span>
      </p>

      <div className="phrase-card">
        <span className="phrase-emoji" aria-hidden="true">
          {q.noun.emoji}
        </span>
        <div className="phrase-line">
          <span className="phrase-fixed">{q.adjForm}</span>
          <span className={'phrase-slot' + (chosen ? ' phrase-slot--filled' : '')}>
            {chosen ? chosen.form : '​'}
          </span>
        </div>
        <p className="en phrase-hint">
          {q.adjective.en} {q.noun.en}
        </p>
        <button
          className="speaker speaker--inline"
          onClick={() => speak(chosen ? fullPhrase : q.adjForm)}
          aria-label="Hear it again"
        >
          🔊 <span className="en">Listen</span>
        </button>
      </div>

      <div className="word-tiles">
        {q.options.map((opt, i) => (
          <button
            key={opt.caseId}
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
