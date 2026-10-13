// Finding pictures in a rendered screen. Pictures are <Art> elements now, not
// emoji text, so tests look them up by the emoji they stand for (or their id).

import { glyphKey } from '../art/glyph';

/** Every picture on screen for an emoji ("🐱") or a picture id ("cat"). */
export function queryAllByPicture(glyphOrId: string, container: ParentNode = document.body): HTMLElement[] {
  const key = glyphKey(glyphOrId);
  return [...container.querySelectorAll<HTMLElement>('[data-emoji], [data-art]')].filter(
    (el) => (el.dataset.emoji !== undefined && glyphKey(el.dataset.emoji) === key) || el.dataset.art === glyphOrId,
  );
}

/** The one picture on screen for an emoji or id, or null. Throws if there are several. */
export function queryByPicture(glyphOrId: string, container?: ParentNode): HTMLElement | null {
  const all = queryAllByPicture(glyphOrId, container);
  if (all.length > 1) throw new Error(`Found ${all.length} pictures of ${glyphOrId}`);
  return all[0] ?? null;
}

/** The one picture on screen for an emoji or id. Throws unless there's exactly one. */
export function getByPicture(glyphOrId: string, container?: ParentNode): HTMLElement {
  const found = queryByPicture(glyphOrId, container);
  if (!found) throw new Error(`No picture of ${glyphOrId} on screen`);
  return found;
}
