import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LexicalItem } from '../content/types';
import type { SkillNode } from '../game/path';
import { buildSoundRound, soundWords } from '../game/soundGames';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { useProfile } from '../state/profile';
import { useCanHearFinnish } from '../audio/voices';
import SoundRound from './SoundRound';
import ActivityHeader from './ActivityHeader';
import Art from '../art/Art';

const QUESTIONS = 6;
/** Fewer usable words than this in the step's own pool: draw from every sound word. */
const MIN_WORDS = 8;

// A Finnish-sounds step in the course (a bonus step: game/path.tsx
// SOUND_STEPS) — the Alphabet corner's game on the words met so far. It needs
// a Finnish voice: without one it says so and lets the child go on.
export default function SoundStep({ step, items, onExit }: { step: SkillNode; items: LexicalItem[]; onExit: () => void }) {
  const navigate = useNavigate();
  const ctx = useActivityContext();
  const { settings, addStars, markExtraSeen } = useProfile();
  const canHear = useCanHearFinnish(!!settings.muted);
  const sound = step.content.sound ?? { mode: 'length' as const };

  // Offered once: Continue moves past it from now on (game/course.ts). (Once
  // per step: the profile's functions change with every save.)
  const marked = useRef('');
  useEffect(() => {
    if (marked.current === step.id) return;
    marked.current = step.id;
    markExtraSeen(step.id);
  }, [step.id, markExtraSeen]);

  const words = useMemo(() => {
    const ok = new Set(soundWords().map((w) => w.id));
    const own = items.filter((w) => ok.has(w.id));
    const pool = own.length >= MIN_WORDS ? own : soundWords();
    return sound.letters ? pool.filter((w) => sound.letters!.includes(w.fi[0])) : pool;
  }, [items, sound.letters]);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    () => buildSoundRound(sound.mode, words, QUESTIONS, 3).slice(0, ctx?.roundQuestions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sound.mode, words, runId, ctx?.roundQuestions],
  );
  const [result, setResult] = useState<{ right: number; total: number } | null>(null);
  const restart = useCallback(() => {
    setResult(null);
    setRunId((r) => r + 1);
  }, []);
  useSegmentComplete(!!result, result?.right ?? 0, result?.total ?? 0, restart);

  if (!canHear) {
    return (
      <section className="screen activity">
        <ActivityHeader title={step.titleFi} index={0} total={1} onExit={onExit} />
        <p className="silent-text" role="status">
          <Art glyph="🔇" /> <span className="en">This game is for hearing Finnish — it needs sound and a Finnish voice.</span>
        </p>
        <button className="btn btn--primary" onClick={() => navigate('/next')} autoFocus>
          Jatka <span className="en">Continue</span>
        </button>
      </section>
    );
  }
  if (result) return null;
  return (
    <SoundRound
      key={runId}
      round={round}
      title={step.titleFi}
      stars={ctx?.sessionStars}
      onExit={onExit}
      onRight={() => addStars(1)}
      onFinish={(right, total) => setResult({ right, total })}
    />
  );
}
