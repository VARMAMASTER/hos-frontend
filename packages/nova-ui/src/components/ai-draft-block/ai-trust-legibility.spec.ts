// @vitest-environment node
// The colour pairings the AI trust components introduce, proven the way theme/legibility.ts proves
// the rest: text at 4.5:1, control edges, rings and marks at 3:1, for HOS Violet and the same 480
// brands round the hue circle, in both schemes. The AI block, the approved block and the Why trail
// are opaque under every material, so the material does not change these grounds.
//
// These checks belong in legibilityChecks() (theme/legibility.ts is another owner's file); until
// they move there, this spec holds them.
import { describe, expect, it } from 'vitest';
import { withLuminance } from '../../theme/colour';
import { contrastRatio } from '../../theme/contrast';
import { deriveNovaPalette, suggestNovaBrand } from '../../theme/derive';
import { resolvePalette, type ResolvedPalette } from '../../theme/legibility';

const TEXT = 4.5;
const MARK = 3;
const SCHEMES = ['light', 'dark'] as const;

type Token = keyof ResolvedPalette;

// [used by, foreground, background, minimum]
const PAIRINGS: ReadonlyArray<readonly [string, Token, Token, number]> = [
  // The draft block's wash (nova-ai-block): the body, the notices, the Why trail and the reason field.
  [
    'draft body text (ink) on the AI wash',
    '--nova-color-ink',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'notices and Why trail reasons (ink-2) on the AI wash',
    '--nova-color-ink-2',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'Why trail sources (ink-3) on the AI wash',
    '--nova-color-ink-3',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'the source line (ai-deep) on the AI wash',
    '--nova-color-ai-deep',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'the rejection note and the required mark (crit-deep) on the AI wash',
    '--nova-color-crit-deep',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'the reason field edge on the AI wash',
    '--nova-color-border-control',
    '--nova-color-ai-ghost',
    MARK,
  ],
  [
    'the focus ring on the AI wash',
    '--nova-color-primary',
    '--nova-color-ai-ghost',
    MARK,
  ],
  [
    'the progress fill on its track',
    '--nova-color-ai',
    '--nova-color-ai-soft',
    MARK,
  ],
  // The approved block's green wash.
  [
    'approved body text (ink) on the green wash',
    '--nova-color-ink',
    '--nova-color-good-soft',
    TEXT,
  ],
  [
    'approved notices (ink-2) on the green wash',
    '--nova-color-ink-2',
    '--nova-color-good-soft',
    TEXT,
  ],
  [
    'the audit record and source line (good-deep) on the green wash',
    '--nova-color-good-deep',
    '--nova-color-good-soft',
    TEXT,
  ],
  [
    'the focus ring on the green wash',
    '--nova-color-primary',
    '--nova-color-good-soft',
    MARK,
  ],
  // The chips (status and tier) and the RED reason on a card.
  [
    'the low-confidence and blocked chips',
    '--nova-color-warn-deep',
    '--nova-color-warn-soft',
    TEXT,
  ],
  [
    'the rejected and RED tier chips',
    '--nova-color-crit-deep',
    '--nova-color-crit-soft',
    TEXT,
  ],
  [
    'the RED "why blocked" reason on a card',
    '--nova-color-crit-deep',
    '--nova-color-surface',
    TEXT,
  ],
  [
    'a tier rail on a card (green)',
    '--nova-color-good',
    '--nova-color-surface',
    MARK,
  ],
  [
    'a tier rail on a card (amber)',
    '--nova-color-warn',
    '--nova-color-surface',
    MARK,
  ],
  [
    'a tier rail on a card (red)',
    '--nova-color-crit',
    '--nova-color-surface',
    MARK,
  ],
];

function failures(palette: ResolvedPalette, scheme: string): string[] {
  return PAIRINGS.flatMap(([usedBy, fg, bg, minimum]) => {
    const ratio = contrastRatio(palette[fg], palette[bg]);
    return ratio < minimum
      ? [
          `${scheme} ${usedBy}: ${palette[fg]} on ${palette[bg]} ${ratio.toFixed(2)}:1 < ${minimum}`,
        ]
      : [];
  });
}

describe('the AI trust pairings', () => {
  it.each(SCHEMES)('hold for HOS Violet in the %s scheme', (scheme) => {
    expect(failures(resolvePalette(scheme), scheme)).toEqual([]);
  });

  it('would catch a failing pair', () => {
    const palette = {
      ...resolvePalette('light'),
      '--nova-color-ink-3': '#C8C8C8',
    };
    expect(failures(palette, 'light').join('\n')).toContain(
      'Why trail sources',
    );
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
