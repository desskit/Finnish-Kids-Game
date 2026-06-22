# Attribution & data licensing

## Finnish word data — CC BY-SA 4.0

The Finnish vocabulary forms in `src/content/data/*.sourced.json` (inflection
tables and example sentences) are derived from:

- **Wiktionary** (en.wiktionary.org), via the machine-readable
  [kaikki.org](https://kaikki.org/dictionary/Finnish/) extract — inflection
  paradigms. Licensed **CC BY-SA 4.0** and GFDL.
- **Tatoeba** (tatoeba.org) — example sentences. Licensed **CC BY 2.0 FR**.

This data was curated and reduced for this project from
[desskit/Finnish-Inflection-Drill](https://github.com/desskit/Finnish-Inflection-Drill)
using `scripts/build-kids-data.mjs`. Forms were selected and copied; they were
not algorithmically generated or modified.

The full upstream source dataset (`nouns.json`, `verbs.json`, `numerals.json`,
`rection.json`, `possessives.json`) is vendored as-is under
`data/finnish-inflection-drill/` so the curation script can run without a
separate checkout — same source and license as above; see the README in that
folder.

The curated data files in `src/content/data/` are made available under
**Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**:
https://creativecommons.org/licenses/by-sa/4.0/

**ShareAlike** applies to these data files and any adaptations of them — if you
redistribute the data, keep it under CC BY-SA 4.0 with attribution. This
obligation covers the data, not the application's source code, which is an
independent work shipped alongside it.

## Application code & art

Application source code, styles, and placeholder artwork are original to this
project and are **not** covered by CC BY-SA 4.0.
