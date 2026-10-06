// @vitest-environment node
// Reads theme.css from disk (see semantic.spec.ts for why this runs under node).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio, mixColours } from '../theme/contrast';
import { screenColours } from '../theme/legibility';
import {
  GLASS,
  isNovaMaterial,
  MATERIAL_FILLS,
  MATERIAL_LEVELS,
  MATERIAL_TOKENS,
  NOVA_DEFAULT_MATERIAL,
  NOVA_MATERIALS,
} from './material';
import { NOVA_DEFAULTS } from './semantic';

const css = readFileSync(
  fileURLToPath(new URL('../styles/theme.css', import.meta.url)),
  'utf8',
);

// Declarations of every block whose selector list is exactly `selector` (whitespace-insensitive).
function blocksFor(selector: string): Array<Record<string, string>> {
  const wanted = selector.replace(/\s+/g, ' ').trim();
  const blocks: Array<Record<string, string>> = [];
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectorText = match[1]
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (selectorText !== wanted) continue;
    blocks.push(
      Object.fromEntries(
        [...match[2].matchAll(/(--nova-[\w-]+):\s*([^;]+);/g)].map((m) => [
          m[1],
          m[2].replace(/\s+/g, ' ').trim(),
        ]),
      ),
    );
  }
  return blocks;
}

const percent = (share: number) => `${Math.round(share * 100)}%`;

const ink2 = NOVA_DEFAULTS['--nova-color-ink-2'];
const ink3 = NOVA_DEFAULTS['--nova-color-ink-3'];
const borderControl = NOVA_DEFAULTS['--nova-color-border-control'];
const bg = NOVA_DEFAULTS['--nova-color-bg'];
const chromeInk = NOVA_DEFAULTS['--nova-color-chrome-ink'];
const chromeAccent = NOVA_DEFAULTS['--nova-color-chrome-accent'];
const white = '#FFFFFF';
// The sidebar's gradient stops (theme.css --nova-gradient-sidebar) and the prototype's hero colours.
const SIDEBAR_TOP = NOVA_DEFAULTS['--nova-color-sidebar-1'];
const SIDEBAR_BASE = NOVA_DEFAULTS['--nova-color-sidebar-3'];
const TOPBAR_END = NOVA_DEFAULTS['--nova-color-chrome-3'];
const HERO_SKY = NOVA_DEFAULTS['--nova-color-chrome-glow-2'];
const HERO_BASE = NOVA_DEFAULTS['--nova-color-chrome-1'];
// The theme gate needs white on the primary at 4.5:1, which caps its luminance: #767676 is the
// lightest primary that passes, so it is the worst case for anything the brand lightens.
const lightestPrimary = '#767676';

describe('material', () => {
  it('is glass by default, product-wide, and one of glass, frost or solid', () => {
    expect(NOVA_DEFAULT_MATERIAL).toBe('glass');
    expect(NOVA_MATERIALS).toEqual(['glass', 'frost', 'solid']);
  });

  it('recognises only "glass", "frost" and "solid"', () => {
    expect(isNovaMaterial('glass')).toBe(true);
    expect(isNovaMaterial('frost')).toBe(true);
    expect(isNovaMaterial('solid')).toBe(true);
    expect(isNovaMaterial('frosted')).toBe(false);
    expect(isNovaMaterial(null)).toBe(false);
  });

  it('gives every material exactly the same set of tokens, so switching never leaves one unset', () => {
    for (const material of NOVA_MATERIALS) {
      expect(Object.keys(MATERIAL_TOKENS[material]).sort(), material).toEqual(
        Object.keys(MATERIAL_TOKENS.glass).sort(),
      );
    }
    expect(MATERIAL_TOKENS.glass['--nova-glass']).toBe('1');
    expect(MATERIAL_TOKENS.frost['--nova-glass']).toBe('1');
    expect(MATERIAL_TOKENS.solid['--nova-glass']).toBe('0');
  });

  // A material is numbers (and the scheme-aware sheen), never a brand colour: theme.css builds the
  // fills from them at every theme scope, so a material switched anywhere meets the nearest theme.
  it('names no brand-derived colour, so it combines with any hospital theme', () => {
    for (const material of NOVA_MATERIALS) {
      for (const [name, value] of Object.entries(MATERIAL_TOKENS[material])) {
        expect(value, `${material} ${name}`).not.toMatch(
          /--nova-color-(?!sheen)/,
        );
      }
    }
  });

  // The prototype's glass utilities, value for value: .glass-panel and .glass-card frost with their
  // own blur and saturation, rim with a white hairline and lift at --shadow-md under a 1px highlight.
  // The white is the sheen token, white in the light scheme.
  it('frosts a glass panel as the prototype .glass-panel does', () => {
    expect(NOVA_DEFAULTS['--nova-color-sheen']).toBe(white);
    expect(MATERIAL_TOKENS.glass).toMatchObject({
      '--nova-surface-alpha': '72%',
      '--nova-surface-tint': '0%',
      '--nova-surface-filter': 'blur(14px) saturate(140%)',
      '--nova-surface-rim':
        'color-mix(in srgb, var(--nova-color-sheen) 50%, transparent)',
      '--nova-surface-shadow':
        'var(--nova-shadow-md), inset 0 1px 0 0 color-mix(in srgb, var(--nova-color-sheen) 70%, transparent)',
    });
  });

  it('frosts an overlay as the prototype .glass-card does, at the opacity the proof holds', () => {
    expect(MATERIAL_TOKENS.glass).toMatchObject({
      '--nova-overlay-alpha': '83%',
      '--nova-overlay-filter': 'blur(20px) saturate(160%)',
      '--nova-overlay-rim':
        'color-mix(in srgb, var(--nova-color-sheen) 60%, transparent)',
      '--nova-overlay-shadow':
        'var(--nova-shadow-md), inset 0 1px 0 0 color-mix(in srgb, var(--nova-color-sheen) 65%, transparent)',
    });
    // The prototype's .glass-card is 0.62; the proof for a menu over the sidebar needs 0.83.
    expect(GLASS.overlayAlpha).toBe(0.83);
  });

  it('paints the top bar and the hero at the prototype opacities, held where the proofs need it', () => {
    expect(MATERIAL_TOKENS.glass).toMatchObject({
      '--nova-chrome-alpha-start': '85%',
      '--nova-chrome-alpha-end': '78%',
      '--nova-chrome-filter': 'blur(16px) saturate(150%)',
      '--nova-hero-alpha-start': '92%',
      '--nova-hero-alpha-end': '55%',
      '--nova-hero-base-alpha': '90%',
      '--nova-hero-filter': 'blur(20px) saturate(160%)',
    });
  });

  // Frost is a heavier, more opaque, tinted glass: everything at least as opaque as glass, more blur,
  // and the panels tinted toward panel-2.
  it('makes frost heavier, more opaque and tinted', () => {
    const glass = MATERIAL_LEVELS.glass;
    const frost = MATERIAL_LEVELS.frost;
    for (const key of [
      'surfaceAlpha',
      'overlayAlpha',
      'chromeStartAlpha',
      'chromeEndAlpha',
      'heroStartAlpha',
      'heroEndAlpha',
      'heroBaseAlpha',
    ] as const) {
      expect(frost[key], key).toBeGreaterThanOrEqual(glass[key]);
    }
    const blur = (filter: string) =>
      Number(/blur\((\d+)px\)/.exec(filter)?.[1]);
    for (const key of [
      'surfaceFilter',
      'overlayFilter',
      'chromeFilter',
      'heroFilter',
    ] as const) {
      expect(blur(frost[key]), key).toBeGreaterThan(blur(glass[key]));
    }
    expect(frost.surfaceTint).toBe(1);
    expect(frost.overlayTint).toBe(1);
  });

  // Solid is the prototype's opaque card and menu, and its own @supports fallbacks for the chrome
  // and the hero.
  it('makes solid the prototype card, menu and opaque fallbacks', () => {
    expect(MATERIAL_TOKENS.solid).toMatchObject({
      '--nova-surface-alpha': '100%',
      '--nova-surface-filter': 'none',
      '--nova-surface-shadow': 'var(--nova-shadow-sm)',
      '--nova-overlay-alpha': '100%',
      '--nova-overlay-filter': 'none',
      '--nova-overlay-shadow': 'var(--nova-shadow-md)',
      '--nova-chrome-alpha-start': '100%',
      '--nova-chrome-alpha-end': '100%',
      '--nova-chrome-filter': 'none',
      '--nova-hero-alpha-start': '100%',
      '--nova-hero-alpha-end': '100%',
      '--nova-hero-base-alpha': '100%',
      '--nova-hero-filter': 'none',
    });
  });

  it('builds the fills from the brand colours and the material numbers, the solid edge from the panel line', () => {
    expect(MATERIAL_FILLS).toMatchObject({
      '--nova-surface-fill':
        'color-mix(in srgb, color-mix(in srgb, var(--nova-color-surface-2) var(--nova-surface-tint), var(--nova-color-surface)) var(--nova-surface-alpha), transparent)',
      '--nova-surface-border':
        'color-mix(in srgb, var(--nova-surface-rim) calc(var(--nova-glass) * 100%), var(--nova-color-border))',
      '--nova-chrome-fill':
        'linear-gradient(120deg, color-mix(in srgb, var(--nova-color-chrome-1) var(--nova-chrome-alpha-start), transparent), color-mix(in srgb, var(--nova-color-chrome-3) var(--nova-chrome-alpha-end), transparent))',
    });
    // The hero runs into the sky on glass and frost, into chrome-3 on solid (the prototype's
    // fallback), over chrome-1 (chrome-2 on solid).
    expect(MATERIAL_FILLS['--nova-hero-fill']).toContain(
      'color-mix(in srgb, var(--nova-color-chrome-glow-2) calc(var(--nova-glass) * 100%), var(--nova-color-chrome-3))',
    );
    expect(MATERIAL_FILLS['--nova-hero-base']).toContain(
      'color-mix(in srgb, var(--nova-color-chrome-1) calc(var(--nova-glass) * 100%), var(--nova-color-chrome-2))',
    );
  });

  it('builds the material tokens from the same numbers the contrast proofs use', () => {
    for (const material of NOVA_MATERIALS) {
      const levels = MATERIAL_LEVELS[material];
      const tokens = MATERIAL_TOKENS[material];
      expect(tokens['--nova-surface-alpha']).toBe(percent(levels.surfaceAlpha));
      expect(tokens['--nova-overlay-alpha']).toBe(percent(levels.overlayAlpha));
      expect(tokens['--nova-chrome-alpha-end']).toBe(
        percent(levels.chromeEndAlpha),
      );
      expect(tokens['--nova-hero-alpha-end']).toBe(
        percent(levels.heroEndAlpha),
      );
      expect(tokens['--nova-hero-base-alpha']).toBe(
        percent(levels.heroBaseAlpha),
      );
    }
    expect(GLASS.topbarEndAlpha).toBe(MATERIAL_LEVELS.glass.chromeEndAlpha);
    expect(GLASS.heroSkyAlpha).toBe(MATERIAL_LEVELS.glass.heroEndAlpha);
    expect(GLASS.heroBaseAlpha).toBe(MATERIAL_LEVELS.glass.heroBaseAlpha);
  });

  it('hands the chrome, the sidebar and the hero their secondary inks at the alphas the proofs use', () => {
    expect(css).toContain(
      `--nova-chrome-ink-2: rgb(255 255 255 / ${GLASS.chromeInk2Alpha});`,
    );
    expect(css).toContain(
      `--nova-chrome-field: rgb(255 255 255 / ${GLASS.chromeFieldAlpha});`,
    );
    expect(css).toContain(
      `--nova-chrome-ink-2: color-mix(in srgb, var(--nova-color-chrome-ink) ${percent(GLASS.sidebarInk2Alpha)}, transparent);`,
    );
    expect(css).toContain(
      `--nova-hero-ink-2: rgb(255 255 255 / ${GLASS.heroInk2Alpha});`,
    );
    expect(css).toContain(
      `color-mix(in srgb, var(--nova-color-sidebar-lift) ${percent(GLASS.sidebarBrandShare)}, transparent)`,
    );
  });
});

// The worst cases every proof below uses, built from the same numbers theme.css paints with.
//
// The canvas: the aurora tints the background with the brand (two blobs, both at GLASS.canvasTint at
// most) and with fixed accent hues (GLASS.canvasAccents, at GLASS.canvasAccentTint). Black is the
// darkest tint any brand could bring, and the proof stacks it on top of the darker accent at full
// strength, a point the gradients never actually reach, so it holds wherever the blobs overlap on a
// narrow screen.
const darker = (a: string, b: string) =>
  contrastRatio(a, white) >= contrastRatio(b, white) ? a : b;
const canvasUnder = (accent: string) =>
  mixColours(
    '#000000',
    GLASS.canvasTint,
    mixColours(accent, GLASS.canvasAccentTint, bg),
  );
const darkestCanvas = GLASS.canvasAccents.map(canvasUnder).reduce(darker);
// The top bar at its lightest: the light end of its gradient over white, which is what a sticky bar
// has under it when it scrolls over a card.
const lightestTopbar = mixColours(TOPBAR_END, GLASS.topbarEndAlpha, white);
// The sidebar at its lightest: a lift as light as the lightest brand primary, screened over the top
// stop. (A theme's lift is derived at HOS Violet's luminance, darker than this bound.)
const lightestSidebar = screenColours(
  lightestPrimary,
  GLASS.sidebarBrandShare,
  SIDEBAR_TOP,
);
// The hero at its lightest: the sky end of the gradient over the hero base over white.
const lightestHero = mixColours(
  HERO_SKY,
  GLASS.heroSkyAlpha,
  mixColours(HERO_BASE, GLASS.heroBaseAlpha, white),
);

describe('glass legibility holds for every possible hospital brand', () => {
  it('takes the darker of the accent hues, under the darkest brand tint, as the darkest canvas', () => {
    expect(GLASS.canvasAccents.length).toBeGreaterThan(0);
    for (const accent of GLASS.canvasAccents) {
      expect(contrastRatio(canvasUnder(accent), white)).toBeLessThanOrEqual(
        contrastRatio(darkestCanvas, white),
      );
    }
  });

  it('keeps small text (ink-3) at 4.5:1 or more on glass panels and overlays', () => {
    for (const alpha of [GLASS.surfaceAlpha, GLASS.overlayAlpha]) {
      expect(
        contrastRatio(ink3, mixColours(white, alpha, darkestCanvas)),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  // Breadcrumbs, page tabs, a divider's label and a page heading's subtitle sit on the bare canvas.
  it.each([
    ['secondary text (ink-2)', ink2],
    ['small text (ink-3)', ink3],
  ])('keeps %s placed directly on the canvas at 4.5:1 or more', (_, ink) => {
    expect(contrastRatio(ink, darkestCanvas)).toBeGreaterThanOrEqual(4.5);
  });

  // The prototype's own ink-3 (#6A6584) does not survive the tinted canvas; that is why it is held.
  it("would fail with the prototype's ink-3, which is why the darker one is kept", () => {
    expect(contrastRatio('#6A6584', darkestCanvas)).toBeLessThan(4.5);
  });

  // A menu anchored in the sidebar composites its overlay over the opaque sidebar, whose base is the
  // darkest chrome there is.
  it.each([
    ['secondary text (ink-2)', ink2],
    ['small text (ink-3)', ink3],
  ])(
    'keeps %s at 4.5:1 or more on an overlay anchored in the dark sidebar',
    (_, ink) => {
      expect(
        contrastRatio(ink, mixColours(white, GLASS.overlayAlpha, SIDEBAR_BASE)),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("would fail with the prototype's .glass-card opacity (0.62), which is why the overlay is held", () => {
    expect(
      contrastRatio(ink3, mixColours(white, 0.62, SIDEBAR_BASE)),
    ).toBeLessThan(4.5);
  });

  it('keeps white text and the secondary chrome ink at 4.5:1 or more on the lightest top bar', () => {
    expect(contrastRatio(white, lightestTopbar)).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(
        mixColours(white, GLASS.chromeInk2Alpha, lightestTopbar),
        lightestTopbar,
      ),
    ).toBeGreaterThanOrEqual(4.5);
  });

  // The search field in the top bar lifts the chrome with its own fill, and its placeholder (the
  // secondary chrome ink) is the only visible label it has.
  it('keeps the secondary chrome ink at 4.5:1 or more inside a top-bar field, where it is the placeholder', () => {
    const field = mixColours(white, GLASS.chromeFieldAlpha, lightestTopbar);
    expect(
      contrastRatio(mixColours(white, GLASS.chromeInk2Alpha, field), field),
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(white, field)).toBeGreaterThanOrEqual(4.5);
  });

  it("would fail with the prototype's light top-bar end (0.72), which is why it is held at 0.78", () => {
    const prototypeEnd = mixColours(TOPBAR_END, 0.72, white);
    const field = mixColours(white, GLASS.chromeFieldAlpha, prototypeEnd);
    expect(
      contrastRatio(mixColours(white, GLASS.chromeInk2Alpha, field), field),
    ).toBeLessThan(4.5);
  });

  it('keeps the chrome ink and the secondary sidebar ink at 4.5:1 or more over the lightest sidebar lift', () => {
    expect(contrastRatio(chromeInk, lightestSidebar)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(
      contrastRatio(
        mixColours(chromeInk, GLASS.sidebarInk2Alpha, lightestSidebar),
        lightestSidebar,
      ),
    ).toBeGreaterThanOrEqual(4.5);
    // The prototype's --chrome-ink-2 (0.66) falls short there.
    expect(
      contrastRatio(
        mixColours(chromeInk, 0.66, lightestSidebar),
        lightestSidebar,
      ),
    ).toBeLessThan(4.5);
  });

  it('keeps white text and the secondary hero ink at 4.5:1 or more at the light end of the hero', () => {
    expect(contrastRatio(white, lightestHero)).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(
        mixColours(white, GLASS.heroInk2Alpha, lightestHero),
        lightestHero,
      ),
    ).toBeGreaterThanOrEqual(4.5);
    // Over the prototype's .6 chrome-glass base, white falls to 3.4:1 at the sky end.
    const prototypeHero = mixColours(
      HERO_SKY,
      GLASS.heroSkyAlpha,
      mixColours(HERO_BASE, 0.6, white),
    );
    expect(contrastRatio(white, prototypeHero)).toBeLessThan(4.5);
  });

  // The tab rail is opaque (the canvas with a 7% chrome-2 tint), so its unselected labels never
  // depend on the aurora behind it.
  it('keeps the secondary ink of an unselected tab at 4.5:1 or more on the tab rail', () => {
    const rail = mixColours(
      NOVA_DEFAULTS['--nova-color-chrome-2'],
      GLASS.tabbarTint,
      bg,
    );
    expect(contrastRatio(ink2, rail)).toBeGreaterThanOrEqual(4.5);
  });

  // WCAG 1.4.11: a field's edge is the thing that says "type here", so it needs 3:1 against both of
  // its neighbours, the field's own (opaque) fill and whatever the field sits on.
  it('gives a form control an edge (border-control) of 3:1 or more against its fill and its backdrop', () => {
    for (const neighbour of [
      darkestCanvas,
      mixColours(white, GLASS.surfaceAlpha, darkestCanvas),
      white,
    ]) {
      expect(
        contrastRatio(borderControl, neighbour),
        neighbour,
      ).toBeGreaterThanOrEqual(3);
    }
    // The prototype's .f-input edge (--line-strong) is 1.6:1 on white.
    expect(
      contrastRatio(NOVA_DEFAULTS['--nova-color-border-strong'], white),
    ).toBeLessThan(3);
  });
});

describe('the keyboard focus ring holds 3:1 for every hospital brand', () => {
  it('the lightest primary the gate allows is the one these proofs use', () => {
    expect(contrastRatio(white, lightestPrimary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(white, '#777777')).toBeLessThan(4.5);
  });

  it.each([
    ['a glass panel over the canvas', GLASS.surfaceAlpha, darkestCanvas],
    ['an overlay over the canvas', GLASS.overlayAlpha, darkestCanvas],
    [
      'an overlay anchored in the dark sidebar',
      GLASS.overlayAlpha,
      SIDEBAR_BASE,
    ],
    ['an opaque card, field or data surface', 1, darkestCanvas],
    // The outline button's 1px primary border is its only boundary, and it may sit on the page.
    ['the bare canvas (also the outline button edge)', 0, darkestCanvas],
  ])('the primary ring on %s', (_, alpha, backdrop) => {
    expect(
      contrastRatio(lightestPrimary, mixColours(white, alpha, backdrop)),
    ).toBeGreaterThanOrEqual(3);
  });

  // The prototype rings focus in --chrome-accent on the dark chrome. It holds on the sidebar, so the
  // sidebar keeps it; on the light end of the top bar it is 2.4:1, so the top bar rings in white.
  it('the chrome-accent ring on the sidebar, from its lightest lift to its base', () => {
    for (const backdrop of [lightestSidebar, SIDEBAR_TOP, SIDEBAR_BASE]) {
      expect(
        contrastRatio(chromeAccent, backdrop),
        backdrop,
      ).toBeGreaterThanOrEqual(3);
    }
    expect(contrastRatio(chromeAccent, lightestTopbar)).toBeLessThan(3);
  });

  it('the white ring on the top bar and the hero', () => {
    expect(contrastRatio(white, lightestTopbar)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(white, lightestHero)).toBeGreaterThanOrEqual(3);
  });
});

describe('theme.css material blocks', () => {
  it('declares the glass tokens on :root (the product default) and on [data-nova-material=glass]', () => {
    expect(blocksFor(":root, [data-nova-material='glass']")).toEqual([
      MATERIAL_TOKENS.glass,
    ]);
  });

  it('declares the frost tokens for [data-nova-material=frost]', () => {
    expect(blocksFor("[data-nova-material='frost']")).toEqual([
      MATERIAL_TOKENS.frost,
    ]);
  });

  it('declares the solid tokens for [data-nova-material=solid]', () => {
    expect(blocksFor("[data-nova-material='solid']")).toEqual([
      MATERIAL_TOKENS.solid,
    ]);
  });

  it('forces solid for reduced transparency, more contrast, and browsers without backdrop-filter', () => {
    expect(css).toContain(
      '@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)',
    );
    expect(css).toContain(
      '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))',
    );
    expect(blocksFor(':root, [data-nova-material]')).toEqual([
      MATERIAL_TOKENS.solid,
      MATERIAL_TOKENS.solid,
    ]);
  });

  it('builds the fills on the root and on every theme and material scope, so either axis re-resolves them', () => {
    const [scoped] = blocksFor(
      ':root, [data-nova-theme], [data-nova-material]',
    );
    expect(scoped).toMatchObject(MATERIAL_FILLS);
  });

  it('tints the canvas with both brand blobs at exactly the strength the legibility proof assumes', () => {
    const tint = `calc(${Math.round(GLASS.canvasTint * 100)}% * var(--nova-glass))`;
    expect(css).toContain(
      `color-mix(in srgb, var(--nova-color-primary) ${tint}, transparent)`,
    );
    expect(css).toContain(
      `color-mix(in srgb, var(--nova-color-primary-hover) ${tint}, transparent)`,
    );
  });

  it('paints each accent hue of the aurora at exactly the strength the proof assumes, and no other tint', () => {
    const aurora = (/--nova-gradient-aurora:([^;]*);/.exec(css)?.[1] ?? '')
      .replace(/\s+/g, ' ')
      .toUpperCase();
    for (const accent of GLASS.canvasAccents) {
      expect(aurora).toContain(
        `COLOR-MIX(IN SRGB, ${accent.toUpperCase()} CALC(${Math.round(GLASS.canvasAccentTint * 100)}% * VAR(--NOVA-GLASS)), TRANSPARENT)`,
      );
    }
    // Two brand blobs and the accents: nothing else tints the canvas.
    expect(aurora.match(/RADIAL-GRADIENT\(/g)).toHaveLength(
      2 + GLASS.canvasAccents.length,
    );
    expect(aurora.match(/COLOR-MIX\(/g)).toHaveLength(
      2 + GLASS.canvasAccents.length,
    );
  });

  it('paints the sidebar from the stop tokens the proofs use', () => {
    const sidebar = /--nova-gradient-sidebar:([^;]*);/.exec(css)?.[1] ?? '';
    expect(sidebar).toContain('var(--nova-color-sidebar-1) 0%');
    expect(sidebar).toContain('var(--nova-color-sidebar-3) 100%');
    expect(SIDEBAR_TOP).toBe('#26185A');
    expect(SIDEBAR_BASE).toBe('#150C34');
  });
});
