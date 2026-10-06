// @vitest-environment node
// The colour pairings the call transcript and the AI draft reply paint on the product's own tokens,
// proven as theme/legibility.ts proves the rest: text at 4.5:1, marks and rings at 3:1, for HOS
// Violet and the 480-brand sweep, in both schemes. The call frame, its bubbles and the footer are
// opaque under every material. (The WhatsApp phone's pairings are in tokens/whatsapp.spec.ts.)
//
// These belong in legibilityChecks() (theme/legibility.ts is another owner's file); until they move
// there, this spec holds them.
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
  [
    'an AI turn (ink) on its bubble',
    '--nova-color-ink',
    '--nova-color-surface',
    TEXT,
  ],
  [
    'a caller turn (ink) on its bubble',
    '--nova-color-ink',
    '--nova-color-primary-soft',
    TEXT,
  ],
  [
    'the gloss (ink-2) on an AI turn',
    '--nova-color-ink-2',
    '--nova-color-surface',
    TEXT,
  ],
  [
    'the gloss (ink-2) on a caller turn',
    '--nova-color-ink-2',
    '--nova-color-primary-soft',
    TEXT,
  ],
  [
    'speaker and time (ink-3) on an AI turn',
    '--nova-color-ink-3',
    '--nova-color-surface',
    TEXT,
  ],
  [
    'speaker and time (ink-3) on a caller turn',
    '--nova-color-ink-3',
    '--nova-color-primary-soft',
    TEXT,
  ],
  [
    'a system pill (ink-2) on the panel',
    '--nova-color-ink-2',
    '--nova-color-surface',
    TEXT,
  ],
  [
    'the escalation pill (crit-deep) on its tint',
    '--nova-color-crit-deep',
    '--nova-color-crit-soft',
    TEXT,
  ],
  [
    'the escalation edge on the transcript',
    '--nova-color-crit',
    '--nova-color-surface-2',
    MARK,
  ],
  [
    'the typing dots (ink-3) on a bubble',
    '--nova-color-ink-3',
    '--nova-color-primary-soft',
    MARK,
  ],
  [
    'the transcript’s focus ring on panel-2',
    '--nova-color-primary',
    '--nova-color-surface-2',
    MARK,
  ],
  [
    'write-back detail (ink-2) on the footer',
    '--nova-color-ink-2',
    '--nova-color-surface',
    TEXT,
  ],
  [
    'the write-back tick (good) on the footer',
    '--nova-color-good',
    '--nova-color-surface',
    MARK,
  ],
  [
    'the reply’s recipient and consent (ink-2) on the AI wash',
    '--nova-color-ink-2',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'the reply’s message (ink) on the AI wash',
    '--nova-color-ink',
    '--nova-color-ai-ghost',
    TEXT,
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

describe('the call transcript and draft reply pairings', () => {
  it.each(SCHEMES)('hold for HOS Violet in the %s scheme', (scheme) => {
    expect(failures(resolvePalette(scheme), scheme)).toEqual([]);
  });

  it('would catch a failing pair', () => {
    const palette = {
      ...resolvePalette('light'),
      '--nova-color-primary-soft': '#8F8F8F',
    };
    expect(failures(palette, 'light').join('\n')).toContain('caller turn');
  });

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
