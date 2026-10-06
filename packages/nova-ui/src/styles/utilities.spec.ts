// @vitest-environment node
// Reads theme.css from disk (see semantic.spec.ts for why this runs under node).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createNovaTheme, type NovaTheme } from '../theme/create-theme';
import { GLASS, MATERIAL_TOKENS } from '../tokens/material';
import { primitives } from '../tokens/primitives';
import { NOVA_DEFAULTS } from '../tokens/semantic';

const css = readFileSync(
  fileURLToPath(new URL('./theme.css', import.meta.url)),
  'utf8',
);
const source = css.replace(/\/\*[\s\S]*?\*\//g, '');

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
  const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*\\{`).exec(source);
  if (!match) throw new Error(`theme.css declares no "${header}" block`);
  const open = match.index + match[0].length - 1;
  return parse(source.slice(open + 1, closingBrace(source, open)));
}

const utility = (name: string): Rule => block(`@utility ${name}`);

// Every top-level rule whose selector list is exactly `selector`, in file order.
function rulesFor(selector: string): Rule[] {
  const found: Rule[] = [];
  let rest = source;
  for (let brace = rest.indexOf('{'); brace !== -1; brace = rest.indexOf('{')) {
    const close = closingBrace(rest, brace);
    if (squash(rest.slice(0, brace)) === selector) {
      found.push(parse(rest.slice(brace + 1, close)));
    }
    rest = rest.slice(close + 1);
  }
  return found;
}

const percent = (share: number) => `${Math.round(share * 100)}%`;
const BRAND_SCOPES = ':root, [data-nova-theme], [data-nova-material]';

describe('theme.css utilities', () => {
  it.each([
    'nova-canvas',
    'nova-surface',
    'nova-overlay',
    'nova-field',
    'nova-chrome',
    'nova-hero',
    'nova-data',
    'nova-gradient-text',
    'nova-ai-rail',
  ])('declares @utility %s', (name) => {
    expect(Object.keys(utility(name).declarations).length).toBeGreaterThan(0);
  });

  it.each([
    ['nova-surface', 'surface'],
    ['nova-overlay', 'overlay'],
  ])(
    '%s draws its fill, frost and rim from the %s material tokens',
    (name, token) => {
      expect(utility(name).declarations).toMatchObject({
        'background-color': `var(--nova-${token}-fill)`,
        'backdrop-filter': `var(--nova-${token}-filter)`,
        '-webkit-backdrop-filter': `var(--nova-${token}-filter)`,
        border: `1px solid var(--nova-${token}-border)`,
      });
    },
  );

  // The lift comes from the elevation scale, under glass and solid alike, with the material's own
  // layer (the glass top highlight) on top. A component that needs another level sets the
  // utility's non-inherited lift property (a Dialog asks for level 3; a hovered card for level 2).
  it.each([
    ['nova-surface', 'surface', 1],
    ['nova-overlay', 'overlay', 2],
  ] as const)(
    '%s lifts at elevation %s unless its lift property asks for another level',
    (name, token, level) => {
      expect(utility(name).declarations['box-shadow']).toBe(
        `var(--nova-${token}-lift, var(--nova-elevation-${level})), var(--nova-${token}-shadow)`,
      );
    },
  );

  it('nova-data lifts at elevation 1 too, unless its lift property asks for another level', () => {
    expect(utility('nova-data').declarations['box-shadow']).toBe(
      'var(--nova-data-lift, var(--nova-elevation-1))',
    );
  });

  // Registered as non-inherited, so a Dialog's level 3 never leaks into the cards and menus it holds.
  it.each(['--nova-surface-lift', '--nova-overlay-lift', '--nova-data-lift'])(
    'registers %s as a non-inherited property',
    (name) => {
      expect(block(`@property ${name}`).declarations).toEqual({
        syntax: "'*'",
        inherits: 'false',
      });
    },
  );

  // A selected card or option upgrades its edge to 2px primary, the only place 2px appears.
  it('nova-surface upgrades a selected panel to a 2px primary border', () => {
    expect(
      utility('nova-surface').nested["&[data-selected='true']"]?.declarations,
    ).toEqual({ border: '2px solid var(--nova-color-primary)' });
  });

  it('nova-data upgrades a selected container to a 2px primary border', () => {
    expect(
      utility('nova-data').nested["&[data-selected='true']"]?.declarations,
    ).toEqual({ border: '2px solid var(--nova-color-primary)' });
  });

  // The edge is a custom property, so a control states hover, invalid or checked by setting one
  // variable instead of fighting the utility's border with an important modifier. Unset, it is
  // border-control, which material.spec.ts proves at 3:1 against the fill and the backdrop.
  it('nova-field frosts a form control and draws its edge from --nova-field-edge, border-control by default', () => {
    expect(utility('nova-field').declarations).toMatchObject({
      'background-color': 'var(--nova-field-fill)',
      'backdrop-filter': 'var(--nova-field-filter)',
      '-webkit-backdrop-filter': 'var(--nova-field-filter)',
      border:
        '1px solid var(--nova-field-edge, var(--nova-color-border-control))',
    });
  });

  it('nova-field sets its own edge for hover, focus, checked and invalid, with invalid winning as the last rule', () => {
    const { nested } = utility('nova-field');
    expect(Object.keys(nested)).toEqual([
      '&:hover:where(:not(:disabled))',
      '&:focus',
      "&:checked, &[aria-checked='true']",
      "&[aria-invalid='true']",
    ]);
    expect(nested['&:hover:where(:not(:disabled))']?.declarations).toEqual({
      '--nova-field-edge': 'var(--nova-color-ink-2)',
    });
    // Focused: the 1px edge turns primary (the focus ring draws outside it).
    expect(nested['&:focus']?.declarations).toEqual({
      '--nova-field-edge': 'var(--nova-color-primary)',
    });
    expect(nested["&:checked, &[aria-checked='true']"]?.declarations).toEqual({
      '--nova-field-edge': 'var(--nova-color-primary)',
    });
    expect(nested["&[aria-invalid='true']"]?.declarations).toEqual({
      '--nova-field-edge': 'var(--nova-color-crit)',
    });
  });

  // The ring is a custom property, so it inherits. The chrome and the hero turn it white for their
  // own dark controls; a light surface nested inside them (a menu anchored in the sidebar, a card in
  // the hero) must turn it back, or its focused items draw a white ring on white.
  it.each(['nova-surface', 'nova-overlay', 'nova-field', 'nova-data'])(
    '%s resets the keyboard focus ring to the brand primary, so a light surface nested in the chrome or the hero never inherits a white ring',
    (name) => {
      expect(utility(name).declarations['--nova-focus-ring']).toBe(
        'var(--nova-color-primary)',
      );
    },
  );

  it('nova-canvas paints the aurora token over the flat background', () => {
    expect(utility('nova-canvas').declarations).toMatchObject({
      'background-color': 'var(--nova-color-bg)',
      'background-image': 'var(--nova-gradient-aurora)',
    });
  });

  // Each block looks its utility up inside the test, so a missing or renamed utility fails its own
  // tests by name instead of failing the whole file while it is being collected.
  describe('nova-chrome', () => {
    const chrome = () => utility('nova-chrome');

    it('paints the chrome gradient token', () => {
      expect(chrome().declarations['background-image']).toBe(
        'var(--nova-gradient-chrome)',
      );
    });

    it('turns the keyboard focus ring white, since the brand ring is ~2:1 on the dark chrome', () => {
      expect(chrome().declarations['--nova-focus-ring']).toBe('#fff');
    });

    it('sets white text, and hands children their secondary ink at the alpha the proof assumes', () => {
      expect(chrome().declarations['color']).toBe('#fff');
      expect(chrome().declarations['--nova-chrome-ink-2']).toBe(
        `rgb(255 255 255 / ${GLASS.chromeInk2Alpha})`,
      );
    });

    it('hands a field on the chrome its lift at the alpha the placeholder proof assumes', () => {
      expect(chrome().declarations['--nova-chrome-field']).toBe(
        `rgb(255 255 255 / ${GLASS.chromeFieldAlpha})`,
      );
    });

    it('frosts with the chrome filter and rims the bottom and the side with a 1px hairline', () => {
      expect(chrome().declarations).toMatchObject({
        'backdrop-filter': 'var(--nova-chrome-filter)',
        '-webkit-backdrop-filter': 'var(--nova-chrome-filter)',
        'border-bottom': '1px solid rgb(255 255 255 / 0.12)',
        'border-right': '1px solid rgb(255 255 255 / 0.12)',
      });
    });

    it('falls back to a solid brand fill where color-mix is missing, so white text never lands on nothing', () => {
      expect(
        chrome().nested[
          '@supports not (color: color-mix(in srgb, red 50%, transparent))'
        ]?.declarations,
      ).toEqual({ 'background-color': 'var(--nova-color-primary-strong)' });
    });
  });

  describe('nova-hero', () => {
    const hero = () => utility('nova-hero');

    it('turns the keyboard focus ring to the on-primary colour, since the brand ring vanishes on the brand', () => {
      expect(hero().declarations['--nova-focus-ring']).toBe(
        'var(--nova-color-on-primary)',
      );
    });

    it('sets the on-primary text colour and frosts with the hero filter', () => {
      expect(hero().declarations).toMatchObject({
        color: 'var(--nova-color-on-primary)',
        'backdrop-filter': 'var(--nova-hero-filter)',
        '-webkit-backdrop-filter': 'var(--nova-hero-filter)',
      });
    });

    it('paints the brand gradient token on a layer behind its content, at the hero opacity', () => {
      expect(hero().declarations).toMatchObject({
        position: 'relative',
        isolation: 'isolate',
      });
      expect(hero().nested['&::before']?.declarations).toMatchObject({
        content: "''",
        position: 'absolute',
        inset: '0',
        'z-index': '-1',
        'border-radius': 'inherit',
        'background-image': 'var(--nova-gradient-brand)',
        opacity: 'var(--nova-hero-opacity)',
        'pointer-events': 'none',
      });
    });

    it('does not repeat the gradient stops, so the token stays the one definition', () => {
      expect(JSON.stringify(hero())).not.toMatch(/--nova-color-primary/);
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

    // Owner decision: no gradient borders. A data surface is opaque with the card's soft hairline.
    it('edges itself with a plain 1px soft hairline, the card hairline', () => {
      expect(utility('nova-data').declarations['border']).toBe(
        '1px solid var(--nova-color-border)',
      );
    });

    it('draws no gradient and no ::before rim', () => {
      const data = utility('nova-data');
      expect(JSON.stringify(data)).not.toMatch(/gradient|mask/);
      expect(
        Object.keys(data.nested).some((key) => /::?before/.test(key)),
      ).toBe(false);
    });
  });

  describe('nova-gradient-text', () => {
    const text = () => utility('nova-gradient-text');
    const clip =
      '@supports (-webkit-background-clip: text) or (background-clip: text)';

    it('sets a real brand colour first, so the text is never invisible where the clip is unsupported', () => {
      expect(Object.keys(text().declarations)[0]).toBe('color');
      expect(text().declarations['color']).toBe(
        'var(--nova-color-primary-strong)',
      );
    });

    it('only turns the text transparent inside a background-clip support query', () => {
      expect(text().declarations).not.toHaveProperty('background-image');
      expect(text().declarations['color']).not.toBe('transparent');
      expect(text().nested[clip]?.declarations).toEqual({
        'background-image': 'var(--nova-gradient-brand)',
        '-webkit-background-clip': 'text',
        'background-clip': 'text',
        color: 'transparent',
      });
    });
  });

  // A scroll frame or a button inside a rounded Surface clips to the Surface's corners, whatever its
  // radius. It is a utility, not an arbitrary rounded-[inherit], so the radius grammar stays closed.
  it('nova-radius-inherit takes the corner radius of its parent', () => {
    expect(utility('nova-radius-inherit').declarations).toEqual({
      'border-radius': 'inherit',
    });
  });

  // A solid AI-cyan rail: one colour, start to end (a single-colour layer, so no colour ever
  // changes along it). AI output is told apart by the AiBadge spark and label plus this rail.
  it('nova-ai-rail paints a solid 3px AI-cyan rail down the left edge, flush with the border and clipped by the radius', () => {
    expect(utility('nova-ai-rail').declarations).toEqual({
      'background-image':
        'linear-gradient(var(--nova-color-ai), var(--nova-color-ai))',
      'background-repeat': 'no-repeat',
      'background-origin': 'border-box',
      'background-position': 'left top',
      'background-size': '3px 100%',
    });
  });
});

describe('theme.css named gradients', () => {
  // A var() inside a custom property is resolved where the property is declared and inherited as a
  // finished value. Declared on :root alone, a brand-derived gradient would stay HOS violet inside a
  // NovaThemeProvider subtree, so those tokens are declared on every scope a theme or material can set.
  const scoped = () => rulesFor(BRAND_SCOPES)[0]?.declarations ?? {};
  const fixed = () => rulesFor(':root').map((rule) => rule.declarations);

  it.each([
    '--nova-gradient-brand',
    '--nova-gradient-chrome',
    '--nova-gradient-aurora',
  ])(
    'declares %s on every theme and material scope, so a subtree re-resolves it',
    (name) => {
      expect(rulesFor(BRAND_SCOPES)).toHaveLength(1);
      expect(scoped()[name]).toBeDefined();
    },
  );

  it('declares --nova-gradient-ai on :root alone, so no theme or material scope can re-resolve it', () => {
    expect(fixed().filter((d) => '--nova-gradient-ai' in d)).toHaveLength(1);
    expect(scoped()).not.toHaveProperty('--nova-gradient-ai');
  });

  it('--nova-gradient-brand runs 120deg from primary-strong to primary, the two stops the hero contrast gate checks', () => {
    expect(scoped()['--nova-gradient-brand']).toBe(
      'linear-gradient(120deg, var(--nova-color-primary-strong), var(--nova-color-primary))',
    );
  });

  it('--nova-gradient-chrome deepens downward from the proof’s brand mix to the bare base, both at the chrome opacity', () => {
    const at = (colour: string) =>
      `color-mix(in srgb, ${colour} calc(var(--nova-chrome-opacity) * 100%), transparent)`;
    const lifted = `color-mix(in srgb, var(--nova-color-primary-strong) ${percent(GLASS.chromeBrandShare)}, ${GLASS.chromeBase})`;
    expect(scoped()['--nova-gradient-chrome']?.toLowerCase()).toBe(
      `linear-gradient(180deg, ${at(lifted)}, ${at(GLASS.chromeBase)})`.toLowerCase(),
    );
  });

  it('--nova-gradient-aurora is the four-blob mesh, tinted by the brand at the strength the proof assumes', () => {
    const aurora = scoped()['--nova-gradient-aurora'] ?? '';
    expect(aurora.match(/radial-gradient\(/g)).toHaveLength(4);
    expect(aurora).toContain(
      `color-mix(in srgb, var(--nova-color-primary) calc(${percent(GLASS.canvasTint)} * var(--nova-glass)), transparent)`,
    );
  });

  // Owner decision: no gradient borders, so the data-card edge gradient is gone everywhere.
  it('declares no --nova-gradient-edge on any scope', () => {
    expect(source).not.toContain('--nova-gradient-edge');
  });

  describe('--nova-gradient-ai', () => {
    const ai = () =>
      fixed().find((d) => '--nova-gradient-ai' in d)?.['--nova-gradient-ai'] ??
      '';

    it('runs 135deg from the bright cyan through the AI cyan into the fixed violet primitive', () => {
      expect(ai().toLowerCase()).toBe(
        `linear-gradient(135deg, #22d3ee, var(--nova-color-ai), ${primitives.violet[600]})`.toLowerCase(),
      );
    });

    it('never references the brand, so no hospital can recolour the mark that says a machine wrote this', () => {
      expect(ai()).not.toBe('');
      expect(ai()).not.toMatch(/--nova-color-primary/);
    });
  });

  describe('across hospital themes', () => {
    // What a surface sees at the scope where a theme is applied: the defaults, the material, the
    // gradient tokens, then the theme's own variables.
    const declared: Record<string, string> = {
      ...NOVA_DEFAULTS,
      ...MATERIAL_TOKENS.glass,
      ...scoped(),
      ...Object.assign({}, ...fixed()),
    };
    const resolve = (name: string, theme?: NovaTheme): string => {
      const vars: Record<string, string> = {
        ...declared,
        ...theme?.cssVariables,
      };
      let value = vars[name] ?? '';
      for (let pass = 0; pass < 8 && value.includes('var('); pass++) {
        value = value.replace(/var\((--[\w-]+)\)/g, (_, ref: string) => {
          const resolved = vars[ref];
          if (resolved === undefined) throw new Error(`${ref} is undeclared`);
          return resolved;
        });
      }
      return value;
    };

    const rose = createNovaTheme({
      name: 'Rose',
      brand: {
        primary: '#9D174D',
        primaryStrong: '#831843',
        primarySoft: '#FCE7F3',
      },
    });
    const teal = createNovaTheme({
      name: 'Teal Care',
      brand: {
        primary: '#0F766E',
        primaryStrong: '#115E59',
        primarySoft: '#CCFBF1',
      },
    });

    it('a wildly different brand leaves --nova-gradient-ai exactly as it was', () => {
      const original = resolve('--nova-gradient-ai');
      expect(original).toContain('#22D3EE');
      expect(resolve('--nova-gradient-ai', rose)).toBe(original);
      expect(resolve('--nova-gradient-ai', teal)).toBe(original);
    });

    it('while --nova-gradient-brand follows the brand', () => {
      expect(resolve('--nova-gradient-brand')).toBe(
        `linear-gradient(120deg, ${NOVA_DEFAULTS['--nova-color-primary-strong']}, ${NOVA_DEFAULTS['--nova-color-primary']})`,
      );
      expect(resolve('--nova-gradient-brand', rose)).toBe(
        'linear-gradient(120deg, #831843, #9D174D)',
      );
      expect(resolve('--nova-gradient-brand', teal)).toBe(
        'linear-gradient(120deg, #115E59, #0F766E)',
      );
    });

    it('and so do the other brand-derived gradients, with none of the default violet left in them', () => {
      for (const name of ['--nova-gradient-chrome', '--nova-gradient-aurora']) {
        const themed = resolve(name, rose);
        expect(themed, name).not.toBe(resolve(name));
        expect(themed.toUpperCase(), name).toMatch(/#(?:9D174D|831843)/);
        expect(themed.toUpperCase(), name).not.toMatch(/#(?:6D4FE0|5636B8)/);
      }
    });
  });
});

describe('theme.css Tailwind theme mapping', () => {
  const stock = () => block('@theme').declarations;
  const mapped = () => block('@theme inline').declarations;

  // The stock shadow scale is gone, so shadow-sm and friends generate nothing; the only shadows are
  // the elevation tokens.
  it('resets the stock shadow, radius and colour scales, so only Nova tokens generate utilities', () => {
    expect(stock()).toMatchObject({
      '--color-*': 'initial',
      '--radius-*': 'initial',
      '--shadow-*': 'initial',
    });
    expect(
      Object.keys(stock()).filter((name) => /^--shadow-(?!\*)/.test(name)),
    ).toEqual([]);
  });

  it('maps the elevation scale, and nothing else, into shadow-elevation-* utilities', () => {
    const shadows = Object.entries(mapped()).filter(([name]) =>
      name.startsWith('--shadow-'),
    );
    expect(shadows).toEqual(
      ['1', '2', '3', 'button'].map((level) => [
        `--shadow-elevation-${level}`,
        `var(--nova-elevation-${level})`,
      ]),
    );
  });

  it('maps the radius grammar sm / md / lg / xl onto the Nova tokens', () => {
    for (const step of ['sm', 'md', 'lg', 'xl']) {
      expect(mapped()[`--radius-${step}`]).toBe(`var(--nova-radius-${step})`);
    }
    expect(
      Object.keys(mapped()).filter((name) => name.startsWith('--radius-')),
    ).toHaveLength(4);
  });

  it.each([
    'micro',
    'caption',
    'callout',
    'body',
    'headline',
    'title3',
    'title2',
    'title1',
  ])(
    'maps the %s step of the type ramp, with its line height, into text-* utilities',
    (step) => {
      expect(mapped()).toMatchObject({
        [`--text-${step}`]: `var(--nova-text-${step})`,
        [`--text-${step}--line-height`]: `var(--nova-text-${step}--line-height)`,
      });
    },
  );

  // Headlines (20px and up) tighten slightly; small text is never tightened.
  it('tightens the tracking of headline sizes only', () => {
    const tightened = Object.entries(mapped())
      .filter(([name]) => name.endsWith('--letter-spacing'))
      .map(([name, value]) => [name, value]);
    expect(tightened).toEqual(
      ['headline', 'title3', 'title2', 'title1'].map((step) => [
        `--text-${step}--letter-spacing`,
        'var(--nova-tracking-tight)',
      ]),
    );
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

describe('theme.css motion', () => {
  it('defines the dialog entrance (scale from 0.94 with a fade) and the scrim fade, quick and ease-out', () => {
    expect(block('@theme').declarations).toMatchObject({
      '--animate-dialog-in': 'nova-dialog-in 180ms ease-out',
      '--animate-fade-in': 'nova-fade-in 180ms ease-out',
    });
    expect(
      block('@keyframes nova-dialog-in').nested['from']?.declarations,
    ).toEqual({ opacity: '0', transform: 'scale(0.94)' });
    expect(
      block('@keyframes nova-fade-in').nested['from']?.declarations,
    ).toEqual({ opacity: '0' });
  });
});
