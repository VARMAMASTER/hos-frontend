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

const ink3 = NOVA_DEFAULTS['--nova-color-ink-3'];
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

describe('glass legibility holds for every possible hospital brand', () => {
  // The canvas behind glass is tinted by the brand primary at GLASS.canvasTint at most.
  // Black is the darkest tint any brand could bring, so it is the worst case for dark text.
  const darkestCanvas = mixColours('#000000', GLASS.canvasTint, bg);

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

  it('keeps secondary chrome text at 4.5:1 or more over the lightest canvas, for the lightest brand the solid gate allows', () => {
    // The solid gate needs white on primary-strong >= 4.5:1, which caps its luminance; #767676 sits at that cap.
    const chromeBase = mixColours(
      '#767676',
      GLASS.chromeBrandShare,
      GLASS.chromeBase,
    );
    const chrome = mixColours(chromeBase, GLASS.chromeOpacity, bg);
    const secondaryText = mixColours(white, GLASS.chromeInk2Alpha, chrome);
    expect(contrastRatio(white, chrome)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(secondaryText, chrome)).toBeGreaterThanOrEqual(4.5);
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

  it('tints the canvas with the brand at exactly the strength the legibility proof assumes', () => {
    expect(css).toContain(
      `color-mix(in srgb, var(--nova-color-primary) calc(${GLASS.canvasTint * 100}% * var(--nova-glass)), transparent)`,
    );
  });
});
