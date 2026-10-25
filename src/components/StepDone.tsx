import { useEffect } from 'react';
import type { Advance } from '../game/autoAdvance';
import Art from '../art/Art';

/** How long the "step done" card shows before play goes on by itself. */
export const STEP_DONE_MS = 2500;

// A step just finished: a moment to celebrate, then straight on to what the
// course offers next (game/autoAdvance.ts) — no trip home to tap Continue.
// "Jatka" goes on at once.
export default function StepDone({ next, onGo }: { next: Advance; onGo: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onGo, STEP_DONE_MS);
    return () => window.clearTimeout(t);
  }, [onGo]);

  return (
    <section className="screen checkpoint checkpoint--pass step-done" aria-live="polite">
      <div className="checkpoint__badge" aria-hidden="true">
        <Art glyph="🌟" motion="loop" />
      </div>
      <h1 className="title">
        Hienoa! <span className="en">Step done!</span>
      </h1>
      <p className="checkpoint__text">
        <span className="en">Next:</span> {next.titleFi} <span className="en">{next.titleEn}</span>
      </p>
      <div className="button-row">
        <button className="btn btn--primary" onClick={onGo} autoFocus>
          Jatka <span className="en">Keep going</span>
        </button>
      </div>
    </section>
  );
}
