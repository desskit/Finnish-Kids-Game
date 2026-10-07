# Unit audit — all 36 units

This audit read every unit's lesson, steps, new words, games, ladder depth and
checkpoint. It asked two questions of each unit:

1. **Is the content strong enough?** Are there enough practice steps, is the
   lesson thin, and does every idea get practised?
2. **Is it easy to take in?** Does one lesson ask the child to hold two or three
   separate grammar ideas before practising any of them?

## The main finding: one lesson, several ideas

Fifteen units taught a second (or third) grammar idea in the opening lesson,
but practised it only steps later. For an 8-year-old the second idea is long
forgotten by then, or it muddles the first. ("Pidän + -sta" and "Rakastan +
-a" were read together, then drilled one after the other.)

**Fix:** each later idea moved into a short **part-way lesson**
(`Chapter.midLessons`), placed right before the step that practises it. It
opens once the steps above are done, so the child practises idea 1 first and
then reads about idea 2. Each part-way lesson has 3–4 cards and two "try it"
questions.

| Unit | Opening lesson | Part-way lesson (before step) |
| --- | --- | --- |
| 4 I have | *Minulla / sinulla on* | **Who has it? Everyone!** — hänellä, meillä, teillä, heillä (before *Who has what*) |
| 11 Feelings | *Olen / En ole iloinen* | **Hungry, thirsty, cold, hot** — *Minulla on nälkä* (before *Hungry, thirsty, cold*) |
| 12 Likes | *Pidän* + **-sta** | **Loving things** — *Rakastan* + **-a** (before *I love…*) |
| 16 Seeing | *Näen* + **-n** | **Watching and waiting** — *katson / odotan* + **-a** (before *Watching & waiting*) |
| 17 Shop | *Ostan omenan* (one whole) | **Buying some** — *Ostan maitoa* (before the new *Some of something* step) |
| 19 Describing | **Colors**, *Tämä on punainen* | **Describing words copy** — *isossa talossa* (before *Describe it*) |
| 20 Comparing | *isompi kuin* | **The biggest of all** — *isoin*, *paras* (before *The biggest*) |
| 21 Where | *-ssa / -lla* | **In MY house** — *talossani* (before *In my house*) |
| 22 Going & coming | *Mihin?* into / onto | **Coming out of, coming off** — *Mistä?* (before *Out of & off*) |
| 24 By & with | *bussilla, kynällä* | **With a friend: kanssa** (before *With a friend*) |
| 25 When? | days **-na**, times **-lla** | **What time is it?** — *Kello on…* (before *What time is it?*) |
| 26 Big numbers | 13–20, tens | **First, second, third** (before the ordinal words) |
| 27 Birthdays | months, *toukokuussa* | **Saying a date** (before *Dates*) · **How old are you?** (before *How old*) |
| 28 Question words | who, what, whose, why | **Where, where to, where from, when** (before the new *Where…* step) |
| 31 Many | **-t** plurals | **Some things** — *palloja* (before *Some & any*) · **In many boxes** — *laatikoissa* (before *In the boxes*) |
| 33 Yesterday | past **-i-** (*söin*), with KPT carried along | **"Didn't"** — *en syönyt* (before the new *What didn't happen* step) |

The three verbs units already had their KPT part-way lessons from the verbs
rework.

## Strengthened

- **Owners (7)** had a single practice step. It gains a sentence step,
  *Tämä on isän pyörä* (new carrier `owner-thing`), so the child builds the
  owner + **-n** inside a sentence, not just picks it.
- **Describing (19)** had one practice step, the agreement game, which was also
  its hardest idea. It gains *Tämä on punainen / Onko tämä sininen?* first.
- **Shop (17)** had one step mixing both object endings. It's now *one whole
  thing* → (part-way lesson) → *some of something* → *one or some?*
- **Yesterday (33)** drilled past and "didn't" together from the start. It's now
  past → (part-way lesson) → didn't → both. A new lesson card shows the k/p/t
  change carrying into the past (*nukuin* / *hän nukkui*).
- **Question words (28)** asked all ten question words in one step. It's now two
  halves split by a part-way lesson, then all ten together.
- **Thin lessons:** *Seeing* and *Shop* each had 4 cards and almost no
  explanation. Both now explain the idea, contrast it with the one before
  ("See it, or watch it?", "One apple — some milk") and ask two questions.
- **Every split lesson** got a second "try it" question where it had one.

## Checkpoints

The newer units had 20-question checkpoints (6–9 steps × 2–3 questions), about
twice as long as the early units'. Now, a unit with 5+ steps asks at most 2
questions per step, and its new-words steps ask one each. Every checkpoint is
between 8 and 18 questions (pinned by a test).

## Fixes found along the way

- **"This is a red."** A describing word after *Tämä on* got an English article.
  It's now "This is red."
- **"Read the lesson" links** from a review question now open the lesson that
  actually explains that sentence pattern (e.g. *Rakastan pitsaa* → *Loving
  things*), not the unit's opening lesson.

## Looked at and left alone

- **Order of units.** It still builds up sensibly: things → having → verbs →
  questions → feelings and likes → more verbs → objects → places → time and
  numbers → plurals → past. Every unit draws only on words met so far.
- **Hello, People, Numbers, Not having, Whose, Not doing, Asking, Wanting,
  Commands, Town, Around, Me & you, Chatting, Sentences:** one idea each, with
  practice that matches the lesson.
- **Big word lists** (Likes 17, Where 16, When 16) stay in one words step.
  Splitting them would add steps without adding grammar.

All new hand-authored Finnish (lesson prose, the `owner-thing` frame) is
flagged in `docs/FINNISH_REVIEW.md`.
