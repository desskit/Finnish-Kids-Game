import type { TogetherPrompt } from '../content/together';
import { useProfile } from '../state/profile';
import { speak } from '../audio/speak';
import Prose from './Prose';
import Art from '../art/Art';
import SpeakerIcon from '../art/SpeakerIcon';

// A card for the grown-up, shown only in Together mode (Settings): what to
// ask, say or play together, in English, with a Finnish line from the
// content to hear and say (content/together.ts).
export default function TogetherCard({ prompt }: { prompt: TogetherPrompt }) {
  const { settings } = useProfile();
  if (!settings.together) return null;
  return (
    <aside className="together-card" aria-label="Together: for the grown-up">
      <p className="together-card__title">
        <Art glyph="👪" /> <span className="en">Together</span>
      </p>
      <Prose className="together-card__text en" text={prompt.en} />
      {prompt.fi && (
        <p className="together-card__fi" lang="fi">
          <span>{prompt.fi}</span>
          <button
            type="button"
            className="speaker speaker--inline"
            onClick={() => speak(prompt.fi!)}
            aria-label={`Kuuntele · Listen: ${prompt.fi}`}
          >
            <SpeakerIcon />
          </button>
        </p>
      )}
    </aside>
  );
}
