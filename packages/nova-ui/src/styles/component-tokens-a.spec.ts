// @vitest-environment node
// Family a's component tokens (theme.css, "Component tokens: family a"): each one is the value the
// component had before it was converted to tokens, a value on the spacing scale points at its step,
// and every one has the utility the components use.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SPACING_PX } from '../tokens/scale';

const css = readFileSync(
  fileURLToPath(new URL('./theme.css', import.meta.url)),
  'utf8',
);

const BEGIN = '===== Component tokens: family a';
const from = css.indexOf(`${BEGIN}, core controls`);
const to = css.indexOf(`${BEGIN} (end)`);
const family = css.slice(from, to);

const normalise = (value: string) =>
  value
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();

const declarations = (text: string): Record<string, string> =>
  Object.fromEntries(
    [...text.matchAll(/(--nova-[\w-]+):\s*([^;]+);/g)].map((match) => [
      match[1],
      normalise(match[2] ?? ''),
    ]),
  );

const tokens = declarations(family.replace(/\/\*[\s\S]*?\*\//g, ''));
// Every token the family block can point at: the scale, the icons and the edges.
const everything = { ...declarations(css), ...tokens };

function px(name: string): number {
  let value = everything[name] ?? '';
  for (let pass = 0; pass < 10 && value.includes('var('); pass++) {
    value = value.replace(/var\((--[\w-]+)\)/g, (_, ref: string) => {
      const resolved = everything[ref];
      if (resolved === undefined) throw new Error(`${ref} is undeclared`);
      return `(${resolved})`;
    });
  }
  const arithmetic = value
    .replace(/calc\(/g, '(')
    .replace(/(\d+(?:\.\d+)?)px/g, '$1');
  if (!/^[\d\s.()+\-*/]+$/.test(arithmetic)) return Number.NaN;
  return Number(new Function(`return (${arithmetic});`)());
}

describe('family a component tokens', () => {
  it('has a marked block that declares tokens', () => {
    expect(from).toBeGreaterThan(-1);
    expect(to).toBeGreaterThan(from);
    expect(Object.keys(tokens).length).toBeGreaterThan(10);
  });

  it('keeps the sizes the components had before they were converted', () => {
    expect(px('--nova-avatar-xs')).toBe(20);
    expect(px('--nova-avatar-sm')).toBe(32);
    expect(px('--nova-avatar-md')).toBe(40);
    expect(px('--nova-avatar-lg')).toBe(48);
    expect(px('--nova-avatar-glyph-xs')).toBe(10);
    expect(px('--nova-avatar-glyph-sm')).toBe(14);
    expect(px('--nova-avatar-glyph-md')).toBe(16);
    expect(px('--nova-avatar-glyph-lg')).toBe(18);
    expect(px('--nova-check')).toBe(20);
    expect(px('--nova-switch-h')).toBe(28);
    expect(px('--nova-switch-w')).toBe(48);
    expect(px('--nova-switch-thumb')).toBe(24);
    expect(px('--nova-textarea-min-h')).toBe(96);
    expect(px('--nova-menu-min-w')).toBe(192);
    expect(px('--nova-link-field-min-w')).toBe(192);
    expect(px('--nova-dialog-w-sm')).toBe(280);
    expect(px('--nova-empty-icon')).toBe(40);
    expect(px('--nova-menu-room')).toBe(224);
  });

  // The thumb rests 1px in from the track's edge and stops 1px short of the far edge, inside the
  // 1px border each side: 48 - 24 - 3 hairlines.
  it('travels the switch thumb the track less the thumb and its three hairlines', () => {
    expect(px('--nova-switch-travel')).toBe(21);
  });

  it('points a value on the spacing scale at its step, and writes only off-scale values as literals', () => {
    for (const [name, value] of Object.entries(tokens)) {
      const literal = /^(\d+(?:\.\d+)?)px$/.exec(value);
      if (!literal) continue;
      expect(
        (SPACING_PX as readonly number[]).includes(Number(literal[1])),
        `${name}: ${value} is on the scale, so it should be var(--nova-space-N)`,
      ).toBe(false);
    }
  });

  it('names a utility for every size token', () => {
    const utilities = family.slice(family.indexOf('@theme inline'));
    for (const name of Object.keys(tokens)) {
      if (name.startsWith('--nova-split-')) continue;
      expect(utilities, name).toContain(`var(${name})`);
    }
  });

  it('keeps the split ratios as grid templates for SplitLayout', () => {
    expect(tokens['--nova-split-2-1']).toBe('2fr 1fr');
    expect(tokens['--nova-split-1-2']).toBe('1fr 2fr');
    expect(tokens['--nova-split-3-2']).toBe('3fr 2fr');
    expect(tokens['--nova-split-2-3']).toBe('2fr 3fr');
  });
});
