# UI guide: the looks, the tokens and the motion

The app comes in three looks: **Day** (the regular look), **Night** (dark) and
**Pink**. Each player picks their own, and a player who hasn't picked follows
the device's light or dark setting. Every color, edge and shadow on a screen
comes from a set of tokens, so a screen styled with them works in all three.

The pictures and the scenery are in [`ART_GUIDE.md`](ART_GUIDE.md).

## Files

| Where | What |
| --- | --- |
| `src/styles/global.css` | All the styles. The looks' tokens are at the top; the motion section is at the bottom. |
| `src/styles/fonts.css` | The font, Baloo 2. |
| `src/theme/theme.ts` | The looks (`THEMES`), how a player's look is chosen, and `applyTheme`. |
| `src/theme/contrast.test.ts` | Checks each look's colors, and that no stray colors are used. |
| `src/components/LookPicker.tsx` | The look picker (the new-player form, the brush). |
| `src/art/Scenery.tsx` | The scenery in the look on screen. |
| `index.html` | A small script that paints the right look before the app loads. |

## The looks

- **The look on screen** is `html[data-theme]`: `day`, `night` or `pink`.
  - A player's own pick is `Child.theme`.
  - With no pick, the look follows the device: Night when it's in dark mode,
    Day otherwise. It also changes when the device switches.
- **Previews:** a screen can show another look for a while with
  `previewTheme`. The player screen uses this: it's everyone's screen, so it
  shows the device's look, or the look being picked.
- **The audit sandbox** never changes the look.
- **First paint:** the script in `index.html` sets `data-theme` and the
  browser bar's color before the app loads, so there's no flash of the wrong
  look.
  - Each look's bar color is its `--page-top`. `THEMES` in `theme.ts` and the
    script's list must agree; a test checks both.
- **A look inside another:** an element with `data-look="night"` shows that
  look inside the page's. The look picker's cards and each player's card on
  the player screen use this.
- **Switching looks** cross-fades (a view transition) where the browser can,
  unless motion is reduced.

## Tokens

`:root` holds Day's tokens; `[data-theme='night']` and `[data-theme='pink']`
change what they need. Use the tokens, never a literal color.

| Group | Tokens |
| --- | --- |
| The page | `--page`, `--page-top`, `--glow-1…3`, `--pattern` |
| Cards | `--surface`, `--surface-sunk` (a row inside a card), `--line`, `--field` (a text box's or a switch's edge) |
| Text | `--ink`, `--ink-soft` (English, notes) |
| Brand | `--brand` (main actions, Finnish words), `--brand-ink` (text on it), `--brand-soft`, `--brand-edge`; the second button color `--brand-2`, `--brand-2-ink`, `--brand-2-edge` |
| Accent | `--accent` (stars, selection rings, hints), `--accent-ink` (as text), `--accent-soft` and `--accent-line` (a tinted box) |
| Status | `--good`, `--bad`, `--warn`, `--info`, each with `-soft`; `--good-ink`, `--bad-ink`; `--good-line`, `--bad-line` |
| Tactile | `--edge`, `--raise`, `--raise-press`, `--ring-good`, `--ring-bad` |
| Other | `--warm-1`, `--warm-2`, `--warm-ink`, `--warm-edge` (the warm-up button); `--highlight`; `--focus`; `--knob` (a switch's knob); `--bar`; `--scrim`; `--well-*`; `--sheen` |
| Shape and shadow | `--radius`, `--radius-sm`, `--shade` (the shadows' color), `--shadow`, `--shadow-sm`, `--shadow-lift`, `--drop`, `--drop-lg`, `--tap` |

Units have their own colors (`src/game/path.tsx`). A unit's card sets
`--unit-accent`, and `--unit` is that color fitted to the look: Night lightens
the darker ones, and Pink blushes them toward its raspberry.

## Styling a new screen

1. **Colors come from the tokens.** `contrast.test.ts` fails on a literal
   color anywhere outside the token blocks. The only exceptions are the art's
   own colors: a story stage's sky while it loads, and the number tile's
   numeral.
2. **Text:**
   - `--ink` for text;
   - `--brand` for Finnish words;
   - English in a `.en` span (soft ink).

   A filled button's text is its `-ink` token.
3. **Something you can press** is a paper card: `background: var(--surface)`
   and `box-shadow: var(--raise)`. Add it to the lists in the motion section,
   so it lifts under the pointer and presses down.
4. **A colored button** is `--brand` with `--brand-ink` text, standing on
   `0 4px 0 var(--brand-edge)`.
5. **Right and wrong** are `--ring-good` and `--ring-bad`.
6. **A menu** (a list of things to pick) gets the class `stagger`, so it
   rises in.
7. **New colors:** if you put text on a background no test checks yet, add the
   pair to `contrast.test.ts`. Text needs 4.5 : 1; rings and edges need 3 : 1.
8. **Check all three looks.** Also check a player with no look, on a device in
   dark mode.

## Motion

Small and quick, and only where it helps.

| What | Where |
| --- | --- |
| Rising in, one item after another | lists with `stagger`: home tiles, units and their steps, players, achievements, the notebook, the alphabet corner, the grown-ups' tabs, the look picker |
| A 2-pixel lift and an icon's wiggle under the pointer | cards and buttons, on devices that hover |
| Pressing down onto the edge | everything you can press |
| A sweep of light every few seconds | the Continue button |
| A bump | a star count that just changed |
| Confetti | the end of a round |
| A cross-fade | changing look |
| Pictures and scenery | see `ART_GUIDE.md` |

**Reduced motion** is the device's setting or the app's own (Grown-ups →
Settings):
- every animation and transition ends at once, with no delays and no
  repeats (the hint's pulse and the listening microphone's pulse included);
- the Continue button's sweep, the one loop that's only decoration, also
  waits for `prefers-reduced-motion: no-preference`;
- pictures and the scenery show still, and the moving files aren't fetched;
- a change of look switches at once.

## The font

Baloo 2, a rounded and friendly typeface (SIL Open Font License), is
self-hosted from `@fontsource-variable/baloo-2`:
- variable files cover weights 400–800, one for Latin and one for Latin
  Extended (nothing else is loaded);
- the service worker caches it for offline play.

## Finnish on the screens

New Finnish labels go through the Finnish check:
- run `npm run review:content`, which updates `data/ui-finnish.json`;
- each word must be a form the word tables know, or be listed in
  `NOT_IN_TABLES` (`src/test/uiFinnish.test.ts`) with what it means.
