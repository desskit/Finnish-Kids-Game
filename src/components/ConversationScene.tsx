import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { buildConversation, type ConversationRound } from '../game/round';
import { conversations } from '../content/conversations';
import type { DialogueLine } from '../content/dialogues';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';

interface Props {
  onExit: () => void;
}

// Jutellaan (small talk): hold a short, multi-turn Finnish conversation. The
// partner speaks (bubble + TTS); the child taps the fitting reply; correct
// replies build the chat downward until the scene finishes with a little payoff.
// A fixed golden path — wrong picks just nudge and let the child retry, so the
// conversation always reaches its end. No SRS crediting (set phrases, like the
// single-turn greetings game); first-try accuracy still feeds the adaptive engine.
export default function ConversationScene({ onExit }: Props) {
  const { level, activeChild, addStars } = useProfile();
  const avatar = activeChild?.avatar;
  const ctx = useActivityContext();
  const { optionCount, maxTier } = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);

  const missedTurn = useRef(false);
  const firstTries = useRef(0);
  const spokenFor = useRef(-1);

  const [runId, setRunId] = useState(0);
  const scene = useMemo<ConversationRound | null>(
    () => buildConversation(conversations, optionCount, maxTier),
    [optionCount, maxTier, runId],
  );

  const [turnIndex, setTurnIndex] = useState(0);
  const [answered, setAnswered] = useState<DialogueLine[]>([]);
  const [wrongFi, setWrongFi] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(false); // transcript payoff before done
  const [done, setDone] = useState(false);

  const turn = scene?.turns[turnIndex];

  // Speak the partner's line when a new turn is reached (guard so it plays once
  // per turn even if the effect re-runs).
  useEffect(() => {
    if (!turn || done || finished) return;
    if (spokenFor.current === turnIndex) return;
    spokenFor.current = turnIndex;
    // Queue so a still-playing reply from the previous turn finishes first
    // (each TTS line completes before the next begins).
    const t = setTimeout(() => speak(turn.partner.fi, { queue: true }), 400);
    return () => clearTimeout(t);
  }, [turn, turnIndex, done, finished]);

  const choose = useCallback(
    (fi: string) => {
      if (!scene || !turn || locked || done || finished) return;
      if (fi !== turn.reply.fi) {
        missedTurn.current = true;
        playDing(false);
        setWrongFi(fi);
        setTimeout(() => setWrongFi((cur) => (cur === fi ? null : cur)), 600);
        return;
      }
      setLocked(true);
      playDing(true);
      // Queue after the partner line, then the next turn's partner queues after
      // this — so the exchange is heard in order, not overlapping.
      speak(turn.reply.fi, { queue: true });
      addStars(1);
      if (!missedTurn.current) firstTries.current += 1;
      setAnswered((prev) => [...prev, turn.reply]);
      const last = turnIndex + 1 >= scene.turns.length;
      setTimeout(() => {
        missedTurn.current = false;
        setLocked(false);
        if (last) {
          setFinished(true); // hold the full transcript a beat, then hand off
          setTimeout(() => setDone(true), 1500);
        } else {
          setTurnIndex((i) => i + 1);
        }
      }, 900);
    },
    [scene, turn, locked, done, finished, turnIndex, addStars],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!turn || done || finished) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speak(turn.partner.fi);
        return;
      }
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= turn.options.length) choose(turn.options[n - 1].fi);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turn, done, finished, choose]);

  function restart() {
    setTurnIndex(0);
    setAnswered([]);
    setWrongFi(null);
    setLocked(false);
    setFinished(false);
    setDone(false);
    missedTurn.current = false;
    firstTries.current = 0;
    spokenFor.current = -1;
    setRunId((r) => r + 1);
  }

  const total = scene?.turns.length ?? 0;
  useSegmentComplete(done, firstTries.current, total, restart);

  if (done || !scene) return null;

  return (
    <section className="screen activity">
      <ActivityHeader
        title={`${scene.titleFi} · ${scene.titleEn}`}
        index={Math.min(turnIndex + (finished ? 1 : 0), total)}
        total={total}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <div className="chat" aria-label="Conversation">
        {scene.turns.slice(0, turnIndex + 1).map((t, i) => (
          <div className="chat-row" key={i}>
            <div className="chat-bubble chat-bubble--partner">
              <span className="chat-avatar" aria-hidden="true">
                {scene.partnerIcon}
              </span>
              <span className="chat-lines">
                <span className="chat-fi">{t.partner.fi}</span>
                <span className="en chat-en">{t.partner.en}</span>
              </span>
              {i === turnIndex && !finished && (
                <button
                  className="speaker speaker--inline chat-speaker"
                  onClick={() => speak(t.partner.fi)}
                  aria-label="Hear it again"
                >
                  🔊
                </button>
              )}
            </div>
            {answered[i] && (
              <div className="chat-bubble chat-bubble--child">
                <span className="chat-lines">
                  <span className="chat-fi">{answered[i].fi}</span>
                  <span className="en chat-en">{answered[i].en}</span>
                </span>
                <span className="chat-avatar" aria-hidden="true">
                  {avatar || '🙂'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {finished ? (
        <p className="chat-done" role="status">
          🎉 Hienoa, juttelit suomeksi! <span className="en">You had a conversation!</span>
        </p>
      ) : (
        turn && (
          <>
            <p className="prompt">
              Mitä vastaat? <span className="en">What do you reply?</span>
            </p>
            <div className="reply-tiles">
              {turn.options.map((opt, i) => (
                <button
                  key={opt.fi}
                  className={'reply-tile' + (wrongFi === opt.fi ? ' reply-tile--wrong' : '')}
                  onClick={() => choose(opt.fi)}
                  disabled={locked}
                >
                  <span className="reply-tile__num">{i + 1}</span>
                  <span className="reply-tile__fi">{opt.fi}</span>
                  <span className="en reply-tile__en">{opt.en}</span>
                </button>
              ))}
            </div>
          </>
        )
      )}
    </section>
  );
}
