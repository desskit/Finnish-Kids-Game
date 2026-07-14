// Hand-curated SEMANTIC constraints — kept apart from the sourced Finnish data
// and the grammar rules so a human can eyeball "which pairings make sense" in
// one place. Grammar stays correct no matter what; these lists only stop
// grammatically-valid NONSENSE the mixed pools would otherwise generate, e.g.
// "Kissa on huoneella" (the cat is on the room) or "kiltti sänky" (a kind bed).
//
// All ids below are curation ids from scripts/build-kids-data.mjs.

// --- Places: surfaces vs. containers -------------------------------------
//
// The locative cases split a place into two shapes:
//   • a SURFACE you sit ON / move ONTO / OFF  (adessive / allative / ablative)
//   • a CONTAINER you are IN / go INTO / OUT-OF (inessive / illative / elative)
// Which shape(s) each place supports is now a per-WORD tag ('surface' /
// 'container', many words carry both) — see PLACE_TAGS in
// scripts/build-kids-data.mjs and LexicalItem.tags. The locative carriers gate
// on these via `requiresTags` (constructions.ts), so a place like `car` that's
// tagged BOTH plays in every locative case, while `table` (surface only) never
// gets an "in the table" question.

/** The locative-shape tags a place word may carry. */
export const SURFACE_TAG = 'surface';
export const CONTAINER_TAG = 'container';

// --- Adjectives: animate-only -------------------------------------------
//
// Some adjectives describe a state a LIVING thing has (a happy dog, a tired
// baby) and read as nonsense on an object (a hungry sock, a kind bed). The
// agreement game only pairs these with animals/family; size/colour/age
// adjectives pair with anything.
export const ANIMATE_ONLY_ADJECTIVES = ['happy', 'tired', 'hungry', 'cute', 'kind'];

/** Topics whose words are living things an animate adjective can describe. */
export const ANIMATE_TOPICS = ['animals', 'family'];

/** True if an adjective (by id) only makes sense describing a living thing. */
export function isAnimateOnlyAdjective(id: string): boolean {
  return ANIMATE_ONLY_ADJECTIVES.includes(id);
}

/** True if a word's topic is a living thing (so animate adjectives fit it). */
export function isAnimateTopic(topic: string | undefined): boolean {
  return !!topic && ANIMATE_TOPICS.includes(topic);
}
