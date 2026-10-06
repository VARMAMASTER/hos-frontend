import { describe, expect, it } from 'vitest';
import { NOVA_MATERIALS } from '../tokens/material';
import { withLuminance } from './colour';
import { createNovaTheme } from './create-theme';
import { deriveNovaPalette, suggestNovaBrand } from './derive';
import {
  legibilityChecks,
  legibilityFailures,
  resolvePalette,
} from './legibility';

const SCHEMES = ['light', 'dark'] as const;

const describeFailures = (
  failures: ReturnType<typeof legibilityFailures>,
): string[] =>
  failures.map(
    (f) =>
      `${f.usedBy}: ${f.foreground} on ${f.background} ${f.ratio.toFixed(2)}:1 < ${f.minimum}`,
  );

describe('the legibility proof', () => {
  it('measures text at 4.5:1 and edges, rings and marks at 3:1, and every check has a reason', () => {
    const checks = legibilityChecks(resolvePalette('light'), 'light', 'glass');
    expect(checks.length).toBeGreaterThan(100);
    expect(new Set(checks.map((c) => c.minimum))).toEqual(new Set([4.5, 3]));
    for (const check of checks) {
      expect(check.usedBy.length).toBeGreaterThan(0);
    }
  });

  // HOS Violet in both schemes, on all three materials.
  it.each(SCHEMES.flatMap((s) => NOVA_MATERIALS.map((m) => [s, m] as const)))(
    'holds for HOS Violet in the %s scheme on %s',
    (scheme, material) => {
      expect(
        describeFailures(
          legibilityFailures(resolvePalette(scheme), scheme, material),
        ),
      ).toEqual([]);
    },
  );

  // The highlight goes through the same gates as the brand: its marks (a gauge fill, a tab underline,
  // a selected edge, a milestone node, an avatar ring) at 3:1 on every ground, its text at 4.5:1 on
  // its tint, its wash and a panel, and its gradient figure at 3:1 as large text, stop by stop.
  it('measures every highlight pairing, in both schemes', () => {
    for (const scheme of SCHEMES) {
      const uses = new Set(
        legibilityChecks(resolvePalette(scheme), scheme, 'glass').map(
          (check) => `${check.usedBy}@${check.minimum}`,
        ),
      );
      for (const use of [
        'a highlight mark (a fill, an underline, an edge or a ring)@3',
        'a hovered highlight edge@3',
        'highlight text on its tint@4.5',
        'highlight text on the highlight wash@4.5',
        'highlight text on a panel@4.5',
        'the highlight gradient as large display text@3',
      ]) {
        expect(uses, `${scheme}: ${use}`).toContain(use);
      }
    }
  });

  // The prototype's sky is 2.5:1 on white: a light highlight that bright would be refused.
  it('would catch a failing highlight: the prototype sky as a mark on a light panel', () => {
    const palette = {
      ...resolvePalette('light'),
      '--nova-color-highlight': '#60A5FA',
    };
    const failing = legibilityFailures(palette, 'light', 'glass').map(
      (f) => f.usedBy,
    );
    expect(failing).toContain(
      'a highlight mark (a fill, an underline, an edge or a ring)',
    );
    expect(failing).toContain('the highlight gradient as large display text');
  });

  it('would catch a failing pair: a pale primary under white text', () => {
    const palette = {
      ...resolvePalette('light'),
      '--nova-color-primary': '#FDE68A',
    };
    expect(
      legibilityFailures(palette, 'light', 'glass').map((f) => f.usedBy),
    ).toContain('primary button text');
  });
});

// Property-style: a spread of brands round the whole hue circle, from grey to vivid and from deep
// to the lightest a brand may be (white text on it at 4.5:1), with the engine's own strong and soft
// for each. Every one is accepted by createNovaTheme, and every pairing holds for it in both
// schemes on all three materials.
const HUES = Array.from({ length: 24 }, (_, i) => i * 15);
const CHROMAS = [0, 0.05, 0.12, 0.2, 0.3];
const LUMINANCES = [0.04, 0.1, 0.142, 0.18];
const BRANDS = HUES.flatMap((hue) =>
  CHROMAS.flatMap((chroma) =>
    LUMINANCES.map((y) => {
      const primary = withLuminance(hue, chroma, y, 'darker');
      return { ...suggestNovaBrand(primary), primary };
    }),
  ),
);

describe('every hospital brand', () => {
  it(`covers ${BRANDS.length} brands round the hue circle`, () => {
    expect(BRANDS.length).toBe(480);
    expect(new Set(BRANDS.map((b) => b.primary)).size).toBeGreaterThan(250);
  });

  it('is accepted by the theme engine and holds every pairing, in both schemes, on glass, frost and solid', () => {
    const failures: string[] = [];
    let tightest = Infinity;
    for (const brand of BRANDS) {
      expect(() =>
        createNovaTheme({ name: brand.primary, brand }),
      ).not.toThrow();
      const palette = deriveNovaPalette(brand);
      for (const scheme of SCHEMES) {
        for (const material of NOVA_MATERIALS) {
          for (const check of legibilityChecks(
            resolvePalette(scheme, palette),
            scheme,
            material,
          )) {
            tightest = Math.min(tightest, check.ratio / check.minimum);
            if (check.ratio < check.minimum) {
              failures.push(
                `${brand.primary} ${scheme} ${material} ${check.usedBy} ${check.ratio.toFixed(2)}`,
              );
            }
          }
        }
      }
    }
    expect(failures).toEqual([]);
    expect(tightest).toBeGreaterThanOrEqual(1);
  }, 120_000);
});
