# Opi Suomea – Finnish for Kids

A playful, installable web game (PWA) that teaches **everyday Finnish** to early
readers (~ages 6–8), designed to scale up as the child grows. Built with
React + Vite + TypeScript. Works on tablets (touch) and laptops/Chromebooks
(keyboard), runs offline, and uses **only human-authored, native-checked
Finnish** — the app never generates or inflects Finnish by rule.

> This is the first vertical slice. Artwork is intentionally placeholder
> (emoji); real art and recorded native voiceover are planned for later,
> art-focused sessions. See "Roadmap" below.

## What's in this slice

- **Two mini-games**
  - **Kuuntele ja osoita / Listen & Tap** — hear a Finnish word, tap the picture.
  - **Rakenna lause / Build a Phrase** — hear a carrier phrase, pick the word that
    completes it (e.g. _Tämä on **kissa**_).
- **One theme** — Animals / _Eläimet_ (8 words).
- **Three carrier phrases** — _Tämä on ___ / Missä on ___? / Minulla on ____.
- **Local profile** (name, level, stars) saved on the device — no accounts, no ads,
  no data collection.
- **Placeholder audio** via the browser's Finnish text-to-speech voice.
- **PWA**: installable, offline-capable, orientation unlocked.

## Run it

```bash
npm install
npm run icons   # generate placeholder PWA icons (one time / after changes)
npm run dev     # http://localhost:5173
```

Build & preview the production PWA:

```bash
npm run build
npm run preview
```

> **Audio note:** placeholder pronunciation uses the operating system's Finnish
> (`fi-FI`) speech voice. If a device has no Finnish voice installed, words still
> appear as pictures and the game is fully playable; install a Finnish voice in
> the OS settings for spoken prompts. Recorded native voiceover replaces TTS later.

## Add or change content (no coding needed)

All Finnish lives in plain data files under `src/content/`:

- **`animals.ts`** — vocabulary. Each entry is `{ id, fi, en, emoji, tier }`.
  Add a word by copying a line and filling in the Finnish (`fi`), English (`en`),
  and a placeholder `emoji`.
- **`constructions.ts`** — carrier phrases. Each phrase has fixed `prefix` /
  `suffix` text and a list of `fills`. **Every `form` is written out by hand in
  its correct Finnish form** — the app never conjugates or declines anything, so
  the data is always exactly what a native speaker wrote.

Adding a word to a theme makes it appear in Listen & Tap automatically; adding a
`fill` to a construction makes it appear in Build a Phrase. No code changes.

## Project structure

```
src/
  content/      # human-authored Finnish data + schema (the source of truth)
  game/         # round builders (select/shuffle only — never generate Finnish)
  audio/        # TTS placeholder + Web Audio reward sounds
  state/        # local profile (localStorage)
  components/   # screens & mini-games
  styles/       # global responsive styles
scripts/
  make-icons.mjs  # generates placeholder PWA icons
```

## Roadmap (planned follow-up sessions)

- Real artwork + a mascot character (dedicated art session).
- Recorded native-speaker voiceover to replace TTS.
- More themes (colors, numbers, food, family) and higher tiers (spelling/typing,
  word-ordering, short dialogues) for older kids.
- Multi-child profiles and a simple progress/parent view.
- Optional native packaging (Capacitor) for the App Store / Play Store.
