// Is there a Finnish voice on this device?
//
// Without one, browsers read Finnish text with their default (English) voice —
// a child would hear, and copy, an English accent. The app can't install a
// voice, but it can tell the grown-up, and say how to add one.

import { useEffect, useState } from 'react';

export type FinnishVoice =
  /** No speech output at all in this browser. */
  | 'unsupported'
  /** The voice list hasn't loaded yet. */
  | 'unknown'
  /** A Finnish voice is installed. */
  | 'finnish'
  /** Voices are installed, but none of them speaks Finnish. */
  | 'none';

export function finnishVoice(): FinnishVoice {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return 'unsupported';
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return 'unknown';
  return voices.some((v) => v.lang?.toLowerCase().startsWith('fi')) ? 'finnish' : 'none';
}

/** The Finnish voice's name, when there is one. */
export function finnishVoiceName(): string | undefined {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
  return window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('fi'))?.name;
}

/** `finnishVoice()`, kept current as the browser loads its voices. */
export function useFinnishVoice(): FinnishVoice {
  const [status, setStatus] = useState<FinnishVoice>(() => finnishVoice());
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const update = () => setStatus(finnishVoice());
    synth.addEventListener?.('voiceschanged', update);
    // Some browsers load voices without the event: look again in a moment.
    const t = window.setTimeout(update, 1500);
    return () => {
      synth.removeEventListener?.('voiceschanged', update);
      window.clearTimeout(t);
    };
  }, []);
  return status;
}
