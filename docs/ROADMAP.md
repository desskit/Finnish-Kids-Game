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

> **See also:** [docs/LEARNING_AUDIT.md](LEARNING_AUDIT.md) — the pedagogy audit and prioritized
> learning roadmap (new drill types, review escalation, habit loop, and the "Sano se" speaking spec).

### Decisions baked into these plans (from user)
- **Hosting = Netlify** (most feature-rich/scalable; deploy previews, branch deploys, room for
  serverless later). Keep Vite `base` configurable so **GitHub Pages remains a documented fallback**.
- **Art = pixel art drawn in code** (replacing the earlier plan of generated WebP art and an owl
  mascot): one 48-pixel set with a fox mascot, animated. See Phase 1 and `docs/ART_GUIDE.md`.

### Cross-cutting conventions (apply in every phase)
- **Reference all runtime assets via `import.meta.env.BASE_URL`** (e.g. `${import.meta.env.BASE_URL}art/animals/cat.webp`).
  This keeps art/audio portable across Netlify (`/`), a GitHub Pages subpath, and a Capacitor webview.
- **Never rule-generate Finnish.** Every inflected form stays hand-authored in `src/content/*`
  (this is an existing, deliberate constraint — keep it). Validation checks *presence*, not grammar.
- **Graceful fallback everywhere:** recorded audio → TTS; new profile schema → migrate old. (Pictures
  have no fallback: every emoji has one, and a test keeps it that way.)
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

## Phase 1 — The picture set (done)

**Status:** Done. Every emoji the app showed is now a picture from one pixel-art set, drawn in code:
- 357 pictures, most of them animated: faces blink, actions, animals and weather loop;
- 28 story backdrops for 16 settings;
- the app's icons, avatars, the fox mascot, and the app icon.

**How it works and how to add to it:** [`docs/ART_GUIDE.md`](ART_GUIDE.md). It covers the palette and the
drawing kit, the pixel rules, the cast, recipes and animation, backdrops, budgets, and the checks that keep
the set complete.

The earlier plan for this phase (flat illustrated WebP assets and an owl mascot) was replaced by this
pixel-art set, and its tracker files are gone.

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

**Status:** Done. `netlify.toml` added (build + SPA redirect + no-cache SW headers, Node 20); base
path already portable (`BASE_PATH` env, asset refs via `import.meta.env.BASE_URL`); a non-root
`BASE_PATH` build was verified to emit no hardcoded absolute asset paths. GitHub Pages fallback
workflow (`deploy.yml`) retained. Remaining manual step: connect the repo in the Netlify dashboard.

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

**Status:** Done. Multi-child profiles, the `fkg.profiles.v2` schema + v1 migration, the profile
picker, and the math-gated parent area (Progress / Profiles / Settings) were already in place. This
phase added the **per-item attempts log + spaced-repetition engine**: `src/game/srs.ts` (pure,
Leitner-lite, unit-tested), a `Child.srs` map backfilled on load, `recordAttempt` on the active
child wired into all four picture/word activities (first-try = correct), a cross-topic **Review**
activity (`/review`, reached from a map banner) with `buildReviewRound`, and an SRS mastery summary
(practiced / mastered / due / first-try accuracy) in the parent dashboard.

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

> **Status — implemented as *adaptive* difficulty (owner's later call).** Instead of
> locked tiles, difficulty now **adapts per (child, activity)** from measured
> accuracy — a pure, unit-tested engine (`src/game/adapt.ts`): a rolling
> accuracy window promotes (≥85%) / demotes (≤50%) the level with hysteresis.
> A level expands into real levers the builders already accept — option count,
> **construction `Tier` gate** (`buildPhraseRound`/`buildWordOrderRound` now take
> `maxTier`), Count & Say `maxCount`, and **verb tense/polarity combos**
> (present → +negative → +past, all sourced). `recordRound` updates the level
> via the shared pure reducer `src/game/progress.ts`; the router hands each
> activity its `difficulty` through `ActivityContext`. Progression is **visible**:
> level pips on the topic hub, an achievement `BADGES` set
> (`src/game/badges.ts`, derived purely from stats), and a level-up / new-badge
> moment on `RoundComplete`. The kid-facing toggle is **Auto / Easy / Hard**
> (Auto = adaptive; Easy/Hard pin the manual level). The parent dashboard shows
> each activity's level + recent-window accuracy so the adaptation is auditable.

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

> **Status (in progress):** Steps 1–4 are largely in place.
> - **Shell & routing:** `HashRouter` (`/`, `/topic/:topicId`,
>   `/topic/:topicId/:activityId`, `/profiles`, `/grown-up/*`), an `AppShell`
>   top bar, a roam-free `MapHome`, per-topic `TopicHub`s, and a declarative
>   activity **registry** (`src/game/activities.tsx`) that replaced the
>   hardcoded `canBuild`/`canCount`/`canMatch` gating. The flat `Screen` state
>   machine and `HomeScreen.tsx` are gone.
> - **Settings + grown-up gate (Step 3):** a math-gated `/grown-up` area with
>   **Progress** (a per child/topic/activity dashboard), **Profiles**
>   (add/rename/remove/switch), and **Settings** (mute audio, reduce motion,
>   reset all data). Mute + reduced-motion are bridged to the audio modules and
>   a root `data-reduced-motion` attribute.
> - **Profiles + progress (Step 4, begun):** multi-child profiles with a
>   `ProfilePicker` + top-bar avatar switch, and a per-topic/activity progress
>   model recorded on every finished round (via an `ActivityContext` consumed by
>   the shared `RoundComplete`). All persistence flows through
>   `src/state/storage.ts` — localStorage today, with `fkg.profile.v1` →
>   `fkg.profiles.v2` migration — which is the single seam a future cloud
>   backend (e.g. **Supabase**) slots into (likely turning `ProfileStore` async).
> - **Adaptive difficulty + progression (done):** per-(child, activity) adaptive
>   difficulty measured from accuracy (`src/game/adapt.ts` + `progress.ts`),
>   `Tier`-gated carrier phrases, expanding verb tense/polarity combos, an
>   achievement badge set (`src/game/badges.ts`), topic-hub level pips, and a
>   level-up / new-badge celebration on `RoundComplete`. Difficulty is Auto by
>   default with a manual Easy/Hard override; the parent dashboard surfaces each
>   activity's level + recent accuracy.
> - **Journey-path redesign (done):** the topic grid / `TopicHub` / activity
>   registry were replaced by a winding **journey path** of chapters → skill
>   nodes (`src/game/path.tsx`), organized by *usable Finnish* (carrier phrases,
>   counting, conjugation) with vocabulary as a mixed pool — not by
>   Animals/Numbers/Food/Family categories. Routes are now `/` (path) and
>   `/skill/:skillId`; progress is keyed by (chapter, skill). The path is
>   **art-ready** (per-node/chapter `art` + `accent`, optional `pos` coordinate
>   placement) and styled with placeholder emoji + a serpentine + progress rings.
>   A final **"Full sentences" chapter** is plumbed but **contentless**: a
>   `SentenceConstruction` type + `buildSentenceRound` already support
>   multi-object / adjective-agreement / verb-chain sentences, authored later in
>   `src/content/sentences.ts`. See **`docs/CONTENT_GUIDE.md`**.
> - **Still deferred:** the `GameFrame` extraction (held for the Phase 4 test
>   net), real illustration art, and the multi-slot sentence *content* +
>   greetings/dialogue content.

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
