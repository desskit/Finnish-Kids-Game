import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Lightweight "are you a grown-up?" gate: a small addition a young child can't
// easily do. Not real security — just a speed bump in front of settings/data,
// per kids-app convention.
export default function ParentGate({ onPass }: { onPass: () => void }) {
  const navigate = useNavigate();
  const [a] = useState(() => 3 + Math.floor(Math.random() * 6)); // 3..8
  const [b] = useState(() => 4 + Math.floor(Math.random() * 6)); // 4..9
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (Number.parseInt(value, 10) === a + b) {
      onPass();
    } else {
      setError(true);
      setValue('');
    }
  }

  return (
    <main className="app">
      <section className="screen parent-gate">
        <div className="mascot" aria-hidden="true">
          🔒
        </div>
        <h1 className="greeting">
          Vain aikuisille <span className="en">Grown-ups only</span>
        </h1>
        <p className="prompt">
          Paljonko on {a} + {b}?{' '}
          <span className="en">Solve to continue</span>
        </p>
        <form className="name-form" onSubmit={submit}>
          <div className="name-row">
            <input
              className={'name-input' + (error ? ' spell-input--wrong' : '')}
              inputMode="numeric"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              autoFocus
              autoComplete="off"
              aria-label="Answer"
            />
            <button className="btn btn--primary" type="submit">
              OK
            </button>
          </div>
          {error && <p className="audio-note">Yritä uudestaan · Try again</p>}
        </form>
        <button className="btn" onClick={() => navigate('/')}>
          Takaisin <span className="en">Back</span>
        </button>
      </section>
    </main>
  );
}
