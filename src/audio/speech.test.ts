import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listenOnce } from './speech';

// A stand-in for the browser's recognizer: the test plays its events.
class FakeRecognition {
  static last: FakeRecognition | null = null;
  lang = '';
  interimResults = true;
  maxAlternatives = 1;
  continuous = true;
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    FakeRecognition.last = this;
  }
  /** The recognizer hands back what it heard, then ends. */
  hear(...alternatives: string[]) {
    const result = Object.assign(
      alternatives.map((transcript) => ({ transcript })),
      { length: alternatives.length },
    );
    this.onresult?.({ results: Object.assign([result], { length: 1 }) });
    this.onend?.();
  }
}

const w = window as unknown as { SpeechRecognition?: unknown };

beforeEach(() => {
  vi.useFakeTimers();
  w.SpeechRecognition = FakeRecognition;
  FakeRecognition.last = null;
});
afterEach(() => {
  delete w.SpeechRecognition;
  vi.useRealTimers();
});

const handlers = () => ({ onResult: vi.fn(), onError: vi.fn() });

describe('listenOnce', () => {
  it('listens once, in Finnish, with several alternatives', () => {
    const h = handlers();
    listenOnce(h);
    const rec = FakeRecognition.last!;
    expect(rec.lang).toBe('fi-FI');
    expect(rec.continuous).toBe(false);
    expect(rec.maxAlternatives).toBe(5);
    rec.hear('kissa', 'kisa');
    expect(h.onResult).toHaveBeenCalledWith(['kissa', 'kisa']);
    expect(h.onError).not.toHaveBeenCalled();
  });

  it('finish() stops listening and hands back what was heard', () => {
    const h = handlers();
    const session = listenOnce(h)!;
    const rec = FakeRecognition.last!;
    session.finish();
    expect(rec.stop).toHaveBeenCalled();
    rec.hear('kissa');
    expect(h.onResult).toHaveBeenCalledWith(['kissa']);
  });

  it('finishes on its own after maxMs (a noisy room never goes quiet)', () => {
    const h = handlers();
    listenOnce(h, { maxMs: 8000 });
    const rec = FakeRecognition.last!;
    vi.advanceTimersByTime(7999);
    expect(rec.stop).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(rec.stop).toHaveBeenCalled();
    rec.onend?.(); // nothing was heard
    expect(h.onError).toHaveBeenCalledWith('no-speech');
  });

  it("doesn't stay listening if the browser never answers a finish", () => {
    const h = handlers();
    listenOnce(h)!.finish();
    vi.advanceTimersByTime(3000);
    expect(h.onError).toHaveBeenCalledWith('no-speech');
    expect(FakeRecognition.last!.abort).toHaveBeenCalled();
  });

  it('resolves exactly once', () => {
    const h = handlers();
    const session = listenOnce(h, { maxMs: 8000 })!;
    FakeRecognition.last!.hear('kissa');
    session.finish();
    session.stop();
    vi.advanceTimersByTime(20000);
    expect(h.onResult).toHaveBeenCalledTimes(1);
    expect(h.onError).not.toHaveBeenCalled();
  });

  it('stop() cancels', () => {
    const h = handlers();
    listenOnce(h)!.stop();
    expect(h.onError).toHaveBeenCalledWith('aborted');
    expect(FakeRecognition.last!.abort).toHaveBeenCalled();
  });
});
