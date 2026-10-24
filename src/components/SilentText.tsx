import { useProfile } from '../state/profile';
import { useCanHearFinnish } from '../audio/voices';
import Art from '../art/Art';

// A listening game's Finnish, as text, when it can't be heard here — muted,
// no speech, or no Finnish voice (src/audio/speak.ts never reads Finnish in
// another voice). The game stays playable: read it instead of hearing it.

export default function SilentText({ fi }: { fi: string }) {
  const { settings } = useProfile();
  const canHear = useCanHearFinnish(!!settings.muted);
  if (canHear) return null;
  return (
    <p className="silent-text" lang="fi" role="status">
      <Art glyph="🔇" /> {fi}
    </p>
  );
}
