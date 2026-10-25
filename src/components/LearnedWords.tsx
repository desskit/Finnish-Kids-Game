import type { LexicalItem } from '../content/types';
import { useProfile } from '../state/profile';
import { newWordsOn, wordsPracticedOn } from '../game/learned';
import { speak } from '../audio/speak';
import Art from '../art/Art';

/** Pictures shown at most (the rest are counted). */
const SHOWN = 8;

// What today taught, as pictures: the words met for the first time today —
// or, on a day with none new, the words practiced. The reward is the words
// themselves, not a points tally (game/learned.ts).
export default function LearnedWords({ words }: { words?: LexicalItem[] }) {
  const { activeChild } = useProfile();
  const now = Date.now();
  const fresh = words ?? newWordsOn(activeChild, now);
  const list = fresh.length > 0 ? fresh : wordsPracticedOn(activeChild, now);
  if (list.length === 0) return null;
  const isNew = !words && fresh.length > 0;
  return (
    <section className="learned" aria-label={isNew ? 'New words today' : 'Words you practiced'}>
      <p className="learned__title">
        {isNew ? (
          <>
            Uudet sanat <span className="en">New words today</span>
          </>
        ) : (
          <span className="en">{words ? 'The words you practiced' : 'Words you practiced today'}</span>
        )}
      </p>
      <ul className="learned__words">
        {list.slice(0, SHOWN).map((item) => (
          <li key={item.id}>
            <button type="button" className="learned__word" onClick={() => speak(item.fi)} aria-label={`${item.fi} · ${item.en}`}>
              <span aria-hidden="true">
                <Art item={item} />
              </span>
              <span className="learned__fi" lang="fi">
                {item.fi}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {list.length > SHOWN && <p className="learned__more en">and {list.length - SHOWN} more</p>}
    </section>
  );
}
