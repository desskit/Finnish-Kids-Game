import type { ReactNode } from 'react';

// Tiny renderer for the lesson/why-tip prose markup: **bold**, *Finnish* (set
// in italics, marked lang="fi" so screen readers switch voice), blank-line
// paragraphs, and "- " bullet lines. Authored content only — never user input.

function inline(text: string, keyBase: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={key} className="fi-word" lang="fi">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export default function Prose({ text, className }: { text: string; className?: string }) {
  const blocks = text.split(/\n\n+/);
  return (
    <div className={'prose' + (className ? ` ${className}` : '')}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n');
        const bullets = lines.filter((l) => l.startsWith('- '));
        const lead = lines.filter((l) => !l.startsWith('- '));
        return (
          <div key={bi}>
            {lead.length > 0 && <p>{inline(lead.join(' '), `p${bi}`)}</p>}
            {bullets.length > 0 && (
              <ul>
                {bullets.map((l, li) => (
                  <li key={li}>{inline(l.slice(2), `l${bi}-${li}`)}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
