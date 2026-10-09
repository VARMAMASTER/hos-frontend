// The AI family follows the hospital theme (owner decision, 2026-10-07, reversing "AI is a fixed
// cyan"). It must stay recognisable: its hue is chosen per brand to keep clear of the brand and of
// every status, and HOS Violet keeps the prototype's cyan exactly.
import { describe, expect, it } from 'vitest';
import { NOVA_MATERIALS } from '../tokens/material';
import { NOVA_DARK } from '../tokens/scheme';
import { NOVA_DEFAULTS } from '../tokens/semantic';
import { EXAMPLE_THEMES } from '../stories/example-themes';
import { hueDelta, relativeLuminance, toOklch, withLuminance } from './colour';
import { createNovaTheme } from './create-theme';
import {
  AI_FIXED_TOKENS,
  AI_SCHEME_TOKENS,
  AI_SEPARATION,
  BRAND_CHROME_TOKENS,
  BRAND_SCHEME_TOKENS,
  aiSeparation,
  aiSeparationFailures,
  chooseAiHue,
  deriveNovaPalette,
  oklabDistance,
  PROTOTYPE_AI_HUE,
  STATUS_HUES,
  suggestNovaBrand,
} from './derive';
import { legibilityFailures, resolvePalette } from './legibility';

const violet = {
  primary: '#6D4FE0',
  primaryStrong: '#5636B8',
  primarySoft: '#EFEAFC',
};
const distance = (a: number, b: number) => Math.abs(hueDelta(a, b));

describe('the AI family is brand-derived', () => {
  it('is every AI token: the scheme family and the single-value bright stop', () => {
    expect([...AI_SCHEME_TOKENS]).toEqual([
      '--nova-color-ai',
      '--nova-color-ai-deep',
      '--nova-color-ai-soft',
      '--nova-color-ai-ghost',
      '--nova-color-ai-line',
      '--nova-color-ai-hover',
    ]);
    expect([...AI_FIXED_TOKENS]).toEqual(['--nova-color-ai-bright']);
    for (const token of AI_SCHEME_TOKENS) {
      expect(BRAND_SCHEME_TOKENS as readonly string[]).toContain(token);
    }
    for (const token of AI_FIXED_TOKENS) {
      expect(BRAND_CHROME_TOKENS as readonly string[]).toContain(token);
    }
  });

  it("keeps HOS Violet's AI the prototype's cyan, value for value, in both schemes", () => {
    const { light, dark } = deriveNovaPalette(violet);
    for (const token of [...AI_SCHEME_TOKENS, ...AI_FIXED_TOKENS]) {
      expect(light[token], token).toBe(NOVA_DEFAULTS[token]);
      expect(dark[token], token).toBe(
        (NOVA_DARK as Record<string, string>)[token] ?? NOVA_DEFAULTS[token],
      );
    }
    expect(NOVA_DEFAULTS['--nova-color-ai']).toBe('#0E7490');
    expect(PROTOTYPE_AI_HUE).toBeCloseTo(toOklch('#0E7490').h, 6);
  });

  it('moves every AI colour at the luminance it had, so each AI contrast the prototype holds, it holds', () => {
    const teal = EXAMPLE_THEMES.tealCare.cssVariables;
    const { light, dark } = deriveNovaPalette({
      primary: teal['--nova-color-primary'] ?? '',
    });
    for (const [palette, template] of [
      [light, NOVA_DEFAULTS],
      [dark, { ...NOVA_DEFAULTS, ...NOVA_DARK }],
    ] as const) {
      for (const token of [...AI_SCHEME_TOKENS, ...AI_FIXED_TOKENS]) {
        const original = (template as Record<string, string>)[token] ?? '';
        expect(palette[token], token).not.toBe(original);
        expect(
          Math.abs(
            relativeLuminance(palette[token]) - relativeLuminance(original),
          ),
          token,
        ).toBeLessThan(0.006);
      }
    }
  });
});

// The rule (theme/derive.ts chooseAiHue): keep the prototype's cyan while it is far enough from the
// brand and every status; otherwise take the hue that maximises the smallest distance from them.
describe('choosing the AI hue', () => {
  it('measures distance from the four status fills, on the OKLCH hue circle', () => {
    expect(STATUS_HUES.map((h) => Math.round(h))).toEqual([168, 49, 29, 254]);
    expect(AI_SEPARATION).toEqual({
      statusHue: 28,
      brandHue: 45,
      deltaE: 6,
      chartDeltaE: 10,
      greyChroma: 0.03,
    });
  });

  // The documented floors sit under the prototype's own separations.
  it('holds the prototype to its own numbers: 30.6° (29.8° dark) and ΔE 6.5 from info, 63.6° and ΔE 18.8 from the violet', () => {
    const [light, dark] = (['light', 'dark'] as const).map((scheme) =>
      aiSeparation(resolvePalette(scheme)),
    );
    expect(light?.statusHue).toBeCloseTo(30.6, 1);
    expect(dark?.statusHue).toBeCloseTo(29.8, 1);
    for (const scheme of ['light', 'dark'] as const) {
      expect(aiSeparationFailures(resolvePalette(scheme), scheme)).toEqual([]);
    }
    expect(light?.brandHue).toBeCloseTo(63.6, 1);
    expect(
      Math.min(light?.statusDeltaE ?? 0, dark?.statusDeltaE ?? 0),
    ).toBeCloseTo(6.5, 1);
    expect(
      Math.min(light?.brandDeltaE ?? 0, dark?.brandDeltaE ?? 0),
    ).toBeCloseTo(18.8, 1);
  });

  it('keeps the cyan for HOS Violet and Rose, and moves it for Teal Care, Clinical Blue and Slate', () => {
    const hueOf = (key: keyof typeof EXAMPLE_THEMES) =>
      chooseAiHue(
        EXAMPLE_THEMES[key].cssVariables['--nova-color-primary'] ?? '#6D4FE0',
      ).hue;
    expect(hueOf('hosViolet')).toBe(PROTOTYPE_AI_HUE);
    expect(hueOf('rose')).toBe(PROTOTYPE_AI_HUE);
    for (const key of ['tealCare', 'clinicalBlue', 'slate'] as const) {
      expect(hueOf(key), key).not.toBe(PROTOTYPE_AI_HUE);
    }
  });

  it('reports a brand no hue can serve, so the theme can be rejected', () => {
    const crowded = Array.from({ length: 9 }, (_, i) => i * 40);
    expect(chooseAiHue('#0E7490', crowded).feasible).toBe(false);
    expect(chooseAiHue('#0E7490').feasible).toBe(true);
  });

  it('names the failing pair and the floor when an AI colour sits too close', () => {
    const palette = {
      ...resolvePalette('light'),
      '--nova-color-ai': '#2563A8',
    };
    const [failure] = aiSeparationFailures(palette, 'light');
    expect(failure?.reason).toMatch(/AI .*#2563A8.* info .*needs at least 28°/);
  });
});

// Every preset and a spread of brands round the hue circle, from grey to vivid: the AI keeps the
// documented distance from the brand and from every status in both schemes, and every contrast
// gate (AI text on its tints, white on the AI fill, AI marks) holds on all three materials.
const HUES = Array.from({ length: 24 }, (_, i) => i * 15);
const BRANDS = [
  ...Object.values(EXAMPLE_THEMES)
    .map((theme) => theme.cssVariables['--nova-color-primary'])
    .filter((primary): primary is string => primary !== undefined),
  ...HUES.flatMap((hue) =>
    [0, 0.05, 0.12, 0.2, 0.3].flatMap((chroma) =>
      [0.04, 0.142].map((y) => withLuminance(hue, chroma, y, 'darker')),
    ),
  ),
];

describe('the AI separation proof, for every preset and brand hue', () => {
  it(`keeps AI clear of the brand and every status for ${BRANDS.length} brands, in light and dark`, () => {
    const failures: string[] = [];
    let closestStatus = Infinity;
    let closestBrand = Infinity;
    let closestChart = Infinity;
    for (const primary of BRANDS) {
      const brand = { ...suggestNovaBrand(primary), primary };
      const palette = deriveNovaPalette(brand);
      for (const scheme of ['light', 'dark'] as const) {
        const resolved = resolvePalette(scheme, palette);
        for (const failure of aiSeparationFailures(resolved, scheme)) {
          failures.push(`${primary} ${scheme}: ${failure.reason}`);
        }
        const measured = aiSeparation(resolved);
        closestStatus = Math.min(closestStatus, measured.statusHue);
        closestBrand = Math.min(closestBrand, measured.brandHue);
        closestChart = Math.min(closestChart, measured.chartDeltaE);
        expect(
          oklabDistance(
            resolved['--nova-color-ai'],
            resolved['--nova-color-primary'],
          ),
        ).toBeGreaterThanOrEqual(AI_SEPARATION.deltaE);
        for (const material of NOVA_MATERIALS) {
          const contrast = legibilityFailures(
            resolved,
            scheme,
            material,
          ).filter((f) => /\bai\b|AI/.test(f.usedBy));
          for (const f of contrast) {
            failures.push(`${primary} ${scheme} ${material}: ${f.usedBy}`);
          }
        }
      }
      expect(() => createNovaTheme({ name: primary, brand })).not.toThrow();
    }
    expect(failures).toEqual([]);
    expect(closestStatus).toBeGreaterThanOrEqual(AI_SEPARATION.statusHue);
    expect(closestBrand).toBeGreaterThanOrEqual(AI_SEPARATION.brandHue);
    expect(closestChart).toBeGreaterThanOrEqual(AI_SEPARATION.chartDeltaE);
  }, 120_000);

  it('takes a grey brand by colour distance alone: a grey has no hue to confuse', () => {
    const grey = '#686868';
    expect(chooseAiHue(grey).hue).toBe(PROTOTYPE_AI_HUE);
    const { light } = deriveNovaPalette({ primary: grey });
    expect(
      oklabDistance(light['--nova-color-ai'], grey),
    ).toBeGreaterThanOrEqual(AI_SEPARATION.deltaE);
    expect(
      distance(toOklch(light['--nova-color-ai']).h, PROTOTYPE_AI_HUE),
    ).toBe(0);
  });
});
