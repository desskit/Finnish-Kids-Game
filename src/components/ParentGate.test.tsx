import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileProvider } from '../state/profile';
import { emptyProfiles, type ProfilesData } from '../state/storage';
import { makeLock, opensLock, passwordProblem } from '../state/grownUpLock';
import ParentGate from './ParentGate';

function gate(data: ProfilesData, onPass: () => void) {
  return render(
    <ProfileProvider ephemeral seed={data}>
      <MemoryRouter>
        <ParentGate onPass={onPass} />
      </MemoryRouter>
    </ProfileProvider>,
  );
}

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('the grown-up password', () => {
  it('keeps only a salted hash, which opens with the password and nothing else', async () => {
    const lock = await makeLock('kissa123');
    expect(JSON.stringify(lock)).not.toContain('kissa123');
    expect(await opensLock(lock, 'kissa123')).toBe(true);
    expect(await opensLock(lock, 'kissa12')).toBe(false);
    // The same password twice: a different salt, a different hash.
    expect((await makeLock('kissa123')).hash).not.toBe(lock.hash);
  });

  it('asks for at least four characters, typed the same twice', () => {
    expect(passwordProblem('abc', 'abc')).toMatch(/at least 4/);
    expect(passwordProblem('abcd', 'abce')).toMatch(/match/);
    expect(passwordProblem('abcd', 'abcd')).toBeNull();
  });

  it('is chosen at the first visit, then asked for — no sum to solve', async () => {
    let passed = 0;
    gate(emptyProfiles(), () => passed++);
    expect(screen.queryByText(/\+/)).toBeNull();
    type('New password', 'mökki');
    type('Type it again', 'mokki');
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/match/);
    type('Type it again', 'mökki');
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    await waitFor(() => expect(passed).toBe(1));
  });

  it('opens only with the right password', async () => {
    let passed = 0;
    const data = { ...emptyProfiles(), settings: { ...emptyProfiles().settings, grownUpLock: await makeLock('mökki') } };
    gate(data, () => passed++);
    type('Password', 'mokki');
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Try again/);
    expect(passed).toBe(0);
    type('Password', 'mökki');
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    await waitFor(() => expect(passed).toBe(1));
  });
});
