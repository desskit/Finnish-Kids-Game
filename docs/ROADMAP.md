# Build Plans — Finnish Kids Game (Phases 1–7)

## Context

`Finnish-Kids-Game` is a React 18 + TypeScript (strict) + Vite 5 PWA that teaches everyday
Finnish to ages ~6–8. The first vertical slice is complete: two activities (Listen & Tap,
Build a Phrase), one theme (Animals, 8 words + 3 carrier phrases), placeholder **emoji** art,
**browser TTS** for Finnish audio, and a **single** localStorage profile. There are no tests,
no CI, and no deploy config.

This document holds **seven self-contained plans**, one per phase. Each phase will be executed in
its own future session, so each section restates its own prerequisites, files, and verification.
The codebase was deliberately scaffolded for these phases — notably `LexicalItem.audio?` (recorded
audio hook) and `LexicalItem.emoji` (art hook) already exist in `src/content/types.ts`.

### Decisions baked into these plans (from user)
- **Hosting = Netlify** (most feature-rich/scalable; deploy previews, branch deploys, room for
  serverless later). Keep Vite `base` configurable so **GitHub Pages remains a documented fallback**.
- **Art = AI-generated via Midjourney** (not Claude): owl "teacher" mascot, flat-&-rounded style,
  WebP @2x. See Phase 1 for the full locked spec.

### Cross-cutting conventions (apply in every phase)
- **Reference all runtime assets via `import.meta.env.BASE_URL`** (e.g. `${import.meta.env.BASE_URL}art/animals/cat.webp`).
  This keeps art/audio portable across Netlify (`/`), a GitHub Pages subpath, and a Capacitor webview.
- **Never rule-generate Finnish.** Every inflected form stays hand-authored in `src/content/*`
  (this is an existing, deliberate constraint — keep it). Validation checks *presence*, not grammar.
- **Graceful fallback everywhere:** image → emoji; recorded audio → TTS; new profile schema → migrate old.
- Keep the strict TypeScript + data-driven content model intact.

### Current file map (reference for all phases)
- Content/schema: `src/content/types.ts`, `animals.ts`, `constructions.ts`, `index.ts`
  (`theme`, `themes`, `sentenceFor()`)
- Activities: `src/components/ListenAndTap.tsx`, `BuildAPhrase.tsx`; round builders `src/game/round.ts`
  (`buildListenRound`, `buildPhraseRound`)
- Audio: `src/audio/speak.ts` (TTS), `src/audio/sfx.ts` (Web Audio chimes)
- State: `src/state/profile.tsx` (`ProfileData`, `useProfile`, key `fkg.profile.v1`)
- UI: `HomeScreen.tsx` (mascot `🦊`), `RoundComplete.tsx`, `ActivityHeader.tsx`, `src/styles/global.css`
- Config/scripts: `vite.config.ts`, `package.json`, `scripts/make-icons.mjs`

### Suggested execution order
The user numbering is preserved below as the canonical sections. Recommended **order to run them**:
**4 (tests) → 5 (deploy) → 3 (content) → 1 (art) → 2 (voiceover) → 6 (profiles/SRS) → 7 (Capacitor)**.
Rationale: get a CI safety net and a live URL on the kids' tablets first, expand content while it's
cheap, then invest in polish (art/audio), then progression features, then optional native wrap.
Each plan still stands alone if you prefer the original order.

---

## Phase 1 — Real Artwork + Mascot (replace emoji)

**Status:** Decisions locked — ready to hand to a breakout session.

**Goal:** Replace all placeholder emoji with a cohesive flat-and-rounded illustration set + an owl
mascot, keeping the data-driven model and the emoji fallback intact.

### Locked decisions
- **Mascot:** an **owl "teacher"** (pöllö) — friendly, wise-but-playful; doesn't clash with any vocab
  word. Working name TBD (suggestions: *Uula*, *Otto*, *Viisas*). Used on Home, RoundComplete, app icon.
- **Style:** **flat & rounded** — bold clean outlines, bright flat colors, simple rounded shapes; matches
  the 22px-radius cards + Baloo 2 font already in `global.css`.
- **Format:** **WebP raster @2x** — ~512×512, transparent background.
- **Tool:** **Midjourney** (v6/v7), commercial-plan license.

### Two tracks (run in parallel)
Track B (code) can ship before art is final because the emoji fallback stays in place; drop WebP files in
as Track A produces them.

#### Track A — Art production (human, in Midjourney — NOT Claude)
1. **Lock a style anchor.** Generate one hero image, pick the best, and reuse it as a **style reference
   (`--sref <url>`)** on every later prompt so the whole set stays on-model. Fixed prompt template, e.g.:
   `flat rounded illustration of a friendly {subject}, thick clean outlines, bright flat colors, simple
   shapes, centered, plain solid background, children's learning app --ar 1:1 --style raw --sref <anchor>`
2. **Mascot (consistency-critical).** Generate the owl once; produce poses via **character reference
   (`--cref <owl-url>` + `--cw`)**: at least `idle` and `celebrate` (a "wave/point" pose is a nice-to-have).
   Also render one clean front-facing **icon master** at high resolution for the app icon.
3. **Item set (8 animals).** One image per existing id — `cat, dog, bear, bunny, bird, fish, horse, cow`
   (match `animals.ts`). Plus a **theme icon** (animals/paw motif) and two **activity icons** (speaker =
   Listen, puzzle = Build).
4. **Post-process to spec.** Midjourney has no native transparency: generate on a plain background, then
   **remove background** (remove.bg / Photoshop), trim, center on a **512×512 square canvas with consistent
   padding**, and export **WebP**. The `scripts/optimize-art.mjs` script (Track B) batches trim/pad/resize/
   WebP from a `raw-art/` drop folder.
5. **License note:** record in `README.md` that art was made on a paid Midjourney plan (commercial use) —
   matters for the Phase 7 store wrap.

**Naming = ids, so wiring is trivial:**
- `public/art/animals/<itemId>.webp` (e.g. `cat.webp`)
- `public/art/mascot/owl-idle.webp`, `owl-celebrate.webp`, `owl-icon-master.png`
- `public/art/themes/animals.webp`
- `public/art/ui/listen.webp`, `build.webp`

#### Track B — Code integration (the Claude breakout session)
1. **Schema** (`src/content/types.ts`): add optional `image?: string` to **`LexicalItem`** and **`Theme`**
   (path relative to `BASE_URL`). Keep `emoji` as the fallback.
2. **`src/components/Illustration.tsx`** (new): props `{ image?: string; emoji: string; className?: string }`.
   Render `<img src={`${import.meta.env.BASE_URL}${image}`} alt="" loading="lazy" decoding="async">` when
   `image` is set, else the existing emoji span. One place owns the fallback.
3. **`src/components/Mascot.tsx`** (new): props `{ pose?: 'idle' | 'celebrate'; big?: boolean }`. Maps
   pose→art file with a 🦉 emoji fallback; reused by `HomeScreen` and `RoundComplete`.
4. **Swap call sites** to the new components (exact lines today):
   - `HomeScreen.tsx:24` mascot · `:90` theme icon (`theme.image`) · `:96`/`:106` activity icons
   - `ListenAndTap.tsx:131` picture cards (`opt.image`)
   - `BuildAPhrase.tsx:126` phrase illustration (`question.item.image`)
   - `RoundComplete.tsx:12` mascot → `pose={allCorrect ? 'celebrate' : 'idle'}` `big`
   - Leave the speaker `🔊` glyphs unless you also produced speaker art.
5. **CSS** (`src/styles/global.css`): emoji are sized by the **parent's `font-size`** today; images aren't,
   so add `width/height` + `object-fit: contain` rules **keyed to the same clamps** — e.g.
   `.pic-card__img { width:clamp(3rem,12vw,5rem); height:clamp(3rem,12vw,5rem); object-fit:contain }`,
   `.phrase-card__img { width:clamp(3.5rem,14vw,5.5rem) }`,
   `.mascot__img { width:clamp(3.5rem,12vw,6rem) }`, `.mascot--big .mascot__img { width:clamp(4.5rem,16vw,8rem) }`,
   `.activity-card__img { width:2.6rem }`, theme-banner icon ~1.4rem. This preserves exact current scale.
6. **App icons:** rewrite `scripts/make-icons.mjs` to use **`sharp`** (new devDependency) to generate
   `public/icons/icon-192.png`, `icon-512.png`, a **maskable** 512 (~20% safe padding), and
   `apple-touch-icon.png` from `owl-icon-master.png`; refresh `public/favicon.svg`. The `vite.config.ts`
   manifest already references these names — no manifest change needed (optionally update
   `theme_color`/`background_color` to the art palette). `index.html` icon links are auto-rebased by Vite.
7. **Data:** set `image` on each animal in `animals.ts` and on the `animals` theme (same file).

### Sequencing note
This breakout covers the **mascot + UI icons + the Animals set** (the only theme that exists today). Each
future theme (Phase 3) adds its art via the same naming checklist.

### Verification
- `npm run dev`: every screen shows real art; blank one `image` value → emoji fallback appears (no layout shift).
- `npm run build && npm run preview`: no 404s in console; check a narrow phone viewport and a wide tablet;
  reduced-motion still fine.
- `BASE_PATH=/sub/ npm run build && npm run preview` (Phase 5 mechanism): art still loads → confirms
  `BASE_URL` usage, nothing hardcoded to `/`.
- Reinstall the PWA and confirm the new standard + maskable app icons render on a device home screen.

---

## Phase 2 — Native Voiceover (replace TTS)

**Goal:** Play recorded clips from a native Finnish speaker, falling back to existing TTS when a clip
is missing or unavailable. Works offline after PWA install.

### Prerequisites
- A native Finnish speaker (the user has one). Content text frozen (run after Phase 3 ideally, so you
  record everything once). The `audio?: string` field already exists on `LexicalItem`.

### What needs audio
- **Words:** each `LexicalItem.fi`.
- **Full phrases:** each spoken sentence is `sentenceFor(construction, item)` (prefix + form + suffix).
  Add an optional `audio?` to `PhraseFill` (per construction×item) since phrase audio is combination-specific.
- (Phase 3 dialogues, if present, each line.)

### Recording pipeline
1. **Record-list generator** `scripts/record-list.mjs`: walk `src/content/*` and emit
   `audio-manifest.json` listing every required clip with its **target filename** and the **exact text**
   to read. Naming convention:
   - words → `public/audio/words/<itemId>.mp3`
   - phrases → `public/audio/phrases/<constructionId>__<itemId>.mp3`
2. **Recording guidance** (put in `README.md` / a `docs/recording.md`): quiet room, consistent mic
   distance, one phrase per take, leave to-be-trimmed gaps.
3. **Normalize** `scripts/normalize-audio.mjs` (ffmpeg): trim leading/trailing silence, loudness-normalize
   (EBU R128, e.g. `loudnorm`), export mono **MP3** (~96kbps; broadest support) or `.m4a/aac`.
4. Drop normalized files into `public/audio/...` per the manifest.

### Code changes
1. **Audio player** — extend `src/audio/speak.ts` (or add `src/audio/play.ts`): new `playClip(path, fallbackText)`
   that constructs `new Audio(`${import.meta.env.BASE_URL}${path}`)`, plays it, and on error/`onerror`
   (or missing path) calls the existing `speak(fallbackText)`. Pool/reuse `Audio` objects; cancel any in-flight.
2. **Call sites:** `ListenAndTap.tsx` → `playClip(item.audio, item.fi)`; `BuildAPhrase.tsx` →
   `playClip(fill.audio, sentenceFor(...))`. Keep the existing auto-play-after-delay + replay-button UX.
3. **PWA caching:** add `mp3`/`m4a` to `workbox.globPatterns` in `vite.config.ts` so clips precache for offline.
4. **Data:** fill `audio` on items and phrase fills as files are produced (fallback covers gaps meanwhile).

### Verification
- With a clip present → recorded voice plays; rename/remove it → TTS fallback (and no console crash).
- Install PWA, go offline → audio still plays (precached).
- Loudness consistent across clips (no jarring volume jumps).

---

## Phase 3 — Content + Tiers (scale up, native reviewer)

**Goal:** Add themes (colors, numbers, food, family) and higher-difficulty activities
(spelling/typing, word-order, short dialogues), with a native-reviewer workflow to keep Finnish correct.

### New themes
- One file per theme mirroring `animals.ts`: `src/content/colors.ts`, `numbers.ts`, `food.ts`, `family.ts`,
  plus matching constructions (extend `constructions.ts` or add per-theme construction files).
- Register in `src/content/index.ts` `themes` array (currently only `animals`). **Enable multi-theme UI:**
  `HomeScreen.tsx` lists themes → selecting one scopes the activity to that theme's items. Update
  `buildListenRound`/`buildPhraseRound` in `src/game/round.ts` to take a theme/item-pool argument.
- Tier each item/construction appropriately; gate activity/option difficulty by the profile `level` (existing
  level 1/2 = 3/4 options); reserve tier 3–4 for the new activities below.

### New activities (each = a component + a round builder + types)
- **Spelling / Typing** `src/components/SpellWord.tsx`: show illustration + play audio → child types the
  Finnish word. On-screen kid keyboard including **ä/ö** (don't rely on device keyboard). Accept exact match;
  forgiving feedback. Tier 3–4.
- **Word-order** `src/components/WordOrder.tsx`: tokenize a full sentence (prefix/form/suffix) into word
  chips, shuffle, child taps them into order. Reuses `Construction` data. Tier 3.
- **Short dialogues** `src/components/Dialogue.tsx`: new content type `Dialogue` in `types.ts`
  (2–4 lines, e.g. greeting exchange) with a "choose the right reply" interaction. Add `src/content/dialogues.ts`.

Add round builders in `src/game/round.ts` for each; extend the activity registry the home screen renders.

### Native-reviewer workflow
- **Validation script** `scripts/check-content.mjs` (also wire as a Phase 4 test): assert referential
  integrity — unique ids, every `PhraseFill.itemId` resolves, every construction has a form per intended
  item, every dialogue line resolves, and (once Phases 1–2 done) every item has `image`+`audio`. Add npm
  script `"check:content"`.
- **Review export** `scripts/content-review.mjs`: emit a human-readable **Markdown/CSV proofreading sheet**
  (Finnish text, English gloss, inflected forms, context) for the native reviewer to mark up. Feed
  corrections back into the `src/content/*` files. This is the "native reviewer" hook — review the *text*,
  not the *code*.

### Verification
- `node scripts/check-content.mjs` passes; `npm run typecheck` clean.
- Each new theme + activity playable in `npm run dev`; difficulty gating respects `level`.
- Reviewer sheet generates and round-trips a sample correction.

---

## Phase 4 — Automated Tests (Vitest + headless smoke) + CI

**Goal:** Make interactive behavior verifiable in CI (which couldn't run locally here). Vitest for
unit/component, Playwright for a headless-browser smoke test, GitHub Actions to run both.

### Tooling
- Add dev deps: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`,
  `@vitest/coverage-v8`, `@playwright/test`.
- Config: `vitest.config.ts` (or `test` block in `vite.config.ts`) with `environment: 'jsdom'`,
  `setupFiles` that **stub Web Speech / Web Audio** (not in jsdom) and fake timers; `playwright.config.ts`
  that boots `vite preview` as the web server.
- npm scripts: `"test"`, `"test:unit"` (vitest run), `"test:e2e"` (playwright), `"test:coverage"`.

### Unit / component tests (Vitest)
- **Round builders** (`src/game/round.ts`): invariants over many runs — correct question count, target
  always present, option count matches level, the answer is among options, distractors are distinct.
- **Content integrity:** reuse Phase 3's `check-content` logic as a test so bad data fails CI.
- **Profile** (`src/state/profile.tsx`): default load, persistence, `addStars`/`setLevel`, corrupt-storage
  fallback (and the Phase 6 migration once it exists).
- **Components:** render `ListenAndTap`/`BuildAPhrase` with mocked audio + fake timers; simulate a correct
  and an incorrect tap; assert star increment, wrong-answer highlight, and reaching `RoundComplete`.

### Headless smoke (Playwright)
- One spec: load home → enter a name → start Listen & Tap → answer the round → assert `RoundComplete`
  appears and stars rendered. Runs headless/Chromium in CI.
- **Routing (after the UI / Navigation Strategy lands):** once `HashRouter` + map/topic-hub replace the flat
  state machine (see "UI / Navigation Strategy" below), drive the smoke spec by navigation — profile picker →
  map → topic → activity → `RoundComplete` — and assert the browser **back** button walks back up the stack.
  Keep it a single happy-path through `GameFrame`.

### CI
- `.github/workflows/ci.yml`: on push/PR → `npm ci`, `npm run typecheck`, `npm run test:unit`,
  `npx playwright install --with-deps`, `npm run test:e2e`. (Deploy lives in Phase 5.)

### Verification
- `npm run test:unit` and `npm run test:e2e` green locally; CI workflow green on a PR; coverage report emits.

---

## Phase 5 — Hosting / Deploy (Netlify; GitHub Pages fallback)

**Goal:** Continuously deploy the PWA to a public URL so it can be installed on the kids' actual tablets,
with deploy previews per PR.

### Make base path portable (do this first — Phases 1/2 depend on it)
- In `vite.config.ts`: `base: process.env.BASE_PATH ?? '/'`. Netlify uses `/`; this lets a GitHub Pages
  build pass `BASE_PATH=/Finnish-Kids-Game/`. Confirm all asset refs already use `import.meta.env.BASE_URL`.

### Netlify (chosen)
- `netlify.toml`: `[build] command = "npm run build"`, `publish = "dist"`; pin Node version; SPA fallback
  `[[redirects]] from="/*" to="/index.html" status=200` (safe for refresh/deep links); ensure the service
  worker (`sw.js`) is served with no long-cache headers.
- Connect the GitHub repo in Netlify → automatic production deploys on the default branch + **deploy
  previews on every PR** + branch deploys (the scalability win). Optional custom domain.
- PWA at root `/` → manifest `start_url`/`scope` already correct; no subpath surgery needed.

### Tablet install
- Open the Netlify URL on each tablet → browser "Add to Home Screen" → installs the PWA (offline-capable).

### GitHub Pages fallback (documented, not primary)
- `.github/workflows/deploy-pages.yml` building with `BASE_PATH=/Finnish-Kids-Game/` and publishing `dist`
  via Pages; note the subpath affects the PWA scope. Keep as a backup path.

### Verification
- PR → Netlify deploy preview URL loads and is installable; production deploy on merge.
- Offline works after install; run a Lighthouse PWA check.
- Build once with a non-root `BASE_PATH` to confirm no hardcoded absolute asset paths slipped in.

---

## Phase 6 — Multi-child Profiles + Parent/Progress View (then SRS)

**Goal:** Support multiple children with separate progress, a parent/progress dashboard, and (later) a
spaced-repetition review engine. Builds on the existing `src/state/profile.tsx` Context.

### Data model + migration
- New schema `fkg.profiles.v2`: `{ children: Child[], activeId: string }` where
  `Child = { id, name, level, stars, createdAt, progress }`.
- **Migrate** the existing single `fkg.profile.v1` into one `Child` on first load (keep the old loader so no
  data is lost). Cover this in a Phase 4 test.
- Rework `ProfileProvider`/`useProfile` to expose the active child + `children` + `addChild`,
  `switchChild`, `removeChild`. Activities keep calling the same `level`/`addStars` API on the active child.

### UI
- **Profile picker** (`src/components/ProfilePicker.tsx`): choose/add a child (avatar = mascot variant);
  shown at launch and switchable from `HomeScreen.tsx`.
- **Parent area** (`src/components/ParentView.tsx`): behind a lightweight gate (simple math question or
  long-press) per kids-app convention. Shows per-child: total stars, per-theme mastery, items practiced,
  accuracy, recent activity.

### Progress tracking (substrate for the dashboard *and* SRS)
- Add an attempts log per child: `progress[itemId] = { seen, correct, lastSeenAt }`, updated by activities
  on each answer. Persist in localStorage alongside the profile.

### Spaced-repetition engine (later sub-phase)
- Scheduler util `src/game/srs.ts`: Leitner/SM-2-lite per (child, item) — track `box`/`interval`/`ease`/`due`.
  A **Review** activity + round builder selects **due** items across all themes, backfilling with new items
  when few are due. Keep it pure/deterministic so it's unit-testable (extend Phase 4 tests).

### Verification
- Old single profile migrates cleanly; add/switch/remove children persists across reloads.
- Activities update the active child's stars + attempts; parent view reflects them.
- SRS unit tests: due-date math, box promotion/demotion, selection prioritizes overdue items.

---

## Phase 7 — Capacitor Native Wrap (only if store distribution is wanted)

**Goal:** Ship to the App Store / Play Store by wrapping the existing web build in Capacitor. The app is
already backend-free and offline-capable, so this is mostly packaging.

### When to do this
- Only if you actually want native store distribution. The PWA (Phase 5) already covers tablet install.
- Needs an Apple Developer account ($99/yr) for iOS and a Google Play account ($25 one-time) for Android.

### Setup
- Add deps: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`.
- `npx cap init` → appId `com.desskit.kielipesa` (confirm), appName "Kielipesä". `capacitor.config.ts`:
  `webDir: 'dist'`. Build with **base `/`** (Netlify already uses `/`; relative paths via `BASE_URL` work in
  the webview). `npx cap add android` / `add ios`, then `npm run build && npx cap sync`.

### Native considerations
- **Service worker:** Capacitor serves assets from a local origin, so the PWA SW is redundant; conditionally
  skip `vite-plugin-pwa` for native builds (env flag) or confirm it's inert. Assets are already bundled in
  `dist`, so offline "just works".
- **Audio/art:** bundled clips/images play from the local origin — no network permission needed.
- **Icons/splash:** generate from the Phase 1 mascot master via `@capacitor/assets`.
- **Privacy:** no data collection / no network → simplest privacy labels; set an appropriate kids age rating
  and prepare store screenshots from real devices.

### Verification
- Runs on Android emulator/device and iOS simulator: art, audio, and offline all work.
- Produce signed build artifacts; dry-run the store listing checklists.

---

## Notes for whoever executes each phase
- Each phase is independent but assumes the **cross-cutting conventions** above (especially `BASE_URL`
  asset refs and graceful fallbacks).
- Re-run `npm run typecheck` after any schema change in `src/content/types.ts` — strict mode will surface
  every call site that needs updating.
- Keep `README.md` updated per phase (it currently advertises emoji/TTS placeholders and the roadmap).
- Develop on branch `claude/admiring-gauss-an28w5`; commit + push per phase; open a PR only if asked.

---

## Appendix A — Phase 1 Track A: Midjourney prompt pack

Palette: blue `#1d4ed8` + amber `#f59e0b`. Workflow: generate the **owl first** (Step 1), upscale, copy its
image URL = `<ANCHOR_URL>`. Reuse it as `--sref <ANCHOR_URL>` (style) for animals/icons and as the character
ref for owl poses — v6: `--cref <ANCHOR_URL> --cw 100`; v7: `--oref <ANCHOR_URL> --ow 100`. Keep
`--style raw --stylize 100`. MJ has no transparency → prompts request a solid background for clean cutouts.

**Step 1 — owl anchor (`owl-idle`):**
```
flat 2d vector illustration of a friendly cartoon owl teacher mascot, round chubby body, big round eyeglasses, big friendly eyes, warm gentle smile, soft little wings, standing and waving one wing hello, blue and amber accent colors, cute kawaii children's-app style, bold uniform clean outline, bright cheerful flat colors, simple rounded geometric shapes, minimal flat shading, single centered character, generous even margin, plain solid #f3f4f6 light-grey background, no text --ar 1:1 --style raw --stylize 100 --no letters, watermark, signature, gradient background, drop shadow, 3d render, photorealistic
```

**Step 2 — owl poses** (append `--cref <ANCHOR_URL> --cw 100` [v6] or `--oref <ANCHOR_URL> --ow 100` [v7]):
- celebrate: `the same friendly cartoon owl teacher mascot cheering with both wings raised high, joyful open smile, small sparkles and stars around it, …[same style tail]…`
- wave/point (optional): `the same owl teacher mascot pointing one wing to the side, encouraging gesture, warm smile, …`
- icon master (`owl-icon-master`, keep transparent PNG): `the same owl teacher mascot, front-facing head-and-shoulders bust, symmetrical, filling the frame with even margin, …`

**Step 3 — 8 animals** (subject + shared style tail + `--sref <ANCHOR_URL>`). Subjects (match `animals.ts` ids):
`cat` sitting · `dog` floppy ears · `bear` brown standing · `bunny` long ears sitting · `bird` small round
songbird side-profile (NOT an owl, no glasses) · `fish` round body · `horse` flowing mane · `cow` b/w spots.
Shared style tail = `, cute kawaii children's-app style, bold uniform clean outline, bright cheerful flat
colors, simple rounded shapes, minimal flat shading, single centered subject, generous even margin, plain
solid #f3f4f6 light-grey background, no text --ar 1:1 --style raw --stylize 100 --sref <ANCHOR_URL> --no
letters, watermark, signature, gradient background, drop shadow, 3d render, photorealistic`. (If a pale
subject blends into grey, switch background to "soft teal".)

**Step 4 — icons** (same tail + `--sref`): paw print → `themes/animals.webp`; speaker w/ two sound waves →
`ui/listen.webp`; two jigsaw pieces → `ui/build.webp`.

**Post-process → files:** upscale → remove background → trim/center on 512² → WebP. Save as
`art/animals/{cat,dog,bear,bunny,bird,fish,horse,cow}.webp`, `art/mascot/owl-{idle,celebrate,wave}.webp` +
`art/mascot/owl-icon-master.png`, `art/themes/animals.webp`, `art/ui/{listen,build}.webp`. Names match ids
so Track B is a drop-in.

---

## UI / Navigation Strategy (cross-phase)

### Context
The app outgrew its flat state machine (`src/App.tsx`: a `Screen` union now juggling home + 7 games) and its
single theme-first `HomeScreen` (4 themes, per-game availability hardcoded via `theme.countable` /
`theme.constructions`). With more themes (colors…), dialogue activities, multi-child profiles, a parent/progress
area, and spaced-repetition Review on the roadmap, navigation needs a real shell. **Locked product direction
(owner):**
- **Non-linear "map" home** — the journey-map *feel*, but roam-free (no locked topic sequence).
- **Topic = unit** — each topic has a landing page with its activities + progress + Review.
- **Light progression** — everything visible/pressure-free, BUT **difficulty tiers gate *within* a topic**:
  harder activities/tiers unlock once a child reaches that section's start level.

### Target experience (the shell)
1. **Profile picker** (launch) → pick/add a child (mascot-variant avatars). [Phase 6]
2. **Map home** — friendly, illustrated, *non-linear* map; each topic is a place-node showing a progress ring
   (stars/mastery) + the mascot. All topics roam-free. Slim **top bar**: mascot avatar (→ switch child), star
   total, ⚙ **grown-up** button (math-gated). A "⭐ Daily review" entry surfaces due SRS items across topics.
   [art = Phase 1; SRS = Phase 6]
3. **Topic hub** (unit page) — the topic's activities as cards (Listen, Build, Count, Match, Conjugate,
   Word-order, Spelling, Dialogue…), each with stars + lock state; a **★ Review** for the topic; topic progress.
   Cards render from a **registry** (below), not hardcoded.
4. **Activity** — runs in a shared **GameFrame** (back + progress + round loop + `RoundComplete`); interaction
   model unchanged.
5. **Grown-up area** (gated) — **Progress** (per child/topic/activity), **Profiles** (add/edit/remove child),
   **Settings** (audio mute, default difficulty, reduced-motion, UI-label language, reset data).

### Navigation / routing architecture
Replace the flat union with a route layer. **Recommended: `react-router-dom` `HashRouter`** — real
back-button/history (critical for PWA + Capacitor hardware back), deep links (resume a topic), and it sidesteps
base-path/redirect issues on GitHub Pages subpaths, Netlify, and Capacitor `file://` (no server rewrites). Routes:
`/` → ProfilePicker (→ `/map` if a child is active) · `/map` → MapHome · `/topic/:topicId` → TopicHub ·
`/topic/:topicId/:activityId` → Activity (GameFrame) · `/topic/:topicId/review` & `/review` → Review (SRS) ·
`/grown-up` (gate) → `/grown-up/{progress,profiles,settings}`. (No-dep alternative: a small `NavigationProvider`
route-stack context — same screens, more custom code, weaker history. Prefer HashRouter.)

### Component architecture (new + refactors; reuse what exists)
- **Reuse the CSS system as-is** (`src/styles/global.css`: tokens `--brand`/`--tap:64px`/`--radius`, BEM naming,
  `clamp()` responsive, reduced-motion). New blocks: `.app-shell`, `.top-bar`, `.map`, `.map-node`, `.topic-hub`,
  `.activity-tile`, `.lock`, `.grownup`.
- **Extract `GameFrame`** from the pattern duplicated across the 7 games (`ActivityHeader` + round loop +
  `RoundComplete`); each activity keeps only its question UI. Reuse existing `ActivityHeader.tsx`,
  `RoundComplete.tsx`.
- **Activity registry** (`src/game/activities.ts`, new) — declarative descriptors replacing the per-game gating
  now scattered across `HomeScreen`/`App` for all 7 games. Each: `{ id, titleFi, titleEn, icon, component,
  roundBuilder, requires:{ constructions?, countable?, globalContent?:'numbers'|'adjectives'|'verbs' },
  unlock:{ metric:'stars'|'level', in?:activityId, amount }, tier }`. TopicHub renders supported activities by
  checking `requires` against the theme; lock state from `unlock` vs progress; the router maps `:activityId` →
  component + content via `roundBuilder`. **This is the seam new activities plug into with no router/App edits**
  (round builders already live in `src/game/round.ts`).
- **MapHome** (`src/components/MapHome.tsx`) — renders `themes` (from `src/content/index.ts`) as nodes; start as
  a styled responsive grid that reads as a map, evolve to a full illustrated map once Phase 1 art lands. Shows
  per-topic progress + Daily-review entry.
- **TopicHub** (`TopicHub.tsx`), **AppShell/TopBar** (`AppShell.tsx`), grown-up (`ParentGate.tsx`,
  `ProgressView.tsx`, `Profiles.tsx`, `Settings.tsx`), **ProfilePicker.tsx**. (Spelling's on-screen ä/ö keyboard
  and the word-order chips already exist inside their game components — reuse them.)

### Difficulty / tier-gating model (owner's rule)
- Topics are **all open** (non-linear); gating applies to **difficulty within a topic**. Each activity/tier
  carries an `unlock` rule; tier-1 open by default, harder ones locked until the child hits that section's start
  level — e.g. *"Earn ⭐⭐ in Listen & Tap to open Build a Phrase,"* or unlock tier-2 content at level 2 / N
  topic-stars. Locked tiles show a friendly lock + hint (never a dead end).
- **Make `Tier` finally mean something**: filter content/option-count by unlocked tier (today tiers are unused;
  difficulty is only the runtime level 1/2 in `round.ts`). Builders already take counts — extend to accept a
  tier/level filter.

### Where each roadmap feature lives
- **Phase 1 art** → mascot in TopBar + map guide; topic/activity illustrations via `<Illustration>`; map nodes.
- **Phase 3 content/activities** → new themes appear as map nodes automatically (`themes[]`); new activities
  (e.g. Dialogues) are registry entries on TopicHub; consider promoting hidden `adjectives`/`verbs` into their
  own units. (Conjugate / Word-order / Spelling + Food / Family already shipped.)
- **Phase 6 profiles/progress/SRS** → ProfilePicker, grown-up Progress/Profiles, top-bar avatar switch; the
  progress model below; Review entries on map + each TopicHub.
- **Settings** (new, cheap first win) → audio mute (none today), default difficulty, reduced-motion, reset.

### State / data additions
- Extend the profile context (`src/state/profile.tsx`) to multi-child (Phase 6) and add a **progress model**:
  `progress[topicId][activityId] = { stars, plays, bestTier, unlockedTier, lastPlayed }` + per-item SRS
  scheduling. One structure powers map rings, topic-hub locks, tier-gating, the parent dashboard, and Review.
  Persist in localStorage; migrate `fkg.profile.v1`.

### Phased migration (each step independently shippable)
1. **Router + GameFrame extraction** — add HashRouter, move home + the 7 games under routes, extract
   `GameFrame`. Behavior identical; pure refactor (foundation).
2. **Activity registry + TopicHub** — replace the hardcoded gating with the registry; add per-topic hubs.
   Map = enhanced topic grid for now.
3. **Settings + grown-up gate** — cheapest visible win (audio mute, difficulty, reduced-motion).
4. **Profiles + progress model** (Phase 6) — ProfilePicker, progress tracking, top-bar avatar; enables
   tier-gating once progress exists.
5. **Map home** — swap the topic grid for the non-linear illustrated map (uses Phase 1 art).
6. **Dialogues + Review** (Phase 3 + SRS) — drop remaining activities into the registry; wire Review.

### Verification
- After step 1: every current game still launches and returns home; browser/Android back works; `npm run
  typecheck` clean; the Phase 4 smoke test updated for routes.
- Registry: adding a dummy descriptor surfaces a card only on the right topics (gating honored) with no
  `App.tsx`/router edits.
- Tier-gating: a fresh profile sees only tier-1 unlocked; hitting the threshold unlocks the next tier and the
  hint clears.
- Responsive/a11y: map + hub usable at narrow-phone and wide-tablet widths; 64px tap targets; reduced-motion
  respected; keyboard-navigable.
