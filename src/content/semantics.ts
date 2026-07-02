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
// Most place words are naturally one or the other (a table is a surface, a
// room is a container); a few are both (a box, a basket, a bed). The locative
// carrier phrases exclude the ids that don't fit their case group.

/** Place ids you canNOT sensibly be "on" — exclude from adessive/allative/ablative. */
export const NON_SURFACE_PLACES = ['house', 'room', 'car', 'school', 'tree', 'forest', 'bag'];

/** Place ids you canNOT sensibly be "in" — exclude from inessive/illative/elative. */
export const NON_CONTAINER_PLACES = ['table', 'chair'];

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
