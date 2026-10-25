import { useEffect, useRef, useState } from 'react';
import { canRecord, playClip, recordClip } from '../audio/record';
import { speak } from '../audio/speak';
import { useCanHearFinnish } from '../audio/voices';
import { useProfile } from '../state/profile';
import Art from '../art/Art';
import SpeakerIcon from '../art/SpeakerIcon';

// "Hear yourself" in the speaking game: record three seconds, hear your own
// voice, then the Finnish model — and compare. Never scored. With no Finnish
// voice on the device, just their own voice (the model is never faked).

type Phase = 'idle' | 'recording' | 'playing' | 'done' | 'denied';

export default function HearYourself({ say, disabled = false }: { say: string; disabled?: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const clip = useRef<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const { settings } = useProfile();
  const canHear = useCanHearFinnish(!!settings.muted);

  // A new word: a fresh start (and the last clip let go).
  useEffect(() => {
    setPhase('idle');
    return () => {
      audio.current?.pause();
      if (clip.current) URL.revokeObjectURL(clip.current);
      clip.current = null;
    };
  }, [say]);

  if (!canRecord()) return null;

  const playBoth = () => {
    if (!clip.current) return;
    setPhase('playing');
    audio.current = playClip(clip.current, () => {
      if (!canHear) {
        setPhase('done');
        return;
      }
      speak(say, { onEnd: () => setPhase('done') });
      window.setTimeout(() => setPhase((p) => (p === 'playing' ? 'done' : p)), 4000);
    });
  };

  const record = async () => {
    setPhase('recording');
    try {
      if (clip.current) URL.revokeObjectURL(clip.current);
      clip.current = await recordClip();
      playBoth();
    } catch {
      setPhase('denied');
    }
  };

  return (
    <div className="hear-yourself">
      {phase === 'done' && clip.current ? (
        <button type="button" className="btn btn--sm" onClick={playBoth} disabled={disabled}>
          <SpeakerIcon /> <span className="en">{canHear ? 'You, then Finnish — again' : 'Hear yourself again'}</span>
        </button>
      ) : (
        <button
          type="button"
          className="btn btn--sm"
          onClick={record}
          disabled={disabled || phase === 'recording' || phase === 'playing'}
        >
          <Art glyph="🔴" />{' '}
          <span className="en">
            {phase === 'recording'
              ? 'Recording… say it now'
              : phase === 'playing'
                ? canHear
                  ? 'You… then Finnish'
                  : 'Listen to yourself…'
                : 'Hear yourself'}
          </span>
        </button>
      )}
      {phase === 'denied' && <p className="say-hint say-hint--soft en">Allow the mic to hear yourself.</p>}
    </div>
  );
}
