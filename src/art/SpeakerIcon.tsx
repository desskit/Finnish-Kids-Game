import { useSpeaking } from '../audio/useSpeaking';
import Art from './Art';

/** The speaker picture: its sound waves pulse while the app is speaking. */
export default function SpeakerIcon() {
  const speaking = useSpeaking();
  return <Art glyph="🔊" motion={speaking ? 'loop' : undefined} />;
}
