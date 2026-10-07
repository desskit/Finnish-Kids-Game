import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../state/profile';
import { parseBackup } from '../state/storage';
import { isSpeechRecognitionAvailable } from '../audio/speech';

function Toggle({
  label,
  fi,
  note,
  checked,
  onChange,
}: {
  label: string;
  fi: string;
  note?: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <label className="gtoggle">
      <span className="gtoggle__text">
        <span className="gtoggle__label">{label}</span>
        <span className="gtoggle__fi" lang="fi">
          {fi}
        </span>
        {note && <span className="gtoggle__note">{note}</span>}
      </span>
      <input
        type="checkbox"
        className="gtoggle__switch"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

// Device settings (grown-up area), grouped: sound & motion, the course,
// speaking (with the microphone disclosure), and the player data — back up,
// restore, or reset. Everything is stored in this browser only.
export default function Settings() {
  const { settings, updateSettings, resetAll, backup, restore, children } = useProfile();
  const navigate = useNavigate();
  const speechAvailable = isSpeechRecognitionAvailable();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  function reset() {
    if (window.confirm('Reset ALL players and progress? This cannot be undone.')) {
      resetAll();
      navigate('/profiles');
    }
  }

  function download() {
    const blob = new Blob([backup()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finnish-kids-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice({ ok: true, text: 'Backup saved to your downloads.' });
  }

  async function upload(file: File) {
    const data = parseBackup(await file.text());
    if (!data) {
      setNotice({ ok: false, text: "That file isn't a backup from this app — nothing was changed." });
      return;
    }
    const names = data.children.map((c) => c.name).join(', ') || 'no players';
    if (window.confirm(`Replace everything on this device with the backup (${names})?`)) {
      restore(data);
      setNotice({ ok: true, text: `Restored: ${names}.` });
    }
  }

  return (
    <div className="grownup__panel">
      <section className="gcard">
        <h3 className="gsection__title">Sound & motion</h3>
        <Toggle
          label="Mute all sound"
          fi="Mykistä äänet"
          checked={settings.muted}
          onChange={(on) => updateSettings({ muted: on })}
        />
        <Toggle
          label="Reduce motion"
          fi="Vähennä liikettä"
          note="Calmer screens: fewer animations and confetti."
          checked={settings.reducedMotion}
          onChange={(on) => updateSettings({ reducedMotion: on })}
        />
      </section>

      <section className="gcard">
        <h3 className="gsection__title">The course</h3>
        <Toggle
          label="Unlock all units"
          fi="Avaa kaikki osat"
          note="Normally each unit's checkpoint opens the next one. Turn this on to let your child jump to any unit — for example if they already know some Finnish."
          checked={!!settings.unlockAll}
          onChange={(on) => updateSettings({ unlockAll: on })}
        />
      </section>

      {speechAvailable && (
        <section className="gcard">
          <h3 className="gsection__title">Speaking</h3>
          <Toggle
            label="Speaking practice"
            fi="Puheharjoittelu"
            note="Asks your child to say Finnish words into the microphone. The mic only turns on when they tap the button and no audio is stored. On Chrome, Edge and Android the audio is sent to the browser maker’s servers to be recognized; on iPhone/iPad Safari it stays on the device."
            checked={settings.speakingEnabled !== false}
            onChange={(on) => updateSettings({ speakingEnabled: on })}
          />
        </section>
      )}

      <section className="gcard">
        <h3 className="gsection__title">Your data</h3>
        <p className="gmuted">
          Progress for {children.length} {children.length === 1 ? 'player' : 'players'} is saved in
          this browser only. Save a backup now and then — clearing the browser's site data would
          erase it.
        </p>
        <div className="gdata">
          <button className="gbtn gbtn--primary" onClick={download}>
            ⬇ Save a backup
          </button>
          <button className="gbtn" onClick={() => fileRef.current?.click()}>
            ⬆ Restore from a backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = '';
            }}
          />
        </div>
        {notice && (
          <p className={'gnotice' + (notice.ok ? '' : ' gnotice--bad')} role="status">
            {notice.text}
          </p>
        )}
      </section>

      <section className="gcard gcard--danger">
        <h3 className="gsection__title">Start over</h3>
        <p className="gmuted">Deletes every player and all progress on this device.</p>
        <button className="gbtn gbtn--danger" onClick={reset}>
          Reset all data
        </button>
      </section>
    </div>
  );
}
