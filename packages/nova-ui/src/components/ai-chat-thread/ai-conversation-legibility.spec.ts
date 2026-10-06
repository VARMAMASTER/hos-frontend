// @vitest-environment node
// The colour pairings the AI conversation components add, proven for every hospital brand in both
// schemes the way theme/legibility.ts proves the rest (that file is outside this batch's folders,
// so the pairings are listed here and reported for adding there). Each pairing sits on an opaque
// ground (the AI wash of the answer bubble and the panel header, the chrome-1 fill of the dock's
// pill), so it reads the same on glass, frost and solid.
import { describe, expect, it } from 'vitest';
import { withLuminance } from '../../theme/colour';
import { contrastRatio } from '../../theme/contrast';
import { deriveNovaPalette, suggestNovaBrand } from '../../theme/derive';
import {
  resolvePalette,
  type NovaSchemeName,
  type ResolvedPalette,
} from '../../theme/legibility';

const TEXT = 4.5;
const MARK = 3;
const SCHEMES: readonly NovaSchemeName[] = ['light', 'dark'];

type Token = keyof ResolvedPalette;
const PAIRINGS: ReadonlyArray<readonly [string, Token, Token, number]> = [
  [
    'answer text on the AI wash (ChatAnswer)',
    '--nova-color-ink',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'gloss and small print on the AI wash (ChatAnswer, the dock header)',
    '--nova-color-ink-2',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'the streaming caret on the AI wash (AiStreamText)',
    '--nova-color-ai',
    '--nova-color-ai-ghost',
    MARK,
  ],
  [
    'the dock pill label on chrome-1 (AiCopilotDock)',
    '--nova-color-chrome-ink',
    '--nova-color-chrome-1',
    TEXT,
  ],
];

function failures(palette: ResolvedPalette, where: string): string[] {
  return PAIRINGS.flatMap(([use, fg, bg, minimum]) => {
    const ratio = contrastRatio(palette[fg], palette[bg]);
    return ratio < minimum
      ? [
          `${where} ${use}: ${palette[fg]} on ${palette[bg]} ${ratio.toFixed(2)}`,
        ]
      : [];
  });
}

// The sweep legibility.spec.ts uses: 24 hues × 5 chromas × 4 luminances.
const BRANDS = Array.from({ length: 24 }, (_, i) => i * 15).flatMap((hue) =>
  [0, 0.05, 0.12, 0.2, 0.3].flatMap((chroma) =>
    [0.04, 0.1, 0.142, 0.18].map((y) => {
      const primary = withLuminance(hue, chroma, y, 'darker');
      return { ...suggestNovaBrand(primary), primary };
    }),
  ),
);

describe('the AI conversation colour pairings', () => {
  it.each(SCHEMES)('hold for HOS Violet in the %s scheme', (scheme) => {
    expect(failures(resolvePalette(scheme), scheme)).toEqual([]);
  });

  it('hold for every brand in the sweep, in both schemes', () => {
    expect(BRANDS).toHaveLength(480);
    const found: string[] = [];
    for (const brand of BRANDS) {
      const palette = deriveNovaPalette(brand);
      for (const scheme of SCHEMES) {
        found.push(
          ...failures(
            resolvePalette(scheme, palette),
            `${brand.primary} ${scheme}`,
          ),
        );
      }
    }
    expect(found).toEqual([]);
  }, 60_000);

  it('would catch a failing pairing: the AI line as text on the AI wash', () => {
    const palette = resolvePalette('light');
    expect(
      contrastRatio(
        palette['--nova-color-ai-line'],
        palette['--nova-color-ai-ghost'],
      ),
    ).toBeLessThan(TEXT);
  });
});
