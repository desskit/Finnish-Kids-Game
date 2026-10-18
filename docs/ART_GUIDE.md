# Art guide: the picture set

Every picture in the app is pixel art drawn in code. There are no image files:
each picture is a small **recipe** that draws vector shapes with a shared kit.
The build samples the shapes onto a pixel grid and writes SVG sprites the app
loads. Every emoji the app used to show is now one of these pictures.

- **Look:** 48-pixel art. One-pixel outlines, a soft palette, flat colors with
  one shade each, and a soft ground shadow under things that stand.
- **Motion:** faces blink, and actions, animals, weather and rewards play short
  loops. Story backdrops and the app's scenery move gently. Small icons stay
  still.
- **Review:** `npm run art` also writes a gallery to `art-gallery/index.html`
  (and `publish.html`, the same page for sharing). It shows every picture
  moving and every backdrop. The folder is git-ignored.

## Files

| Where | What |
| --- | --- |
| `art/style.mjs` | The grid size (48 pixels across a picture). |
| `art/palette.mjs` | The only colors allowed. Each has a `…Shade` partner. |
| `art/kit.mjs` | The drawing kit (`makeKit`) and geometry helpers. |
| `art/pixel.mjs` | The rasterizer: vector shapes to pixels, outlines, frames. |
| `art/people.mjs` | The cast, the family and the one body plan everyone shares. |
| `art/faces.mjs` | The round face that feelings are drawn on. |
| `art/animals*.mjs` | Sitting, standing and small animals, and their heads. |
| `art/*.mjs` (others) | Drawings by subject: food, places, verbs, props, icons, badges, avatars… |
| `art/recipes/*.mjs` | The recipes: id, title, what emoji each replaces, motion, `draw`. |
| `art/scenes/*.mjs` | The story backdrops (and `parts.mjs`, `rooms.mjs`, `outdoors.mjs`, shared pieces), and `hero.mjs`, the app's scenery. |
| `art/patterns.mjs` | The tile behind the page in each look. |
| `art/index.mjs` | Lists every recipe module, backdrop and UI scene. Add new ones here. |
| `scripts/build-art.mjs` | The build: lint, rasterize, budgets, sprites, manifest, gallery. |
| `src/art/generated/` | What the build writes. Never edit by hand. |
| `src/art/Art.tsx` | `<Art>`, which draws a picture in place of an emoji, and `ArtText`. |
| `src/art/Avatar.tsx` | A player's avatar: the `avatar-<name>` head for their emoji. |
| `src/art/Scenery.tsx` | The app's scenery in the look on screen. |
| `scripts/make-icons.mjs` | The app icons and favicon, drawn from the pixel fox. |

## The pixel rules

A picture is drawn on a 64 × 64 canvas. The grid is 48 pixels across, so one
pixel is 4/3 of a canvas unit (`k.px`). Backdrops are 400 × 200 units with
pixels the same size, so the cast belongs in the scene.

- **Outlines are exactly one pixel:** the inner edge of each outlined shape's
  pixels. The edge of the canvas is not an edge, so a bust can run off the
  bottom.
- **Every pixel is one palette color.** Shapes are sampled at pixel centers
  with no blending. Only the ground shadow (`k.ground`) and a backdrop's light
  (`k.tint`) use opacity. The build rejects any color not in the palette.
- **Flat shapes** (`k.flat`, `k.flatCircle`, `k.flatEllipse`) have no outline:
  use them for shades, spots and stripes. A flat is clipped to the last
  outlined shape if at least half of it lies inside.
- **Limbs** (`k.limb`) need a width of at least 3.8 to keep a color stripe
  between their two outline pixels.
- **Eyes** (`k.eye(cx, cy, r)`) are a fixed pattern of pixels snapped to the
  grid, so a pair always matches. On the round face, `r` 3.2 gives eyes 4 × 5
  pixels wide. A scaled group scales its eyes too.
- **Paths** may use `M L H V C Q A Z` only (no `S` or `T`).
- **Small details:** a curve too small for the grid is noise. Keep mouths
  short, skip whiskers on small heads, and let `k.px` decide (the kit's `smile`
  draws a straight mouth on a coarse grid).

## The kit

`makeKit({ px, frame, frames, blink, moving })` gives each recipe `k`:

- **Shapes,** outlined: `circle`, `ellipse`, `rect`, `path`, and `poly`
  (a polygon with rounded corners). The flat versions are listed above.
- **Lines** (`line`) and groups (`g(transform, …)`), which move, turn or scale a
  part. Outlines stay one pixel.
- **The shared pieces:** `limb`, `eye`, `happyEye`, `sleepyEye`, `blush`,
  `smile`, `openSmile`, `shine` and `shineDot` (highlights, top left), `ground`
  (the shadow), `speed` (motion lines) and `tint` (a backdrop's light).
- **Helpers** from `kit.mjs`: `fmt`, `pt`, `polar`, `roundPoly`, `starPoints`,
  `heartPath`, `arcPath`, `ringSector`, `crescentPath` (shade just inside a
  circle) and `scallops`.
- **`k.P` is the palette.** `k.frame` and `k.frames` say which frame of a loop is
  being drawn, and `k.t` runs from 0 to 1 around the loop.

## The cast

`art/people.mjs` draws everyone with one chibi body plan: a big head, a short
body and chunky limbs. A person is a **look** (skin, hair, clothes) in a
**pose** (where the limbs go, which face).

| Who | Look |
| --- | --- |
| Aino 👧 | golden pigtails with red ties, a red dress |
| Eero 👦 | brown hair with a tuft, a blue shirt, sandy shorts |
| Leo 🧒 | dark curls, a green shirt, blue shorts. Also the "action kid" of the verbs |
| Äiti 👩 | long brown hair, a purple top, a navy skirt |
| Isä 👨 | ginger hair and beard, a teal shirt, navy trousers |
| Isoäiti 👵 | a grey bun, glasses, a pink cardigan |
| Opettaja 🧑‍🏫 | a dark bob, glasses, a mustard cardigan |
| Täti 👩‍🦰 (aunt) | a short ginger bob, a green dress |
| Setä 🧔 (uncle) | dark hair, a moustache, a grey flat cap, an orange shirt |
| Serkku 🧑‍🦱 (cousin) | a ginger ponytail with a yellow tie, freckles, a sky-blue shirt |
| Kapteeni 🧑‍✈️ (captain) | Leo in a captain's cap (white top, navy band, gold badge), saluting |

Mirri the cat is grey and striped, and Musti the dog is black and tan. Keep
these looks wherever the cast appears. The captain game's **Ei!** tile is the
captain with his arms crossed and a red ✗.

- **`person(k, look, pose)`** draws someone standing on the 64 canvas.
- **`placed(k, look, pose, x, ground, s)`** shrinks them and puts them at a spot
  in a bigger picture.
- **`portrait`** draws just the head. `hand` and `arm` draw a hand or an arm
  again over something held.
- **Pose fields:**
  - `head` and `look` (the face turned right or left);
  - `torso` (lean), `hips` (keep the shorts level while bending) and `tilt`
    (tip the head);
  - `armBack`, `armFront`, `legBack` and `legFront` as point lists, `toes` and
    `bob`;
  - `face`: `smile`, `grin`, `laugh`, `o`, `sleepy`, `sad` or `shut`.
- **Ready-made poses:** `POSES.stand`, `POSES.run`, `runPose(k)` and
  `walkPose(k)`.

## Adding a picture

1. **Draw it.** Write a function in the right `art/*.mjs` module. Reuse what
   exists: a person in a pose, an animal's head, `faceBase` for a feeling, the
   shared pieces.
2. **Add a recipe** to an `art/recipes/*.mjs` module:

   ```js
   { id: 'cat', title: 'cat (Mirri, her tail swaying)', motion: { frames: 4, fps: 3 }, draw: animals.cat }
   ```

   - **`id`:** lower-case words joined by hyphens.
     - A **word picture** uses its word's id (from `src/content/data`) and
       claims that word's emoji. Add `glyph: false` to leave the emoji to
       another picture.
     - A **UI picture** (`group: 'ui'`) must not use a word's id. It names its
       emoji in `glyphs: ['⚙️']`.
     - A **story prop** (`prop: true`) is not a word but goes in the words
       sprite. A story needs one when it shows something with no word. The
       clock faces are props too: every hour and half hour (🕐–🕧, drawn by
       `props.oclock(k, hour, minutes)`), shown by the stories and by the
       clock phrases (a phrase's `pictureById`).
     - `awaitingWord: 'sorsa'` draws a picture before its word's data arrives.
       It appears in the gallery, not the app.
   - **One emoji, one picture.** Claiming an emoji twice fails the build.
   - **`theme`** puts it in a gallery section, for pictures that aren't words.
3. **Run `npm run art`** and look at it in the gallery: moving at card size,
   still at 40 and 24 pixels.
4. **If its module is new,** add it to `art/index.mjs`.

## Animation

- **Loops.** `motion: { frames, fps }` (2–8 frames, at most 12 fps) makes a
  picture loop. The recipe draws each frame from `k.frame`. **Frame 0 is the
  still picture,** so make it the clearest pose. The build checks that the
  frames actually differ.
- **Blinking is free.** Anything drawn with `k.eye` blinks: the build draws one
  extra frame with the eyes shut and gives each picture its own timing, so
  faces don't blink together. The eyes must stay put in the loop for that (a
  picture whose eyes move doesn't blink). `blink: false` keeps the eyes of
  something that doesn't blink (a fish) open.
- **Where things move:**

  | `<Art motion=…>` | Where | What plays |
  | --- | --- | --- |
  | `"loop"` | the main picture on a screen: word intro, prompts, the story stage, the mascot, the reward toast | everything |
  | `"idle"` | answer cards, avatars | just the blink |
  | none | small icons, lists, the course map, grown-ups' screens | nothing |

  Reduced motion (the system setting or the app's own) shows every picture and
  backdrop still, and the moving sprite is never fetched.

## Story backdrops

A backdrop (`art/scenes/<id>.mjs`) is
`{ id, title, tones, motion?, drift?, draw(k, tone) }`:

- **Canvas:** 400 × 200 units, the cast standing near the bottom.
- **Tones** are inside, day, morning, evening, night, rain and snow. A
  backdrop is drawn in each tone its stories use, and every tone gets its own
  file. In the rain the sky is grey, puddles lie on the path and the rain
  falls (`rainFall`); in the snow the ground is white, snow lies on the trees,
  roofs and bushes (`snowCap`, `snowOnPine`, `snowOnRoof`) and more falls
  (`snowFall`). The forest, the yard and the park come in both.
- **`motion`** makes a moving version: stars twinkle, lamps glow, water
  rolls. `k.moving` is set while it's drawn. A tone can move at its own pace
  (`motion.byTone`): the rain falls faster than the yard's smoke rises.
- **`drift(k, tone)`** draws a layer (clouds) that slides slowly across the
  moving version.

Stories pick a backdrop with `sc('kitchen', '👧 🥛', 'morning')`. The tone is
only written when it isn't the usual one: inside for indoor settings
(`INDOORS` in `src/content/storyKit.ts`), day outdoors. `stories.test.ts`
checks that every page's setting is drawn in its tone. A new setting needs its
backdrop, an entry in `SCENES` (`art/index.mjs`), and `INDOORS` if it's
indoors.

## The app's scenery

`art/scenes/hero.mjs` is the cottage by the lake with the fox on the shore,
drawn once for each look (`src/theme`):

| Look | The scene |
| --- | --- |
| day | a Finnish summer: the red cottage, birches, a dock, the sun |
| night | a snowy night: lit windows, a snowman, the moon, the northern lights |
| pink | candy hills, a pink cottage, birches in blossom, a rainbow, the fox holding heart balloons |

- **It's a UI scene,** listed in `UI_SCENES` (`art/index.mjs`), not `SCENES`.
  The build writes it to `src/art/generated/scenery/` and lists it in
  `UI_BACKDROPS`, so a story can't pick it.
- **Its size:** 600 × 200, wider than a backdrop. A scene may set its own
  `w` and `h`, and its budget grows with its area.
- **Where it shows:** `<Scenery>` draws it in the look on screen: the banner
  on the home screen and the player screen, and (still) on the look picker's
  cards.
- **Cropping:** the banner has the scene's own shape, so it shows all of it.
  The look picker's small cards show only the middle, so the fox and the
  cottage stay there, and the clouds stay well inside the frame.
- **Motion:** it moves where motion is allowed: the clouds bob, the fox's tail
  swings, the lake glints, stars twinkle, the northern lights shimmer (they
  taper out at both ends), and the balloons bob.

## Background patterns

`art/patterns.mjs` holds one small tile per look:
- **Day:** sparkles and clover dots.
- **Night:** stars.
- **Pink:** hearts.

Each tile is a square of pixels in one palette color at a low opacity (at
most 0.6, and in practice much less). The build writes
`src/art/generated/patterns/<look>.svg`. Each look sets `--pattern` in
`global.css`, and the page tiles it at 2 screen pixels per pixel.

## Budgets and sprites

| | Budget |
| --- | --- |
| A still picture | 6,000 bytes |
| A moving picture | 16,000 bytes |
| A still backdrop | 40,000 bytes |
| A moving backdrop | 60,000 bytes |

A UI scene's budget is a backdrop's, times its area over a backdrop's (the
600 × 200 scenery gets 1.5 times as much). The build fails a picture over
budget. Simpler shapes or fewer changing pixels
per frame bring it down.

- **`ui.svg`** holds the UI pictures: buttons, badges, the course map's icons
  and the avatars. Nearly every screen shows some.
- **`words.svg`** holds the word pictures and story props.
- **`motion.svg`** holds the moving versions.
- **Backdrops** are separate files under `src/art/generated/scenes/`, and the
  app's scenery under `src/art/generated/scenery/`.

Each sprite is fetched the first time a picture from it is drawn, and
`motion.svg` the first time something moves. The service worker caches them
all for offline play.

## Keeping it complete

- **`src/art/coverage.test.ts`** checks that every emoji in the source (in
  strings and JSX text) and in the word data has a picture, or is a keycap the
  number tile shows. Draw the picture before using a new emoji: `<Art>` draws
  nothing for an emoji without one.
- **No emoji as text.** `src/App.test.tsx` and the e2e smoke test check that
  the main screens show no emoji as text.
- **`npm run art -- --check`** (run by `src/art/generated.test.ts`) fails when
  `src/art/generated` is out of date or a picture fails the lint.

## The app icon

`npm run icons` draws `public/icons/*.png` and `public/favicon.svg` from the
pixel fox (`avatar-fox`), using the build's own rasterizer. The icons are
committed: run it again after changing the fox.
