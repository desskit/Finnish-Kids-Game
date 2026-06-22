import { useState } from 'react';
import { useProfile } from '../state/profile';
import { AVATARS } from '../state/storage';

// Grown-up profile management: rename, switch, remove children, and add new
// ones. (Adding/switching is also available kid-side in the ProfilePicker;
// removing is gated here.)
export default function Profiles() {
  const { children, activeId, addChild, renameChild, removeChild, switchChild } = useProfile();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);

  function add(e: React.FormEvent) {
    e.preventDefault();
    addChild(name, avatar);
    setName('');
    setAdding(false);
  }

  function confirmRemove(id: string, childName: string) {
    if (window.confirm(`Poista ${childName}? · Remove ${childName} and their progress?`)) {
      removeChild(id);
    }
  }

  return (
    <div className="grownup__panel">
      <ul className="profile-manage">
        {children.map((c) => (
          <li key={c.id} className="profile-manage__row">
            <span className="profile-manage__avatar" aria-hidden="true">
              {c.avatar}
            </span>
            <input
              className="profile-manage__name"
              defaultValue={c.name}
              maxLength={16}
              aria-label={`Name for ${c.name}`}
              onBlur={(e) => renameChild(c.id, e.target.value)}
            />
            <span className="profile-manage__stars">⭐ {c.stars}</span>
            <button
              className="chip"
              onClick={() => switchChild(c.id)}
              disabled={c.id === activeId}
            >
              {c.id === activeId ? 'Aktiivinen · Active' : 'Valitse · Use'}
            </button>
            <button
              className="chip chip--danger"
              onClick={() => confirmRemove(c.id, c.name)}
              aria-label={`Remove ${c.name}`}
            >
              Poista · Remove
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        <form className="name-form profile-add" onSubmit={add}>
          <div className="name-row">
            <input
              className="name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={16}
              placeholder="Nimi · Name"
              autoFocus
              autoComplete="off"
              aria-label="New child name"
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
              Lisää <span className="en">Add</span>
            </button>
            <button type="button" className="btn" onClick={() => setAdding(false)}>
              Peruuta <span className="en">Cancel</span>
            </button>
          </div>
        </form>
      ) : (
        <button className="btn" onClick={() => setAdding(true)}>
          ➕ Lisää pelaaja <span className="en">Add player</span>
        </button>
      )}
    </div>
  );
}
