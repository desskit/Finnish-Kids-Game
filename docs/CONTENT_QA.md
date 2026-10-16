# Content QA: before the children start

A deep pass over everything a child sees, before the children use the app. It
runs in course order, in three parts, so the units the children meet first
were checked first:

1. **Part 1:** the shared screens, units 1–8, and the rules every unit shares
   (pictures, stories, the native review's course order).
2. **Part 2:** units 9–22.
3. **Part 3:** units 23–37, the expert stories, and this report's last word.

The rules for the pass:

- **No new Finnish.** A corrected word form is the sourced form or a line
  already in the app. A changed hand-written line stays ⚠️ for the Finnish
  speaker, and appears in the questions below.
- **Never mark correct Finnish wrong.** If a "wrong" option might be fine
  Finnish, it's removed, not argued over.
- **The English is US English**, with one gloss per word everywhere.
- **Pictures:** look-alikes are kept apart in questions. A picture is
  redrawn only when it shows the wrong thing.

## Part 1: shared screens and units 1–8

### What was checked

- **Lesson cards:** each rule, its examples and its "try it" checks.
- **Steps:** every generated sentence (`docs/SENTENCE_AUDIT.md`), and that
  each right answer is right and each wrong one is wrong.
- **Why tips:** each matches its lesson.
- **Dialogues and scenes:** the Finnish, the English, and the wrong replies.
- **Stories:** the plot, every line, every question and true-or-false
  statement, and a storyboard of every page as the player draws it.
- **New words:** their glosses and second meanings, and their pictures.
- **Shared screens:**
  - home, the warm-up, Kertaus and the checkpoints;
  - the can-do statements, badges and Notebook;
  - the Alphabet corner;
  - the example sentences from Tatoeba;
  - a light pass over the grown-ups' screens.
- **Kid-safety:** nothing scary, unkind or sad.

### Fixed

| Where | Was | Now |
| --- | --- | --- |
| Picture answers (Listen & tap, Review, yes/no, counting, Hear it) | Look-alikes could sit side by side: son, brother and child; soup and porridge; draw and paint; smile and laugh | Never in the same question (`NEVER_TOGETHER`, 56 groups) |
| Review | Mixed verbs and nouns as options | Options are the same kind of word as the answer, each with a different picture |
| Verbs that shared an emoji with a noun | "Syö!" showed the table; "Istu!" the chair | Eat, sit, sing, draw, love, help, drive, run away, wake up, grow old, tall and weekend each have their own |
| Story pages | 11 pages where someone speaks but isn't in the picture (e.g. Aino on *hello-eero* p3) | Everyone who speaks is pictured |
| *three-cats* | The classmates were drawn as Leo, who joins the class later | Other children |
| *busy-park* | Grandma's dance drawn as a second Aino | Music notes |
| *open-window*, *morning* | "Huomenta!" in daylight | Morning light |
| *at-the-shop* | The question offered an apple, which the page also showed | Tomato, banana, cheese |
| *what-we-have* (unit 4) | Grandma's ball is the children's on the last page, so "Kenellä on pallo?" had two answers and "Ainolla on pallo" turned true | Aino says "Nyt meillä on pallo!", and nothing asks who has the ball |
| Story text | A word's punctuation could wrap onto a line by itself | Never splits |
| Story glossary | "Isä tuli" showed *fire*; *paljonko* had no gloss | *came (tulla) · fire (tuli)*; *how much* |
| Listen & tap, Review | Prompt "Mikä tämä on?" with an English that didn't match | "Mitä kuulit? · What did you hear?" |
| Generated sentences | "Tämä on nuori" (a thing that's young), "Minulla on vauva", "Minulla ei ole äitiä", "minun tuuleni", "minun poikani" | None of these: things aren't young, a child doesn't own a baby or the wind, never says they have no mom, and doesn't call a son "mine" |
| Generated sentences | "Minulla ei ole kaveria / kavereita" (I don't have a friend / any friends) | Never asked: a friend is kept out of "don't have", like the family |
| Words | *oppilas* = "pupil"; *syksy* = "autumn" | "student"; "autumn, fall" |
| Words | *pieni* = "small", *kiltti* = "kind" | Also "little"; also "nice, good" |
| Warm-up, checkpoint, grown-ups | "practise", "practised" | "practice", "practiced" |
| Example sentences | Five with British English ("in hospital", "sweets", "colour", a yard called a garden, "Mr Wood") | No longer shown |
| Home, a new player's first day | After the very first step, Continue offered "today's warm-up · 10 questions" of the step just played | The warm-up opens a *new* day with what came before it: only subjects practised before today count |
| Stats (grown-ups) | A new player's first game was counted twice, once without a date | Every player has their stats from the start (older profiles get theirs as they load), so each game counts once |
| Home | "Pelataan tänään! · Let's practice today" | "Let's play today" (what it says) |
| Course map | Units 8 and 19 had the same runner icon | Unit 19 (do it, don't, let's) points at you |
| Notebook | "N more lessons unlock" counted locked *units* | Counts the lessons still to come |
| Unit 8 lesson | Type 3 named only -lla, -nna, -sta, then gave *mennä* | Also -llä, -nnä, -stä |
| Teacher scenes | The teacher shown as the *teach* picture | The teacher's own picture |
| The wolf | Standing side on, it looked like a grey pony | Sits and howls at the moon |

### How it stays fixed

These rules are now tests:

- **Look-alikes:** every picture game is swept many times, and no question
  shows two pictures from one look-alike group (`apart.test.ts`).
- **Story pictures:** speakers are pictured, greetings match the time of day,
  and option pictures differ, with no wrong one a near-twin of the right one
  (`stories.test.ts`).
- **Own pictures:** a word with its own picture uses its own emoji
  (`coverage.test.ts`).
- **Glossary:** a spelling two words share shows both meanings
  (`unitStories.test.ts`).
- **Course order:** every entry of the Finnish check says where a child first
  meets it (`review.test.ts`).
- **The warm-up:** never sends a child back over what they first played today
  (`warmup.test.ts`).

### The Finnish check, in course order

Grown-ups → Finnish check now lists entries in the order the children meet
them:

1. the words on every screen (buttons, badges, the alphabet);
2. then unit 1, unit 2, and so on;
3. then what no game shows yet;
4. then the grown-ups' own screens.

The **Where** menu shows one unit at a time, with how much is left to check.
`docs/FINNISH_REVIEW.md` opens with the same order in a **Start here** table.

Some entries are written but never shown. For example, 55 "do you…?"
questions use verbs taught after the asking unit, and no game asks them.
They're listed as "Not in the course yet", so they can wait.

### Questions for the Finnish speaker (units 1–8)

Each question names the entry key, as the Finnish check shows it.

1. **`conversation:at-school:1`.** The model reply is *Hyvää huomenta,
   opettaja!* Do children address their teacher as *opettaja*, or would they
   use the teacher's name (or *ope*)?
2. **A bare *Ei.*:**
   - `conversation:what-is-this:3`: *Ei. Se on kello.*
   - `story:in-class:page-2` and `story:in-class:page-3`: *Ei. Tämä on kynä.*
   - `story:what-we-have:page-2`: *Ei. Minulla on kitara.*

   These answers to an *Onko…?* question start with a bare *Ei.*, while
   *going-out* models *Ei ole.* Is the bare *Ei.* natural here, or should the
   model answer echo the verb (*Ei ole.*)?
3. **`dialogue:nice-to-meet`.** The reply to *Hauska tutustua!* is *Niin
   sinuunkin!* Is that what a 7-year-old would say, or is *Samoin!* better?
4. **`dialogue:how-old` and `conversation:new-friend:2`.** The model answer is
   always *Olen seitsemänvuotias.* (seven). The Finnish is fine; it's noted
   because your child may not be seven.
5. **`dialogue:how-old`.** A wrong reply is written *Kiitos hyvää.*, but
   elsewhere *Kiitos, hyvää.* Which punctuation do you prefer?
6. **`story:what-we-have:page-4`.** *Nyt meillä on pallo!* is now Aino's line
   rather than the narrator's, so "we" is the children. Is it natural from her?

### Noted for later parts

- **Unit 11, *do-you-sing*:** Eero's "Hän tanssii" option shows the
  dancing-Aino picture.
- **Unit 20, *big-and-small*:**
  - The text calls Musti brown and Mirri white, but the pictures are a black
    and tan dog and a grey cat.
  - "Mirrin ruokaa" shows a table.
- **Unit 20 scene:** "iso, ruskea koira", against Musti's colors.
- **Unit 24, *park-and-library*:** the page moves from the library to a café,
  which has no backdrop.
- ***viedä*:** glossed "carry".
- **Two titles shared by a scene and a story:** *Uusi oppilas* (unit 29) and
  *Paljon tavaraa* (unit 32).
