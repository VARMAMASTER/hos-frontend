// @vitest-environment node
// The colour pairings the AI voice components introduce, proven the way theme/legibility.ts proves
// the rest: text at 4.5:1, marks and edges at 3:1, for HOS Violet and the same 480 brands round the
// hue circle, in both schemes. The recording pill is the fixed dark chrome and the AI block is
// opaque under every material, so the material does not change these grounds.
//
// These checks belong in legibilityChecks() (theme/legibility.ts is another owner's file); until
// they move there, this spec holds them.
import { describe, expect, it } from 'vitest';
import { withLuminance } from '../../theme/colour';
import { contrastRatio, mixColours } from '../../theme/contrast';
import { deriveNovaPalette, suggestNovaBrand } from '../../theme/derive';
import { resolvePalette, type ResolvedPalette } from '../../theme/legibility';

const TEXT = 4.5;
const MARK = 3;
const SCHEMES = ['light', 'dark'] as const;

// The SOAP section's panel: the surface at 55% (bg-surface/55) over the block's wash.
const SECTION_ALPHA = 0.55;

type Pairing = readonly [string, string, string, number];

function pairings(p: ResolvedPalette): Pairing[] {
  const ghost = p['--nova-color-ai-ghost'];
  const approved = p['--nova-color-good-soft'];
  const surface = p['--nova-color-surface'];
  const chrome = p['--nova-color-chrome-1'];
  const draftSection = mixColours(surface, SECTION_ALPHA, ghost);
  const approvedSection = mixColours(surface, SECTION_ALPHA, approved);
  const list: Pairing[] = [
    // The recording pill (hos.css .rec): the words, the bars and the live dot on the dark chrome.
    [
      'the recording pill text (chrome-ink) on chrome-1',
      p['--nova-color-chrome-ink'],
      chrome,
      TEXT,
    ],
    [
      'the waveform bars (chrome-accent) on chrome-1',
      p['--nova-color-chrome-accent'],
      chrome,
      MARK,
    ],
    ['the live dot (good) on chrome-1', p['--nova-color-good'], chrome, MARK],
    // The streaming caret on the AI wash and on a card.
    ['the caret (ai) on the AI wash', p['--nova-color-ai'], ghost, MARK],
    ['the caret (ai) on a card', p['--nova-color-ai'], surface, MARK],
    // Voice entry: a value HOS filled in has the AI edge on the AI fill, inside the AI block.
    [
      'the AI-filled field edge (ai) on its AI fill',
      p['--nova-color-ai'],
      ghost,
      MARK,
    ],
    [
      'the out-of-range flag (warn-deep) on the AI wash',
      p['--nova-color-warn-deep'],
      ghost,
      TEXT,
    ],
    [
      'the out-of-range flag (warn-deep) on the approved wash',
      p['--nova-color-warn-deep'],
      approved,
      TEXT,
    ],
    [
      'the pane headings (ai-deep) on the approved wash',
      p['--nova-color-ai-deep'],
      approved,
      TEXT,
    ],
    [
      'the last value (ink-3) on the approved wash',
      p['--nova-color-ink-3'],
      approved,
      TEXT,
    ],
  ];
  // The SOAP sections, in the draft and once approved.
  for (const [state, ground] of [
    ['draft', draftSection],
    ['approved', approvedSection],
  ] as const) {
    list.push(
      [
        `SOAP text (ink) on a ${state} section`,
        p['--nova-color-ink'],
        ground,
        TEXT,
      ],
      [
        `SOAP gloss (ink-2) on a ${state} section`,
        p['--nova-color-ink-2'],
        ground,
        TEXT,
      ],
      [
        `SOAP heading (ai-deep) on a ${state} section`,
        p['--nova-color-ai-deep'],
        ground,
        TEXT,
      ],
    );
  }
  list.push(
    [
      'the empty-plan flag (warn-deep) on a draft section',
      p['--nova-color-warn-deep'],
      draftSection,
      TEXT,
    ],
    [
      'the empty-plan edge (warn) on the AI wash',
      p['--nova-color-warn'],
      ghost,
      MARK,
    ],
  );
  return list;
}

function failures(palette: ResolvedPalette, scheme: string): string[] {
  return pairings(palette).flatMap(([usedBy, fg, bg, minimum]) => {
    const ratio = contrastRatio(fg, bg);
    return ratio < minimum
      ? [
          `${scheme} ${usedBy}: ${fg} on ${bg} ${ratio.toFixed(2)}:1 < ${minimum}`,
        ]
      : [];
  });
}

describe('the AI voice pairings', () => {
  it.each(SCHEMES)('hold for HOS Violet in the %s scheme', (scheme) => {
    expect(failures(resolvePalette(scheme), scheme)).toEqual([]);
  });

  it('would catch a failing pair', () => {
    const palette = {
      ...resolvePalette('light'),
      '--nova-color-chrome-accent': '#2A1B5C',
    };
    expect(failures(palette, 'light').join('\n')).toContain('waveform bars');
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
