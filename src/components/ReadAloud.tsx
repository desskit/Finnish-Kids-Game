import { useEffect } from 'react';
import { speakProse, stopSpeaking } from '../audio/speak';
import Art from '../art/Art';

// Read an explanation aloud (src/audio/speak.ts `speakProse`): a 🔊 beside a
// lesson card's or a "Why?" tip's English. `auto` reads it as it appears —
// for a younger reader (src/game/learner.ts), who may not read it alone.

export default function ReadAloud({ text, auto = false }: { text: string; auto?: boolean }) {
  useEffect(() => {
    if (!auto || !text) return;
    const t = setTimeout(() => speakProse(text), 300);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [auto, text]);
  if (!text) return null;
  return (
    <button type="button" className="read-aloud" onClick={() => speakProse(text)} aria-label="Read this aloud">
      <Art glyph="🔊" /> <span className="en">Read it to me</span>
    </button>
  );
}
