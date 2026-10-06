// @vitest-environment node
// Reads theme.css from disk (see semantic.spec.ts for why this runs under node).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio, mixColours } from '../theme/contrast';
import {
  GLASS,
  isNovaMaterial,
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

// A colour seen through CSS `screen` blending at `opacity` over `backdrop` (the sidebar's lift is a
// screened layer): screen lightens each channel to 1 - (1 - a)(1 - b), then the layer's alpha mixes.
function screenColours(
  colour: string,
  opacity: number,
  backdrop: string,
): string {
  const ch = (hex: string) =>
    [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const top = ch(colour);
  const screened = ch(backdrop).map(
    (value, index) => 255 - ((255 - value) * (255 - (top[index] ?? 0))) / 255,
  );
  const hex = `#${screened
    .map((value) => Math.round(value).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
  return mixColours(hex, opacity, backdrop);
}

const ink2 = NOVA_DEFAULTS['--nova-color-ink-2'];
const ink3 = NOVA_DEFAULTS['--nova-color-ink-3'];
const borderControl = NOVA_DEFAULTS['--nova-color-border-control'];
const bg = NOVA_DEFAULTS['--nova-color-bg'];
const chromeInk = NOVA_DEFAULTS['--nova-color-chrome-ink'];
const chromeAccent = NOVA_DEFAULTS['--nova-color-chrome-accent'];
const white = '#FFFFFF';
// The sidebar's gradient stops (theme.css --nova-gradient-sidebar) and the prototype's hero colours.
const SIDEBAR_TOP = '#26185A';
const SIDEBAR_BASE = '#150C34';
const TOPBAR_END = NOVA_DEFAULTS['--nova-color-chrome-3'];
const HERO_SKY = NOVA_DEFAULTS['--nova-color-chrome-glow-2'];
const HERO_BASE = NOVA_DEFAULTS['--nova-color-chrome-1'];
// The theme gate needs white on the primary at 4.5:1, which caps its luminance: #767676 is the
// lightest primary that passes, so it is the worst case for anything the brand lightens.
const lightestPrimary = '#767676';

describe('material', () => {
  it('is glass by default, product-wide', () => {
    expect(NOVA_DEFAULT_MATERIAL).toBe('glass');
    expect(NOVA_MATERIALS).toEqual(['glass', 'solid']);
  });

  it('recognises only "glass" and "solid"', () => {
    expect(isNovaMaterial('glass')).toBe(true);
    expect(isNovaMaterial('solid')).toBe(true);
    expect(isNovaMaterial('frosted')).toBe(false);
    expect(isNovaMaterial(null)).toBe(false);
  });

  it('gives glass and solid exactly the same set of tokens, so switching never leaves one unset', () => {
    expect(Object.keys(MATERIAL_TOKENS.solid).sort()).toEqual(
      Object.keys(MATERIAL_TOKENS.glass).sort(),
    );
    expect(MATERIAL_TOKENS.glass['--nova-glass']).toBe('1');
    expect(MATERIAL_TOKENS.solid['--nova-glass']).toBe('0');
  });

  // The prototype's glass utilities, value for value: .glass-panel and .glass-card frost with their
  // own blur and saturation, rim with a white hairline and lift at --shadow-md under a 1px highlight.
  it('frosts a glass panel as the prototype .glass-panel does', () => {
    expect(MATERIAL_TOKENS.glass).toMatchObject({
      '--nova-surface-fill': 'rgb(255 255 255 / 0.72)',
      '--nova-surface-filter': 'blur(14px) saturate(140%)',
      '--nova-surface-border': 'rgb(255 255 255 / 0.5)',
      '--nova-surface-shadow':
        'var(--nova-shadow-md), inset 0 1px 0 0 rgb(255 255 255 / 0.7)',
    });
  });

  it('frosts an overlay as the prototype .glass-card does, at the opacity the proof holds', () => {
    expect(MATERIAL_TOKENS.glass).toMatchObject({
      '--nova-overlay-filter': 'blur(20px) saturate(160%)',
      '--nova-overlay-border': 'rgb(255 255 255 / 0.6)',
      '--nova-overlay-shadow':
        'var(--nova-shadow-md), inset 0 1px 0 0 rgb(255 255 255 / 0.65)',
    });
    // The prototype's .glass-card is 0.62; the proof for a menu over the sidebar needs 0.83.
    expect(GLASS.overlayAlpha).toBe(0.83);
  });

  it('paints the top bar and the hero with the prototype gradients, held where the proofs need it', () => {
    expect(MATERIAL_TOKENS.glass).toMatchObject({
      '--nova-chrome-fill':
        'linear-gradient(120deg, rgb(23 15 48 / 0.85), rgb(59 33 120 / 0.78))',
      '--nova-chrome-filter': 'blur(16px) saturate(150%)',
      '--nova-hero-fill':
        'linear-gradient(120deg, rgb(42 27 92 / 0.92), rgb(96 165 250 / 0.55))',
      '--nova-hero-base': 'rgb(23 15 48 / 0.9)',
      '--nova-hero-filter': 'blur(20px) saturate(160%)',
    });
  });

  // Solid is the prototype's opaque card and menu, and its own @supports fallbacks for the chrome
  // and the hero.
  it('makes solid the prototype card, menu and opaque fallbacks', () => {
    expect(MATERIAL_TOKENS.solid).toMatchObject({
      '--nova-surface-fill': 'var(--nova-color-surface)',
      '--nova-surface-filter': 'none',
      '--nova-surface-border': 'var(--nova-color-border)',
      '--nova-surface-shadow': 'var(--nova-shadow-sm)',
      '--nova-overlay-fill': 'var(--nova-color-surface)',
      '--nova-overlay-filter': 'none',
      '--nova-overlay-shadow': 'var(--nova-shadow-md)',
      '--nova-chrome-filter': 'none',
      '--nova-hero-fill':
        'linear-gradient(120deg, var(--nova-color-chrome-2), var(--nova-color-chrome-3))',
      '--nova-hero-filter': 'none',
    });
  });

  it('builds the translucent fills from the same numbers the contrast proofs use', () => {
    expect(MATERIAL_TOKENS.glass['--nova-surface-fill']).toBe(
      `rgb(255 255 255 / ${GLASS.surfaceAlpha})`,
    );
    expect(MATERIAL_TOKENS.glass['--nova-overlay-fill']).toBe(
      `rgb(255 255 255 / ${GLASS.overlayAlpha})`,
    );
    expect(MATERIAL_TOKENS.glass['--nova-chrome-fill']).toContain(
      `rgb(59 33 120 / ${GLASS.topbarEndAlpha})`,
    );
    expect(MATERIAL_TOKENS.glass['--nova-hero-fill']).toContain(
      `rgb(96 165 250 / ${GLASS.heroSkyAlpha})`,
    );
    expect(MATERIAL_TOKENS.glass['--nova-hero-base']).toBe(
      `rgb(23 15 48 / ${GLASS.heroBaseAlpha})`,
    );
  });

  it('hands the chrome, the sidebar and the hero their secondary inks at the alphas the proofs use', () => {
    expect(css).toContain(
      `--nova-chrome-ink-2: rgb(255 255 255 / ${GLASS.chromeInk2Alpha});`,
    );
    expect(css).toContain(
      `--nova-chrome-field: rgb(255 255 255 / ${GLASS.chromeFieldAlpha});`,
    );
    expect(css).toContain(
      `--nova-sidebar-ink-2: rgb(241 238 251 / ${GLASS.sidebarInk2Alpha});`,
    );
    expect(css).toContain(
      `--nova-hero-ink-2: rgb(255 255 255 / ${GLASS.heroInk2Alpha});`,
    );
    expect(css).toContain(
      `color-mix(in srgb, var(--nova-color-primary) ${Math.round(GLASS.sidebarBrandShare * 100)}%, transparent)`,
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
// The sidebar at its lightest: the lightest brand's lift screened over the top stop.
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

  it('tints the canvas with both brand blobs at exactly the strength the legibility proof assumes', () => {
    const tint = `calc(${Math.round(GLASS.canvasTint * 100)}% * var(--nova-glass))`;
    expect(css).toContain(
      `color-mix(in srgb, var(--nova-color-primary) ${tint}, transparent)`,
    );
    expect(css).toContain(
      `color-mix(in srgb, var(--nova-color-primary-strong) ${tint}, transparent)`,
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

  it('paints the sidebar from the stops the proofs use', () => {
    const sidebar = /--nova-gradient-sidebar:([^;]*);/.exec(css)?.[1] ?? '';
    expect(sidebar).toContain(`${SIDEBAR_TOP} 0%`);
    expect(sidebar).toContain(`${SIDEBAR_BASE} 100%`);
  });
});
