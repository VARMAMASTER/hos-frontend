// @vitest-environment node
// One AI mark, enforced. The Care spark (primitives/ai-mark.tsx) is the only way Nova or the web app
// draws "this was made by the AI": bare in the text colour, or in the AI tile, always beside a text
// label. So no source writes a sparkle or star glyph itself, no svg of its own draws a four-point
// spark, and the tile (nova-ai-spark) is reached only through <AiMark tile />, so it can never hold
// a different symbol. Specs are exempt (they plant the offences below); comments are fine.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcDir = fileURLToPath(new URL('..', import.meta.url));
const SCOPES = [
  'components',
  'primitives',
  'stories',
  'styles',
  '../.storybook',
  '../../../apps/web/src',
];
const MARK_HOME = 'primitives/ai-mark.tsx';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(tsx?|css)$/.test(name) && !/\.spec\.tsx?$/.test(name)
      ? [path]
      : [];
  });
}

// Comments out: block comments (JSX ones too) and line comments that start a line or follow code.
export function withoutComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

// Sparkle and star glyphs: the four-point spark, its outline, the stars and the emoji.
const GLYPHS = /[✦✧★☆✨⭐]/u;
export const glyphOffences = (text: string): string[] =>
  withoutComments(text)
    .split('\n')
    .filter((line) => GLYPHS.test(line))
    .map((line) => line.trim());

// The Care spark's own geometry and the old three-star cluster's, copied anywhere else.
const OWN_PATHS = ['M11 0.8Q12.9 9.1', 'M19.4 14.6q.55', 'M12 2L14.5 9.5'];

// A path of straight segments that draws a four-point star: four tips alternating with four waist
// points, the waists well inside the tips.
function drawsFourPointStar(d: string): boolean {
  const points = [...d.matchAll(/[ML]\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g)].map(
    (m) => [Number(m[1]), Number(m[2])] as const,
  );
  if (points.length >= 9 && points[0]?.join() === points.at(-1)?.join()) {
    points.pop();
  }
  if (points.length !== 8) return false;
  const cx = points.reduce((sum, p) => sum + p[0], 0) / 8;
  const cy = points.reduce((sum, p) => sum + p[1], 0) / 8;
  const radii = points.map((p) => Math.hypot(p[0] - cx, p[1] - cy));
  const tips = radii.filter((_, i) => i % 2 === 0);
  const waists = radii.filter((_, i) => i % 2 === 1);
  const tipsFirst = Math.min(...tips) > Math.max(...waists) * 1.4;
  const waistsFirst = Math.min(...waists) > Math.max(...tips) * 1.4;
  return tipsFirst || waistsFirst;
}

export function sparkSvgOffences(text: string): string[] {
  const found: string[] = [];
  const code = withoutComments(text);
  for (const own of OWN_PATHS) {
    if (code.includes(own)) found.push(`copy of the mark's path (${own})`);
  }
  for (const match of code.matchAll(/\bd="([^"]+)"/g)) {
    if (drawsFourPointStar(match[1] ?? '')) found.push(`a four-point star`);
  }
  return found;
}

// The tile class written by hand, in a string or a template.
export const tileOffences = (text: string): string[] =>
  withoutComments(text)
    .split('\n')
    .filter((line) => /(?<![\w-])nova-ai-spark(?![\w-])/.test(line))
    .map((line) => line.trim());

const files = SCOPES.flatMap((scope) => walk(join(srcDir, scope))).map(
  (path) => ({
    path: relative(srcDir, path).replace(/\\/g, '/'),
    text: readFileSync(path, 'utf8'),
  }),
);
const sources = files.filter((file) => !file.path.endsWith('.css'));
const inWeb = (path: string) => path.startsWith('../../../apps/web/src/');

describe('the guard reads what it should', () => {
  it('scans Nova, the Storybook preview and the whole web app, data and plain .ts included', () => {
    const paths = sources.map((file) => file.path);
    expect(paths).toContain('components/ai-badge/ai-badge.tsx');
    expect(paths).toContain('primitives/ai-mark.tsx');
    expect(paths).toContain('stories/ai-messaging.stories.tsx');
    expect(paths).toContain('../.storybook/preview.tsx');
    expect(paths).toContain('../../../apps/web/src/app/app.tsx');
    expect(paths).toContain(
      '../../../apps/web/src/modules/ai-workforce/manifest.ts',
    );
    expect(
      paths.some((path) => inWeb(path) && /\/data\/.+\.ts$/.test(path)),
    ).toBe(true);
    expect(paths.filter(inWeb).length).toBeGreaterThan(100);
  });
});

describe('one AI mark', () => {
  it('no component, primitive, story or web file writes a sparkle or star glyph', () => {
    const found = sources
      .map((file) => ({ path: file.path, lines: glyphOffences(file.text) }))
      .filter((file) => file.lines.length > 0);
    expect(found).toEqual([]);
  });

  it('theme.css draws no glyph as generated content', () => {
    const css = files.find((file) => file.path === 'styles/theme.css');
    expect(css).toBeDefined();
    expect(glyphOffences(css?.text ?? '')).toEqual([]);
    expect(/content:\s*['"]✦/u.test(css?.text ?? '')).toBe(false);
  });

  it('no svg of its own draws the spark: the Care spark is in primitives/ai-mark.tsx alone', () => {
    const found = sources
      .filter((file) => file.path !== MARK_HOME)
      .map((file) => ({ path: file.path, found: sparkSvgOffences(file.text) }))
      .filter((file) => file.found.length > 0);
    expect(found).toEqual([]);
  });

  it('the AI tile is reached only through <AiMark tile />, never written by hand', () => {
    const found = sources
      .filter((file) => file.path !== MARK_HOME)
      .map((file) => ({ path: file.path, lines: tileOffences(file.text) }))
      .filter((file) => file.lines.length > 0);
    expect(found).toEqual([]);
    // ...and the tile exists, so the guard is not passing on a renamed class.
    expect(sources.find((file) => file.path === MARK_HOME)?.text).toContain(
      'nova-ai-spark',
    );
    expect(
      files.find((file) => file.path === 'styles/theme.css')?.text,
    ).toContain('@utility nova-ai-spark');
  });
});

describe('the guard itself (planted violations)', () => {
  it.each([
    ['JSX text', '<span aria-hidden="true">✦</span>'],
    ['a string', "const spark = '✦ AI draft';"],
    ['a template', 'const t = `✦ ${banner}`;'],
    ['an attribute', '<Chip tone="ai" icon="✦">'],
    ['an outline spark', 'const s = "✧";'],
    ['a solid star', 'const s = "★";'],
    ['an outline star', 'const s = "☆";'],
    ['the sparkles emoji', 'const s = "✨";'],
    ['the star emoji', 'const s = "⭐";'],
    ['a Tailwind content class', "before:content-['✦_/_'']"],
    ['CSS content', ".x::before { content: '✦'; }"],
  ])('rejects a glyph in %s', (_name, text) => {
    expect(glyphOffences(text)).not.toEqual([]);
  });

  it('allows the glyph in comments, and plain text without one', () => {
    expect(glyphOffences('// marked ✦ and in words\nconst a = 1;')).toEqual([]);
    expect(glyphOffences('/* the ✦ spark */ const a = 1;')).toEqual([]);
    expect(glyphOffences('{/* ✦ */}<span>AI draft</span>')).toEqual([]);
    expect(glyphOffences('const s = "AI draft";')).toEqual([]);
    expect(glyphOffences('const check = "✓";')).toEqual([]);
  });

  it.each([
    [
      'a copy of the Care spark',
      '<path d="M11 0.8Q12.9 9.1 21.2 11Q12.9 12.9 11 21.2Z" />',
    ],
    [
      'the old three-star cluster',
      '<path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />',
    ],
    [
      'a four-point star drawn another way',
      '<path d="M10 0L12 8L20 10L12 12L10 20L8 12L0 10L8 8Z" />',
    ],
  ])('rejects an svg that draws %s', (_name, text) => {
    expect(sparkSvgOffences(text)).not.toEqual([]);
  });

  it('allows other svg: a tick, a close cross and the highlight’s five-point star', () => {
    for (const text of [
      '<path d="M3 8.5l3.2 3.2L13 4.5" />',
      '<path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />',
      '<path d="M10 2.2l2.35 4.97 5.45.68-4.02 3.74 1.04 5.39L10 14.33l-4.82 2.65 1.04-5.39L2.2 7.85l5.45-.68z" />',
    ]) {
      expect(sparkSvgOffences(text), text).toEqual([]);
    }
  });

  it.each([
    'className="nova-ai-spark"',
    "className={cx('nova-ai-spark', 'mt-s0')}",
    "'nova-ai-spark mt-s0'",
    '`nova-ai-spark ${extra}`',
  ])('rejects a hand-written tile: %s', (text) => {
    expect(tileOffences(text)).not.toEqual([]);
  });

  it('allows the names that merely contain it, and a comment', () => {
    expect(tileOffences("'nova-ai-spark-lift'")).toEqual([]);
    expect(tileOffences('// the nova-ai-spark tile')).toEqual([]);
  });
});
