import { useState } from 'react';
import { READER_BANDS, readerBandOf } from '../game/learner';
import { useProfile } from '../state/profile';
import { AVATARS } from '../state/storage';
import { UNITS, unitsCompleted } from '../game/course';
import { THEMES } from '../theme/theme';
import Art from '../art/Art';
import Avatar, { avatarName } from '../art/Avatar';

// Grown-up player management: rename, colors, switch, remove, add. (Adding,
// switching and colors are also on the kid-side player picker; removing lives
// only here, behind the gate, with a confirmation.)
export default function Profiles() {
  const { children, activeId, addChild, renameChild, setChildTheme, setChildReaderBand, setChildUnlockAll, removeChild, switchChild } =
    useProfile();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const total = UNITS.filter((u) => u.checkpoint !== false).length;

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addChild(name.trim(), avatar);
    setName('');
    setAdding(false);
  }

  function confirmRemove(id: string, childName: string) {
    if (window.confirm(`Remove ${childName} and all of their progress? This can't be undone.`)) {
      removeChild(id);
    }
  }

  return (
    <div className="grownup__panel">
      <ul className="gplayers">
        {children.map((c) => {
          const active = c.id === activeId;
          return (
            <li key={c.id} className={'gplayer' + (active ? ' gplayer--active' : '')}>
              <span className="gplayer__avatar" aria-hidden="true">
                <Avatar glyph={c.avatar} still />
              </span>
              <div className="gplayer__body">
                <label className="gplayer__namefield">
                  <span className="sr-only">Name for {c.name}</span>
                  <input
                    className="gplayer__name"
                    defaultValue={c.name}
                    maxLength={16}
                    onBlur={(e) => e.target.value.trim() && renameChild(c.id, e.target.value.trim())}
                  />
                </label>
                <span className="gplayer__meta">
                  <Art glyph="⭐" /> {c.stars} · {unitsCompleted(c)} of {total} units
                </span>
              </div>
              <div className="glook" role="group" aria-label={`Reader for ${c.name}`}>
                <span className="glook__label">Reader</span>
                {READER_BANDS.map((b) => (
                  <button
                    key={b.id}
                    className={'gswitch__btn' + (readerBandOf(c) === b.id ? ' gswitch__btn--on' : '')}
                    aria-pressed={readerBandOf(c) === b.id}
                    onClick={() => setChildReaderBand(c.id, b.id)}
                    title={b.hint}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <div className="glook" role="group" aria-label={`Units for ${c.name}`}>
                <span className="glook__label">Units</span>
                <button
                  className={'gswitch__btn' + (c.unlockAll ? '' : ' gswitch__btn--on')}
                  aria-pressed={!c.unlockAll}
                  onClick={() => setChildUnlockAll(c.id, false)}
                  title="Each unit's checkpoint opens the next one"
                >
                  In order
                </button>
                <button
                  className={'gswitch__btn' + (c.unlockAll ? ' gswitch__btn--on' : '')}
                  aria-pressed={!!c.unlockAll}
                  onClick={() => setChildUnlockAll(c.id, true)}
                  title="Every unit open — to jump ahead if they already know some Finnish"
                >
                  All open
                </button>
              </div>
              <div className="glook" role="group" aria-label={`Colors for ${c.name}`}>
                <span className="glook__label">Colors</span>
                <button
                  className={'gswitch__btn' + (c.theme ? '' : ' gswitch__btn--on')}
                  aria-pressed={!c.theme}
                  onClick={() => setChildTheme(c.id, undefined)}
                >
                  Follow device
                </button>
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    className={'gswitch__btn' + (c.theme === t.id ? ' gswitch__btn--on' : '')}
                    aria-pressed={c.theme === t.id}
                    onClick={() => setChildTheme(c.id, t.id)}
                  >
                    <Art glyph={t.glyph} /> {t.en}
                  </button>
                ))}
              </div>
              <div className="gplayer__actions">
                {active ? (
                  <span className="gchip gchip--good">✓ Playing now</span>
                ) : (
                  <button className="gbtn" onClick={() => switchChild(c.id)}>
                    Switch to {c.name}
                  </button>
                )}
                <button
                  className="gbtn gbtn--danger"
                  onClick={() => confirmRemove(c.id, c.name)}
                  aria-label={`Remove ${c.name}`}
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="gmuted">
        Each player can pick their colors with the brush on the player screen. Follow device shows Day, or Night when
        this device is set to dark mode.
      </p>

      {adding ? (
        <form className="gcard gadd" onSubmit={add}>
          <h3 className="gsection__title">New player</h3>
          <input
            className="gplayer__name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            placeholder="Name"
            autoFocus
            autoComplete="off"
            aria-label="New player's name"
          />
          <div className="avatar-row" role="group" aria-label="Choose an avatar">
            {AVATARS.map((a) => (
              <button
                type="button"
                key={a}
                className={'avatar-choice' + (a === avatar ? ' avatar-choice--on' : '')}
                onClick={() => setAvatar(a)}
                aria-label={`Avatar: ${avatarName(a)}`}
                aria-pressed={a === avatar}
              >
                <Avatar glyph={a} still />
              </button>
            ))}
          </div>
          <div className="gadd__actions">
            <button className="gbtn gbtn--primary" type="submit" disabled={!name.trim()}>
              Add player
            </button>
            <button type="button" className="gbtn" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button className="gbtn gbtn--wide" onClick={() => setAdding(true)}>
          <Art glyph="➕" /> Add a player
        </button>
      )}
    </div>
  );
}
