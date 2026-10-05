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

const ink2 = NOVA_DEFAULTS['--nova-color-ink-2'];
const ink3 = NOVA_DEFAULTS['--nova-color-ink-3'];
const borderControl = NOVA_DEFAULTS['--nova-color-border-control'];
const bg = NOVA_DEFAULTS['--nova-color-bg'];
const white = '#FFFFFF';

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

  it('builds the translucent fills from the same numbers the contrast gate uses', () => {
    expect(MATERIAL_TOKENS.glass['--nova-surface-fill']).toBe(
      `rgb(255 255 255 / ${GLASS.surfaceAlpha})`,
    );
    expect(MATERIAL_TOKENS.glass['--nova-overlay-fill']).toBe(
      `rgb(255 255 255 / ${GLASS.overlayAlpha})`,
    );
    expect(MATERIAL_TOKENS.glass['--nova-field-fill']).toBe(
      `rgb(255 255 255 / ${GLASS.fieldAlpha})`,
    );
    expect(MATERIAL_TOKENS.glass['--nova-hero-opacity']).toBe(
      String(GLASS.heroOpacity),
    );
    expect(MATERIAL_TOKENS.glass['--nova-chrome-opacity']).toBe(
      String(GLASS.chromeOpacity),
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
// The chrome at its darkest: a black brand mixed into the base, over the darkest canvas.
const darkestChrome = mixColours(
  mixColours('#000000', GLASS.chromeBrandShare, GLASS.chromeBase),
  GLASS.chromeOpacity,
  darkestCanvas,
);
// The chrome at its lightest: the lightest brand the solid gate allows (white on primary-strong at
// 4.5:1 caps its luminance, and #767676 sits at that cap), over white, which is what a sticky top bar
// has under it when it scrolls over a card.
const lightestChrome = mixColours(
  mixColours('#767676', GLASS.chromeBrandShare, GLASS.chromeBase),
  GLASS.chromeOpacity,
  white,
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

  it('keeps small text (ink-3) at 4.5:1 or more on glass panels, overlays and fields', () => {
    for (const alpha of [
      GLASS.surfaceAlpha,
      GLASS.overlayAlpha,
      GLASS.fieldAlpha,
    ]) {
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

  // A menu anchored in the sidebar (the workspace switcher) composites its overlay over the dark
  // chrome, not over the canvas.
  it.each([
    ['secondary text (ink-2)', ink2],
    ['small text (ink-3)', ink3],
  ])(
    'keeps %s at 4.5:1 or more on an overlay anchored in the dark chrome',
    (_, ink) => {
      expect(
        contrastRatio(
          ink,
          mixColours(white, GLASS.overlayAlpha, darkestChrome),
        ),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('keeps white text and the secondary chrome ink at 4.5:1 or more on the lightest chrome', () => {
    const secondaryText = mixColours(
      white,
      GLASS.chromeInk2Alpha,
      lightestChrome,
    );
    expect(contrastRatio(white, lightestChrome)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(secondaryText, lightestChrome)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  // The search field in the top bar lifts the chrome with its own fill, and its placeholder (the
  // secondary chrome ink) is the only visible label it has.
  it('keeps the secondary chrome ink at 4.5:1 or more inside a chrome field, where it is the placeholder', () => {
    const field = mixColours(white, GLASS.chromeFieldAlpha, lightestChrome);
    expect(
      contrastRatio(mixColours(white, GLASS.chromeInk2Alpha, field), field),
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(white, field)).toBeGreaterThanOrEqual(4.5);
  });

  // WCAG 1.4.11: a field's edge is the thing that says "type here", so it needs 3:1 against both of
  // its neighbours, the field's own fill and whatever the field sits on.
  it('gives a form control an edge (border-control) of 3:1 or more against its fill and its backdrop', () => {
    for (const neighbour of [
      darkestCanvas,
      mixColours(white, GLASS.fieldAlpha, darkestCanvas),
      mixColours(white, GLASS.surfaceAlpha, darkestCanvas),
      white,
    ]) {
      expect(
        contrastRatio(borderControl, neighbour),
        neighbour,
      ).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('the keyboard focus ring on light surfaces holds 3:1 for every hospital brand', () => {
  // Every light surface resets the ring to the brand primary (utilities.spec.ts). The theme gate
  // needs white on the primary at 4.5:1, which caps its luminance: #767676 is the lightest primary
  // that passes, so it is the worst case for a ring on a light fill.
  const lightestPrimary = '#767676';

  it('the lightest primary the gate allows is the one this proof uses', () => {
    expect(contrastRatio(white, lightestPrimary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(white, '#777777')).toBeLessThan(4.5);
  });

  it.each([
    ['a panel over the canvas', GLASS.surfaceAlpha, darkestCanvas],
    ['a field over the canvas', GLASS.fieldAlpha, darkestCanvas],
    ['an overlay over the canvas', GLASS.overlayAlpha, darkestCanvas],
    [
      'an overlay anchored in the dark chrome',
      GLASS.overlayAlpha,
      darkestChrome,
    ],
    ['an opaque data surface', 1, darkestCanvas],
  ])('on %s', (_, alpha, backdrop) => {
    expect(
      contrastRatio(lightestPrimary, mixColours(white, alpha, backdrop)),
    ).toBeGreaterThanOrEqual(3);
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
});
