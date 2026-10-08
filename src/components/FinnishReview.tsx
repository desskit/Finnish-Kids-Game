import { useMemo, useRef, useState } from 'react';
import vettedLedger from '../../data/finnish-vetted.json';
import { reviewEntries, reviewSections, type ReviewEntry } from '../game/reviewEntries';
import { entryStatus, mergeReview, parseReviewFile, reviewCounts, reviewFile, type EntryStatus } from '../game/review';
import { useProfile } from '../state/profile';
import { speak } from '../audio/speak';

// Grown-ups → Finnish check. For a Finnish speaker (a parent, a teacher): every
// piece of Finnish the app's authors wrote by hand — stories, scenes, sentence
// patterns, the forms marked wrong, lesson quotes, titles, the screens' own
// labels — one at a time: ✓ if it's
// right, ✎ if it needs fixing (with a note). Decisions stay on this device;
// "Download" makes a file to send to the developer, who folds it into the
// app (`npm run review:import`). Generated from the same list as
// docs/FINNISH_REVIEW.md, under the same keys.

const PAGE = 20;
const LEDGER: ReadonlySet<string> = new Set((vettedLedger as { vetted: string[] }).vetted);

type Filter = 'todo' | 'fix' | 'done' | 'all';

const STATUS_LABEL: Record<EntryStatus, string> = {
  ledger: '✅ Approved',
  ok: '✓ Correct',
  fix: '✎ Needs a fix',
  changed: '↻ Changed since checked',
  todo: 'Not checked yet',
};

function matches(filter: Filter, status: EntryStatus): boolean {
  if (filter === 'all') return true;
  if (filter === 'todo') return status === 'todo' || status === 'changed';
  if (filter === 'fix') return status === 'fix';
  return status === 'ok' || status === 'ledger';
}

/** The text to read aloud: the Finnish without the sheet's annotations. */
function spoken(fi: string): string {
  return fi
    .replace(/\s—\s(e\.g\.|marked wrong:).*$/, '')
    .replace(/⟨[^⟩]*⟩/g, '')
    .replace(/[✓→]/g, ' ')
    .trim();
}

function EntryCard({ e, sectionTitle }: { e: ReviewEntry; sectionTitle: string }) {
  const { review, setReviewDecision } = useProfile();
  const status = entryStatus(e, review.decisions, LEDGER);
  const d = review.decisions[e.key];
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(d?.note ?? '');
  const [suggestion, setSuggestion] = useState(d?.suggestion ?? '');

  const decide = (s: 'ok' | 'fix') => {
    setReviewDecision(e.key, {
      status: s,
      fi: e.fi,
      at: Date.now(),
      ...(s === 'fix' && note.trim() ? { note: note.trim() } : {}),
      ...(s === 'fix' && suggestion.trim() ? { suggestion: suggestion.trim() } : {}),
    });
    setEditing(false);
  };

  return (
    <li className={`rcard rcard--${status}`}>
      <div className="rcard__top">
        <span className="gchip gchip--muted">{sectionTitle}</span>
        <span className={'rcard__status rcard__status--' + status}>{STATUS_LABEL[status]}</span>
      </div>
      <p className="rcard__fi" lang="fi">
        {e.fi}{' '}
        <button className="rcard__speak" onClick={() => speak(spoken(e.fi))} aria-label="Hear it">
          🔊
        </button>
      </p>
      <p className="rcard__en">{e.en}</p>
      {status === 'fix' && d && !editing && (d.note || d.suggestion) && (
        <p className="rcard__note">
          {d.note}
          {d.suggestion && (
            <>
              {' '}→ <span lang="fi">{d.suggestion}</span>
            </>
          )}
        </p>
      )}
      {editing ? (
        <div className="rcard__edit">
          <label>
            <span>What's wrong?</span>
            <textarea value={note} onChange={(ev) => setNote(ev.target.value)} rows={2} placeholder="e.g. sounds unnatural; wrong ending" />
          </label>
          <label>
            <span>How should it read? (optional)</span>
            <input value={suggestion} onChange={(ev) => setSuggestion(ev.target.value)} lang="fi" placeholder="Kirjoita oikea muoto" />
          </label>
          <div className="gdata">
            <button className="gbtn gbtn--primary" onClick={() => decide('fix')}>
              Save
            </button>
            <button className="gbtn" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="rcard__actions">
          <button className={'gbtn' + (status === 'ok' ? ' gbtn--primary' : '')} onClick={() => decide('ok')}>
            ✓ Oikein <span className="rcard__en-inline">Correct</span>
          </button>
          <button className={'gbtn' + (status === 'fix' ? ' gbtn--danger' : '')} onClick={() => setEditing(true)}>
            ✎ Korjattava <span className="rcard__en-inline">Needs a fix</span>
          </button>
          {d && (
            <button className="gbtn" onClick={() => setReviewDecision(e.key, null)}>
              Undo
            </button>
          )}
        </div>
      )}
      <p className="rcard__key">{e.key}</p>
    </li>
  );
}

export default function FinnishReview() {
  const { review, setReviewer, replaceReview } = useProfile();
  const sections = reviewSections();
  const entries = useMemo(() => reviewEntries(), []);
  const titleOf = useMemo(() => new Map(sections.map((s) => [s.id, s.title])), [sections]);
  const [filter, setFilter] = useState<Filter>('todo');
  const [section, setSection] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const counts = reviewCounts(entries, review.decisions, LEDGER);
  const checked = counts.ok + counts.ledger + counts.fix;
  const q = query.trim().toLowerCase();
  const list = entries.filter(
    (e) =>
      (section === 'all' || e.section === section) &&
      matches(filter, entryStatus(e, review.decisions, LEDGER)) &&
      (!q || e.fi.toLowerCase().includes(q) || e.en.toLowerCase().includes(q) || e.key.includes(q)),
  );

  function download() {
    try {
      const text = JSON.stringify(reviewFile(review, entries, Date.now()), null, 2);
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `finnish-review-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setNotice({ ok: false, text: "This browser can't save files." });
    }
  }

  async function load(file: File | undefined) {
    if (!file) return;
    const parsed = parseReviewFile(await file.text());
    if (!parsed) {
      setNotice({ ok: false, text: "That file isn't a Finnish review from this app." });
      return;
    }
    replaceReview(mergeReview(review, parsed));
    setNotice({ ok: true, text: `Merged ${parsed.decisions.length} decisions (the newer one wins for each entry).` });
  }

  return (
    <div className="grownup__panel">
      <article className="greport">
        <header>
          <h2 className="greport__name">Suomen tarkistus · Finnish check</h2>
          <p className="gmuted">
            For a Finnish speaker. Every word form the games use comes from Wiktionary; the sentences, stories,
            explanations, titles and button labels below were written by hand, so they need a native ear. Tap{' '}
            <strong>✓ Oikein</strong> if it's
            right, or <strong>✎ Korjattava</strong> to say what's wrong. Your answers are saved on this device —
            download them and send the file to the app's developer.
          </p>
        </header>

        <div className="gstats">
          <div className="gstat">
            <span className="gstat__value">
              {checked}
              <small>/{counts.total}</small>
            </span>
            <span className="gstat__label">checked ({counts.ledger} approved earlier)</span>
          </div>
          <div className="gstat">
            <span className="gstat__value">{counts.fix}</span>
            <span className="gstat__label">need a fix</span>
          </div>
          <div className="gstat">
            <span className="gstat__value">{counts.todo + counts.changed}</span>
            <span className="gstat__label">
              to check{counts.changed ? ` (${counts.changed} changed since checked)` : ''}
            </span>
          </div>
        </div>
        <div className="rprogress" aria-label={`${checked} of ${counts.total} checked`}>
          <span style={{ width: `${Math.round((checked / Math.max(1, counts.total)) * 100)}%` }} />
        </div>

        <label className="rfield">
          <span>Your name (goes in the file)</span>
          <input value={review.reviewer ?? ''} onChange={(ev) => setReviewer(ev.target.value)} placeholder="e.g. Maija" />
        </label>

        <div className="rfilters">
          <div className="gswitch" role="tablist" aria-label="Show">
            {(
              [
                ['todo', `To check (${counts.todo + counts.changed})`],
                ['fix', `Need a fix (${counts.fix})`],
                ['done', `Correct (${counts.ok + counts.ledger})`],
                ['all', 'All'],
              ] as [Filter, string][]
            ).map(([f, label]) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                className={'gswitch__btn' + (filter === f ? ' gswitch__btn--on' : '')}
                onClick={() => {
                  setFilter(f);
                  setShown(PAGE);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            className="rselect"
            value={section}
            onChange={(ev) => {
              setSection(ev.target.value);
              setShown(PAGE);
            }}
            aria-label="Section"
          >
            <option value="all">All sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.rows.length})
              </option>
            ))}
          </select>
          <input
            className="rsearch"
            type="search"
            value={query}
            onChange={(ev) => {
              setQuery(ev.target.value);
              setShown(PAGE);
            }}
            placeholder="Search Finnish or English"
            aria-label="Search"
          />
        </div>
        {section !== 'all' && <p className="gmuted">{sections.find((s) => s.id === section)?.hint}</p>}

        {list.length === 0 ? (
          <p className="gmuted">{filter === 'todo' ? 'Nothing left to check here — kiitos! 🎉' : 'Nothing here.'}</p>
        ) : (
          <ul className="rlist">
            {list.slice(0, shown).map((e) => (
              <EntryCard key={e.key} e={e} sectionTitle={titleOf.get(e.section) ?? e.section} />
            ))}
          </ul>
        )}
        {list.length > shown && (
          <button className="gbtn gbtn--wide" onClick={() => setShown((n) => n + PAGE)}>
            Show more ({list.length - shown} left)
          </button>
        )}

        <section className="gsection">
          <h3 className="gsection__title">Send it to the developer</h3>
          <p className="gmuted">
            The file lists every ✓ and ✎ with your notes. Checking on two devices? Load the other device's file here —
            for each entry the newer answer wins.
          </p>
          <div className="gdata">
            <button className="gbtn gbtn--primary" onClick={download} disabled={Object.keys(review.decisions).length === 0}>
              ⬇ Download review
            </button>
            <button className="gbtn" onClick={() => fileRef.current?.click()}>
              ⬆ Load a review file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(ev) => {
                void load(ev.target.files?.[0]);
                ev.target.value = '';
              }}
            />
          </div>
          {notice && <p className={notice.ok ? 'gmuted' : 'gerror'}>{notice.text}</p>}
        </section>
      </article>
    </div>
  );
}
