import type { ArtId } from '../../art/generated/manifest';
import Art from '../../art/Art';
import Avatar from '../../art/Avatar';
import SpeakerIcon from '../../art/SpeakerIcon';
import { LIFT_OFF } from '../../content/mathProblems';
import { numberWord, teenTail, type MathProblem } from '../../game/math';
import { speak } from '../../audio/speak';
import Quantity from './Quantity';

// What each math game shows above its question: the apple tree and its basket,
// the scale, the train (and the rocket), the fox with something to count, the
// teen being built. The pictures never count FOR the child while a problem is
// asked — no dots, no digits — except the apple tree's apples at levels 1–2.
// Once it's answered, each scene shows why the answer is right: the apples in
// the basket, the scale tipping, the gap in the train filled, dots in frames.

export type MathGame = 'listen' | 'tree' | 'scale' | 'train' | 'word' | 'build' | 'quick';

/** The scale's pans are its choices (when answers are tapped). */
export const ownsChoices = (game: MathGame): boolean => game === 'scale';

/** Choosing by tapping the scene itself (the scale's pans). */
export interface SceneChoose {
  wrong: number[];
  picked: number | null;
  /** Choices only heard: the first tap says it, the second picks it. */
  heard: boolean;
  onChoose: (v: number) => void;
}

interface Props {
  game: MathGame;
  q: MathProblem;
  /** Answered: right, or shown after a give-up. */
  answered: boolean;
  /** The words are on screen (lower levels, or "Lue" tapped); else only heard. */
  wordsShown: boolean;
  /** Things to count while it's asked: the apple tree at levels 1–2. */
  countable: boolean;
  choose?: SceneChoose;
  /** The player's avatar: "sinä" in a word problem. */
  avatar?: string;
}

export function MathScene(p: Props) {
  const s = p.q.show;
  switch (p.game) {
    case 'tree':
      return s.kind === 'plus' || s.kind === 'minus' ? <TreeScene {...p} /> : <HostScene {...p} />;
    case 'scale':
      return s.kind === 'compare' ? <ScaleScene {...p} /> : <HostScene {...p} />;
    case 'train':
      if (s.kind === 'run' && s.countdown) return <RocketScene {...p} />;
      return s.kind === 'run' && s.gap ? <TrainScene {...p} /> : <HostScene {...p} />;
    case 'word':
      return p.q.noun ? <WordScene {...p} /> : <HostScene {...p} />;
    case 'build':
      return s.kind === 'parts' ? <BuildScene {...p} /> : <HostScene {...p} />;
    default:
      return <HostScene {...p} />;
  }
}

/** Why the answer is right, drawn: dots in ten-frames, never a digit. */
export function Why({ q }: { q: MathProblem }) {
  const s = q.show;
  switch (s.kind) {
    case 'plus':
      return <Quantity groups={[s.a, s.b]} className="math-why" />;
    case 'minus':
      return <Quantity groups={[s.a, s.b]} takeAway className="math-why" />;
    case 'compare':
      return (
        <span className="math-why math-why--pair">
          <Quantity groups={[s.a]} small />
          <Quantity groups={[s.b]} small />
        </span>
      );
    case 'run':
      return (
        <span className="math-why math-run" lang="fi">
          {s.values.map((v, i) => (
            <span key={i} className={'math-run__word' + (v === s.missing ? ' math-run__word--answer' : '')}>
              {numberWord(v)}
            </span>
          ))}
        </span>
      );
    case 'parts':
      return <Quantity groups={[10, s.base]} className="math-why" />;
  }
}

/** The fox asks; once answered, the answer's picture. */
function HostScene({ q, answered, game }: Props) {
  return (
    <div className={'math-scene math-host' + (game === 'quick' ? ' math-host--quick' : '')}>
      {answered ? <Why q={q} /> : <Art id="fox" motion="loop" className="math-host__fox" />}
    </div>
  );
}

// --- The apple tree ------------------------------------------------------------

/**
 * Plus: the first apples drop into the basket, then the rest. Minus: the
 * basket holds them all, and the ones taken away lift out. At levels 1–2 it
 * happens as the problem is said; higher up the basket waits, covered, and the
 * apples only come once it's answered.
 */
function TreeScene({ q, answered, countable }: Props) {
  const s = q.show as { kind: 'plus' | 'minus'; a: number; b: number };
  const fill = countable || answered;
  // plus: a then b drop in; minus: a are there, the last b lift out
  const apples =
    s.kind === 'plus'
      ? [...Array.from({ length: s.a }, () => 'a'), ...Array.from({ length: s.b }, () => 'b')]
      : Array.from({ length: s.a }, (_, i) => (i >= s.a - s.b ? 'out' : 'a'));
  const step = answered && !countable ? 0.08 : 0.32;
  return (
    <div className={`math-scene math-tree math-tree--${s.kind}`}>
      <span className="math-tree__tree">
        <Art id="math-apple-tree" motion="loop" />
      </span>
      <span className="math-basket">
        <span className="math-basket__apples">
          {fill &&
            apples.map((kind, i) => {
              // the second group waits a beat after the first
              const delay = 0.4 + i * step + (kind === 'b' ? 0.5 : 0) + (kind === 'out' ? 0.9 : 0);
              return (
                <span
                  key={i}
                  className={`math-basket__apple math-basket__apple--${s.kind === 'plus' ? 'in' : 'there'} math-basket__apple--${kind}`}
                  style={{ animationDelay: `${delay}s` }}
                >
                  <Art id="apple" />
                </span>
              );
            })}
        </span>
        <Art id="math-basket" className="math-basket__basket" />
        {!fill && <span className="math-basket__cover" aria-hidden="true" />}
      </span>
    </div>
  );
}

// --- The scale -------------------------------------------------------------------

/**
 * Two amounts in the pans: tap the one the question asks for (more, or less?
 * Only the Finnish says which); then it tips toward the heavier one.
 */
function ScaleScene({ q, answered, choose }: Props) {
  const s = q.show as { kind: 'compare'; a: number; b: number };
  const tilt = answered ? (s.a > s.b ? 'left' : 'right') : 'level';
  const pan = (v: number, side: 'left' | 'right') => {
    const wrong = choose?.wrong.includes(v);
    const right = answered && v === q.answer;
    const label = choose?.heard && !answered ? <SpeakerIcon /> : numberWord(v);
    const body = (
      <>
        <span className="math-pan__hang">
          <Art id="math-scale-pan" />
          {answered && (
            <span className="math-pan__load">
              <Quantity groups={[v]} small />
            </span>
          )}
        </span>
        <span className="math-pan__word" lang="fi">
          {label}
        </span>
      </>
    );
    const cls = `math-pan math-pan--${side}` + (wrong ? ' math-pan--missed' : '') + (right ? ' math-pan--correct' : '') + (choose?.picked === v ? ' math-pan--picked' : '');
    return choose && !answered ? (
      <button type="button" className={cls} onClick={() => choose.onChoose(v)} disabled={wrong} aria-label={choose.heard ? 'Kuuntele · Listen' : numberWord(v)}>
        {body}
      </button>
    ) : (
      <span className={cls}>{body}</span>
    );
  };
  return (
    <div className={`math-scene math-scale math-scale--${tilt}`}>
      <Art id="math-scale-stand" className="math-scale__stand" />
      <span className="math-scale__beam" aria-hidden="true" />
      {pan(s.a, 'left')}
      {pan(s.b, 'right')}
    </div>
  );
}

// --- The train and the rocket ------------------------------------------------------

/** A word on a wagon, or — when the problem is only heard — a button that says it. */
function Load({ v, gap, answered, wordsShown }: { v: number; gap: boolean; answered: boolean; wordsShown: boolean }) {
  if (gap && !answered) return <Art glyph="❓" />;
  if (wordsShown || answered) return <>{numberWord(v)}</>;
  return (
    <button type="button" className="math-hear" onClick={() => speak(numberWord(v))} aria-label="Kuuntele · Listen">
      <SpeakerIcon />
    </button>
  );
}

/**
 * The counting run on a train, in reading order behind its engine, one wagon
 * empty; answered, it's filled and the train chugs. Each wagon is as long as
 * its word, so a long run wraps onto a second line at phone width.
 */
function TrainScene({ q, answered, wordsShown }: Props) {
  const s = q.show as { kind: 'run'; values: number[]; missing: number };
  return (
    <div className="math-scene math-track">
      <div className={'math-train' + (answered ? ' math-train--go' : '')}>
        <Art id="math-engine" motion="loop" className="math-train__engine" />
        {s.values.map((v, i) => (
          <span key={i} className={'math-wagon' + (v === s.missing ? ' math-wagon--gap' : '') + (answered && v === s.missing ? ' math-wagon--filled' : '')}>
            <span className="math-wagon__load" lang="fi">
              <Load v={v} gap={v === s.missing} answered={answered} wordsShown={wordsShown} />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** The countdown to nolla beside the rocket; answered, "Lähtö!" and up it goes. */
function RocketScene({ q, answered, wordsShown }: Props) {
  const s = q.show as { kind: 'run'; values: number[]; missing: number };
  return (
    <div className={'math-scene math-rocket' + (answered ? ' math-rocket--go' : '')}>
      <ol className="math-countdown" lang="fi">
        {s.values.map((v, i) => (
          <li key={i} className={'math-countdown__word' + (v === s.missing ? ' math-countdown__word--gap' : '')}>
            <Load v={v} gap={v === s.missing} answered={answered} wordsShown={wordsShown} />
          </li>
        ))}
      </ol>
      <span className="math-rocket__pad">
        <Art id="math-rocket" motion="loop" className="math-rocket__rocket" />
        {answered && (
          <span className="math-rocket__shout" lang="fi">
            {LIFT_OFF.fi}
          </span>
        )}
      </span>
    </div>
  );
}

// --- Word problems -------------------------------------------------------------------

/** What each frame's verb looks like, acted out once answered. */
const ACTED: Record<NonNullable<MathProblem['frame']>, ArtId | undefined> = {
  'have-have': undefined,
  'have-get': 'get',
  'have-eat': 'eat',
  'have-give': 'give',
};

/**
 * The fox ("minä") and the thing it's counting — one picture, nothing to
 * count — and "sinä", the player, when the problem has them. Answered, the
 * verb is acted out beside the dots that show why.
 */
function WordScene({ q, answered, avatar }: Props) {
  const acted = q.frame ? ACTED[q.frame] : undefined;
  const you = q.frame === 'have-have' || q.frame === 'have-give';
  return (
    <div className="math-scene math-story">
      <span className="math-story__cast">
        <Art id="fox" motion="loop" className="math-story__me" />
        <span className="math-story__thing">
          <Art item={q.noun} motion="idle" />
        </span>
        {you && avatar && <Avatar glyph={avatar} className="math-story__you" />}
      </span>
      {answered && (
        <span className="math-story__why">
          {acted && <Art id={acted} motion="loop" className="math-story__acted" />}
          <Why q={q} />
        </span>
      )}
    </div>
  );
}

// --- Building the teens ---------------------------------------------------------------

/** "?" + "toista": the teen heard, its first part to find; answered, the word put together. */
function BuildScene({ q, answered }: Props) {
  const s = q.show as { kind: 'parts'; teen: number; base: number };
  return (
    <div className={'math-scene math-build' + (answered ? ' math-build--done' : '')}>
      <span className="math-build__word" lang="fi">
        <span className="math-block math-block--gap">{answered ? numberWord(s.base) : <Art glyph="❓" />}</span>
        <span className="math-block math-block--tail">{teenTail(s.teen, s.base)}</span>
      </span>
      {answered && <Why q={q} />}
    </div>
  );
}
