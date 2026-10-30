import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { lessonById, noticeLesson, withSpoken } from '../content/lessons';
import { hrefAfterLesson } from '../game/course';
import { stageForLesson } from '../game/mathPath';
import { mathStepAfterLesson } from '../game/mathCourse';
import { useProfile } from '../state/profile';
import LessonView from './LessonView';
import { useLearner } from '../game/useLearner';

// /lesson/:lessonId — read a unit's lesson. Finishing it marks it read (which
// opens the rest of the unit's steps) and goes on into the practice it opens —
// or back to the Notebook when opened there. In the course a younger reader
// sees just the lesson's notice cards (content/lessons.ts `noticeLesson`); the
// Notebook always has the whole lesson. A math stage's lesson belongs to the
// math map instead, and leads into the stage's games.
export default function LessonRoute() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeChild, markLessonSeen } = useProfile();
  const { fullLessons } = useLearner();
  const lesson = lessonId ? lessonById[lessonId] : undefined;

  if (!activeChild) return <Navigate to="/profiles" replace />;
  if (!lesson) return <Navigate to="/" replace />;

  const fromNotebook = (location.state as { from?: string } | null)?.from === 'notebook';
  const math = !!stageForLesson(lesson.id);
  const back = () => navigate(fromNotebook ? '/notebook' : math ? '/math' : '/');
  const mathStep = math ? mathStepAfterLesson(lesson.id) : undefined;
  const next = math ? mathStep && `/skill/${mathStep.id}` : hrefAfterLesson(lesson.id, activeChild);
  // Everyday spoken forms come last, for every reader: to recognise, not to use.
  const shown = withSpoken(fromNotebook || fullLessons || math ? lesson : noticeLesson(lesson));

  return (
    <main className="app">
      {/* Keyed by lesson: one lesson leading into the next starts at its first card. */}
      <LessonView
        key={lesson.id}
        lesson={shown}
        onClose={back}
        doneLabel={
          fromNotebook
            ? { fi: 'Takaisin', en: 'Back to notebook' }
            : { fi: 'Harjoittele!', en: 'Start practicing' }
        }
        onDone={() => {
          markLessonSeen(lesson.id);
          // Straight into the practice it opens (the unit's next unfinished
          // step, or for a part-way lesson the step after it) — by way of a
          // part-way lesson that stands in front of it.
          if (!fromNotebook && next) navigate(next);
          else back();
        }}
      />
    </main>
  );
}
