// Tiny reward/feedback sounds synthesized with the Web Audio API.
// No asset files needed, works offline.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(ac: AudioContext, freq: number, startAt: number, duration: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ac.destination);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.25, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** Happy rising arpeggio for correct, soft low pair for try-again. */
export function playDing(success: boolean): void {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const notes = success ? [523.25, 659.25, 783.99] : [311.13, 246.94];
  notes.forEach((f, i) => tone(ac, f, now + i * 0.11, 0.18));
}
