import { useNavigate } from 'react-router-dom';
import { useProfile } from '../state/profile';

// Device settings (grown-up area): mute audio, force reduced motion, and the
// reset-everything escape hatch. Difficulty stays on the home screen so kids
// can adjust it themselves.
export default function Settings() {
  const { settings, updateSettings, resetAll } = useProfile();
  const navigate = useNavigate();

  function reset() {
    if (
      window.confirm(
        'Nollaa KAIKKI pelaajat ja edistyminen? · Reset ALL players and progress? This cannot be undone.',
      )
    ) {
      resetAll();
      navigate('/profiles');
    }
  }

  return (
    <div className="grownup__panel">
      <label className="setting-row">
        <span className="setting-row__label">
          Mykistä äänet <span className="en">Mute audio</span>
        </span>
        <input
          type="checkbox"
          className="setting-row__toggle"
          checked={settings.muted}
          onChange={(e) => updateSettings({ muted: e.target.checked })}
        />
      </label>

      <label className="setting-row">
        <span className="setting-row__label">
          Vähennä liikettä <span className="en">Reduce motion</span>
        </span>
        <input
          type="checkbox"
          className="setting-row__toggle"
          checked={settings.reducedMotion}
          onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
        />
      </label>

      <button className="btn setting-danger" onClick={reset}>
        Nollaa kaikki tiedot <span className="en">Reset all data</span>
      </button>
    </div>
  );
}
