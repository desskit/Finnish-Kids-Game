import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { lessonById } from '../content/lessons';
import { stepAfterLesson } from '../game/course';
import { useProfile } from '../state/profile';
import LessonView from './LessonView';

// /lesson/:lessonId — read a unit's lesson. Finishing it marks it read (which
// opens the unit's practice steps) and returns to where the child came from:
// the Notebook when opened there, otherwise the course home.
export default function LessonRoute() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeChild, markLessonSeen } = useProfile();
  const lesson = lessonId ? lessonById[lessonId] : undefined;

  if (!activeChild) return <Navigate to="/profiles" replace />;
  if (!lesson) return <Navigate to="/" replace />;

  const fromNotebook = (location.state as { from?: string } | null)?.from === 'notebook';
  const back = () => navigate(fromNotebook ? '/notebook' : '/');
  const firstStep = stepAfterLesson(lesson.id);

  return (
    <main className="app">
      <LessonView
        lesson={lesson}
        onClose={back}
        doneLabel={
          fromNotebook
            ? { fi: 'Takaisin', en: 'Back to notebook' }
            : { fi: 'Harjoittele!', en: 'Start practicing' }
        }
        onDone={() => {
          markLessonSeen(lesson.id);
          // Straight into the practice it opens (the unit's first step, or for a
          // part-way lesson the step after it) — the natural next move.
          if (!fromNotebook && firstStep) navigate(`/skill/${firstStep.id}`);
          else back();
        }}
      />
    </main>
  );
}
