// Ä and Ö as tap keys under a typing box, for a keyboard that hasn't got them
// (an English tablet or laptop). They type at the cursor and keep the device
// keyboard up: pressing one never takes the focus from the text box.

interface Props {
  /** Type this letter into the box. */
  onLetter: (letter: string) => void;
  disabled?: boolean;
}

const FINNISH_LETTERS = ['ä', 'ö'];

export default function FinnishLetters({ onLetter, disabled }: Props) {
  return (
    <div className="fi-letters" role="group" aria-label="Finnish letters">
      {FINNISH_LETTERS.map((letter) => (
        <button
          key={letter}
          type="button"
          className="fi-letters__key"
          lang="fi"
          // Keep the focus (and the caret) in the text box.
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onLetter(letter)}
          disabled={disabled}
          aria-label={`Type ${letter}`}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}
