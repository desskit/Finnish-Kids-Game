// How a typed answer is compared with the sourced Finnish.
//
// The same letters count as the same answer however they were typed: in any
// case, with or without the sentence's punctuation, with stray or doubled
// spaces — and whichever way the keyboard encoded "ä" (one character, or "a"
// plus a combining ¨, which some keyboards send). Letters themselves are never
// loosened: "tuli" is not "tuuli", and "a" is not "ä".

/** A typed or target string, reduced to what has to match. */
export function normAnswer(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,!?;:"“”«»]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Has the child typed the answer? */
export function answerMatches(typed: string, target: string): boolean {
  return normAnswer(typed) === normAnswer(target);
}

/** Has the child typed enough to judge (as many letters as the answer has)? */
export function readyToJudge(typed: string, target: string): boolean {
  return normAnswer(typed).length >= normAnswer(target).length;
}

/** `value` with `letter` typed at the text box's cursor: the new value and caret. */
export function typeAt(
  input: { selectionStart: number | null; selectionEnd: number | null } | null,
  value: string,
  letter: string,
): { value: string; caret: number } {
  const start = input?.selectionStart ?? value.length;
  const end = input?.selectionEnd ?? value.length;
  return { value: value.slice(0, start) + letter + value.slice(end), caret: start + letter.length };
}
