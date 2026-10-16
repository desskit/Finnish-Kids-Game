// @vitest-environment node
// Every emoji the app can show has a picture. Each emoji in the source (in its
// strings and JSX text, not its comments) and in the word data is drawn, or is
// a keycap the number tile shows. A new emoji needs its picture (art/recipes)
// before the app can use it: <Art> draws nothing for an emoji without one.

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { ART, GLYPH_ART } from './generated/manifest';
import { glyphKey, keycapText, splitEmoji } from './glyph';

const SRC = join(__dirname, '..');

/** Is this emoji drawn: a picture of its own, or the number tile? */
const drawn = (glyph: string) => glyphKey(glyph) in GLYPH_ART || keycapText(glyph) !== undefined;

/** The emoji in some text that have no picture. */
const undrawn = (text: string) => splitEmoji(text).flatMap((p) => ('glyph' in p && !drawn(p.glyph) ? [p.glyph] : []));

/** Every source file of the app (not its tests, not the generated art). */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'generated' || name === 'test' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) && !name.endsWith('.d.ts') ? [path] : [];
  });
}

/** The text a source file can put on screen: its string literals, templates and JSX text. */
function texts(path: string): string[] {
  const file = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node) || ts.isJsxText(node)) out.push(node.text);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return out;
}

/** Every string in some JSON. */
function jsonStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(jsonStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(jsonStrings);
  return [];
}

describe('every emoji has a picture', () => {
  it('in the source', () => {
    const files = sourceFiles(SRC);
    expect(files.length).toBeGreaterThan(50);
    const missing = files.flatMap((path) => texts(path).flatMap(undrawn).map((g) => `${relative(SRC, path)}: ${g}`));
    expect([...new Set(missing)]).toEqual([]);
  });

  it('in the word data', () => {
    const dir = join(SRC, 'content', 'data');
    const missing = readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .flatMap((name) => jsonStrings(JSON.parse(readFileSync(join(dir, name), 'utf8'))).flatMap(undrawn).map((g) => `${name}: ${g}`));
    expect([...new Set(missing)]).toEqual([]);
  });

  it('notices one that has none', () => {
    expect(undrawn('🦄 Yksisarvinen')).toEqual(['🦄']);
    expect(undrawn('🐱 3️⃣ 🔟')).toEqual([]);
  });

  // A screen that draws a word by its emoji must draw THAT word: "Syö!" is the
  // eating picture, not the table that once shared 🍽️ with it.
  it("draws each word's own picture from the word's emoji", () => {
    const dir = join(SRC, 'content', 'data');
    const wrong = readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .flatMap((name) => (JSON.parse(readFileSync(join(dir, name), 'utf8')).words ?? []) as { id: string; emoji?: string }[])
      .filter((w) => w.emoji && w.id in ART && GLYPH_ART[glyphKey(w.emoji)] !== w.id)
      .map((w) => `${w.id}: ${w.emoji} draws "${GLYPH_ART[glyphKey(w.emoji!)]}"`);
    expect(wrong).toEqual([]);
  });
});
