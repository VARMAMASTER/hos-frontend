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
    'nova-card',
    'nova-surface',
    'nova-overlay',
    'nova-field',
    'nova-chrome',
    'nova-sidebar',
    'nova-hero',
    'nova-data',
    'nova-ai-block',
    'nova-gradient-text',
    'nova-ai-grad',
    'nova-ai-mark',
    'nova-ai-rail',
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
        'box-shadow': `var(--nova-${token}-lift, var(--nova-${token}-shadow))`,
      });
    },
  );

  // The prototype's .card: an opaque panel, a 1px --line edge and --shadow-sm, under either material.
  it('nova-card is the prototype card, opaque under either material', () => {
    const card = utility('nova-card');
    expect(card.declarations).toMatchObject({
      'background-color': 'var(--nova-color-surface)',
      border: '1px solid var(--nova-color-border)',
      'box-shadow': 'var(--nova-surface-lift, var(--nova-shadow-sm))',
    });
    expect(JSON.stringify(card)).not.toMatch(
      /--nova-(?:glass|surface-(?:fill|filter|border|shadow)|overlay|chrome|hero)\b/,
    );
    expect(card.declarations).not.toHaveProperty('backdrop-filter');
  });

  // Registered as non-inherited, so a Dialog's lift never leaks into the cards and menus it holds.
  it.each(['--nova-surface-lift', '--nova-overlay-lift', '--nova-data-lift'])(
    'registers %s as a non-inherited property',
    (name) => {
      expect(block(`@property ${name}`).declarations).toEqual({
        syntax: "'*'",
        inherits: 'false',
      });
    },
  );

  // A selected card or option upgrades its edge to 2px primary.
  it.each(['nova-card', 'nova-surface', 'nova-data'])(
    '%s upgrades a selected container to a 2px primary border',
    (name) => {
      expect(
        utility(name).nested["&[data-selected='true']"]?.declarations,
      ).toEqual({ border: '2px solid var(--nova-color-primary)' });
    },
  );

  // The prototype's .f-input is an opaque panel. The edge is a custom property, so a control states
  // hover, invalid or checked by setting one variable instead of fighting the utility's border with
  // an important modifier. Unset, it is border-control, which material.spec.ts proves at 3:1.
  it('nova-field is an opaque panel with its edge from --nova-field-edge, border-control by default', () => {
    const field = utility('nova-field');
    expect(field.declarations).toMatchObject({
      'background-color': 'var(--nova-color-surface)',
      border:
        '1px solid var(--nova-field-edge, var(--nova-color-border-control))',
    });
    expect(field.declarations).not.toHaveProperty('backdrop-filter');
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

  // The ring is a custom property, so it inherits. The chrome and the hero set their own for their
  // dark controls; a light surface nested inside them (a menu anchored in the sidebar, a card in the
  // hero) must turn it back, or its focused items draw a pale ring on white.
  it.each([
    'nova-card',
    'nova-surface',
    'nova-overlay',
    'nova-field',
    'nova-data',
    'nova-ai-block',
  ])(
    '%s resets the keyboard focus ring to the brand primary, so a light surface nested in the chrome or the hero never inherits a pale ring',
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
  describe('nova-chrome (the prototype .topbar)', () => {
    const chrome = () => utility('nova-chrome');

    it('lays the grain over the top-bar fill, blended as the prototype blends it', () => {
      expect(chrome().declarations).toMatchObject({
        'background-image': 'var(--nova-grain), var(--nova-chrome-fill)',
        'background-blend-mode': 'overlay, normal',
      });
    });

    it('turns the keyboard focus ring white, since the chrome accent is 2.4:1 at the light end', () => {
      expect(chrome().declarations['--nova-focus-ring']).toBe('#fff');
    });

    it('sets white text, and hands children their secondary ink at the alpha the proof assumes', () => {
      expect(chrome().declarations['color']).toBe('#fff');
      expect(chrome().declarations['--nova-chrome-ink-2']).toBe(
        `rgb(255 255 255 / ${GLASS.chromeInk2Alpha})`,
      );
      expect(chrome().declarations['--nova-chrome-field']).toBe(
        `rgb(255 255 255 / ${GLASS.chromeFieldAlpha})`,
      );
    });

    it('frosts with the chrome filter and rims the bottom with the chrome line and an inner highlight', () => {
      expect(chrome().declarations).toMatchObject({
        'backdrop-filter': 'var(--nova-chrome-filter)',
        '-webkit-backdrop-filter': 'var(--nova-chrome-filter)',
        'border-bottom': '1px solid var(--nova-color-chrome-line)',
        'box-shadow': 'inset 0 -1px 0 0 rgba(255,255,255,.06)',
      });
    });
  });

  describe('nova-sidebar (the prototype .sidebar)', () => {
    const sidebar = () => utility('nova-sidebar');

    it('paints the grain over the sidebar gradient, screened as the prototype screens its lift, and never frosts', () => {
      expect(sidebar().declarations).toMatchObject({
        'background-image': 'var(--nova-grain), var(--nova-gradient-sidebar)',
        'background-blend-mode': 'overlay, screen, normal',
        'border-right': '1px solid var(--nova-color-chrome-line)',
        'box-shadow': 'inset -1px 0 0 rgba(255,255,255,.05)',
        color: 'var(--nova-color-chrome-ink)',
      });
      expect(sidebar().declarations).not.toHaveProperty('backdrop-filter');
    });

    it('rings focus in the chrome accent and hands children the proven secondary ink', () => {
      expect(sidebar().declarations).toMatchObject({
        '--nova-focus-ring': 'var(--nova-color-chrome-accent)',
        '--nova-sidebar-ink-2': `rgb(241 238 251 / ${GLASS.sidebarInk2Alpha})`,
      });
    });
  });

  describe('nova-hero (the prototype .glass-hero)', () => {
    const hero = () => utility('nova-hero');

    it('paints the hero fill over the hero base, frosted, rimmed with the chrome line', () => {
      expect(hero().declarations).toMatchObject({
        'background-color': 'var(--nova-hero-base)',
        'background-image': 'var(--nova-hero-fill)',
        'backdrop-filter': 'var(--nova-hero-filter)',
        '-webkit-backdrop-filter': 'var(--nova-hero-filter)',
        border: '1px solid var(--nova-color-chrome-line)',
        'box-shadow':
          'var(--nova-shadow-glass), inset 0 1px 0 0 rgba(255,255,255,.16)',
        overflow: 'hidden',
      });
    });

    it('sets white text and a white ring, and hands children the proven secondary ink', () => {
      expect(hero().declarations).toMatchObject({
        color: '#fff',
        '--nova-focus-ring': '#fff',
        '--nova-hero-ink-2': `rgb(255 255 255 / ${GLASS.heroInk2Alpha})`,
      });
    });

    it('lays the grain behind its content', () => {
      expect(hero().declarations).toMatchObject({
        position: 'relative',
        isolation: 'isolate',
      });
      expect(hero().nested['&::after']?.declarations).toMatchObject({
        'background-image': 'var(--nova-grain-hero)',
        opacity: '0.06',
        'mix-blend-mode': 'overlay',
        'z-index': '-1',
        'pointer-events': 'none',
      });
    });
  });

  describe('nova-data (the prototype card with .edge-premium)', () => {
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

    it('rests on the card hairline and --shadow-sm', () => {
      expect(utility('nova-data').declarations).toMatchObject({
        border: '1px solid var(--nova-color-border)',
        'box-shadow': 'var(--nova-data-lift, var(--nova-shadow-sm))',
      });
    });

    it('draws the gradient edge as a masked 1px ring, swappable through --nova-data-edge', () => {
      expect(utility('nova-data').nested['&::before']?.declarations).toEqual({
        content: "''",
        position: 'absolute',
        inset: '0',
        padding: '1px',
        'border-radius': 'inherit',
        background: 'var(--nova-data-edge, var(--nova-gradient-edge))',
        '-webkit-mask':
          'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        '-webkit-mask-composite': 'xor',
        mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        'mask-composite': 'exclude',
        'pointer-events': 'none',
      });
    });
  });

  describe('nova-ai-block (the prototype .ai-block)', () => {
    const block = () => utility('nova-ai-block');

    it('washes near-white, edges in the AI line with no left border, and pads 16px plus the rail', () => {
      expect(block().declarations).toMatchObject({
        'background-color': 'var(--nova-color-ai-ghost)',
        border: '1px solid var(--nova-color-ai-line)',
        'border-left': 'none',
        padding: 'var(--nova-space-6)',
        'padding-left': 'calc(var(--nova-space-6) + 3px)',
        overflow: 'hidden',
      });
    });

    it('draws the 3px AI gradient rail down the left edge as a background layer', () => {
      expect(block().declarations).toMatchObject({
        'background-image': 'var(--nova-gradient-ai-rail)',
        'background-repeat': 'no-repeat',
        'background-origin': 'border-box',
        'background-position': 'left top',
        'background-size': '3px 100%',
      });
    });

    it('settles once approved: a green wash, a green edge and a solid green rail', () => {
      expect(block().nested["&[data-approved='true']"]?.declarations).toEqual({
        'background-color': 'var(--nova-color-good-soft)',
        'background-image':
          'linear-gradient(var(--nova-color-good), var(--nova-color-good))',
        'border-color':
          'color-mix(in srgb, var(--nova-color-good) 32%, transparent)',
      });
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

  it('nova-ai-grad fills with the AI gradient and nova-ai-mark with the AI mark', () => {
    expect(utility('nova-ai-grad').declarations).toEqual({
      'background-image': 'var(--nova-gradient-ai)',
    });
    expect(utility('nova-ai-mark').declarations).toEqual({
      'background-image': 'var(--nova-ai-mark)',
    });
  });

  it('nova-ai-rail paints the 3px AI gradient rail down the left edge, flush with the border', () => {
    expect(utility('nova-ai-rail').declarations).toEqual({
      'background-image': 'var(--nova-gradient-ai-rail)',
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
  const fixedValue = (name: string) =>
    fixed().find((d) => name in d)?.[name] ?? '';

  it.each([
    '--nova-gradient-brand',
    '--nova-gradient-sidebar',
    '--nova-gradient-aurora',
  ])(
    'declares %s on every theme and material scope, so a subtree re-resolves it',
    (name) => {
      expect(rulesFor(BRAND_SCOPES)).toHaveLength(1);
      expect(scoped()[name]).toBeDefined();
    },
  );

  it.each([
    '--nova-gradient-ai',
    '--nova-gradient-ai-rail',
    '--nova-gradient-edge',
    '--nova-gradient-edge-kpi',
  ])(
    'declares %s on :root alone, so no theme or material scope can re-resolve it',
    (name) => {
      expect(fixed().filter((d) => name in d)).toHaveLength(1);
      expect(scoped()).not.toHaveProperty(name);
    },
  );

  it('--nova-gradient-brand runs 120deg from primary-strong to primary', () => {
    expect(scoped()['--nova-gradient-brand']).toBe(
      'linear-gradient(120deg, var(--nova-color-primary-strong), var(--nova-color-primary))',
    );
  });

  it('--nova-gradient-sidebar is the prototype sidebar: the brand lift at 42% over a base that deepens downward', () => {
    expect(scoped()['--nova-gradient-sidebar']).toBe(
      `radial-gradient(120% 42% at 0% 0%, color-mix(in srgb, var(--nova-color-primary) ${percent(GLASS.sidebarBrandShare)}, transparent), transparent 70%), linear-gradient(180deg, #26185A 0%, #1A0F42 42%, #150C34 100%)`,
    );
  });

  it('--nova-gradient-aurora is the prototype four-blob mesh, tinted by the brand at the strength the proof assumes', () => {
    const aurora = scoped()['--nova-gradient-aurora'] ?? '';
    expect(aurora.match(/radial-gradient\(/g)).toHaveLength(4);
    for (const geometry of [
      '680px 520px at 8% -6%',
      '720px 560px at 96% 4%',
      '760px 620px at 78% 96%',
      '620px 520px at 18% 104%',
    ]) {
      expect(aurora).toContain(`radial-gradient(${geometry}, `);
    }
    expect(aurora).toContain(
      `color-mix(in srgb, var(--nova-color-primary) calc(${percent(GLASS.canvasTint)} * var(--nova-glass)), transparent)`,
    );
  });

  it('--nova-gradient-edge is the prototype .edge-premium and --nova-gradient-edge-kpi the .kpi edge', () => {
    expect(fixedValue('--nova-gradient-edge')).toBe(
      'linear-gradient(135deg, rgba(167,139,250,.55), rgba(34,211,238,.26) 60%, transparent 85%)',
    );
    expect(fixedValue('--nova-gradient-edge-kpi')).toBe(
      'linear-gradient(135deg, rgba(167,139,250,.5), rgba(34,211,238,.24) 65%, transparent 85%)',
    );
  });

  describe('the AI gradients', () => {
    it('--nova-gradient-ai runs 135deg from the bright cyan through the AI cyan into the pinned violet', () => {
      expect(fixedValue('--nova-gradient-ai')).toBe(
        `linear-gradient(135deg, var(--nova-color-ai-bright) 0%, var(--nova-color-ai) 48%, ${primitives.violet[600]} 105%)`,
      );
    });

    it('--nova-gradient-ai-rail runs down from the pinned violet through the AI cyan to the bright stop', () => {
      expect(fixedValue('--nova-gradient-ai-rail')).toBe(
        `linear-gradient(180deg, ${primitives.violet[600]} 0%, var(--nova-color-ai) 52%, var(--nova-color-ai-bright) 100%)`,
      );
    });

    it('never reference the brand, so no hospital can recolour the mark that says a machine wrote this', () => {
      for (const name of ['--nova-gradient-ai', '--nova-gradient-ai-rail']) {
        expect(fixedValue(name), name).not.toBe('');
        expect(fixedValue(name), name).not.toMatch(/--nova-color-primary/);
      }
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

    it('a wildly different brand leaves the AI gradients exactly as they were', () => {
      for (const name of ['--nova-gradient-ai', '--nova-gradient-ai-rail']) {
        const original = resolve(name);
        expect(original).toContain('#22D3EE');
        expect(resolve(name, rose)).toBe(original);
        expect(resolve(name, teal)).toBe(original);
      }
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

    it('and so do the sidebar lift and the aurora, with none of the default violet left in them', () => {
      for (const name of [
        '--nova-gradient-sidebar',
        '--nova-gradient-aurora',
      ]) {
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

  it('maps the prototype shadow scale, and nothing else, into shadow-sm | md | lg | glass', () => {
    const shadows = Object.entries(mapped()).filter(([name]) =>
      name.startsWith('--shadow-'),
    );
    expect(shadows).toEqual(
      ['sm', 'md', 'lg', 'glass'].map((size) => [
        `--shadow-${size}`,
        `var(--nova-shadow-${size})`,
      ]),
    );
  });

  it('maps the prototype radii sm / md / lg / xl / full onto the Nova tokens', () => {
    const radii = Object.entries(mapped()).filter(([name]) =>
      name.startsWith('--radius-'),
    );
    expect(radii).toEqual(
      ['sm', 'md', 'lg', 'xl', 'full'].map((step) => [
        `--radius-${step}`,
        `var(--nova-radius-${step})`,
      ]),
    );
  });

  // Sizes are written text-[Npx] from PROTOTYPE_TYPE_SIZES; there is no named ramp any more.
  it('maps no named text sizes', () => {
    expect(
      Object.keys({ ...stock(), ...mapped() }).filter((name) =>
        name.startsWith('--text-'),
      ),
    ).toEqual([]);
  });

  it('sets Google Sans Flex as the sans and display face and IBM Plex Mono as the mono face', () => {
    expect(mapped()).toMatchObject({
      '--font-sans': 'var(--nova-font-body)',
      '--font-display': 'var(--nova-font-display)',
      '--font-mono': 'var(--nova-font-mono)',
      '--default-font-family': 'var(--nova-font-body)',
    });
  });

  it('carries the prototype heading tracking as tracking-h1 | h2 | h3', () => {
    expect(stock()).toMatchObject({
      '--tracking-h1': '-0.015em',
      '--tracking-h2': '-0.01em',
      '--tracking-h3': '-0.005em',
    });
  });
});

describe('theme.css base rules', () => {
  // The prototype draws plain border-radius corners: the Apple squircle is gone.
  it('sets no corner-shape anywhere, so every radius is a plain border-radius', () => {
    expect(source).not.toMatch(/corner-shape/);
  });

  it('sets the prototype page type on the body: Google Sans Flex, 14px on a 1.55 line', () => {
    expect(block('@layer base').nested['body']?.declarations).toEqual({
      'font-family': 'var(--nova-font-body)',
      'font-size': '14px',
      'line-height': '1.55',
      color: 'var(--nova-color-ink)',
      background: 'var(--nova-color-bg)',
      'font-optical-sizing': 'auto',
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
