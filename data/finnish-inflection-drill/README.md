# Finnish-Inflection-Drill source data (vendored)

Raw, machine-readable Finnish word data pulled from
[desskit/Finnish-Inflection-Drill](https://github.com/desskit/Finnish-Inflection-Drill)
(`data/` folder, `main` branch), kept here so `scripts/build-kids-data.mjs` can
run without a separate checkout.

- **Source:** Wiktionary (en.wiktionary.org) via the kaikki.org machine-readable
  extract; example sentences from Tatoeba (tatoeba.org).
- **License:** CC BY-SA 4.0 — see `/NOTICE.md` at the repo root.
- **Not hand-edited.** Treat as a read-only vendored snapshot; re-run the
  Finnish-Inflection-Drill extraction pipeline upstream and re-pull to refresh.

Files: `nouns.json`, `verbs.json`, `numerals.json`, `rection.json`,
`possessives.json`.

`build-kids-data.mjs` resolves this directory via (in order): a CLI arg,
`$FID_DATA_DIR`, or `../Finnish-Inflection-Drill/data` relative to `scripts/`.
Run it pointed at this folder:

```bash
node scripts/build-kids-data.mjs data/finnish-inflection-drill
```
