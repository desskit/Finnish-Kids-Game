# Kielipesä – Finnish for Kids

A playful, installable web game (PWA) that teaches **everyday Finnish** to
readers aged about 6–10. Each unit runs *hear it, use it, notice it*: its story
first, then practice, then the pattern pointed out — younger readers (6–7) get
short pattern cards read aloud, older ones (8–10) the full lessons. See
[docs/LEARNING_RESEARCH.md](docs/LEARNING_RESEARCH.md) for the research behind
the design. Built with
React + Vite + TypeScript. Works on tablets (touch) and laptops/Chromebooks
(keyboard), runs offline, and uses **only human-authored, native-checked
Finnish** — the app never generates or inflects Finnish by rule.

> Every picture is pixel art drawn in code, most of it animated: words, the
> cast, story backdrops, the app's scenery in each look, its icons and the fox
> mascot. See
> [`docs/ART_GUIDE.md`](docs/ART_GUIDE.md). The app comes in three looks (Day,
> Night and Pink), each player's own pick; see
> [`docs/UI_GUIDE.md`](docs/UI_GUIDE.md). Recorded native voiceover is still
> planned. See "Roadmap" below.

## What's in this slice

- **Seven mini-games**
  - **Kuuntele ja osoita / Listen & Tap** — hear a Finnish word, tap the picture.
  - **Rakenna lause / Build a Phrase** — hear a carrier phrase, pick the word that
    completes it (e.g. _Tämä on **kissa**_).
  - **Laske ja sano / Count & Say** — count the animals, then build the two-slot
    counting phrase: pick the number, then the noun in its correct form
    (_yksi **kissa**_ → _kolme **kissaa**_, partitive after 2+).
  - **Yhdistä sanat / Match the Words** — an adjective is shown in some case
    (_isossa_); pick the noun form that **agrees** with it (_isossa **kissassa**_).
    Distractors are the same noun in other cases, so the skill drilled is the
    agreement itself. (Pairs the adjectives with each theme's nouns.)
  - **Taivuta verbi / Conjugate the Verb** — hear a pronoun, pick the verb form
    that agrees with the person (_minä **syön**_ / _hän **syö**_).
  - **Järjestä sanat / Word Order** — a full carrier-phrase sentence is shown as
    shuffled word chips; tap them back into the correct order.
  - **Kirjoita sana / Spelling** — see/hear a word, type it with an on-screen
    keyboard (includes ä/ö, so it works the same on any device).
- **A journey path, not categories** — the home is a winding path of _chapters →
  skill nodes_ built around **usable Finnish** (naming, location, likes, counting,
  describing, actions, and a plumbed "full sentences" chapter). Vocabulary —
  Animals / _Eläimet_, Numbers / _Numerot_, Food / _Ruoka_, Family / _Perhe_ — is
  the **word pool** that flows through the phrase skills, mixed across topics. See
  [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md) to add words, skills, or
  multi-slot sentences.
- **A short day, spaced and mixed** (`src/game/session.ts`). A new day's first
  Continue is the warm-up (6 questions for a younger reader, 10 for an older
  one): a story due back for "Muistatko?" (a day, three days and a week after
  it was read), then the words and grammar due back for review or the weakest
  grammar step — taking turns day by day when both are waiting, so a shaky
  step from units ago keeps coming back. Review is woven into the course too:
  words due back come up more often in the rounds, and once a pile builds up
  every fifth round of a step is a quick review. A word moves up its review
  box only when it was due — never several boxes in one sitting. After about
  four rounds (a younger reader) or six (an older one) the game says *Hienoa
  työtä tänään!* and offers home; going on is the child's choice.
  `npm run sim:progress` plays a model child through a year on the real engine
  ([`docs/LEARNING_AUDIT.md`](docs/LEARNING_AUDIT.md), "Pacing"). Words are asked for (Name
  it, Spell it, Say it) once they've been heard about six times, a missed word
  comes back in the next round, and two new look-alikes never arrive together.
- **Rewards that tell.** A day, a warm-up or a review ends on the words the
  child learned, as pictures; stars are a small line. The Notebook keeps a word
  book (*Sanakirjani*) of every word they know, and after each checkpoint the
  child says for themselves whether they can do what the unit taught.
- **Together mode** for a grown-up playing alongside: cards with something to
  ask, say or play after stories, in scenes and at a unit's end, a try-at-home
  idea per unit and a "This week" summary in the grown-up area, and "Hear
  yourself" in the speaking game (the child's own voice, then the model).
- **Lasketaan! — math in Finnish (optional).** A path beside the course, opened
  from a card under Continue: eight stages of short games (an apple tree, a
  scale, a train and a rocket, word problems, building the *-toista* and
  *-kymmentä* numbers, times tables and halves, paying at a shop, the clock,
  quick sums), each with a lesson, a story and a test that wins the stage's
  crown. *Päivän laskut* (today's sums) gives bonus stars once a day, with
  flames for the days in a row; six math badges, three of them winning a face
  to wear (a robot, an owl in glasses, a dragon). No digit appears anywhere in
  it — numbers are only Finnish words and speech, amounts are drawn as dots —
  so it can't be done in English in your head. Math never moves the course's
  progress or badges; its stars and the daily streak count. See [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md#lasketaan-math-in-finnish-optional).
- **Nine carrier phrases** built on **case-tagged, sourced inflections**:
  - Nominative — _Tämä on ___ / Missä on ___? / Minulla on ___._
  - Verb rection — _Pidän ___sta_ (elative) / _Näen ___n_ (accusative).
  - Locational postpositions (genitive) — ____ edessä / takana / vieressä / alla_.
  - Two-slot counting — _number + noun_ (partitive after 2+), used by Count & Say.
- **Verified Finnish from tagged data** — word forms come from Wiktionary (via
  [Finnish-Inflection-Drill](https://github.com/desskit/Finnish-Inflection-Drill)).
  The app looks up the correct inflected form by tag; it never generates Finnish.
- **Local profiles** — multiple children, each with their own level, stars, and
  per-topic progress, saved on the device (no accounts, no ads, no data
  collection). A password-locked **grown-up area** (the grown-up picks the
  password on the first visit; only a salted hash is saved) holds a progress
  dashboard, profile management — including opening every unit for one player
  who already knows some Finnish, or putting a player at an exact unit and step
  (for testing, or after lost data or a new device) — and settings (mute audio, reduce motion,
  reset). Profile
  storage is funnelled through one module (`src/state/storage.ts`) so a cloud
  backend can be added later without touching the UI.
- **Three looks: Day, Night and Pink.** Each player picks one with the brush on
  their card (a player who hasn't picked follows the device's light or dark
  mode). Each look has its own colors, pixel scenery and background pattern,
  and every color is checked for contrast. Cards and buttons are tactile, and
  menus move a little; all of it stops with reduced motion. See
  [`docs/UI_GUIDE.md`](docs/UI_GUIDE.md).
- **Placeholder audio** via the browser's Finnish text-to-speech voice.
- **PWA**: installable, offline-capable, orientation unlocked.

## Run it

```bash
npm install
npm run dev     # http://localhost:5173
```

Build & preview the production PWA:

```bash
npm run build
npm run preview
```

## Test it on a real device

The app is a static, backend-free PWA, so it deploys to any static host. Open
the deployed URL on a tablet or phone and tap _Add to Home Screen_ to install
it (it's offline-capable once installed).

### Netlify (primary)

`netlify.toml` configures the build (`npm run build`, publish
`dist`, Node 20), an SPA fallback redirect, and no-cache headers on the service
worker so clients always pick up new deploys. Connect the GitHub repo in Netlify
once and you get **production deploys on the default branch, a deploy preview on
every PR, and branch deploys**. The PWA is served at the domain root (`/`), so
the manifest scope/`start_url` need no changes.

### GitHub Pages (fallback)

A workflow (`.github/workflows/deploy.yml`) also builds and publishes to Pages on
every push to the default branch, live at
**https://desskit.github.io/Finnish-Kids-Game/**. It enables Pages itself
(`configure-pages` with `enablement: true`), so **no manual repo setting is
needed**, and must run from the default branch (the `github-pages` environment
only permits that).

The base path is configurable via the `BASE_PATH` env var — Pages sets
`/Finnish-Kids-Game/` (matching the repo name's casing; Pages paths are
case-sensitive), while Netlify and local dev/`npm run preview` use the default
`/`. All runtime assets are referenced via `import.meta.env.BASE_URL`, so the
same build is portable across both hosts.

## Tests & CI

```bash
npm run test:unit      # Vitest unit + component tests (jsdom)
npm run test:e2e       # Playwright headless smoke test (builds + previews)
npm run typecheck      # production tsc
npm run typecheck:test # tsc over test/e2e sources
```

`.github/workflows/ci.yml` runs the type checks, unit tests, and the Playwright
smoke test on every push and PR. Unit tests cover the round builders, content
data integrity, profile persistence/migration, the SRS scheduler, and the
activities; the e2e spec drives the real routes (profile → map → a skill's
unbroken challenge stream → review's finite round).

> **Audio note:** placeholder pronunciation uses the operating system's Finnish
> (`fi-FI`) speech voice. If a device has no Finnish voice installed, words still
> appear as pictures and the game is fully playable; install a Finnish voice in
> the OS settings for spoken prompts. Recorded native voiceover replaces TTS later.

## Where the Finnish content comes from

Word forms are **human-generated, tagged data** — not authored by hand here and
not generated by code. They are curated from the
[Finnish-Inflection-Drill](https://github.com/desskit/Finnish-Inflection-Drill)
dataset (Wiktionary via kaikki.org, plus Tatoeba examples) into small,
attributed files:

- **`animals.sourced.json`**, **`numbers.sourced.json`**, **`adjectives.sourced.json`**,
  **`verbs.sourced.json`** (under `src/content/data/`) — each word carries its
  inflection table plus `kotusType`/`group`/`frequencyRank` (and examples for
  nouns). Nouns/adjectives store the full case×number table
  (`nominative_singular`, `genitive_singular`, …); verbs store a focused
  conjugation subset keyed `${tense}_active_${polarity}_${person}` (present
  positive/negative + past, all persons, + commands). Adjectives and verbs come
  from the same source. **CC BY-SA 4.0** — see `NOTICE.md`.
- **`src/content/constructions.ts`** — human-authored carrier phrases. Each one
  declares a `case` + `number` (e.g. `genitive` / `singular`); the slot form is
  **looked up from the tagged data**, so consonant gradation etc. is always
  correct (e.g. _kettu → ketun_, _hevonen → hevosen_).

### How exercises are built (UI-agnostic)

A construction is a template with **tagged slots**; the actual Finnish form is
always looked up from the sourced inflection tables by tag, never generated.
The **round builders** in `src/game/round.ts` expand a construction + vocabulary
into plain exercise objects (`{ target, options, … }`) by select + shuffle +
lookup. These builders know nothing about React — the mini-games just render
their output, so new exercise types can be defined and verified before any UI
exists. Four shapes exist today:

- **Single-slot carrier** (`buildPhraseRound`) — e.g. _Tämä on **kissa**_.
- **Counting** (`buildCountingRound`) — number + noun (partitive after 2+).
- **Adjective + noun agreement** (`buildAgreementRound`) — both words share one
  case (_isossa kissassa_, _punaisen koiran_). Rendered by the **Match the Words**
  mini-game (`MatchTheWord.tsx`), which pairs the global `adjectives` list with
  the active theme's nouns. `adjectives` stays out of the home-screen `themes`
  because agreement needs nouns to attach to — it isn't a standalone play topic.
- **Verb conjugation** (`buildConjugationRound`) — pronoun + verb; pick the form
  for the person (_minä **syön** / hän **syö**_), with present positive/negative
  and past supported. Rendered by **Conjugate the Verb** (`ConjugateVerb.tsx`);
  `verbs` is intentionally excluded from the home-screen `themes` — it's its
  own game, not a noun vocabulary topic.
- **Word order** (`buildWordOrderRound`) — tokenizes a full carrier-phrase
  sentence into shuffled chips; rendered by `WordOrder.tsx`. Reuses the same
  construction + sourced slot-form data as Build a Phrase.
- **Spelling** (`buildSpellingRound`) — picks target words for the child to
  type; rendered by `SpellWord.tsx` with an on-screen ä/ö keyboard.
- **Review** (`buildReviewRound`) — a cross-topic, picture-tap drill over the
  words a child is due to review. The schedule comes from a Leitner-lite
  spaced-repetition engine (`src/game/srs.ts`): every answer in the picture-tap
  activities records a per-item attempt (`Child.srs`), correct answers promote a
  word to a longer interval and misses send it back to the front. Reached from
  the **Kertaus · Review** banner on the map; new words backfill when few are due.

### Regenerating / extending the data

The upstream Finnish-Inflection-Drill source dataset is vendored at
`data/finnish-inflection-drill/` (see its `README.md`), so the curation script
runs directly against this repo:

```bash
node scripts/build-kids-data.mjs data/finnish-inflection-drill
```

Edit the curation lists (`ANIMALS`, `NUMBERS`, `ADJECTIVES`, `VERBS`, `FOOD`, `FAMILY`)
in `scripts/build-kids-data.mjs` to add words; the script copies verified forms + tags
from the source.

A word the snapshot doesn't have (it keeps only the ~5,600 most common nouns) comes
from the **Wiktionary supplement** in `data/wiktionary/`: run
`npm run fetch:wiktionary` on a computer that can reach kaikki.org. It applies the
upstream pipeline's own rules with a wider frequency net, plus every word listed in
`data/wiktionary/keep.txt`, and writes only the new lemmas (gzipped). The build
looks a word up in the snapshot first, then in the supplement. See
`data/wiktionary/README.md`. Adding a new construction is a few lines in `constructions.ts`
(`nounConstructions`, used by every noun theme) — no code changes elsewhere.

## Project structure

```
src/
  content/
    data/       # sourced, tagged Finnish (CC BY-SA 4.0) — generated, attributed
    types.ts    # schema + form lookup (formFor / sentenceFor)
    constructions.ts  # human-authored carrier phrases (case-tagged)
    index.ts    # loads data into themes
  game/         # round builders (select/shuffle only — never generate Finnish)
                #   + srs.ts (Leitner-lite spaced-repetition scheduler, pure)
  art/          # <Art>, sprites and the generated picture set (see docs/ART_GUIDE.md)
  audio/        # TTS placeholder + Web Audio reward sounds
  state/        # local profiles + per-item SRS state (localStorage)
  components/   # screens & mini-games
  styles/       # global styles: the three looks' tokens, the screens, motion
  theme/        # the looks (Day, Night, Pink) and their contrast test
art/            # the picture recipes, drawing kit, story backdrops, scenery and patterns
scripts/
  build-kids-data.mjs  # curates Finnish data from Finnish-Inflection-Drill
  build-art.mjs        # npm run art: draws the picture set into src/art/generated
  make-icons.mjs       # draws the app icons and favicon from the pixel fox
```

## Roadmap (planned follow-up sessions)

- **More verb challenges** — rection (which case a verb governs, from
  `rection.json`) and possessive suffixes (from `possessives.json`); both are
  vendored in `data/finnish-inflection-drill/` already.
- More themes curated from the same tagged source (e.g. colors as a
  standalone topic, clothing, weather).
- A kid-safety review pass before surfacing the sourced example sentences in the UI.
- Recorded native-speaker voiceover to replace TTS.
- Higher tiers (spelling/typing, word-ordering, short dialogues) for older kids.
- Multi-child profiles and a simple progress/parent view.
- Optional native packaging (Capacitor) for the App Store / Play Store.
