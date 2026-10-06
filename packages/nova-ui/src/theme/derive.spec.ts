import { describe, expect, it } from 'vitest';
import { MATERIAL_LEVELS } from '../tokens/material';
import { NOVA_DARK } from '../tokens/scheme';
import { NOVA_DEFAULTS } from '../tokens/semantic';
import {
  fromOklch,
  hueDelta,
  relativeLuminance,
  toOklch,
  withLuminance,
} from './colour';
import { contrastRatio, mixColours } from './contrast';
import {
  BRAND_CHROME_TOKENS,
  BRAND_SCHEME_TOKENS,
  DARK_BRAND_LUMINANCE,
  deriveNovaPalette,
  HOS_VIOLET,
  suggestNovaBrand,
} from './derive';

const violet = {
  primary: '#6D4FE0',
  primaryStrong: '#5636B8',
  primarySoft: '#EFEAFC',
};
const teal = {
  primary: '#0F766E',
  primaryStrong: '#115E59',
  primarySoft: '#CCFBF1',
};
const allTokens = [...BRAND_SCHEME_TOKENS, ...BRAND_CHROME_TOKENS];
const isHex = (value: string) => /^#[0-9A-F]{6}$/.test(value);

describe('colour arithmetic', () => {
  it('round-trips sRGB through OKLCH', () => {
    for (const hex of ['#6D4FE0', '#0F766E', '#FFFFFF', '#1A1730', '#B3261E']) {
      expect(fromOklch(toOklch(hex))).toBe(hex);
    }
  });

  it('finds the colour of a hue at a WCAG luminance, rounding to the side asked for', () => {
    const { h, c } = toOklch('#0F766E');
    const darker = withLuminance(h, c, 0.175, 'darker');
    const lighter = withLuminance(h, c, 0.175, 'lighter');
    expect(relativeLuminance(darker)).toBeLessThanOrEqual(0.175);
    expect(relativeLuminance(lighter)).toBeGreaterThanOrEqual(0.175);
    expect(Math.abs(relativeLuminance(darker) - 0.175)).toBeLessThan(0.005);
  });

  it('measures hue differences the short way round', () => {
    expect(hueDelta(350, 10)).toBe(20);
    expect(hueDelta(10, 350)).toBe(-20);
    expect(hueDelta(0, 180)).toBe(180);
  });
});

describe('deriveNovaPalette', () => {
  // Status and the charts are never the brand's. AI is (owner decision 2026-10-07; ai.spec.ts).
  it('names every brand token once, and none of status or the charts', () => {
    expect(new Set(allTokens).size).toBe(allTokens.length);
    for (const token of allTokens) {
      expect(token).not.toMatch(/-(good|warn|crit|info)(-|$)|chart/);
    }
  });

  // The default must stay the prototype exactly: semantic.spec.ts compares NOVA_DEFAULTS with
  // os/public/assets/hos.css, and HOS Violet's derived palette is NOVA_DEFAULTS, value for value.
  it("gives HOS Violet the prototype's own palette, value for value", () => {
    const { light, dark } = deriveNovaPalette(violet);
    for (const token of allTokens) {
      expect(light[token], token).toBe(NOVA_DEFAULTS[token]);
    }
    expect(HOS_VIOLET).toBe('#6D4FE0');
    // ... and the dark one is NOVA_DARK (and the chrome, which is dark in both schemes).
    for (const token of allTokens) {
      const expected =
        token in NOVA_DARK
          ? NOVA_DARK[token as keyof typeof NOVA_DARK]
          : NOVA_DEFAULTS[token];
      expect(dark[token], token).toBe(expected);
    }
  });

  it("keeps the hospital's own light brand colours, and hovers to its strong colour", () => {
    const { light } = deriveNovaPalette(teal);
    expect(light).toMatchObject({
      '--nova-color-primary': '#0F766E',
      '--nova-color-primary-strong': '#115E59',
      '--nova-color-primary-soft': '#CCFBF1',
      '--nova-color-primary-hover': '#115E59',
    });
  });

  // The owner's report: "the theme presets are not working". Every brand-dependent colour must move.
  it('recolours the whole brand-dependent palette: chrome, sidebar, hero, canvas, lines and inks', () => {
    const { light, dark } = deriveNovaPalette(teal);
    for (const token of allTokens) {
      if (token === '--nova-color-surface') continue; // white is white for every brand
      expect(light[token], token).not.toBe(NOVA_DEFAULTS[token]);
      expect(dark[token], token).not.toBe(
        (NOVA_DARK as Record<string, string>)[token] ?? NOVA_DEFAULTS[token],
      );
    }
    // The chrome is now teal: its hue is within a few degrees of the brand's.
    const brandHue = toOklch(teal.primary).h;
    for (const token of [
      '--nova-color-chrome-1',
      '--nova-color-chrome-3',
      '--nova-color-sidebar-1',
      '--nova-color-chrome-accent',
      '--nova-color-bg',
    ] as const) {
      expect(
        Math.abs(hueDelta(toOklch(light[token]).h, brandHue)),
        token,
      ).toBeLessThan(25);
    }
  });

  // Contrast is a function of luminance, so a colour moved at its own luminance keeps every ratio
  // it was proven at. (The top bar and hero chrome, and the hero's sky glow, are only ever darker.)
  it('moves each opaque colour at the luminance it had in HOS Violet, so every proven ratio survives', () => {
    const { light, dark } = deriveNovaPalette(teal);
    for (const [palette, template] of [
      [light, NOVA_DEFAULTS],
      [dark, { ...NOVA_DEFAULTS, ...NOVA_DARK }],
    ] as const) {
      for (const token of allTokens) {
        const value = palette[token];
        const original = (template as Record<string, string>)[token] ?? '';
        if (!isHex(value) || /primary/.test(token)) continue;
        const pinned = relativeLuminance(original);
        const moved = relativeLuminance(value);
        if (
          token === '--nova-color-chrome-1' ||
          token === '--nova-color-chrome-3' ||
          token === '--nova-color-chrome-glow-2'
        ) {
          expect(moved, token).toBeLessThanOrEqual(pinned + 0.002);
        } else {
          expect(Math.abs(moved - pinned), token).toBeLessThan(0.006);
        }
      }
    }
  });

  it('writes the translucent chrome as its moved base at the prototype alpha', () => {
    const { light } = deriveNovaPalette(teal);
    const rgb = (hex: string) =>
      [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');
    expect(light['--nova-color-chrome-glass']).toBe(
      `rgba(${rgb(light['--nova-color-chrome-1'])}, 0.60)`,
    );
    expect(light['--nova-color-chrome-ink-2']).toBe(
      `rgba(${rgb(light['--nova-color-chrome-ink'])}, 0.66)`,
    );
    expect(light['--nova-color-chrome-accent-soft']).toBe(
      `rgba(${rgb(light['--nova-color-chrome-accent'])}, 0.18)`,
    );
  });

  it('keeps the chrome the same in both schemes: the app frame is dark in each', () => {
    const { light, dark } = deriveNovaPalette(teal);
    for (const token of BRAND_CHROME_TOKENS) {
      expect(dark[token], token).toBe(light[token]);
    }
  });

  // In the dark scheme the brand family is pinned: a fill white text holds 4.5:1 on, a strong colour
  // that is text on a dark panel, a soft tint and a ghost wash.
  it('pins the dark brand family to its luminances, at the brand hue', () => {
    for (const brand of [teal, violet, { ...teal, primary: '#9D174D' }]) {
      const { dark } = deriveNovaPalette(brand);
      const y = (token: (typeof BRAND_SCHEME_TOKENS)[number]) =>
        relativeLuminance(dark[token]);
      expect(y('--nova-color-primary')).toBeLessThanOrEqual(
        DARK_BRAND_LUMINANCE.primary,
      );
      expect(y('--nova-color-primary-strong')).toBeGreaterThanOrEqual(
        DARK_BRAND_LUMINANCE.primaryStrong,
      );
      expect(
        contrastRatio('#FFFFFF', dark['--nova-color-primary']),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(
          dark['--nova-color-primary-strong'],
          dark['--nova-color-primary-soft'],
        ),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('derives a soft grey palette, not a tinted one, from a grey brand', () => {
    const { light } = deriveNovaPalette({
      primary: '#686868',
      primaryStrong: '#686868',
      primarySoft: '#FFFFFF',
    });
    expect(toOklch(light['--nova-color-chrome-2']).c).toBeLessThan(0.01);
    expect(toOklch(light['--nova-color-bg']).c).toBeLessThan(0.005);
  });
});

// The highlight: a second accent, used deliberately beside the brand (a gauge fill, the active tab's
// underline, a KPI's gradient figure, a "New" chip). For HOS Violet it is the prototype's own sky,
// --chrome-glow-2 (#60A5FA): the far stop of the hero, the .sb-bar fill and the aurora. Like every
// brand colour it is built, then moved to a hospital's hue at the same luminance.
describe('the highlight family', () => {
  const HIGHLIGHT = [
    '--nova-color-highlight',
    '--nova-color-highlight-soft',
    '--nova-color-highlight-deep',
    '--nova-color-highlight-hover',
  ] as const;
  const sky = toOklch(NOVA_DEFAULTS['--nova-color-chrome-glow-2']);

  it('is a brand scheme token family, so every hospital theme derives its own in both schemes', () => {
    for (const token of HIGHLIGHT) {
      expect(BRAND_SCHEME_TOKENS as readonly string[], token).toContain(token);
      expect(token in NOVA_DARK, token).toBe(true);
    }
  });

  // Built, not picked: the sky's hue and chroma, pinned to the luminance of each member's twin in the
  // brand family, so the highlight passes exactly the proofs the brand family passes.
  it("is the prototype's sky for HOS Violet: #60A5FA itself in the dark, held to its legible luminance in the light", () => {
    expect(NOVA_DEFAULTS['--nova-color-chrome-glow-2']).toBe('#60A5FA');
    const strong = relativeLuminance(
      NOVA_DEFAULTS['--nova-color-primary-strong'],
    );
    const soft = relativeLuminance(NOVA_DEFAULTS['--nova-color-primary-soft']);
    const deep = withLuminance(sky.h, sky.c, strong, 'darker');
    expect({
      '--nova-color-highlight': NOVA_DEFAULTS['--nova-color-highlight'],
      '--nova-color-highlight-soft':
        NOVA_DEFAULTS['--nova-color-highlight-soft'],
      '--nova-color-highlight-deep':
        NOVA_DEFAULTS['--nova-color-highlight-deep'],
      '--nova-color-highlight-hover':
        NOVA_DEFAULTS['--nova-color-highlight-hover'],
    }).toEqual({
      '--nova-color-highlight': withLuminance(sky.h, sky.c, 0.18, 'darker'),
      '--nova-color-highlight-soft': withLuminance(
        sky.h,
        Math.min(sky.c, 0.03),
        soft,
        'lighter',
      ),
      '--nova-color-highlight-deep': deep,
      '--nova-color-highlight-hover': deep,
    });
    expect({
      '--nova-color-highlight': NOVA_DARK['--nova-color-highlight'],
      '--nova-color-highlight-soft': NOVA_DARK['--nova-color-highlight-soft'],
      '--nova-color-highlight-deep': NOVA_DARK['--nova-color-highlight-deep'],
      '--nova-color-highlight-hover': NOVA_DARK['--nova-color-highlight-hover'],
    }).toEqual({
      '--nova-color-highlight': '#60A5FA',
      '--nova-color-highlight-soft': withLuminance(
        sky.h,
        Math.min(sky.c, 0.06),
        DARK_BRAND_LUMINANCE.primarySoft,
        'darker',
      ),
      '--nova-color-highlight-deep': withLuminance(
        sky.h,
        sky.c * 0.8,
        DARK_BRAND_LUMINANCE.primaryStrong,
        'lighter',
      ),
      '--nova-color-highlight-hover': withLuminance(
        sky.h,
        sky.c,
        0.5,
        'lighter',
      ),
    });
  });

  it('keeps every member on the sky hue', () => {
    for (const token of HIGHLIGHT) {
      for (const value of [NOVA_DEFAULTS[token], NOVA_DARK[token]]) {
        expect(Math.abs(hueDelta(toOklch(value).h, sky.h)), token).toBeLessThan(
          3,
        );
      }
    }
  });

  it("moves to each hospital's hue, keeping the violet-to-sky step between brand and highlight", () => {
    const step = hueDelta(toOklch(HOS_VIOLET).h, sky.h);
    for (const brand of [teal, { ...teal, primary: '#9D174D' }]) {
      const { light, dark } = deriveNovaPalette(brand);
      const brandHue = toOklch(brand.primary).h;
      for (const palette of [light, dark]) {
        const offset = hueDelta(
          brandHue,
          toOklch(palette['--nova-color-highlight']).h,
        );
        expect(Math.abs(offset - step), brand.primary).toBeLessThan(8);
        expect(palette['--nova-color-highlight']).not.toBe(
          NOVA_DEFAULTS['--nova-color-highlight'],
        );
      }
    }
  });

  // The hero's far stop is the highlight on the chrome. It follows the brand, but blended over the
  // hero base over white it is never lighter than HOS Violet's, so white text on the hero keeps the
  // ratio material.spec.ts proves for the prototype's own sky.
  it("makes the chrome's sky glow (the hero's far stop) the brand's highlight, never lighter over the hero base than the prototype's", () => {
    expect(BRAND_CHROME_TOKENS as readonly string[]).toContain(
      '--nova-color-chrome-glow-2',
    );
    const glass = MATERIAL_LEVELS.glass;
    const lightestHero = (palette: Record<string, string>) =>
      relativeLuminance(
        mixColours(
          palette['--nova-color-chrome-glow-2'] ?? '',
          glass.heroEndAlpha,
          mixColours(
            palette['--nova-color-chrome-1'] ?? '',
            glass.heroBaseAlpha,
            '#FFFFFF',
          ),
        ),
      );
    const ceiling = lightestHero(NOVA_DEFAULTS);
    for (let hue = 0; hue < 360; hue += 15) {
      for (const chroma of [0.05, 0.12, 0.3]) {
        const primary = withLuminance(hue, chroma, 0.142, 'darker');
        const { light } = deriveNovaPalette({ primary });
        expect(lightestHero(light), primary).toBeLessThanOrEqual(ceiling);
      }
    }
    expect(
      deriveNovaPalette(teal).light['--nova-color-chrome-glow-2'],
    ).not.toBe('#60A5FA');
  });
});

describe('suggestNovaBrand', () => {
  it("puts a colour's hue at HOS Violet's lightness", () => {
    const suggestion = suggestNovaBrand('#FDE68A');
    expect(
      Math.abs(hueDelta(toOklch(suggestion.primary).h, toOklch('#FDE68A').h)),
    ).toBeLessThan(15);
    expect(contrastRatio('#FFFFFF', suggestion.primary)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(
      contrastRatio(suggestion.primaryStrong, suggestion.primarySoft),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('suggests HOS Violet for HOS Violet', () => {
    const suggestion = suggestNovaBrand('#6D4FE0');
    expect(
      Math.abs(
        relativeLuminance(suggestion.primary) - relativeLuminance('#6D4FE0'),
      ),
    ).toBeLessThan(0.003);
  });
});
