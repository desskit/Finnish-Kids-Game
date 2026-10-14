import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../state/profile';
import { AVATARS } from '../state/storage';
import { resolveTheme, useDeviceDark, type ThemeId } from '../theme/theme';
import Art from '../art/Art';
import Avatar, { avatarName } from '../art/Avatar';
import LookPicker from './LookPicker';

// Kid-accessible profile picker (launch + top-bar avatar). Choose an existing
// child, add a new one (a name, colors and an avatar), or change a child's
// colors with the brush on their card. Editing names and removing live in the
// math-gated grown-up area.
//
// This is everyone's screen, so it's in the device's look, with each card in
// its player's own. While colors are being picked, the screen shows them.
export default function ProfilePicker() {
  const { children, activeId, switchChild, addChild, setChildTheme, previewTheme } = useProfile();
  const navigate = useNavigate();
  const deviceDark = useDeviceDark();

  const [adding, setAdding] = useState(children.length === 0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[children.length % AVATARS.length]);
  const [look, setLook] = useState<ThemeId | undefined>(undefined);
  /** The player whose colors are being changed, if any. */
  const [painting, setPainting] = useState<string | null>(null);
  const painted = adding ? undefined : children.find((c) => c.id === painting);

  const shown = resolveTheme(adding ? look : painted?.theme, deviceDark);
  useEffect(() => {
    previewTheme(shown);
  }, [shown, previewTheme]);
  useEffect(() => () => previewTheme(null), [previewTheme]);

  function choose(id: string) {
    switchChild(id);
    navigate('/');
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    addChild(name, avatar, look);
    navigate('/');
  }

  return (
    <main className="app">
      <section className="screen profile-picker">
        {painted ? (
          <>
            <div className="mascot" aria-hidden="true">
              <Avatar glyph={painted.avatar} />
            </div>
            <h1 className="greeting">{painted.name}</h1>
            <LookPicker value={painted.theme} onPick={(t) => setChildTheme(painted.id, t)} />
            <button className="btn btn--primary" onClick={() => setPainting(null)}>
              Valmis <span className="en">Done</span>
            </button>
          </>
        ) : (
          <>
            <div className="mascot" aria-hidden="true">
              <Art glyph="🦊" motion="loop" />
            </div>
            <h1 className="greeting">
              Kuka pelaa? <span className="en">Who's playing?</span>
            </h1>
          </>
        )}

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

            <LookPicker value={look} onPick={setLook} />

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
          !painted && (
            <div className="profile-grid">
              {children.map((c) => (
                <div
                  key={c.id}
                  className={'profile-card profile-card--player' + (c.id === activeId ? ' profile-card--on' : '')}
                  data-look={c.theme}
                >
                  <button className="profile-card__play" onClick={() => choose(c.id)}>
                    <span className="profile-card__avatar" aria-hidden="true">
                      <Avatar glyph={c.avatar} />
                    </span>
                    <span className="profile-card__name">{c.name}</span>
                    <span className="profile-card__stars">
                      <Art glyph="⭐" /> {c.stars}
                    </span>
                  </button>
                  <button
                    className="profile-card__paint"
                    onClick={() => setPainting(c.id)}
                    aria-label={`Change ${c.name}'s colors`}
                  >
                    <Art glyph="🖌️" />
                  </button>
                </div>
              ))}
              <button
                className="profile-card profile-card--add"
                onClick={() => {
                  setName('');
                  setAvatar(AVATARS[children.length % AVATARS.length]);
                  setLook(undefined);
                  setAdding(true);
                }}
              >
                <span className="profile-card__avatar" aria-hidden="true">
                  <Art glyph="➕" />
                </span>
                <span className="profile-card__name">
                  Uusi <span className="en">New</span>
                </span>
              </button>
            </div>
          )
        )}

        {/* Opened from the map to switch player? Let a grown-up back out without
            being forced to pick someone. Hidden at first launch (no child yet). */}
        {!adding && !painted && children.length > 0 && (
          <button className="btn" onClick={() => navigate('/')}>
            <Art glyph="⬅︎" /> Takaisin <span className="en">Back home</span>
          </button>
        )}
      </section>
    </main>
  );
}
