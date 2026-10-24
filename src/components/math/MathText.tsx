import { useState, type ReactNode } from 'react';
import { lookupWord } from '../../content/wordIndex';
import { mathGloss, valueOfWord } from '../../game/math';
import { speak } from '../../audio/speak';
import Quantity from './Quantity';

// Finnish on a math screen, every word tappable: tap one to hear it and see
// what it means. A NUMBER word shows how many, as dots — never its English, so
// a tap can't turn the math back into English ("kolme" is three dots). Other
// words show their English without any example that carries a digit
// (`mathGloss`: "puoli" is "half", not "… 7:30").

export default function MathText({ text, className }: { text: string; className?: string }) {
  const [tip, setTip] = useState<string | null>(null);
  const value = tip ? valueOfWord(tip) : undefined;
  const meaning = tip && value === undefined ? lookupWord(tip) : undefined;
  const tap = (word: string) => {
    speak(word);
    setTip((t) => (t === word ? null : word));
  };
  const words: ReactNode[] = text.split(/(\s+)/).map((chunk, i) =>
    /^\s*$/.test(chunk) ? (
      chunk
    ) : (
      <span key={i} className="math-text__chunk">
        {chunk.split(/([\p{L}-]+)/u).map((part, j) =>
          /\p{L}/u.test(part) ? (
            <button key={j} type="button" className="story-word" onClick={() => tap(part)}>
              {part}
            </button>
          ) : (
            part
          ),
        )}
      </span>
    ),
  );
  return (
    <span className={'math-text' + (className ? ` ${className}` : '')} lang="fi">
      {words}
      {tip && (
        <span className="math-tip" role="status">
          <strong>{tip}</strong>
          {value !== undefined ? (
            <>
              {' '}
              <Quantity groups={[value]} small />
            </>
          ) : meaning ? (
            <>
              {meaning.base.toLowerCase() !== tip.toLowerCase() && <> → {meaning.base}</>}
              {' · '}
              <span className="en">{mathGloss(meaning.en)}</span>
            </>
          ) : null}
        </span>
      )}
    </span>
  );
}
