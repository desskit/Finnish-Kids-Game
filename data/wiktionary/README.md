# Wiktionary supplement

Finnish words the vendored Finnish-Inflection-Drill snapshot
(`../finnish-inflection-drill/`) doesn't have, fetched by
`scripts/fetch-wiktionary.mjs` from Wiktionary (en.wiktionary.org) via the
kaikki.org machine-readable extract. CC BY-SA 4.0.

The script applies the upstream pipeline's own rules (Finnish-Inflection-Drill
`scripts/extract.py` and `scripts/extract_possessives.py`, commit 2b62dfa; its
config files are vendored in `../finnish-inflection-drill/config/`). It keeps
lemmas whose forms rank within a wider frequency cutoff than upstream's 30,000,
plus every word in `keep.txt`. Every form is copied, never generated.

- `nouns.json.gz`, `verbs.json.gz`, `possessives.json.gz` — the same shape as
  the vendored files, gzipped; only lemmas the snapshot doesn't already have.
- `report.md` — what the last run found, and each kept word's status.
- `keep.txt` — words to keep however rare.
- `.cache/` — the downloads (not committed).

`scripts/build-kids-data.mjs` reads these as a fallback: a curated word is
looked up in the vendored snapshot first, then here.

## Refreshing it

kaikki.org has to be reachable, so run it on your own computer (Node 18+):

```bash
npm run fetch:wiktionary                 # or: node scripts/fetch-wiktionary.mjs
node scripts/build-kids-data.mjs data/finnish-inflection-drill
```

Options: `--cutoff 60000` (a narrower or wider net; default 100,000),
`--keep <file>`, `--kaikki <file or URL>` (if you downloaded the extract
yourself), `--freq <file or URL>`, `--out <dir>`.
