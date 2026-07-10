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

  it('hides Home when onHome is omitted (embedded, e.g. the audit harness)', () => {
    render(<RoundComplete stars={3} total={4} onAgain={vi.fn()} />);
    expect(screen.queryByText('Koti')).toBeNull();
    // Keep going is still there so the round can replay.
    expect(screen.getByText('Jatka')).toBeInTheDocument();
  });
});
