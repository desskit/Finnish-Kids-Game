// Hear yourself: record a short clip of the child saying the word, play it
// back, then the model. Children's speech defeats recognisers too often to
// judge (docs/LEARNING_RESEARCH.md); comparing their own voice with the model
// is something they — and a grown-up — can judge. The clip stays in memory
// only: nothing is stored or sent anywhere.

type RecorderCtor = new (stream: MediaStream) => MediaRecorder;

/** Can this browser record from the mic? */
export function canRecord(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { MediaRecorder?: RecorderCtor }).MediaRecorder === 'function' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

/** How long a clip runs. */
export const CLIP_MS = 3000;

/** Record a clip; resolves to an object URL to play (revoke it when done). */
export async function recordClip(ms = CLIP_MS): Promise<string> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  try {
    const Recorder = (window as unknown as { MediaRecorder: RecorderCtor }).MediaRecorder;
    const rec = new Recorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    const stopped = new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
    });
    rec.start();
    window.setTimeout(() => rec.state !== 'inactive' && rec.stop(), ms);
    await stopped;
    return URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
}

/** Play a recorded clip; `onEnd` runs when it finishes (or can't play). */
export function playClip(url: string, onEnd: () => void): HTMLAudioElement {
  const audio = new Audio(url);
  audio.onended = onEnd;
  audio.onerror = onEnd;
  audio.play().catch(onEnd);
  return audio;
}
