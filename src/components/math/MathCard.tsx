import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../../state/profile';
import { findUnit } from '../../game/course';
import { MATH_STAGES } from '../../game/mathPath';
import { newStages, nextMathAction, stageStatus, waitingFor } from '../../game/mathCourse';
import Art from '../../art/Art';
import { TodayButton } from './MathToday';
import '../../styles/math.css';

// The math section's door on the course home, right under "Continue": the fox
// at its market stall, "Lasketaan!", what comes next, and the stages as a
// little road of crowns. When a stage opens it says "Uusi!" — on the card
// until the child has been to see it, and once in a passing toast. Under it,
// once a stage is begun, today's sums (Päivän laskut).

/** Stages already announced in a toast since the app opened (once is enough). */
const announced = new Set<string>();

export default function MathCard() {
  const { activeChild, settings } = useProfile();
  const unlockAll = !!settings.unlockAll;
  const next = nextMathAction(activeChild, unlockAll);
  const fresh = newStages(activeChild, unlockAll);
  const first = MATH_STAGES[0];
  const closed = stageStatus(activeChild, first, unlockAll) === 'locked';
  const waitUnit = closed ? waitingFor(activeChild, first).unit : undefined;

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    const s = fresh.find((f) => !announced.has(f.id));
    if (!s) return;
    announced.add(s.id);
    setToast(s.titleFi);
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per visit
  }, []);

  return (
    <>
      <Link className={'math-card' + (closed ? ' math-card--closed' : '')} to="/math">
        <span className="math-card__art" aria-hidden="true">
          <Art id="math-card" motion="loop" />
        </span>
        <span className="math-card__label">
          <span className="math-card__title">
            Lasketaan! <span className="en">Math in Finnish</span>
            {fresh.length > 0 && (
              <span className="math-card__new">
                Uusi <span className="en">New</span>
              </span>
            )}
          </span>
          <span className="math-card__what en">
            {closed
              ? `Opens after “${findUnit(waitUnit ?? '')?.titleEn ?? 'Numbers'}” — count, add and take away, all in Finnish`
              : next
                ? `${next.stage.titleFi} · ${next.kind === 'lesson' ? 'Lesson' : next.kind === 'test' ? 'Win the crown' : next.step.titleEn}`
                : 'Every crown won!'}
          </span>
          <span className="math-card__road" aria-hidden="true">
            {MATH_STAGES.map((s) => {
              const st = stageStatus(activeChild, s, unlockAll);
              return (
                <span key={s.id} className={'math-card__stop math-card__stop--' + st}>
                  <Art id={s.crown} />
                </span>
              );
            })}
          </span>
        </span>
      </Link>
      <TodayButton />
      {toast && (
        <div className="reward-toast" role="status">
          <p className="reward-toast__line">
            <Art glyph="🍎" /> Uusi! {toast} <span className="en">A new math stage is open</span>
          </p>
        </div>
      )}
    </>
  );
}
