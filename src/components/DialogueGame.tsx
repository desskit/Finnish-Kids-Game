import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor, showsGloss } from '../game/adapt';
import { buildDialogueRound, type DialogueQuestion } from '../game/round';
import { dialogues } from '../content/dialogues';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';

const QUESTIONS = 6;

interface Props {
  onExit: () => void;
}

// Keskustelu (conversations): hear/read the other speaker's Finnish line, tap
// the appropriate reply. The Finnish prompt is played aloud (it's the input to
// understand); the reply tiles show Finnish + English. Distractors are correct
// Finnish for other moments, so the child practices what to SAY BACK, not
// spotting broken grammar. No SRS crediting — replies are set phrases, not
// single lexical items (like the multi-slot sentence game).
export default function DialogueGame({ onExit }: Props) {
  const { level, addStars, activeChild } = useProfile();
  const ctx = useActivityContext();
  const difficulty = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  const { optionCount, maxTier } = difficulty;
  // Top rung: drop the English so it's Finnish-only comprehension.
  const glossed = showsGloss(difficulty.level);
  const childName = activeChild?.name ?? '';

  const missed = useRef(false);
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo<DialogueQuestion[]>(
    // `roundQuestions` (Audit harness) caps the round to stop after each answer.
    () =>
      buildDialogueRound(dialogues, QUESTIONS, optionCount, maxTier, childName).slice(
        0,
        ctx?.roundQuestions,
      ),
    [optionCount, maxTier, childName, runId, ctx?.roundQuestions],
  );

  const [index, setIndex] = useState(0);
  const [wrongFi, setWrongFi] = useState<string | null>(null);
  const [chosenFi, setChosenFi] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const q = round[index];

  // Play the other speaker's Finnish line when a new exchange appears — it's the
  // input the child responds to.
  useEffect(() => {
    if (!q || done) return;
    const t = setTimeout(() => speak(q.prompt.fi), 400);
    return () => clearTimeout(t);
  }, [q, done]);

  const choose = useCallback(
    (fi: string) => {
      if (!q || locked || done) return;
      if (fi === q.reply.fi) {
        setLocked(true);
        setChosenFi(fi);
        playDing(true);
        speak(q.reply.fi); // hear the correct reply spoken
        addStars(1);
        if (!missed.current) firstTries.current += 1;
        setWrongFi(null);
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else {
            setIndex(next);
            setChosenFi(null);
          }
          missed.current = false;
          setLocked(false);
        }, 1200);
      } else {
        missed.current = true;
        playDing(false);
        setWrongFi(fi);
        setTimeout(() => setWrongFi((cur) => (cur === fi ? null : cur)), 600);
      }
    },
    [q, locked, done, index, round.length, addStars],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!q || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speak(q.prompt.fi);
        return;
      }
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= q.options.length) choose(q.options[n - 1].fi);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, done, choose]);

  function restart() {
    setIndex(0);
    setWrongFi(null);
    setChosenFi(null);
    setLocked(false);
    setDone(false);
    missed.current = false;
    firstTries.current = 0;
    setRunId((r) => r + 1);
  }

  useSegmentComplete(done, firstTries.current, round.length, restart);

  if (done) return null;
  if (!q) return null;

  return (
    <section className="screen activity">
      <ActivityHeader
        title="Keskustelu · Conversation"
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <p className="prompt">
        Mitä vastaat? <span className="en">What do you reply?</span>
      </p>

      <div className="phrase-card dialogue-prompt">
        <p className="dialogue-said">{q.prompt.fi}</p>
        {glossed && <p className="en phrase-hint">{q.prompt.en}</p>}
        <button
          className="speaker speaker--inline"
          onClick={() => speak(q.prompt.fi)}
          aria-label="Hear it again"
        >
          🔊 <span className="en">Listen</span>
        </button>
      </div>

      <div className="reply-tiles">
        {q.options.map((opt, i) => (
          <button
            key={opt.fi}
            className={
              'reply-tile' +
              (wrongFi === opt.fi ? ' reply-tile--wrong' : '') +
              (locked && opt.fi === chosenFi ? ' reply-tile--correct' : '')
            }
            onClick={() => choose(opt.fi)}
            disabled={locked}
          >
            <span className="reply-tile__num">{i + 1}</span>
            <span className="reply-tile__fi">{opt.fi}</span>
            {/* No English on the reply tiles: the child chooses from the Finnish
                itself (the prompt is still glossed), so it's a real comprehension
                choice, not translation-matching. */}
          </button>
        ))}
      </div>
    </section>
  );
}
