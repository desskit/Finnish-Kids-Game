import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Unmount React trees and reset DOM between tests so queries don't leak.
afterEach(() => {
  cleanup();
});

// --- Stub browser APIs jsdom doesn't implement -----------------------------
// The audio modules (src/audio/speak.ts, sfx.ts) feature-detect these and
// safely no-op when they're absent, but stubbing them keeps component tests
// realistic and quiet. Tests that need to assert audio calls mock the audio
// modules directly instead of relying on these.

class FakeSpeechSynthesisUtterance {
  text: string;
  lang = '';
  voice: unknown = null;
  rate = 1;
  pitch = 1;
  constructor(text: string) {
    this.text = text;
  }
}

vi.stubGlobal('SpeechSynthesisUtterance', FakeSpeechSynthesisUtterance);
vi.stubGlobal('speechSynthesis', {
  getVoices: () => [],
  speak: vi.fn(),
  cancel: vi.fn(),
  onvoiceschanged: null,
});

// matchMedia isn't in jsdom; some libraries call it during render.
vi.stubGlobal(
  'matchMedia',
  vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
);
