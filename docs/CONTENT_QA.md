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
| Unit 1 lesson, Alphabet corner | "y is "ee" said with round lips": read quickly, it says y sounds like "ee", which it doesn't | "y sounds a bit like the "ew" in "few"" (the corner adds: lips in a small, tight circle) |
| Teacher scenes | The teacher shown as the *teach* picture | The teacher's own picture |
| The wolf | Standing side on, it looked like a grey pony | Sits and howls at the moon |
| Reply questions (dialogues and scenes) | Two options could differ only by punctuation: "Ole hyvä!" and "Ole hyvä.", or "Hyvää, kiitos!" and "Hyvää, kiitos." (3 of the 5 reply questions in one unit 1 checkpoint) | Options are compared as they're heard, so only one of each shows |
| Reply questions | A reply that also fits could be marked wrong: "Kiitos!" to "Hyvää ruokahalua!" or "Hyvää yötä!", "Pitsa." to "Mikä tämä on?", "Menen kotiin." to "Mihin sinä menet?" | Each prompt lists the other replies that fit it (`alsoFits`), and they're never offered as wrong answers. *good-night* no longer offers "Kiitos!" as wrong |
| Build a sentence | The prompt read "This is a ___." beside "brother", while the voice said "This is my brother." | The prompt shows the sentence it reads |
| Is this…? (yes/no) | The answer was spoken ("Ei, se on kynä.") but never shown | It replaces the question once answered |
| Checkpoint and story results | "Melkein! · Almost there" even at 0 of 9 | "Almost there" only when a child is one or two short; otherwise "Hyvä yritys! · Good try!" (already in the app) |

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
- **Reply options:** no two read alike, and no reply that fits is offered as a
  wrong one, across the whole set the Mestari step plays (`round.test.ts`,
  `dialogues.test.ts`).
- **Results:** "Almost there" only near the pass mark (`score.test.ts`).

### Live play

A bot played as a new player at phone width, from the first screen to unit
4's lesson: every lesson, step, story and checkpoint of units 1–3. It logged
what was spoken beside what was shown. Then the clock moved forward a day, and
then another:

- **The next day,** home offered "today's warm-up · a story to remember + 10
  questions". The warm-up opened with *Hei, Eero!*'s "Muistatko?" and its two
  questions, then asked about unit 2's new words.
- **The day after,** it was a plain 10-question warm-up: the story had had its
  one revisit.
- No screen threw an error or scrolled sideways.
- Once a question is answered, the Finnish it speaks is on screen. The
  listening games are the exception: they say a word for the child to find.

The bugs it found are in the table above: the warm-up on a first day, the
stats counted twice, the look-alike replies, "Almost there", the Build a
sentence prompt and the unshown yes/no answer.

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
7. **Replies that also fit.** These are never offered as wrong answers. Do you
   agree with each, and is any other reply right for a prompt?

   | Prompt | Its reply | Also fits |
   | --- | --- | --- |
   | `dialogue:how-are-you` *Mitä kuuluu?* | *Hyvää, kiitos!* | *Olen iloinen!* |
   | `dialogue:thanks` *Kiitos!* | *Ole hyvä!* | *Ei se mitään.* |
   | `dialogue:goodbye` *Näkemiin!* | *Hei hei!* | *Nähdään!* |
   | `dialogue:good-night` *Hyvää yötä!* | *Hyvää yötä!* | *Kiitos!*, *Kiitos samoin!* |
   | `dialogue:nice-to-meet` *Hauska tutustua!* | *Niin sinuunkin!* | *Kiitos samoin!* |

   Later units have more (`see-tomorrow`, `enjoy-meal`, `where-going`,
   `what-is-this`, `when-home` and the question words); they're in
   `src/content/dialogues.ts`. *good-night* now offers *Ole hyvä.* as a wrong
   reply, in place of *Kiitos!*.

## Part 2: units 9–22

### What was checked

The same checklist as part 1, for verbs, saying no, asking, feelings, likes,
want/can/may, the school day, seeing and waiting, the shop, do/don't/let's,
describing, comparing and "where". Also:

- **Choose the form:** all 1,258 questions these units can ask: answering,
  asking, verb types, "which ending?", do/don't/let's, and the degree,
  compare and "the most" games.
- **Generated tables:** the 72 -ko questions; every comparison is true; every
  form marked wrong ("slip") is wrong for the sentence's meaning.
- **Verb carriers:** every "Haluan / En halua / Osaan / Saanko ___" sentence.
- **A game-by-game sweep:** every game first met in units 4–22, played at
  phone width as a child would, with what's spoken logged beside what's shown.

### Fixed

| Where | Was | Now |
| --- | --- | --- |
| Unit 15, verb types | The tiles said "-lla, -nna, -sta" and "-ata, -ota, -uta", but the game asks about *mennä*, *kävellä* and *herätä* | Each tile shows an ä ending too, as the lessons do |
| Unit 19, do / don't / let's | It could ask for "Like!", "Don't like!", "Let's like!" | Never: feelings and states (like, love, want, cry, see, hear…) aren't commands |
| Unit 18 scene, *shopping-list* | The wrong reply *Ostetaan maito ja leipä.* is fine for the milk and bread on the list | *Ostan maito.*, which is wrong whatever it means |
| Unit 11 story, *do-you-sing* | A third, dancing girl on two pages | Music notes |
| Unit 20 story, *big-and-small* | Musti was "brown" and Mirri "white", but they're drawn as a black dog and a grey cat; "Mirrin ruokaa" showed a table | *Musti on musta.*, as he's drawn (and as his name says), and the questions follow; Mirri's food is food |
| Words | *pitkä* = "tall"; *hauska* = "funny" | Also "long"; also "fun" |
| Game labels | The English beside the Finnish wasn't its meaning: *Kenen se on?* · "Which one is it?" (units 6, 7, 22); *Kumpi?* · "Which is more?" (unit 21); *Mikä on oikein?* · "Look at the verb: which ending?" (units 17, 36); *Tee! Älä!* · "Do, don't, let's" and *Mitä pitää tehdä?* · "Tap what the command says" (unit 19); *Mikä sopii yhteen?* · "Pick the word with the matching ending" (units 20, 22) | "Whose is it?", "Which of the two?", "Which one is right?", "Do! Don't!", "What do you have to do?", "Which one goes with it?" |

### Questions for the Finnish speaker (units 9–22)

1. **`conversation:shopping-list:1`.** The wrong reply is now *Ostan maito.*
   Is that clearly wrong to you, as an answer to *Mitä me ostamme?*
2. **`story:big-and-small:page-1`.** *Musti on musta.* replaces *Musti on
   ruskea ja Mirri on valkoinen.*, to match the pictures. Fine?
3. **Commands (unit 19).** Do any of these sound odd as a bare command:
   *Älä auta!*, *Älä herää!*, *Älä vastaa!*, *Leikataan!*, *Korjataan!*?
4. **`slip:i-buy-some`.** For "I buy some bread", *Ostan leivän* (a whole
   loaf) is marked wrong. Is that right for the meaning?

## Part 3: units 23–37, the expert band, and the speaking game

### What was checked

The same checklist as parts 1 and 2, for going and coming, around town, by
bus, when, big numbers, months and birthdays, question words, me and you,
around things, many, verbs part 3, yesterday, real conversations, sentences
and Mestari. Also:

- **The stories:** all fifteen in these units (four are the core stories in
  `stories.ts`), and the fifth core story, *little-cat*, on the bookshelf.
  This covered each plot, every line, question and true-or-false statement,
  and who and what is in each picture.
- **Hand-written Finnish:**
  - the ordinals 11th–31st and the date patterns;
  - the pronoun table and its sentence frames;
  - the sentence templates (`docs/SENTENCE_AUDIT.md`, part 2).
- **Choose the form:** every question these units ask: three or third, dates,
  ages and me and you.
- **A game-by-game sweep** at phone width of the games first met here:
  building sentences, find the mistake, real sentences (Tatoeba), dates, ages,
  ordinals and me and you, with what's spoken beside what's shown.
- **The real sentences:** all 168 approved Tatoeba sentences, and their
  English.
- **The speaking game,** after you saw it move on too fast and struggle in a
  loud room.

### Fixed

| Where | Was | Now |
| --- | --- | --- |
| *Sano se* (speaking), every unit | Each try's result flashed for a second, then the game moved on by itself, so nobody saw which sounds were right. In a noisy room, silence or a recognizer error counted as a wrong try, and two ended the word | The result stays until **Jatka · Continue**, with a key to the colors (right, length, not yet). Silence and recognizer errors don't count as a try. A second tap on the mic says "done", and listening stops by itself after 8 seconds. After a miss, **Sanoin sen · I said it** lets a grown-up vouch for the try (a star, but no review credit). The app stops its own voice before listening, and stray words around the answer are ignored |
| *Sano se*, the length tip | "Hold the doubled letter" also showed when a child held a single letter too long | That case says "Keep the single letter short" |
| Alphabet corner and lesson, **ö** | Like the u in "fur" (which, in US English, comes with an r) | Like the u in "fur" without the r |
| Unit 23 lesson, *Mistä?* | "The cat jumps OFF the table", for *Kissa tulee pöydältä* | "The cat comes OFF the table" |
| Unit 24 story, *park-and-library* | Page 3 moved from the library to a café partway through, all drawn as the library | One place a page: the park, the library, the café (a new backdrop) and home. The lines are the same, regrouped |
| Unit 25 scene, *how-do-you-go* | The wrong reply *Piirrän kynää.* ("I'm drawing a pencil") is a fine answer to *Mitä teet koulussa?* | *Piirrän kynässä.* (in the pencil), which answers nothing |
| Unit 33 scene, *drawing-time* | The wrong reply *Ei kiitos.* could be a polite answer to "red or blue?" | *Valitset punaisen.* (YOU choose), the same kind of slip as the scene's first question |
| Units 29, 30, 32 | The story had the same title as the unit's scene: *Uusi oppilas*, *Auta minua!*, *Paljon tavaraa* | Each story is named with one of its own lines: *Minä olen Leo*, *Mirri, tule alas!*, *Missä ovat kenkäni?* A test keeps a unit's titles apart |
| Unit 30, a step | *Minua, minulle* was "Me and you" for the unit and "All of them together" for a step | "Me and you — all together" |
| Unit 32 story, *my-things* | Aino has three balls (and the question asks how many), but the picture showed one | Three balls |
| *viedä* | "carry" only, while the story says *Aino vie kissan kotiin* = "Aino takes the cat home" | Also "take (somewhere)", on the word card and in the story glossary |
| Unit 36, sentences | "I draw the flower" | "I draw a flower" (a new picture) |
| Real sentences (Mestari) | Five that broke the rules: *Hänestä tuli tähti* (a film star, not a star in the sky); a saying about a frog in a well; *Tavataan kahvilassa* as "Meet me down in the coffee shop"; *Hän loistaa matematiikassa* as "he is an ace"; *Jänikset tykkäävät porkkanoista* as "love" | Left out |
| The Finnish check | A wrong reply's key counted its place in the list, so adding or removing one renumbered the rest and lost the reviewer's ticks | Keyed by its own words (`line:Kaverilla.`), like the titles. A test keeps it so |

### Questions for the Finnish speaker (units 23–37)

1. **`line:Piirrän kynässä.`** (`conversation:how-do-you-go:3`). The wrong
   reply is now *Piirrän kynässä.* Clearly wrong to you, as an answer to
   *Mitä teet koulussa?*
2. **`line:Valitset punaisen.`** (`conversation:drawing-time:2`). The wrong
   reply is now *Valitset punaisen.* Fine?
3. **Story titles:** `title:Minä olen Leo`, `title:Mirri, tule alas!` and
   `title:Missä ovat kenkäni?`. Each is a line from its own story. Do they
   work as titles?
4. **`title:Minua, minulle`.** Unit 30 is "Me and you" in English, but the
   Finnish says "me, to me". Is there a better Finnish title?
5. **"I see him", "I see the dog".** The app marks *Näen häntä* and *Näen
   koiraa* wrong: in the "me and you" game (unit 30), in unit 17, and in find
   the mistake. That's the textbook rule, but a native speaker can say *Näen
   häntä joka päivä*. Right to keep them wrong for children?
6. **The ordinals 11th–31st** (`ordinal:eleventh` … `ordinal:thirty-first`,
   unit 28) are hand-written, e.g. *kahdeskymmenesensimmäinen*. Please check them, and say whether children
   would say *kahdeskymmenesyhdes* instead.
7. **`story:at-the-shop:page-4`.** Grandma says *Hyvää keittoa!* for "Good
   soup!" Natural, or *Onpa hyvää keittoa!*?
8. ***viedä*** is glossed "carry, take (somewhere)". Is "carry" a fair first
   meaning?

### For you, as the parent

- **The scripted replies give the child an age.** It's seven in unit 1 (*Olen
  seitsemänvuotias*) and eight at the birthday party in unit 28. Your
  children can say their own ages aloud. The games only ask them to pick the
  well-formed sentence.

## Where things stand

Every unit has been through the checklist. What's left is the Finnish
speaker's pass. The Grown-ups → Finnish check lists every entry in course
order, with a unit filter, so they can start with units 1–8, the part the
children meet first. The questions above, and those in parts 1 and 2, are the
places I'd like them to look first.

## Part 4: the lessons, in the new course order

The units now run: the opening story first, the first practice step, then the
lesson (a younger reader sees its notice cards), the rest of the steps with
any part-way lessons, the closing story and the checkpoint. This pass read
every lesson card in that order (all 44 units: main and part-way lessons,
notice picks, spoken cards), every "Why?" tip, the at-home ideas, and the
sentence audit, checking the grammar, the explanations and how each lesson
fits the steps around it.

### Fixed

| Where | Was | Now |
| --- | --- | --- |
| Opening story, The Finnish year | Midsummer, though the unit starts with Christmas | *Joulupukki tulee!* — the opener is a unit's FIRST story step |
| After a lesson, Question words and Many | "Start practicing" went to the step behind the part-way lesson, skipping it | it goes to that part-way lesson first (`hrefAfterLesson`) |
| Lesson screen | one lesson leading into the next opened on the previous one's card | every lesson starts at card 1 |
| Not having, "Why?" card | the -a ending for "more than one" | "and after numbers like *kaksi*" — the noun stays singular after a number |
| Going & coming, all six | into: "-an, -oon, -seen" | "-aan, -oon, -seen" |
| Asking, -ko / -kö | *Hyppäätkö?* — "jump" comes in unit 15 | *Piirrätkö?* (draw, unit 9) |
| Ordinals | "from the 3rd on they end in -s" (*yhdestoista* doesn't) | "from the 3rd to the 10th" |
| Question words, the "where" words | only -ssa / into / -sta | also -lla / -lle / -lta (*pöydällä, pöydälle, pöydältä*) |
| Many, "These are…" | read as if *Nämä ovat* takes the -t plural | *Missä ovat kirjat?* — and *Nämä ovat kirjoja*, the next lesson's plural |
| Whose, spoken card | *mun* and *sun* only | "and then often leave off the -ni or -si too" |
| Feelings, "Why?" tip for *Minua pelottaa* | "the feeling word in its 'it' form" | "*Minua* (me) + the feeling verb … It's never *minä* here." |
| How Finnish sounds, ö and y | no word on the lips | "with round lips", as the alphabet corner says |
| Notice cards: Play, My day, Verb types 5 & 6 | cards that skipped the very next steps (music before toys; meals without "at seven"; type 5 only) | the cards for the steps that follow |

### Checked and kept

- The English glosses say "my brother", "my friend's bike" for a bare family
  noun (*veljen*, *kaverin pyörä*). That is the natural English for these, by
  design (`MY_PEOPLE` in `types.ts`), so they stay.
- Two units read two lessons back to back (Question words, Many): the main
  lesson after the first step, then a part-way lesson for the very next step.
  Each is short, and play now goes from one into the other.
- The generated sentences have not changed since the last audit; a mechanical
  sweep (articles, doubled words, spacing) found nothing.
