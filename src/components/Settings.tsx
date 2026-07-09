import { useNavigate } from 'react-router-dom';
import { useProfile } from '../state/profile';
import { isSpeechRecognitionAvailable } from '../audio/speech';

// Device settings (grown-up area): mute audio, force reduced motion, the
// speaking-game toggle + mic disclosure, and the reset-everything escape hatch.
// Difficulty stays on the home screen so kids can adjust it themselves.
export default function Settings() {
  const { settings, updateSettings, resetAll } = useProfile();
  const navigate = useNavigate();
  const speechAvailable = isSpeechRecognitionAvailable();

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

      {speechAvailable && (
        <>
          <label className="setting-row">
            <span className="setting-row__label">
              Puheharjoittelu <span className="en">Speaking practice</span>
            </span>
            <input
              type="checkbox"
              className="setting-row__toggle"
              checked={settings.speakingEnabled !== false}
              onChange={(e) => updateSettings({ speakingEnabled: e.target.checked })}
            />
          </label>
          <p className="setting-note en">
            The speaking game asks your child to say Finnish words into the microphone. The mic only
            turns on when they tap the button, and no audio is stored. On Chrome, Edge and Android
            the audio is sent to the browser maker’s servers to be recognized; on iPhone/iPad Safari
            it stays on the device.
          </p>
        </>
      )}

      <button className="btn setting-danger" onClick={reset}>
        Nollaa kaikki tiedot <span className="en">Reset all data</span>
      </button>
    </div>
  );
}
