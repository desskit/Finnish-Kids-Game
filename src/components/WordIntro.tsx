import { useEffect } from 'react';
import type { LexicalItem } from '../content/types';
import { speak } from '../audio/speak';

interface Props {
  item: LexicalItem;
  onContinue: () => void;
}

// A no-stakes "meet the word" moment: shown once, right before a brand-new
// (never-attempted) item is first quizzed. Picture + Finnish + TTS + English,
// one tap to continue into the real question — nothing is graded here, so a
// child's very first encounter with a word is a presentation, not a test.
//
// Renders CONTENT ONLY (no screen/section): the host game keeps its own frame
// around it — ActivityHeader with the star counter and the back button — so
// the child can still leave mid-intro and the session chrome never blinks out.
export default function WordIntro({ item, onContinue }: Props) {
  useEffect(() => {
    const t = setTimeout(() => speak(item.fi), 300);
    return () => clearTimeout(t);
  }, [item]);

  return (
    <>
      <p className="prompt">
        Uusi sana! <span className="en">New word!</span>
      </p>

      <div className="phrase-card word-intro">
        <span className="phrase-emoji" aria-hidden="true">
          {item.emoji}
        </span>
        <p className="word-intro__fi">{item.fi}</p>
        <p className="en phrase-hint">{item.en}</p>
        <button
          className="speaker speaker--inline"
          onClick={() => speak(item.fi)}
          aria-label="Hear it again"
        >
          🔊 <span className="en">Listen</span>
        </button>
      </div>

      <button className="btn btn--primary" onClick={onContinue} autoFocus>
        Jatka <span className="en">Continue</span>
      </button>
    </>
  );
}
