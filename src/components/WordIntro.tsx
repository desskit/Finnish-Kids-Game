import { useEffect } from 'react';
import { ALSO_EN, type LexicalItem } from '../content/types';
import { speak } from '../audio/speak';
import { syllablesOf } from '../content/syllables';
import Art from '../art/Art';
import SpeakerIcon from '../art/SpeakerIcon';

interface Props {
  item: LexicalItem;
  onContinue: () => void;
  /** Show the word split into syllables (a younger reader: learner.ts `syllables`). */
  syllables?: boolean;
}

// A no-stakes "meet the word" moment: shown once, right before a brand-new
// (never-attempted) item is first quizzed. Picture + Finnish + TTS + English,
// one tap to continue into the real question — nothing is graded here, so a
// child's very first encounter with a word is a presentation, not a test.
//
// Renders CONTENT ONLY (no screen/section): the host game keeps its own frame
// around it — ActivityHeader with the star counter and the back button — so
// the child can still leave mid-intro and the session chrome never blinks out.
export default function WordIntro({ item, onContinue, syllables = false }: Props) {
  // Wiktionary's split, when there is one (content/syllables.ts).
  const parts = syllables ? syllablesOf(item.fi) : undefined;
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
          <Art item={item} motion="loop" />
        </span>
        <p className="word-intro__fi">{item.fi}</p>
        {parts && (
          <p className="word-intro__syllables" lang="fi" aria-label={`Syllables: ${parts.join(', ')}`}>
            {parts.join(' - ')}
          </p>
        )}
        <p className="en phrase-hint">
          {item.en}
          {ALSO_EN[item.id] && <span className="word-intro__also"> · also “{ALSO_EN[item.id]}”</span>}
        </p>
        <button
          className="speaker speaker--inline"
          onClick={() => speak(item.fi)}
          aria-label="Hear it again"
        >
          <SpeakerIcon /> <span className="en">Listen</span>
        </button>
      </div>

      <button className="btn btn--primary" onClick={onContinue} autoFocus>
        Jatka <span className="en">Continue</span>
      </button>
    </>
  );
}
