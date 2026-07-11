# AGID — English inflection database (vendored source)

`infl.txt` is the **Automatically Generated Inflection Database (AGID)**, version
2016.01.19, by Kevin Atkinson, distributed as part of the SCOWL / `en-wl/wordlist`
project. It maps each English word to its inflected forms:

```
child N: children
fish N: fish, fishes {:1}
eat V: ate | eaten | eating | eats          # past | pastPart | presPart | 3sg
answer V: answered | answering | answers    # regular: past==pastPart collapses to 3 slots
good A: better | best                        # comparative | superlative
```

## Why this is here

The app's golden rule is that inflected forms are **looked up from sourced data, never
rule-generated in code** — the same discipline the Finnish side gets from
`data/finnish-inflection-drill/`. This file is the English counterpart: the build
(`scripts/build-kids-data.mjs` via `scripts/agid.mjs`) looks up each vocabulary word's
English plural / verb forms / comparatives here and attaches them to each item's
`english` field in `src/content/data/*.sourced.json`. Only those ~180 derived records
ship to the browser; this 3.3 MB source stays build-time only.

## Source & license

- Source: https://raw.githubusercontent.com/en-wl/wordlist/master/agid/infl.txt
- Author: Kevin Atkinson. Copyright 2000–2014 Kevin Atkinson.
- License: "Permission to use, copy, modify, distribute and sell this database … for any
  purpose is hereby granted without fee, provided … the above copyright notice appear in
  all copies." Provided "as is" without warranty.
- AGID incorporates Alan Beale's 2of12id (from WordNet + Moby), ENABLE2K, and the UK
  Advanced Cryptics Dictionary, under their respective permissive/public-domain terms.
