import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileProvider } from '../state/profile';
import SilentText from './SilentText';
import EnglishTap from './EnglishTap';

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
afterEach(() => withVoices(null));

describe('a listening game where Finnish can’t be heard', () => {
  it('shows the Finnish as text when there is no Finnish voice', () => {
    withVoices([{ lang: 'en-US', name: 'Samantha' }]);
    render(
      <ProfileProvider>
        <SilentText fi="kissa" />
      </ProfileProvider>,
    );
    expect(screen.getByText(/kissa/)).toBeInTheDocument();
  });

  it('shows nothing when a Finnish voice will say it', () => {
    withVoices([{ lang: 'fi-FI', name: 'Satu' }]);
    const r = render(
      <ProfileProvider>
        <SilentText fi="kissa" />
      </ProfileProvider>,
    );
    expect(r.container.textContent).toBe('');
  });
});

describe('a faded English line', () => {
  it('is a tap away', () => {
    render(<EnglishTap en="Hello!" shown={false} />);
    expect(screen.queryByText('Hello!')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Show the English: Hello!/ }));
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });
});
