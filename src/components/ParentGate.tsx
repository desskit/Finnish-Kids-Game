import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Art from '../art/Art';
import { useProfile } from '../state/profile';
import { makeLock, opensLock, passwordProblem } from '../state/grownUpLock';

// The door to the grown-up area: a password the grown-up sets the first time
// (state/grownUpLock.ts keeps only its salted hash), then types each visit.
// A child can't get in by doing a sum. Not real security — the data lives on
// this device — but it keeps settings and progress out of small hands.
export default function ParentGate({ onPass }: { onPass: () => void }) {
  const navigate = useNavigate();
  const { settings, updateSettings } = useProfile();
  const lock = settings.grownUpLock;
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (lock) {
        if (await opensLock(lock, password)) onPass();
        else {
          setError('Yritä uudestaan · Try again');
          setPassword('');
        }
        return;
      }
      const problem = passwordProblem(password, again);
      if (problem) {
        setError(problem);
        return;
      }
      updateSettings({ grownUpLock: await makeLock(password) });
      onPass();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app">
      <section className="screen parent-gate">
        <div className="mascot" aria-hidden="true">
          <Art glyph="🔒" />
        </div>
        <h1 className="greeting">
          Vain aikuisille <span className="en">Grown-ups only</span>
        </h1>
        <p className="prompt en">
          {lock
            ? 'Type the grown-up password.'
            : 'Choose a password for the grown-up area. Keep it to yourself — you’ll need it each time.'}
        </p>
        <form className="name-form parent-gate__form" onSubmit={submit}>
          <input
            className={'name-input' + (error ? ' spell-input--wrong' : '')}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            autoFocus
            autoComplete={lock ? 'current-password' : 'new-password'}
            aria-label={lock ? 'Password' : 'New password'}
            placeholder={lock ? 'Password' : 'New password'}
          />
          {!lock && (
            <input
              className="name-input"
              type="password"
              value={again}
              onChange={(e) => {
                setAgain(e.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              aria-label="Type it again"
              placeholder="Type it again"
            />
          )}
          <button className="btn btn--primary" type="submit" disabled={busy}>
            OK
          </button>
          {error && (
            <p className="audio-note" role="alert">
              {error}
            </p>
          )}
        </form>
        {lock && (
          <p className="gmuted parent-gate__hint en">
            Forgot it? The only way back in is to clear this site’s data in the browser — which also erases every
            player’s progress, so keep a backup (Grown-ups → Settings).
          </p>
        )}
        <button className="btn" onClick={() => navigate('/')}>
          Takaisin <span className="en">Back</span>
        </button>
      </section>
    </main>
  );
}
