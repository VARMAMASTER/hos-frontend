// @vitest-environment node
// Reads theme.css from disk (see semantic.spec.ts for why this runs under node).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GLASS } from '../tokens/material';

const css = readFileSync(
  fileURLToPath(new URL('./theme.css', import.meta.url)),
  'utf8',
);

interface Rule {
  declarations: Record<string, string>;
  nested: Record<string, Rule>;
}

// Line breaks and indentation are formatting, not content: collapse them, and the padding Prettier
// puts inside parentheses, so an assertion survives a long value being re-wrapped.
function squash(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+,/g, ',')
    .trim();
}

function closingBrace(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return i;
  }
  throw new Error('theme.css has an unclosed block');
}

// Declarations plus nested rules (`&::before { … }`). A value holding a semicolon, such as a data
// URL, would need a real parser; no utility has one.
function parse(body: string): Rule {
  const rule: Rule = { declarations: {}, nested: {} };
  let rest = body;
  while (rest.trim() !== '') {
    const semicolon = rest.indexOf(';');
    const brace = rest.indexOf('{');
    if (brace !== -1 && (semicolon === -1 || brace < semicolon)) {
      const close = closingBrace(rest, brace);
      rule.nested[squash(rest.slice(0, brace))] = parse(
        rest.slice(brace + 1, close),
      );
      rest = rest.slice(close + 1);
      continue;
    }
    const declaration = semicolon === -1 ? rest : rest.slice(0, semicolon);
    const colon = declaration.indexOf(':');
    rule.declarations[squash(declaration.slice(0, colon))] = squash(
      declaration.slice(colon + 1),
    );
    rest = semicolon === -1 ? '' : rest.slice(semicolon + 1);
  }
  return rule;
}

// The rule that follows an at-rule header such as `@utility nova-hero` or `@layer base`.
function block(header: string): Rule {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*\\{`).exec(source);
  if (!match) throw new Error(`theme.css declares no "${header}" block`);
  const open = match.index + match[0].length - 1;
  return parse(source.slice(open + 1, closingBrace(source, open)));
}

const utility = (name: string): Rule => block(`@utility ${name}`);

const percent = (share: number) => `${Math.round(share * 100)}%`;

describe('theme.css utilities', () => {
  it.each([
    'nova-canvas',
    'nova-surface',
    'nova-overlay',
    'nova-field',
    'nova-chrome',
    'nova-hero',
    'nova-data',
  ])('declares @utility %s', (name) => {
    expect(Object.keys(utility(name).declarations).length).toBeGreaterThan(0);
  });

  it.each([
    ['nova-surface', 'surface'],
    ['nova-overlay', 'overlay'],
  ])(
    '%s draws its fill, frost, rim and shadow from the %s material tokens',
    (name, token) => {
      expect(utility(name).declarations).toMatchObject({
        'background-color': `var(--nova-${token}-fill)`,
        'backdrop-filter': `var(--nova-${token}-filter)`,
        '-webkit-backdrop-filter': `var(--nova-${token}-filter)`,
        border: `1px solid var(--nova-${token}-border)`,
        'box-shadow': `var(--nova-${token}-shadow)`,
      });
    },
  );

  it('nova-field frosts a form control and keeps the strong border so its edge never relies on the glass', () => {
    expect(utility('nova-field').declarations).toMatchObject({
      'background-color': 'var(--nova-field-fill)',
      'backdrop-filter': 'var(--nova-field-filter)',
      '-webkit-backdrop-filter': 'var(--nova-field-filter)',
      border: '1px solid var(--nova-color-border-strong)',
    });
  });

  // Each block looks its utility up inside the test, so a missing or renamed utility fails its own
  // tests by name instead of failing the whole file while it is being collected.
  describe('nova-chrome', () => {
    const chrome = () => utility('nova-chrome').declarations;

    it('mixes the brand into the chrome base at the share the legibility proof assumes, then composites it at the chrome opacity', () => {
      const base = `color-mix(in srgb, var(--nova-color-primary-strong) ${percent(GLASS.chromeBrandShare)}, ${GLASS.chromeBase})`;
      expect(chrome()['background-color']?.toLowerCase()).toBe(
        `color-mix(in srgb, ${base} calc(var(--nova-chrome-opacity) * 100%), transparent)`.toLowerCase(),
      );
    });

    it('sets white text, and hands children their secondary ink at the alpha the proof assumes', () => {
      expect(chrome()['color']).toBe('#fff');
      expect(chrome()['--nova-chrome-ink-2']).toBe(
        `rgb(255 255 255 / ${GLASS.chromeInk2Alpha})`,
      );
    });

    it('frosts with the chrome filter and rims the bottom and the side with a 1px hairline', () => {
      expect(chrome()).toMatchObject({
        'backdrop-filter': 'var(--nova-chrome-filter)',
        '-webkit-backdrop-filter': 'var(--nova-chrome-filter)',
        'border-bottom': '1px solid rgb(255 255 255 / 0.12)',
        'border-right': '1px solid rgb(255 255 255 / 0.12)',
      });
    });
  });

  describe('nova-hero', () => {
    const hero = () => utility('nova-hero').declarations;

    it('runs the brand gradient at 120deg from primary-strong to primary, each stop at the hero opacity', () => {
      const stop = (colour: string) =>
        `color-mix(in srgb, var(--nova-color-${colour}) calc(var(--nova-hero-opacity) * 100%), transparent)`;
      expect(hero()['background-image']).toBe(
        `linear-gradient(120deg, ${stop('primary-strong')}, ${stop('primary')})`,
      );
    });

    it('uses only the two brand tokens createNovaTheme gates white text against', () => {
      expect(hero()['background-image']?.match(/--nova-color-[\w-]+/g)).toEqual(
        ['--nova-color-primary-strong', '--nova-color-primary'],
      );
    });

    it('sets the on-primary text colour and frosts with the hero filter', () => {
      expect(hero()).toMatchObject({
        color: 'var(--nova-color-on-primary)',
        'backdrop-filter': 'var(--nova-hero-filter)',
        '-webkit-backdrop-filter': 'var(--nova-hero-filter)',
      });
    });
  });

  describe('nova-data', () => {
    it('is opaque under either material, filling with the plain surface colour', () => {
      const { declarations } = utility('nova-data');
      expect(declarations['background-color']).toBe(
        'var(--nova-color-surface)',
      );
      expect(declarations).not.toHaveProperty('backdrop-filter');
      expect(declarations).not.toHaveProperty('-webkit-backdrop-filter');
    });

    it('reads no material token at all, so glass and solid cannot make it differ', () => {
      expect(JSON.stringify(utility('nova-data'))).not.toMatch(
        /--nova-(?:glass|surface|overlay|field|chrome|hero)-?/,
      );
    });

    it('puts the richness in a 1px gradient rim that only paints its edge', () => {
      const data = utility('nova-data');
      expect(data.declarations['position']).toBe('relative');
      const rim = data.nested['&::before'];
      expect(rim).toBeDefined();
      expect(rim?.declarations).toMatchObject({
        content: "''",
        position: 'absolute',
        inset: '0',
        padding: '1px',
        'border-radius': 'inherit',
        'pointer-events': 'none',
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--nova-color-primary) 55%, transparent), rgb(34 211 238 / 0.26), transparent)',
        'mask-composite': 'exclude',
        '-webkit-mask-composite': 'xor',
      });
      for (const mask of ['mask', '-webkit-mask']) {
        expect(rim?.declarations[mask]).toBe(
          'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        );
      }
    });
  });
});

describe('theme.css base rules', () => {
  // corner-shape is not inherited, so the rule has to reach every box. Browsers without it ignore the
  // declaration and draw plain rounded corners, which is why a refactor must not drop it as dead weight.
  it('gives every element and pseudo-element continuous (squircle) corners, so each rounded-* and surface utility inherits the shape', () => {
    expect(block('@layer base').nested['*, ::before, ::after']).toMatchObject({
      declarations: { 'corner-shape': 'squircle' },
    });
  });
});
