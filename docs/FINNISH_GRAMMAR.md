# Finnish grammar reference — for authoring constructions

This is a working reference for whoever (human or future session) authors new
`Construction`/`SentenceConstruction` content. It exists because the app's golden
rule is **never generate or inflect Finnish in code** — every form a child sees is
*looked up* from the sourced inflection table by `case` + `number` tags. That means
correctness is decided here, at authoring time, not by any code path. Get the
case/number tag right and the form is guaranteed correct (it came from Wiktionary);
get it wrong and you've authored a grammatical error that will be looked up just as
faithfully.

Only **unambiguous** rules become content below — patterns where the case is
fixed by the construction itself, not by aspect/context the slot-filling code can't
see. (e.g. *rakastaa* "to love" always governs the partitive, so it's safe; many
other verbs shift between total/partial object depending on meaning, so they're
left out until the content model can represent that distinction.)

## Possession: `[possessor] + on + [possessed]`

Finnish has no verb "to have." Possession is existential: a possessor in the
**adessive** case + `on`/`ei ole` ("is"/"is not") + the possessed thing.

| Person | Adessive possessor | Example |
|---|---|---|
| minä (I) | minulla | Minulla on kissa. — I have a cat. |
| sinä (you) | sinulla | Sinulla on kissa. |
| hän (he/she) | hänellä | Hänellä on kissa. |
| me (we) | meillä | Meillä on kissa. |
| te (you pl.) | teillä | Teillä on kissa. |
| he (they) | heillä | Heillä on kissa. |

A noun can be the possessor the same way: *kissalla on häntä* ("the cat has a
tail" — lit. "on the cat is a tail").

**What case is the possessed thing?**
- **Nominative singular** — a definite, single, existing thing: *Minulla on
  kissa.* (I have a/the cat.)
- **Partitive singular** — under **negation**, regardless of quantity:
  *Minulla ei ole kissaa.* (I don't have a cat.) Negation in Finnish forces the
  partitive on the thing whose existence is being denied.
- **Partitive plural** — an indefinite/unspecified *quantity* of things, asserted
  or denied: *Minulla on kissoja.* (I have [some] cats.) / *Minulla ei ole
  kissoja.* (I don't have [any] cats.)
- **Partitive singular** — after a number ≥ 2 modifying the possessed noun (see
  "Counting" below): *Minulla on kaksi kissaa.* (I have two cats.)

So possessor person and possessed-noun case/number are independent dials: the
*possessor* changes who has it; the *case+number of the possessed slot* changes
whether it's "a cat" / "no cat" / "some cats" / "no cats."

## The partitive — when it is required

The partitive is Finnish's "indefinite/incomplete" case. It is **required**
(not optional/stylistic) in these situations:

1. **Negation.** A negated clause's object (or possessed thing, see above) goes
   to the partitive: *Näen koiran* (I see the dog, total object, genitive/
   accusative-looking singular) → *En näe koiraa* (I don't see a/the dog,
   partitive). The case-switch on negation is itself unambiguous and rule-governed
   — but turning a *specific construction* negative requires a second authored
   construction with `case: 'partitive'`, since the model has no "negate this"
   transform (golden rule: no rule-based inflection).
2. **Partitive-government verbs.** Some verbs always take a partitive object
   regardless of aspect — *rakastaa* (to love), *katsoa* (to watch/look at),
   *odottaa* (to wait for), *kuunnella* (to listen to), *tarvita* (to need),
   *pitää* (to like — already used by `i-like`, takes the **elative**, not the
   partitive; pitää + elative is a different, equally fixed rection: *pidän
   kissasta*). These are safe to author directly: `{ case: 'partitive', number:
   'singular' }`.
3. **Indefinite/unspecified plural quantity.** *Pöydällä on kirjoja* (there are
   [some] books on the table) — existential "there is/are" with plural,
   uncounted things uses partitive plural.
4. **Numbers ≥ 2.** A noun counted by a number two or higher takes partitive
   **singular** (not plural!): *kaksi kissaa* (two cats), *kolme koiraa* (three
   dogs). Counted by exactly 1, it stays nominative singular: *yksi kissa*. This
   is already implemented as a dedicated two-slot rule, not a `Construction` —
   see `countingNounForm()` in `src/content/types.ts`.
5. **Mass/uncountable nouns as an object.** *Juon maitoa* (I drink [some] milk)
   — not modeled in this app yet (no mass-noun pool), noted for later.
6. **After quantity words** (paljon "a lot of," vähän "a little," monta "many")
   — not yet modeled; would need the quantity word as fixed carrier text + a
   partitive slot, same shape as the postposition constructions already in
   `nounConstructions`.

## Object case: total vs. partial

A transitive verb's object is **total** (the whole/specific thing is affected) in
the genitive-looking singular — *Näen koiran* (I see the [whole] dog) — or
**partial** (incomplete/ongoing/some-of) in the partitive — *Syön omenaa* (I'm
eating [some of] the apple, not necessarily finishing it) vs. *Syön omenan* (I eat
the [whole] apple). **Negation always forces partitive**, overriding whatever the
positive sentence would use. The app's existing `i-see` construction (*Näen ___*,
genitive singular) is the total-object pattern; the new partitive-government verbs
above are the safe partial/always-partitive pattern. Aspectual total/partial pairs
on the *same* verb (most action verbs) are NOT modeled — the slot-filling model
picks one fixed case per construction, and a verb whose correct case depends on
whether the action is "finished" can't be represented without a second content
dimension (out of scope for this pass).

## How this maps to constructions (the authoring contract)

Each rule above becomes a `Construction` (`src/content/constructions.ts`) with a
**fixed** `case`/`number` — the rule is baked into which construction you picked,
not computed:

| Rule | Construction shape | `case` | `number` |
|---|---|---|---|
| Possession, definite singular | `[Possessor]lla on ___.` | nominative | singular |
| Possession, negated | `[Possessor]lla ei ole ___.` | partitive | singular |
| Possession, indefinite plural | `[Possessor]lla on ___.` | partitive | plural |
| Possession, negated plural | `[Possessor]lla ei ole ___.` | partitive | plural |
| Partitive-government verb | `Rakastan/Katson ___.` | partitive | singular |
| Total object | `Näen ___.` | genitive | singular |
| Counting (2+) | (two-slot, see `countingNounForm`) | partitive | singular |

Every new construction is automatically checked by `content.test.ts` (`'resolves
every shared noun construction for every animal'`): if the noun pool you intend to
use is missing the required inflected form, the test fails with the exact
construction + item id, rather than the gap surfacing as a silently-wrong round.
If a form is missing, fix it via the curation script
(`scripts/build-kids-data.mjs`) against the sourced dataset — never hand-type it.
