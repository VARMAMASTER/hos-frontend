// @vitest-environment node
// The design-token layer (tokens/design.ts) against theme.css: the same tokens, the same values, and
// every component token tied to the scale wherever the prototype's value sits on it.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BREAKPOINT_REM, DIMENSION_TOKENS, NOVA_DESIGN_TOKENS } from './design';
import { SPACING_PX } from './scale';
import { NOVA_DEFAULTS } from './semantic';

const css = readFileSync(
  fileURLToPath(new URL('../styles/theme.css', import.meta.url)),
  'utf8',
);

function between(begin: string, end: string): string {
  const from = css.indexOf(begin);
  const to = css.indexOf(end);
  expect(from, begin).toBeGreaterThan(-1);
  expect(to, end).toBeGreaterThan(from);
  return css.slice(from, to);
}

const declarations = (text: string): Record<string, string> =>
  Object.fromEntries(
    [...text.matchAll(/(--nova-[\w-]+):\s*([^;]+);/g)].map((match) => [
      match[1],
      // Prettier wraps a long calc(); its line breaks are formatting, not value.
      match[2]
        .replace(/\s+/g, ' ')
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')')
        .trim(),
    ]),
  );

const values = () =>
  declarations(
    between(
      '===== Design tokens (begin) =====',
      '===== Design tokens (end) =====',
    ).replace(/\/\*[\s\S]*?\*\//g, ''),
  );

// Every token's value with every var() chain followed to the end and calc() worked out, in px.
const all: Record<string, string> = { ...NOVA_DEFAULTS, ...NOVA_DESIGN_TOKENS };
function px(name: string): number {
  let value = all[name] ?? '';
  for (let pass = 0; pass < 10 && value.includes('var('); pass++) {
    value = value.replace(/var\((--[\w-]+)\)/g, (_, ref: string) => {
      const resolved = all[ref];
      if (resolved === undefined) throw new Error(`${ref} is undeclared`);
      return `(${resolved})`;
    });
  }
  const arithmetic = value
    .replace(/^calc/, '')
    .replace(/calc\(/g, '(')
    .replace(/(\d+(?:\.\d+)?)px/g, '$1');
  if (!/^[\d\s.()+\-*/]+$/.test(arithmetic)) return Number.NaN;
  return Number(new Function(`return (${arithmetic});`)());
}

describe('the design-token layer', () => {
  it('declares exactly NOVA_DESIGN_TOKENS in theme.css, in one marked :root block', () => {
    expect(values()).toEqual(NOVA_DESIGN_TOKENS);
  });

  it('names no token twice, and none that the prototype defaults already name', () => {
    for (const name of Object.keys(NOVA_DESIGN_TOKENS)) {
      expect(NOVA_DEFAULTS, name).not.toHaveProperty(name);
    }
  });

  // A component token whose prototype value is a step of the scale points at that step, so editing
  // --nova-space-* moves the controls, cards and chips; only values off the scale are literals. Edge
  // widths are not distances, so a 2px border is not --space-0.
  it('ties every dimension on the spacing scale to its step', () => {
    for (const [name, value] of Object.entries(DIMENSION_TOKENS)) {
      if (/^--nova-border-/.test(name)) continue;
      const literal = /^(\d+(?:\.\d+)?)px$/.exec(value);
      if (literal) {
        expect(
          (SPACING_PX as readonly number[]).includes(Number(literal[1])),
          `${name}: ${value} is on the scale, so it should be var(--nova-space-N)`,
        ).toBe(false);
      }
    }
  });

  it('keeps the prototype values: .btn, .btn-sm, .f-input, .card-b, .card-h and .chip', () => {
    expect(px('--nova-control-py-md')).toBe(8);
    expect(px('--nova-control-px-md')).toBe(16);
    expect(px('--nova-control-py-sm')).toBe(6);
    expect(px('--nova-control-px-sm')).toBe(10);
    expect(px('--nova-field-px')).toBe(10);
    expect(px('--nova-card-p')).toBe(16);
    expect(px('--nova-card-bar-py')).toBe(12);
    expect(px('--nova-chip-px')).toBe(8);
    expect(px('--nova-chip-py')).toBe(2);
    expect(px('--nova-chip-gap')).toBe(6);
    expect(px('--nova-touch')).toBe(44);
    expect(px('--nova-touch-sm')).toBe(24);
    expect(px('--nova-sidebar-rail-w')).toBe(68);
  });

  // A control's height is the prototype's padding + its line + its border (a 13px label on the body's
  // 1.55 line, 8px above and below, a 1px border), so it follows each of those tokens.
  it('derives each control height from its padding, its type role and its border', () => {
    expect(px('--nova-control-h-md')).toBeCloseTo(8 * 2 + 13 * 1.55 + 2, 5);
    expect(px('--nova-control-h-sm')).toBeCloseTo(6 * 2 + 12 * 1.55 + 2, 5);
    expect(px('--nova-field-icon-inset')).toBe(32);
  });
});

// A media query in script cannot read a custom property, so the breakpoints a component matches in
// script (AppShell's drawer below md) are numbers here, held to the ones Tailwind compiles md: with.
describe('breakpoints', () => {
  it('are declared by theme.css itself, so a script media query and an md: variant switch together', () => {
    for (const [name, rem] of Object.entries(BREAKPOINT_REM)) {
      expect(css, name).toMatch(
        new RegExp(`--breakpoint-${name}:\\s*${rem}rem;`),
      );
    }
  });
});

// Values two or more components share are one token in the shared layer, never a copy per family.
describe('shared component tokens', () => {
  it('holds each shared value once, at the prototype size', () => {
    // The check box: Checkbox, Radio and DataTable's row checkbox.
    expect(px('--nova-check')).toBe(20);
    // .hos-x, the square close button: Dialog and Toast.
    expect(px('--nova-close-size')).toBe(30);
    // .tb-ico, the top bar's square icon button: NotificationBell and the TopBar menu button.
    expect(px('--nova-topbar-ico')).toBe(34);
    // .ws-item, a menu row: Menu, ModuleSwitcher and DataTable's Columns toggle.
    expect(px('--nova-menu-item-p')).toBe(8);
    expect(px('--nova-menu-item-gap')).toBe(8);
    // A column or a filter that must not squeeze below a readable width.
    expect(NOVA_DESIGN_TOKENS['--nova-column-min-w']).toBe('12rem');
  });

  it('retires the per-family copies', () => {
    for (const name of [
      '--nova-table-check',
      '--nova-ai-column-min-w',
      'size-table-check',
    ]) {
      expect(css, name).not.toContain(name);
    }
  });
});
