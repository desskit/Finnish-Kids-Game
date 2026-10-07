import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Construction, LexicalItem } from '../content/types';
import { englishSentenceFor, formFor, sentenceFor } from '../content';
import { glossFor } from '../content/types';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { familiarityWeigher, grammarSrsId } from '../game/srs';
import { buildPhraseRound } from '../game/round';
import { speak, speakEnglish } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';
import WhyTip from './WhyTip';
import { whyForPhrasePick } from '../content/why';

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
  // Harder levels add more options AND unlock higher-tier carrier phrases; the
  // expert band (L9+) swaps word tiles for CASE-FORM tiles and drops the gloss.
  const { optionCount, maxTier, tricky, formDistractors, drillGlossFree } =
    ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  // Familiarity bias, snapshotted once per mount (see ListenAndTap).
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;

  // Tracks a wrong tap on the current question, so SRS only credits a first-try
  // correct answer.
  const missed = useRef(false);
  // First-try successes this segment — the real accuracy for the adaptive engine.
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    // `roundQuestions` (Audit harness) caps the round to stop after each answer.
    () =>
      buildPhraseRound(
        items,
        constructions,
        QUESTIONS,
        optionCount,
        maxTier,
        tricky,
        weigh,
        formDistractors,
      ).slice(0, ctx?.roundQuestions),
    [items, constructions, optionCount, maxTier, tricky, formDistractors, weigh, runId, ctx?.roundQuestions],
  );

  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<LexicalItem | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [wrongForm, setWrongForm] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const question = round[index];
  // The question a wrong tap happened on — its "Why?" tip shows until it advances.
  const [whyAt, setWhyAt] = useState(-1);
  // What the child picked last (another word, or another form of the word).
  const [whyPick, setWhyPick] = useState<{ item?: LexicalItem; form?: string }>({});

  // Gloss-free (L9+) needs a picture to stand in for the English — a word with
  // no single picture keeps its English, or the question would be unreadable.
  const glossFree = drillGlossFree && !!question?.item.emoji;

  const fullSentence = question ? sentenceFor(question.item, question.construction) : '';
  const englishPrompt = question ? englishSentenceFor(question.item, question.construction) : '';

  // No FINNISH before an answer: reading the target phrase aloud would hand
  // the child the completing word for free. The ENGLISH prompt, though, is
  // narrated up front — it's just the on-screen gloss read aloud for a
  // pre-reader, and never previews the Finnish. Finnish is spoken once they
  // choose correctly, below. Gloss-free expert band: no English at all — the
  // picture + carrier ARE the prompt.
  useEffect(() => {
    if (!question || done || glossFree) return;
    const t = setTimeout(() => speakEnglish(englishPrompt), 350);
    return () => clearTimeout(t);
  }, [question, done, englishPrompt, glossFree]);

  // Shared success/advance path for both tile modes.
  const succeed = useCallback(() => {
    if (!question) return;
    setLocked(true);
    setChosen(question.item);
    playDing(true);
    speak(fullSentence);
    addStars(1);
    recordAttempt(question.item.id, !missed.current);
    // The GRAMMAR gets its own spaced schedule too: the construction just
    // exercised comes due for review like a word does (see ReviewActivity).
    recordAttempt(grammarSrsId(question.construction.id), !missed.current);
    if (!missed.current) firstTries.current += 1;
    setWrongId(null);
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
    }, 1100);
  }, [question, index, round.length, addStars, recordAttempt, fullSentence]);

  const choose = useCallback(
    (item: LexicalItem) => {
      if (!question || locked || done) return;
      if (item.id === question.item.id) {
        succeed();
      } else {
        missed.current = true;
        setWhyAt(index);
        playDing(false);
        setWrongId(item.id);
        setWhyPick({ item });
        setTimeout(() => setWrongId((cur) => (cur === item.id ? null : cur)), 600);
      }
    },
    [question, locked, done, succeed, index],
  );

  // Expert mode: the tiles are case FORMS of the same word — correct means the
  // one form whose ending fits the carrier.
  const chooseForm = useCallback(
    (form: string) => {
      if (!question || locked || done) return;
      if (form === formFor(question.item, question.construction)) {
        succeed();
      } else {
        missed.current = true;
        setWhyAt(index);
        playDing(false);
        setWrongForm(form);
        setWhyPick({ form });
        setTimeout(() => setWrongForm((cur) => (cur === form ? null : cur)), 600);
      }
    },
    [question, locked, done, succeed, index],
  );

  // Replay: English before an answer (a missed auto-play shouldn't be a dead
  // end), Finnish once answered correctly. Never Finnish before that — and in
  // the gloss-free band, no English either (nothing to replay pre-answer).
  const replay = useCallback(() => {
    if (chosen) speak(fullSentence);
    else if (!glossFree) speakEnglish(englishPrompt);
  }, [chosen, fullSentence, englishPrompt, glossFree]);

  // Keyboard: number keys pick a tile (word or form); Space/Enter replays.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!question || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        replay();
        return;
      }
      const n = Number.parseInt(e.key, 10);
      if (question.formOptions) {
        if (n >= 1 && n <= question.formOptions.length) chooseForm(question.formOptions[n - 1]);
      } else if (n >= 1 && n <= question.options.length) {
        choose(question.options[n - 1]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, done, choose, chooseForm, replay]);

  function restart() {
    setIndex(0);
    setChosen(null);
    setWrongId(null);
    setWrongForm(null);
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

      {glossFree ? (
        // Expert band: no English anywhere — the picture + carrier are the
        // whole prompt, and (in form mode) the ENDING is the question.
        <p className="prompt">Täydennä lause</p>
      ) : (
        <p className="prompt">
          {construction.en} <span className="en">{glossFor(item, construction)}</span>
        </p>
      )}

      <div className="phrase-card">
        {item.emoji && (
          <span className="phrase-emoji" aria-hidden="true">
            {item.emoji}
          </span>
        )}
        <div className="phrase-line">
          {construction.before && <span className="phrase-fixed">{construction.before}</span>}
          <span className={'phrase-slot' + (chosenForm ? ' phrase-slot--filled' : '')}>
            {chosenForm ?? '​'}
          </span>
          {construction.after && <span className="phrase-fixed">{construction.after}</span>}
          {construction.punct && <span className="phrase-fixed">{construction.punct}</span>}
        </div>
        {(chosen || !glossFree) && (
          <button
            className="speaker speaker--inline"
            onClick={replay}
            aria-label={chosen ? 'Hear the sentence again' : 'Hear the prompt again'}
          >
            🔊 <span className="en">Listen</span>
          </button>
        )}
      </div>

      {question.formOptions ? (
        // Expert tiles: the SAME word across sourced cases — pick the ending
        // the carrier requires.
        <div className="word-tiles">
          {question.formOptions.map((form, i) => (
            <button
              key={form}
              className={
                'word-tile' +
                (wrongForm === form ? ' word-tile--wrong' : '') +
                (locked && form === formFor(item, construction) ? ' word-tile--correct' : '')
              }
              onClick={() => chooseForm(form)}
              disabled={locked}
            >
              <span className="word-tile__num">{i + 1}</span>
              {form}
            </button>
          ))}
        </div>
      ) : (
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
      )}
      {whyAt === index && question && (
        <WhyTip why={whyForPhrasePick(question.construction, question.item, whyPick)} />
      )}
    </section>
  );
}
