// @vitest-environment node
// The colour pairings ExtractedValuesReview introduces, proven the way theme/legibility.ts proves the
// rest: text at 4.5:1, marks and rings at 3:1, for HOS Violet and the same 480 brands round the hue
// circle, in both schemes. The table is the opaque data material, so the material does not change
// these grounds. Everything else the review draws (the AI wash, the green approved wash, the chips,
// the banner) is already proven in legibility.ts or ai-trust-legibility.spec.ts.
//
// What is new is the hovered row: Table tints a row primary-ghost under the pointer, and this table
// sets the source line (ai-deep), the "Filed" mark (good-deep), the row error (crit-deep), the units
// and the "AI read" line (ink-2) and the values (ink) on it. These checks belong in
// legibilityChecks() (theme/legibility.ts is another owner's file); until they move there, this spec
// holds them.
import { describe, expect, it } from 'vitest';
import { withLuminance } from '../../theme/colour';
import { contrastRatio } from '../../theme/contrast';
import { deriveNovaPalette, suggestNovaBrand } from '../../theme/derive';
import { resolvePalette, type ResolvedPalette } from '../../theme/legibility';

const TEXT = 4.5;
const MARK = 3;
const SCHEMES = ['light', 'dark'] as const;

type Token = keyof ResolvedPalette;

const GROUNDS: ReadonlyArray<readonly [string, Token]> = [
  ['a resting row', '--nova-color-surface'],
  ['a hovered row', '--nova-color-primary-ghost'],
];

// [used by, foreground, minimum]
const INKS: ReadonlyArray<readonly [string, Token, number]> = [
  ['the test name and value (ink)', '--nova-color-ink', TEXT],
  ['the unit, "AI read" and "Not filed" (ink-2)', '--nova-color-ink-2', TEXT],
  ['the source line (ai-deep)', '--nova-color-ai-deep', TEXT],
  ['the "Filed" mark (good-deep)', '--nova-color-good-deep', TEXT],
  ['the empty-value error (crit-deep)', '--nova-color-crit-deep', TEXT],
  ['the focus ring', '--nova-color-primary', MARK],
];

function failures(palette: ResolvedPalette, scheme: string): string[] {
  return GROUNDS.flatMap(([ground, bg]) =>
    INKS.flatMap(([usedBy, fg, minimum]) => {
      const ratio = contrastRatio(palette[fg], palette[bg]);
      return ratio < minimum
        ? [
            `${scheme} ${usedBy} on ${ground}: ${palette[fg]} on ${palette[bg]} ${ratio.toFixed(2)}:1 < ${minimum}`,
          ]
        : [];
    }),
  );
}

describe('the extraction review pairings', () => {
  it.each(SCHEMES)('hold for HOS Violet in the %s scheme', (scheme) => {
    expect(failures(resolvePalette(scheme), scheme)).toEqual([]);
  });

  it('would catch a failing pair', () => {
    const palette = {
      ...resolvePalette('light'),
      '--nova-color-primary-ghost': '#5A5A5A',
    };
    expect(failures(palette, 'light').join('\n')).toContain('a hovered row');
  });

  // The same sweep as legibility.spec.ts: 24 hues × 5 chromas × 4 luminances.
  it('hold for 480 hospital brands, in both schemes', () => {
    const found: string[] = [];
    for (let hue = 0; hue < 360; hue += 15) {
      for (const chroma of [0, 0.05, 0.12, 0.2, 0.3]) {
        for (const y of [0.04, 0.1, 0.142, 0.18]) {
          const primary = withLuminance(hue, chroma, y, 'darker');
          const palette = deriveNovaPalette({
            ...suggestNovaBrand(primary),
            primary,
          });
          for (const scheme of SCHEMES) {
            found.push(
              ...failures(resolvePalette(scheme, palette), scheme).map(
                (failure) => `${primary} ${failure}`,
              ),
            );
          }
        }
      }
    }
    expect(found).toEqual([]);
  }, 60_000);
});
