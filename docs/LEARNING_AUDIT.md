# Learning-Value Audit v2 & Long-Term Roadmap

*The second deliberate pass comparing the app's learning design against
second-language-acquisition (SLA) research, written after the v1 roadmap was fully
implemented (see status below) and after the content/structure expansions of
PRs #14–#28 (speaking woven into every node, dialogue/small-talk depth,
places/plurals/i-wait-for nodes, numbers to 100, per-theme vocab depth, path
reorder). Part 1 is the review of what exists today; Parts 2–3 are the agreed
long-term plan. Nothing in Parts 2–3 is implemented yet.*

---

## Part 0 — v1 audit: fully shipped

Every item from the first audit is now live. Preserved here as a one-line record:

| v1 item | Status |
|---|---|
| P1-1 "Name it" production recall | ✅ `name` activity, in every warm-up ramp |
| P1-2 Review formats escalate with SRS box | ✅ recognition → production → spelling |
| P1-3 "Kuuntele lause" sentence listening | ✅ `listen-sentence` in warm-up ramps |
| P2-4 Gentle streak + due-review nudge | ✅ `src/game/streak.ts`, map badge |
| P3-5 "Sano se" speaking | ✅ + per-sound feedback, model→read→recall ramp, woven into every node |
| P3-6 Dialogues / greetings chapter | ✅ 25 exchanges + 4 small-talk scenes, Finnish-only top rung |
| P3-7 Kid-safety pass over example sentences | ✅ `kidSafeExamples` + Reading node |
| P3-8 Recorded native audio | ⏳ still open — carried into this roadmap (Phase E) |
| P3-9 Numbers past ten | ✅ 11–20 sourced + tens to 100 |

---

## Part 1 — Review: what the design gets right today

These converged strengths should be **protected** by every future change:

1. **Retrieval-first everywhere.** No passive flashcard mode exists; every game
   demands recall — tap, assemble, type, say. Node ramps move recognition →
   assembly → typing → speaking (`activities` arrays in `src/game/path.tsx`),
   mirroring skill-acquisition theory's declarative→procedural path.

2. **Honest adaptive difficulty** (`src/game/adapt.ts`). Levels are measured
   per (child, node) from rolling first-try accuracy; promotion steepens with
   level; each node's ladder depth is sized to how much real Finnish grammar its
   subject supports (locatives 8, single-case verbs 4).

3. **Real spaced repetition** (`src/game/srs.ts`, Leitner 5-box) with review
   formats that escalate by box, plus `familiarityWeigher` folding review into
   every ordinary round (~3× bias to met words without cutting off new ones).

4. **All Finnish sourced, never generated.** Every inflected form is looked up
   from the vendored inflection data; English morphology from AGID; semantic
   gating (`topics`/`excludeIds`/`requiresTags`, `src/content/semantics.ts`)
   stops grammatical nonsense. Input is always correct and sensible.

5. **A communicative spine now exists.** Greetings → small-talk scenes → the
   Finnish-only top rung (`showsGloss`), and speaking is woven into every
   content node with a model → read → recall presentation ramp — the child is
   asked to *use* Finnish, not only recognize it.

6. **A low affective filter.** No fail states; wrong answers teach (a wrong tap
   names the tapped thing); stuck-help (reveal-letter, skip) on every typing/tile
   game; per-node timers that only forfeit the first-try bonus, never punish.

7. **Formulaic chunks over paradigm tables.** Case endings are met inside
   meaningful carrier frames ("Minulla on ___", "Kissa on laatikossa"), exactly
   how usage-based acquisition describes early child L2 development.

---

## Part 2 — Review: the gaps

Grouped, each with the evidence in the code. These drive the roadmap in Part 3.

**A. Vocabulary is quizzed before it is ever taught.** Every word's first
encounter is a quiz question (guess from 3–4 tiles). All items are flat tier 1
(`toItem` in `src/content/index.ts`), so a brand-new child faces all 22 animals
from round one — there is no "meet the word" presentation moment and no staged
introduction. The hook already exists: the SRS map knows exactly which items are
unseen.

**B. Practice is child-steered with no guided session.** A child will grind one
favorite node; nothing assembles the pedagogically right ten minutes (due review
→ weak node → new material). The streak and due-badge exist but don't *guide* —
distributed, interleaved practice currently depends on the child's own choices.

**C. Grammar gets no spaced review.** SRS covers lexical items only
(`reviewItems` = nouns + picturable verbs + numbers). Constructions and cases
are drilled by level, then only revisited if the child happens to replay the
node — a mastered case decays silently.

**D. Functional Finnish gaps** — things a child would actually *use*:
- **Commands (TPR).** No imperative anywhere, yet the vendored verb data carries
  the full imperative paradigm (`imperative_active_positive_2sg` etc.). A
  "do what the owl says" listening game (Hyppää! Taputa!) is the most
  age-appropriate format in SLA for 6–8-year-olds.
- **Shopping.** `i-buy` (t6) is authored but wired to no node
  (`src/content/constructions.ts`); it pairs naturally with food/clothes and
  numbers-as-prices, and teaches the real partitive-vs-genitive object contrast
  ("Ostan maitoa" vs "Ostan omenan").
- **Yes/no questions.** No -ko/-kö anywhere ("Onko tämä kissa?").
- **Colors.** Seven color adjectives exist and a dialogue asks "Mikä on
  lempivärisi?", but colors are never taught as vocabulary (no node).

**E. The Finnish ear is under-trained.** Browser TTS remains the only audio.
Phonemic length (tuli/tuuli/tulli) — THE Finnish-specific listening skill — is
never drilled, and TTS is a shaky model for it. Recorded native audio (v1's
P3-8) is still the single biggest audio upgrade.

**F. No connected input.** Reading is single sentences (79 items / ~133
kid-safe sourced sentences; the node caps at L3); small talk is 4 short scenes.
There is no *story* — the largest missing input format for this age: an
illustrated 3–6 sentence mini-story read page by page.

**G. Quality-assurance debt on authored Finnish.** Vetting is ad-hoc
("⚠️ NEEDS NATIVE FINNISH VETTING" comments in `dialogues.ts` /
`conversations.ts`); the planned reviewer export (`scripts/content-review.mjs`)
was never built. As authored content grows (stories, dialogues), this becomes
the bottleneck — and Finnish correctness is the app's core promise.

**H. Smaller polish items.**
- Semantic gating is aging with the expanded pools: fast/slow can pair with
  things that don't move ("nopea luu" — a fast bone).
- Name dialogues hardcode "Nimeni on Aino" instead of the child's own profile
  name (a nominative slot — safe to substitute, no Finnish generated).
- Family (11) / places (12) / clothes (15) are capped by emoji-distinctness even
  though text-only games (spell/order) don't need emoji.
- Counting grammar caps at 20 while the tens (30–100) are recognition-only.

---

## Part 3 — The long-term roadmap

Phased in **pedagogy-per-effort** order, adjusted to the owner's priorities
(Phase A confirmed as the first implementation wave). Each numbered item is
roughly one build session.

### Phase A — Polish batch (first wave, owner's pick)
1. **Animacy gating for speed adjectives**: extend `src/content/semantics.ts` so
   fast/slow only pair with things that move (animals, family, vehicles);
   re-audit agreement pairings against the expanded noun pools.
2. **The child's real name in name dialogues**: replace the hardcoded
   "Nimeni on Aino" reply (and the `new-friend` scene's) with the active child's
   profile name — nominative slot only, so no Finnish is generated.
3. **Emoji-less vocabulary in text-only games**: let spell/order/build pools
   accept words without a distinct emoji, unlocking depth for the emoji-capped
   themes without touching the picture games.

### Phase B — "Teach before you test" + guided practice
4. **Meet-the-word moments**: when an unseen item (no SRS schedule) enters a
   round, show a no-stakes intro card first — picture + Finnish + TTS + English,
   one tap to continue — then quiz it. Trigger: SRS `seen === 0`; cap ~2–3 new
   introductions per round.
5. **"Today's adventure" guided session**: a one-tap map entry assembling ~3
   stops — due Review (if any) → the child's weakest recent node → the next path
   node. Reuses `selectReviewItems`, per-skill progress, `nextSkillId`. Free
   play stays untouched.
6. **Colors node** in First words: listen/name over the 7 color adjectives,
   rendered as color swatches (no art dependency); closes the lempiväri gap.

### Phase C — Functional Finnish + grammar retention
7. **TPR commands node ("Tee näin!")**: hear an imperative ("Hyppää!"), tap the
   matching action picture. Imperative 2sg forms added to the data build —
   sourced, verified present in the vendored verb data. A rection-free, high-fun
   node in Actions.
8. **Shopping node ("Kaupassa")**: wires the unused `i-buy`, the mass-noun
   partitive contrast, and numbers as prices; food/clothes pools.
9. **Yes/no questions ("Onko tämä…?")**: -ko carriers with Kyllä/Ei + full-answer
   replies (small authored set; needs native vetting).
10. **Grammar SRS**: fold carrier phrases into Review as sentence-format
    questions keyed by construction id (parallel schedule map, e.g. keys
    `con:<id>`), so cases get spaced retention like words do.
11. **Counting with tens**: let `buildCountingRound` draw tens (30–90) as counts
    at the top levels ("kolmekymmentä kissaa" — partitive singular, already
    sourced).

### Phase D — Input flood (the ceiling raiser)
12. ✅ **Story time ("Satuhetki")**: authored 3–6 sentence illustrated
    mini-stories read page by page, with comprehension taps at the end
    (`src/content/stories.ts`, `StoryTime.tsx`; Finnish-only at L5).
13. ⏳ **Minimal-pair ear training**: phonemic-length discrimination built ONLY
    from real sourced word pairs; honest only with recorded audio → still
    gated on Phase E item 15 (recorded native audio, user-owned).
14. ✅ **More scenes/dialogues**: shop, asking-for-help, and playdate scenes +
    the shop register (Saanko…?, Voitko auttaa?, Paljonko se maksaa?).

### Phase E — Quality infrastructure (parallel, ongoing)
15. **Recorded native audio** (user-owned; pipeline per ROADMAP Phase 2).
    Priority: dialogue/conversation lines first (fixed set, highest pragmatic
    value), then words.
16. ✅ **`scripts/content-review.ts`** (`npm run review:content`): exports ALL
    authored Finnish (dialogues, scenes, stories, carrier texts, sentence
    templates) to `docs/FINNISH_REVIEW.md` with per-entry vetted status from
    the reviewer-owned `data/finnish-vetted.json` — the vetting workflow that
    replaces the ⚠️ code comments.
17. **Parent "can-do" statements** on the dashboard ("Can greet and reply",
    "Can count to 20", "Can say where things are") derived from node levels —
    makes learning legible to the parent.

---

## Part 4 — Suggested build order

| Wave | Scope | Items |
|---|---|---|
| Next | Polish batch | A-1 animacy gating, A-2 real name, A-3 emoji-less words |
| +1 | Teach-before-test | B-4 meet-the-word, B-5 today's adventure, B-6 colors |
| +2 | Functional Finnish | C-7 TPR commands, C-8 shopping, C-9 questions |
| +3 | Grammar retention | C-10 grammar SRS, C-11 counting tens |
| +4 | Input flood | D-12 stories, D-13 minimal pairs, D-14 more scenes |
| Parallel | Quality infra | E-15 recorded audio, E-16 reviewer export, E-17 can-do |

Every item stays inside the golden rule: **no Finnish form is ever
rule-generated** — new forms (imperatives, question carriers, stories) are
either looked up from the vendored sourced data or human-authored and flagged
"⚠️ NEEDS NATIVE FINNISH VETTING" until reviewed.
