import { useEffect } from 'react';
import type { DialogueLine } from '../content/dialogues';
import { speak } from '../audio/speak';

interface Props {
  prompt: DialogueLine;
  reply: DialogueLine;
  onContinue: () => void;
}

// "Show it before you ask it" for set phrases: the first time a greeting pair
// comes up, the child SEES and HEARS what is said and what comes back — "Kun
// joku sanoo… / Sinä vastaat…" — before being asked to pick the reply. A reply
// like "Ei se mitään" can't be worked out from grammar; it has to be modelled.
// Nothing is graded here (same contract as WordIntro). Content only — the host
// game keeps its own frame.
export default function PhraseIntro({ prompt, reply, onContinue }: Props) {
  useEffect(() => {
    const t = setTimeout(() => {
      speak(prompt.fi, { queue: true });
      speak(reply.fi, { queue: true });
    }, 300);
    return () => clearTimeout(t);
  }, [prompt, reply]);

  return (
    <>
      <p className="prompt">
        Uusi fraasi! <span className="en">New phrase!</span>
      </p>

      <div className="phrase-card phrase-intro">
        <p className="phrase-intro__label en">When someone says…</p>
        <p className="phrase-intro__fi" lang="fi">
          {prompt.fi}
        </p>
        <p className="en phrase-hint">{prompt.en}</p>
        <button className="speaker speaker--inline" onClick={() => speak(prompt.fi)} aria-label="Hear what they say">
          🔊 <span className="en">Listen</span>
        </button>

        <p className="phrase-intro__arrow" aria-hidden="true">
          ↓
        </p>

        <p className="phrase-intro__label en">…you say back:</p>
        <p className="phrase-intro__fi phrase-intro__fi--reply" lang="fi">
          {reply.fi}
        </p>
        <p className="en phrase-hint">{reply.en}</p>
        <button className="speaker speaker--inline" onClick={() => speak(reply.fi)} aria-label="Hear what you say">
          🔊 <span className="en">Listen</span>
        </button>
      </div>

      <button className="btn btn--primary" onClick={onContinue} autoFocus>
        Jatka <span className="en">Continue</span>
      </button>
    </>
  );
}
