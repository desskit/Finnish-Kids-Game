import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoundComplete from './RoundComplete';

describe('RoundComplete', () => {
  it('shows Home when onHome is given and calls it', () => {
    const onHome = vi.fn();
    const onAgain = vi.fn();
    render(<RoundComplete stars={3} total={4} onAgain={onAgain} onHome={onHome} />);
    fireEvent.click(screen.getByText('Koti'));
    expect(onHome).toHaveBeenCalled();
  });

  it('shows the fox cheering after a perfect round, and sitting otherwise', () => {
    const { container, unmount } = render(<RoundComplete stars={4} total={4} onAgain={vi.fn()} />);
    expect(container.querySelector('.mascot [data-art="mascot-cheer"]')).not.toBeNull();
    unmount();
    const again = render(<RoundComplete stars={3} total={4} onAgain={vi.fn()} />);
    expect(again.container.querySelector('.mascot [data-art="fox"]')).not.toBeNull();
    expect(again.container.querySelector('[data-art="mascot-cheer"]')).toBeNull();
  });

  it('bursts confetti, hidden from screen readers, each piece placed and timed', () => {
    const { container } = render(<RoundComplete stars={3} total={4} onAgain={vi.fn()} />);
    const confetti = container.querySelector('.confetti');
    expect(confetti).toHaveAttribute('aria-hidden', 'true');
    const pieces = [...confetti!.querySelectorAll('span')];
    expect(pieces.length).toBeGreaterThan(10);
    for (const piece of pieces) {
      expect(piece.style.left).toMatch(/%$/);
      expect(piece.style.getPropertyValue('--dx')).toMatch(/px$/);
    }
  });

  it('hides Home when onHome is omitted (embedded, e.g. the audit harness)', () => {
    render(<RoundComplete stars={3} total={4} onAgain={vi.fn()} />);
    expect(screen.queryByText('Koti')).toBeNull();
    // Keep going is still there so the round can replay.
    expect(screen.getByText('Jatka')).toBeInTheDocument();
  });
});
