import { useState } from 'react';
import type { Why } from '../content/why';
import { lessonById } from '../content/lessons';
import { useActivityContext } from '../game/activityContext';
import LessonView, { Segments } from './LessonView';
import Prose from './Prose';

interface Props {
  why: Why | null | undefined;
  /** Lesson to offer; defaults to the session's (the step's unit lesson). */
  lessonId?: string;
}

// The "Why?" tip: after a wrong answer, the rule behind the right one ("IN
// something → -ssa / -ssä") with the correct form's ending highlighted, plus
// a button that opens the explaining lesson IN PLACE (a modal) so the child
// never loses their session.
export default function WhyTip({ why, lessonId }: Props) {
  const ctx = useActivityContext();
  const [reading, setReading] = useState(false);
  if (!why) return null;
  const lesson = lessonById[lessonId ?? ctx?.lessonId ?? ''];

  return (
    <>
      <div className="why-tip" role="note">
        <span className="why-tip__head">💡 Miksi? <span className="en">Why?</span></span>
        <Prose text={why.text} />
        {why.example && (
          <span className="why-tip__example" lang="fi">
            → <Segments segments={why.example} />
          </span>
        )}
        {lesson && (
          <button className="btn btn--sm why-tip__lesson" onClick={() => setReading(true)}>
            📓 <span className="en">Read the lesson</span>
          </button>
        )}
      </div>
      {reading && lesson && (
        <div className="why-modal" role="dialog" aria-modal="true" aria-label={lesson.titleEn}>
          <LessonView
            lesson={lesson}
            onClose={() => setReading(false)}
            onDone={() => setReading(false)}
            doneLabel={{ fi: 'Takaisin', en: 'Back to practice' }}
          />
        </div>
      )}
    </>
  );
}
