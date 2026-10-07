# Audit: the English the child reads

The English is the meaning check. If it's clunky or wrong, the child learns a
wrong meaning, or stops trusting the hints. This audit generated every English
gloss:

- every carrier sentence × every word it allows;
- every sentence template × every swap;
- verb clauses, possessive glosses and commands;
- unit, step, lesson, badge and can-do text;
- stories and scenes.

## Fixed

| Where | Was | Now |
| --- | --- | --- |
| Writing / drawing with | *I write with on my phone.* | *I write on my phone.* · *I draw on the computer.* |
| *Olen laivalla* | *I'm ship.* | *I'm on the ship.* |
| Cat on a window / door / station / market | *The cat is on the window.* | *…at the window.* (also *goes to*, *comes away from*). Yard → *in the yard*. |
| Into / out of a tree | *The cat goes into the tree.* | *…goes up the tree.* / *…comes down from the tree.* |
| Buses, trains, planes | *The cat is in the bus.* · *I'm in the bus.* | *…on the bus.* · *I'm getting on / off the bus.* |
| Bed | *I'm in the bed.* · *I'm going to the bed.* | *I'm in bed.* · *I'm going to bed.* · *I'm getting out of bed.* |
| Car / taxi / boat | *I'm going to the car.* | *I'm getting into the car.* |
| Places you're AT | *I'm in the school / shop / zoo.* | *I'm at school.* · *…at the shop / zoo / café…* |
| Family | *Where is the mom?* · *The grandfather reads in the school.* | *Where is Mom?* · *Grandpa reads at school.* · *I play with Grandma.* |
| He/she | *She/He has a…* | *He/she has a…* (same as the rest of the app) |
| "te" | *you (plural)* | *you all* |
| Verb glosses | *viedä* = "take away", *etsiä* = "search" | "carry", "look for" |
| Whose unit | "my, your, **their**" for *kirjansa* | "my, your, his / her" |
| Likes unit title | *Tykkään* (a word the unit never uses) | *Pidän ja rakastan* |
| Repeated step titles in one unit | *Montako?* ×2, *Kenen?* ×2, *Missä se on?* ×2, *Olen…* ×2 | Each step has its own title (*Montako kynää?*, *Isän pyörä*, *Laatikossa, pöydällä*, *Olen puistossa*…) |
| Story | *dad's birthday* | *Dad's birthday* |

## How it stays fixed

- A carrier can now give a whole English sentence for one word
  (`Construction.sentenceById`), where English changes more than the noun
  ("goes **up** the tree").
- Mom / Dad / Grandma / Grandpa are named without "the" everywhere.
- Sentence templates use the sourced English he/she form ("watches"), not
  word + "s".
- Tests generate every carrier gloss and every template gloss, and fail on the
  broken patterns above.

## Also in this change: dates past the 10th

Dates now go up to the 31st. The ordinals *yhdestoista* to
*kolmaskymmenesensimmäinen* are **hand-authored**: the sourced Wiktionary data
stops at the 10th. They were cross-checked against an independent source, and
are flagged ⚠️ in `FINNISH_REVIEW.md` for native vetting.
