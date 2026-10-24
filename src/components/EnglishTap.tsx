import { useEffect, useState } from 'react';
import Art from '../art/Art';

// A Finnish line's English, as the grown-ups' "English help" setting allows
// (src/game/learner.ts `showsEnglish`): shown, or a small 🇬🇧 to tap for it.
// Fading the English keeps the child on the Finnish, but a meaning is never
// out of reach.

interface Props {
  en: string;
  shown: boolean;
  className?: string;
  /** Inline (inside a chat bubble) or a block line (under a prompt). */
  as?: 'span' | 'p';
}

export default function EnglishTap({ en, shown, className = '', as = 'span' }: Props) {
  // (hidden, it carries none of the shown line's classes: there's no English on screen)
  const [open, setOpen] = useState(false);
  // A new line starts hidden again.
  useEffect(() => setOpen(false), [en]);
  const Tag = as;
  if (shown || open) return <Tag className={`en ${className}`.trim()}>{en}</Tag>;
  return (
    <Tag className="english-tap">
      <button type="button" className="english-tap__btn" onClick={() => setOpen(true)} aria-label={`Show the English: ${en}`}>
        <Art glyph="🇬🇧" /> <span className="en">English?</span>
      </button>
    </Tag>
  );
}
