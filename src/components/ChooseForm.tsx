import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor, showsGloss } from '../game/adapt';
import { buildChooseRound, type ChooseMode, type ChoosePools } from '../game/formChoice';
import { speak, speakEnglish } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';
import WhyTip from './WhyTip';

const QUESTIONS = 6;

const TITLES: Record<ChooseMode, { fi: string; en: string; prompt: string; promptEn: string }> = {
  answer: { fi: 'Vastaa', en: 'Answer it', prompt: 'Mitä vastaat?', promptEn: 'What do you answer?' },
  ask: { fi: 'Kysy', en: 'Ask it', prompt: 'Miten kysyt?', promptEn: 'How do you ask?' },
  mood: { fi: 'Tee! Älä!', en: "Do, don't, let's", prompt: 'Mitä sanot?', promptEn: 'What do you say?' },
  pronoun: { fi: 'Minua, minulle', en: 'Me and you', prompt: 'Kumpi on oikein?', promptEn: 'Which one is right?' },
  owner: { fi: 'Kenen?', en: 'Whose is it?', prompt: 'Kenen se on?', promptEn: 'Which one is it?' },
  degree: { fi: 'Iso, isompi, isoin', en: 'Big, bigger, biggest', prompt: 'Mikä sana?', promptEn: 'Which word is it?' },
  compare: { fi: 'Kumpi?', en: 'Which is more?', prompt: 'Mikä on totta?', promptEn: 'Which one is true?' },
  superlative: { fi: 'Kuka voittaa?', en: 'Who wins?', prompt: 'Mikä on totta?', promptEn: 'Which one is true?' },
  ordinal: { fi: 'Kolme vai kolmas?', en: 'Three or third?', prompt: 'Mikä sana?', promptEn: 'Which word is it?' },
  date: { fi: 'Päivämäärä', en: 'Dates', prompt: 'Miten sanot?', promptEn: 'How do you say it?' },
  age: { fi: 'Kuinka vanha?', en: 'How old?', prompt: 'Miten sanot?', promptEn: 'How do you say it?' },
  'verb-type': { fi: 'Mikä tyyppi?', en: 'Which type?', prompt: 'Mikä verbityyppi?', promptEn: 'Which verb type is it?' },
  'verb-case': { fi: 'Mikä pääte?', en: 'Which ending?', prompt: 'Mikä on oikein?', promptEn: 'Look at the verb: which ending?' },
};

interface Props extends ChoosePools {
  mode: ChooseMode;
  onExit: () => void;
}

// Valitse oikea muoto — the same word(s) in a few real forms; pick the one this
// moment needs (see game/formChoice.ts). Someone's Finnish line (a question) is
// read aloud; the English task is narrated; a wrong pick shows the "Why?" rule.
export default function ChooseForm({
  mode,
  verbs,
  owners,
  things,
  types,
  adjectives,
  known,
  numbers,
  ordinals,
  months,
  constructions,
  items,
  onExit,
}: Props) {
  const { level, addStars } = useProfile();
  const ctx = useActivityContext();
  const difficulty = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  const { optionCount } = difficulty;
  const glossed = showsGloss(difficulty.level);
  const t = TITLES[mode];

  const missed = useRef(false);
  const firstTries = useRef(0);
  const [runId, setRunId] = useState(0);
  const round = useMemo(
    () =>
      buildChooseRound(
        mode,
        { verbs, owners, things, types, adjectives, known, numbers, ordinals, months, constructions, items },
        QUESTIONS,
        Math.max(3, optionCount),
      ).slice(0, ctx?.roundQuestions),
    [mode, verbs, owners, things, types, adjectives, known, numbers, ordinals, months, constructions, items, optionCount, runId, ctx?.roundQuestions],
  );

  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const [whyAt, setWhyAt] = useState(-1);
  // The wrong option picked last — its own "Why?" (what that choice means).
  const [whyPick, setWhyPick] = useState<string | null>(null);

  // Never stall on an empty round (a pool too small to ask anything).
  useEffect(() => {
    if (round.length === 0) setDone(true);
  }, [round.length]);

  const q = round[index];

  // Read out what was SAID (Finnish), or narrate the English task.
  useEffect(() => {
    if (!q || done) return;
    const timer = setTimeout(() => (q.said ? speak(q.said.fi) : speakEnglish(q.cue)), 350);
    return () => clearTimeout(timer);
  }, [q, done]);

  const choose = useCallback(
    (form: string) => {
      if (!q || locked || done) return;
      if (form === q.answer) {
        setLocked(true);
        playDing(true);
        speak(q.spoken ?? q.answer);
        addStars(1);
        if (!missed.current) firstTries.current += 1;
        setWrong(null);
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else setIndex(next);
          missed.current = false;
          setLocked(false);
        }, 900);
      } else {
        missed.current = true;
        setWhyAt(index);
        setWhyPick(form);
        playDing(false);
        setWrong(form);
        setTimeout(() => setWrong((cur) => (cur === form ? null : cur)), 600);
      }
    },
    [q, locked, done, index, round.length, addStars],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!q || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (q.said) speak(q.said.fi);
        else speakEnglish(q.cue);
        return;
      }
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= q.options.length) choose(q.options[n - 1]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, done, choose]);

  function restart() {
    setIndex(0);
    setWrong(null);
    setLocked(false);
    setDone(false);
    setWhyAt(-1);
    setWhyPick(null);
    missed.current = false;
    firstTries.current = 0;
    setRunId((r) => r + 1);
  }

  useSegmentComplete(done, firstTries.current, round.length, restart);

  if (done || !q) return null;

  return (
    <section className="screen activity">
      <ActivityHeader
        title={`${t.fi} · ${t.en}`}
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <p className="prompt">
        {t.prompt} <span className="en">{t.promptEn}</span>
      </p>

      <div className="phrase-card">
        {q.emoji && (
          <span className="phrase-emoji" aria-hidden="true">
            {q.emoji}
          </span>
        )}
        {q.said && (
          <>
            <p className="dialogue-said" lang="fi">
              {q.said.fi}
            </p>
            {glossed && <p className="en phrase-hint">{q.said.en}</p>}
          </>
        )}
        <p className="choose-cue">{q.cue}</p>
        <button
          className="speaker speaker--inline"
          onClick={() => (q.said ? speak(q.said.fi) : speakEnglish(q.cue))}
          aria-label="Hear it again"
        >
          🔊 <span className="en">Listen</span>
        </button>
      </div>

      <div className="word-tiles">
        {q.options.map((form, i) => (
          <button
            key={form}
            className={
              'word-tile' +
              (wrong === form ? ' word-tile--wrong' : '') +
              (locked && form === q.answer ? ' word-tile--correct' : '')
            }
            onClick={() => choose(form)}
            disabled={locked}
            lang="fi"
          >
            <span className="word-tile__num">{i + 1}</span>
            {form}
          </button>
        ))}
      </div>
      {whyAt === index && <WhyTip why={(whyPick && q.whyFor?.[whyPick]) || q.why} />}
    </section>
  );
}
