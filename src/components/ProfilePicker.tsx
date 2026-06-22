import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../state/profile';
import { AVATARS } from '../state/storage';

// Kid-accessible profile picker (launch + top-bar avatar). Choose an existing
// child, or add a new one (pick a name + avatar). Editing/removing lives in the
// math-gated grown-up area.
export default function ProfilePicker() {
  const { children, activeId, switchChild, addChild } = useProfile();
  const navigate = useNavigate();

  const [adding, setAdding] = useState(children.length === 0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[children.length % AVATARS.length]);

  function choose(id: string) {
    switchChild(id);
    navigate('/');
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    addChild(name, avatar);
    navigate('/');
  }

  return (
    <main className="app">
      <section className="screen profile-picker">
        <div className="mascot" aria-hidden="true">
          🦊
        </div>
        <h1 className="greeting">
          Kuka pelaa? <span className="en">Who's playing?</span>
        </h1>

        {adding ? (
          <form className="name-form" onSubmit={add}>
            <label htmlFor="cname">
              Nimi <span className="en">Name</span>
            </label>
            <div className="name-row">
              <input
                id="cname"
                className="name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={16}
                autoFocus
                autoComplete="off"
              />
            </div>

            <div className="avatar-row" role="group" aria-label="Choose an avatar">
              {AVATARS.map((a) => (
                <button
                  type="button"
                  key={a}
                  className={'avatar-choice' + (a === avatar ? ' avatar-choice--on' : '')}
                  onClick={() => setAvatar(a)}
                  aria-label={`Avatar ${a}`}
                  aria-pressed={a === avatar}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="button-row">
              <button className="btn btn--primary" type="submit">
                Aloita <span className="en">Start</span>
              </button>
              {children.length > 0 && (
                <button type="button" className="btn" onClick={() => setAdding(false)}>
                  Takaisin <span className="en">Back</span>
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="profile-grid">
            {children.map((c) => (
              <button
                key={c.id}
                className={'profile-card' + (c.id === activeId ? ' profile-card--on' : '')}
                onClick={() => choose(c.id)}
              >
                <span className="profile-card__avatar" aria-hidden="true">
                  {c.avatar}
                </span>
                <span className="profile-card__name">{c.name}</span>
                <span className="profile-card__stars">⭐ {c.stars}</span>
              </button>
            ))}
            <button
              className="profile-card profile-card--add"
              onClick={() => {
                setName('');
                setAvatar(AVATARS[children.length % AVATARS.length]);
                setAdding(true);
              }}
            >
              <span className="profile-card__avatar" aria-hidden="true">
                ➕
              </span>
              <span className="profile-card__name">
                Uusi <span className="en">New</span>
              </span>
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
