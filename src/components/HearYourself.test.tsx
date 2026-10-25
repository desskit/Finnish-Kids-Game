import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileProvider } from '../state/profile';

const said: string[] = [];
vi.mock('../audio/record', () => ({
  canRecord: () => true,
  recordClip: async () => 'blob:clip',
  playClip: (_url: string, onEnd: () => void) => {
    onEnd();
    return { pause() {} };
  },
}));
vi.mock('../audio/speak', async (orig) => ({
  ...(await orig<typeof import('../audio/speak')>()),
  speak: (text: string) => said.push(text),
}));

import HearYourself from './HearYourself';

function withVoices(voices: { lang: string; name: string }[] | null) {
  if (voices === null) {
    delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
    return;
  }
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: { getVoices: () => voices, addEventListener() {}, removeEventListener() {} },
  });
}
afterEach(() => {
  withVoices(null);
  said.length = 0;
});

describe('hearing yourself', () => {
  it('plays your try, then the Finnish model', async () => {
    withVoices([{ lang: 'fi-FI', name: 'Satu' }]);
    render(
      <ProfileProvider>
        <HearYourself say="kissa" />
      </ProfileProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /hear yourself/i }));
    await waitFor(() => expect(said).toEqual(['kissa']));
  });

  it('never promises a model it can’t play: no Finnish voice, just your own try', async () => {
    withVoices([{ lang: 'en-US', name: 'Samantha' }]);
    render(
      <ProfileProvider>
        <HearYourself say="kissa" />
      </ProfileProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /hear yourself/i }));
    expect(await screen.findByRole('button', { name: /hear yourself again/i })).toBeInTheDocument();
    expect(screen.queryByText(/then Finnish/)).toBeNull();
    expect(said).toEqual([]);
  });
});
