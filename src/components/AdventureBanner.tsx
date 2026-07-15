interface AdventureLike {
  stepLabel: string | null;
  upNext: { titleFi: string; titleEn: string; icon: string } | null;
}

interface Props {
  adventure: AdventureLike;
}

// A quiet, non-blocking pill shown only during an active "Today's adventure"
// run, so the child (and a watching grown-up) can see it's a guided stop, not
// a random redirect, and what's coming after it. Purely informational — the
// back button (unchanged) is what actually advances to the next stop.
export default function AdventureBanner({ adventure }: Props) {
  if (!adventure.stepLabel) return null;
  return (
    <div className="adventure-banner" role="status">
      🎯 {adventure.stepLabel}
      {adventure.upNext && (
        <span className="adventure-banner__next">
          · Seuraavaksi {adventure.upNext.icon} <span className="en">Next up</span>
        </span>
      )}
    </div>
  );
}
