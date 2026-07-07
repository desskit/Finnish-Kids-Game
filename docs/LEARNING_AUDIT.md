# Learning-Value Audit & Pedagogy Roadmap

*A deliberate pass comparing the app's current learning design against modern
second-language-acquisition (SLA) research, with a prioritized roadmap of
improvements. Written after the app's core feature set stabilized (7 game
types, adaptive difficulty, SRS review, endless play, English→Finnish TTS
sequencing). Nothing in this document is implemented yet — it is the agreed
plan for future build sessions.*

---

## Part 1 — What the app already gets right

The current design didn't set out to follow SLA research explicitly, but it
converged on a lot of it. These strengths should be **protected** in future
changes:

1. **Retrieval practice everywhere (the testing effect).** Every game demands
   active recall — tap, assemble, type. There is no passive flash-card mode,
   which research consistently shows is the weaker format. Retrieval attempts,
   even failed ones, strengthen memory more than re-study.

2. **Real spaced repetition.** The Leitner 5-box SRS (`src/game/srs.ts`:
   same-day / 1 / 3 / 7 / 16-day intervals) credits only *first-try* answers,
   so guess-until-right can't fake mastery. On top of the explicit Review
   node, `familiarityWeigher` biases every ordinary round toward already-met
   words (~3×) without ever cutting off new ones — review is folded into
   normal play rather than quarantined in a chore screen.

3. **Interleaving.** A continuous session round-robins every unlocked game
   type for a node (`activityForRound`), and the capstone nodes mix all
   topics. Interleaved practice feels harder but measurably outperforms
   blocked drilling for retention and transfer.

4. **Adaptive difficulty done honestly.** Promotion needs a rolling ≥85–95%
   *first-try* accuracy window; demotion is fast (≤50%). Levels move tier
   gates, distractor trickiness, case counts, and verb-form coverage
   (`src/game/adapt.ts`). This is a working "zone of proximal development"
   mechanism with zero settings burden on the parent.

5. **Formulaic chunks over paradigm tables.** Children acquire carrier
   phrases ("Minulla on ___", "Kissa on laatikossa") as usable wholes —
   exactly how usage-based acquisition describes early L2 development. Case
   endings are met inside meaningful frames, never as declension charts.

6. **Recognition → assembly → production ramps.** Node ramps move from
   picking (build) to ordering (order) to typing (spell/sentence-type),
   mirroring skill-acquisition theory's declarative→procedural path. The new
   typing apexes are genuine production tests (English gloss in, Finnish
   out, no dictation).

7. **A low affective filter.** No timers, no lives, no failure screens.
   Endless play with silent level tracking, hints after repeated misses, and
   wrong answers that *teach* (a wrong picture-tap names the tapped item
   aloud). Anxiety suppresses acquisition in children; this design keeps it
   low without being aimless.

8. **Input is always correct and sensible.** Every Finnish form is looked up
   from sourced inflection tables, and semantic gating (topics/excludes/tags)
   prevents grammatical nonsense ("Minulla on taivas"). Learners never see
   malformed or absurd input — a quiet but real advantage over generated
   content.

---

## Part 2 — Gaps, with proposals

Ranked by **pedagogy-per-effort**: how much acquisition value each change buys
relative to how much new machinery it needs.

### P1 — High impact, mostly reuses existing infrastructure

These three are the recommended scope for the next build session.

#### 1. "Name it" — production recall for bare vocabulary

**Gap.** Listen & Tap and Review both run Finnish-audio → picture. That is
*recognition* — the easiest retrieval direction. There is no drill where the
child sees a picture and must *produce/select the Finnish word* until the
spelling apex (which starts as dictation). Vocabulary research (the
generation effect; Nation's receptive-vs-productive distinction) is clear
that recall in the harder, L1→L2 direction builds much stronger and more
usable knowledge.

**Proposal.** A new `name` activity: the picture is shown (plus its English
word for pre-readers, narrated via `speakEnglish`), and the child picks the
Finnish word from **word tiles** — the inverse of Listen & Tap. Correct →
the Finnish word is spoken.

**Reuse.** Target/distractor selection inverts `buildListenRound` (same
same-topic "tricky" logic); UI is the existing `word-tile` tray; slots into
the warm-up ramps via the existing mechanism, e.g.
`activities: ['listen', 'listen', 'name', 'match']` on every `listen-*` node.

#### 2. Review formats that escalate with mastery

**Gap.** The SRS scheduler is solid, but `ReviewActivity` drills every item
as picture-tap recognition forever — a box-5 "mastered" word gets the same
easy test as a day-one word. Desirable-difficulty research says retrieval
effort should *grow* with mastery, or the schedule over-credits shallow
knowledge.

**Proposal.** Format keyed to the item's SRS box:
- box 1–2 → picture-tap (recognition, current format)
- box 3–4 → "Name it" (production pick)
- box 5 → spelling (full written production)

**Reuse.** All three formats exist or arrive with P1-1; `ReviewActivity`
already snapshots per-item schedules, so the box is available at
round-build time. `SpellWord` already supports single-word targets.

#### 3. "Kuuntele lause" — sentence-level listening comprehension

**Gap.** All audio-first tasks are single words; every sentence-level task is
reading/assembly. Comprehensible-input research (and plain common sense
about how children acquire languages) wants meaning-bearing *listening*
slightly above the learner's level — currently the ear never trains past
one word.

**Proposal.** A new `listen-sentence` activity: a full Finnish carrier phrase
plays ("Kissa on laatikossa."), and the child picks the matching picture
from same-topic distractors. At higher levels, distractors share the noun
but differ in the relation (the cat *on* vs *in* the box → different
constructions), so comprehension of the case ending, not just the noun, is
tested.

**Reuse.** `sentenceFor` + existing TTS for the audio; constructions +
semantic gating for content; the `pic-card` grid for UI; tier gating from
the adaptive difficulty, exactly like BuildAPhrase.

### P2 — Habit & retention scaffolding

#### 4. A gentle daily-practice loop

**Gap.** Spacing only works if the child comes back across days, and nothing
in the app encourages a return visit. There are no streaks, daily goals, or
due-review nudges.

**Proposal (deliberately gentle — this is a small child, not a DAU metric):**
- A streak counter ("🔥 3 päivää putkeen!") on the map; a missed day quietly
  resets it with no guilt copy, no lost rewards, no notifications.
- A small "due" badge on the Review node when `selectReviewItems` has due
  items — making the existing scheduler visible at the right moment.

**Reuse/cost.** Two new fields on `Child` (`lastPlayedDay`, `streakDays`)
with the storage layer's existing graceful-migration convention; the due
count is already computable from `srs` + `Date.now()`.

### P3 — Bigger lifts, each its own future session

#### 5. Speaking — "Sano se" v1 (fully specced in Part 3 below)

#### 6. Dialogues / greetings chapter
Already on the CONTENT_GUIDE wishlist. "Moi! Mitä kuuluu?" with a
choose-the-right-reply mechanic brings pragmatic, communicative Finnish the
drill formats can't. Needs a new small content type (`Dialogue`) and one new
component; content must be human-authored like everything else.

#### 7. Kid-safety pass over the sourced example sentences
Every item already carries real Tatoeba example sentences
(`LexicalItem.examples`), stored but entirely unused pending a safety
review. One curation pass (script-assisted allowlist, human-reviewed like
`SENTENCE_AUDIT.md`) unlocks a rich pool of authentic input for future
listening/reading activities at near-zero content-authoring cost.

#### 8. Recorded native audio (ROADMAP Phase 2)
Browser TTS is the weakest link for ear training — prosody and vowel
quality matter for a language like Finnish with phonemic length. The
`LexicalItem.audio?` hook already exists; this stays a content project, and
it directly raises the ceiling of P1-3 and the speaking node's model audio.

#### 9. Minor content debt: numbers stop at ten
`buildCountingRound`'s `maxCount` lever scales to 20 at L6–8, but
`numbers.sourced.json` ends at ten — the top rungs of the count ladder add
nothing today. Either source 11–20 (yksitoista…kaksikymmentä) or re-cap the
lever at 10. Small, but it makes an advertised difficulty rung real.

---

## Part 3 — Speaking spec: "Sano se" (Say it) v1

*Design agreed now; implementation is a dedicated follow-up session. Nothing
below exists in code yet.*

### Mechanic
- The picture + Finnish word (or short carrier phrase) is shown; the model
  audio plays (TTS now, recorded audio later via the same call site).
- A large mic button starts listening — **the microphone only ever activates
  on an explicit tap**, never automatically.
- Recognition via the browser's built-in `SpeechRecognition`
  (`webkitSpeechRecognition` where prefixed): `lang: 'fi-FI'`,
  `interimResults: false`, `maxAlternatives: 5`.
- **Generous matching, by design.** Normalize (lowercase, strip punctuation
  and extra whitespace) and accept if *any* returned alternative is within a
  Levenshtein distance of ~¼ of the target's length. Child speech is hard
  for ASR; a strict matcher would punish good pronunciation and poison the
  feature. When in doubt, accept.

### Never a dead end
- Two unmatched attempts → the model replays, the child gets warm copy
  ("Hyvä yritys!"), and the round **advances anyway**. The visible star
  economy is not docked; the adaptive engine records it honestly as a
  non-first-try, same as every other game.

### Availability gating
- Feature-detect `SpeechRecognition`; where missing (Firefox) or when mic
  permission is denied, `say` steps are transparently filtered out of node
  ramps (each node falls back to its previous activity). This mirrors the
  existing `hasFinnishVoice()` graceful-degradation pattern — unsupported
  devices simply never see the feature.

### Placement
- New `ActivityKind 'say'` + `SayIt.tsx` component.
- Enters the warm-up ramps, e.g. `['listen', 'say', 'name', 'match']`, and
  later short-phrase variants can join the carrier-phrase nodes.

### Privacy (prominent, because the users are children)
- **Chrome/Edge/Android process speech in the cloud** — audio leaves the
  device for Google's servers. iOS Safari recognition is on-device.
- The grown-up dashboard must disclose this before the feature first
  activates, and the mic is strictly push-to-talk.

### Explicit non-goals for v1
- **No phoneme-level pronunciation scoring.** Real pronunciation assessment
  needs on-device acoustic models and per-phoneme alignment — a much larger,
  separate project. v1 answers only "did the child say something recognizably
  like the target?", framed positively.
- No recording storage of any kind; audio is never persisted.

---

## Part 4 — Suggested build order

| Session | Scope | Items |
|---|---|---|
| Next | New drills, high reuse | P1-1 "Name it", P1-2 review escalation, P1-3 "Kuuntele lause" |
| +1 | Habit loop | P2-4 streak + due-review nudge |
| +2 | Speaking | P3-5 "Sano se" v1 per the spec above |
| Later | Content sessions | P3-6 dialogues, P3-7 examples safety pass, P3-9 numbers 11–20 |
| Ongoing | Asset project | P3-8 recorded native audio |

Each of P1's three items is independently shippable; if a session runs short,
ship them in the listed order.
