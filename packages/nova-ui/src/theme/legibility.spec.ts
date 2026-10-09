// @vitest-environment node
// The legibility proof: every pairing Nova draws, for HOS Violet and 480 hospital brands, in both
// schemes and on every material. Pure arithmetic, so it runs under node.
import { describe, expect, it } from 'vitest';
import { NOVA_MATERIALS } from '../tokens/material';
import { WHATSAPP_PAIRINGS } from '../tokens/whatsapp';
import { withLuminance } from './colour';
import { createNovaTheme } from './create-theme';
import { deriveNovaPalette, suggestNovaBrand } from './derive';
import {
  AI_CONVERSATION_PAIRINGS,
  AI_TRUST_PAIRINGS,
  AI_VOICE_PAIRINGS,
  EXTRACTION_PAIRINGS,
  legibilityChecks,
  legibilityFailures,
  MESSAGING_PAIRINGS,
  resolvePalette,
  SOAP_SECTION_PAIRINGS,
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

  // The AiButton's sheen band lightens the hover fill by AI_SHEEN_PEAK while it sweeps over the label,
  // so white text must still hold 4.5:1 on the lightened fill, for every hospital's AI colour.
  it('measures the AiButton label under the sheen peak, in both schemes', () => {
    for (const scheme of SCHEMES) {
      const names = legibilityChecks(
        resolvePalette(scheme),
        scheme,
        'glass',
      ).map((c) => c.usedBy);
      expect(names, scheme).toContain('AI button label under the sheen peak');
    }
  });

  // The AI tile (AiMark tile): the white Care spark on the HOS AI gradient (bright, AI, brand), a
  // graphic mark at 3:1 against every stop and the gradient's visible end, for every brand.
  it('measures the white AI-tile glyph against every stop of the AI gradient, in both schemes', () => {
    for (const scheme of SCHEMES) {
      const uses = legibilityChecks(
        resolvePalette(scheme),
        scheme,
        'glass',
      ).filter((check) => check.usedBy.startsWith('the AI tile glyph'));
      expect(
        uses.map((check) => check.usedBy),
        scheme,
      ).toEqual([
        'the AI tile glyph (white) on the AI gradient: the bright stop',
        'the AI tile glyph (white) on the AI gradient: the AI stop',
        'the AI tile glyph (white) on the AI gradient: the brand stop',
        'the AI tile glyph (white) on the AI gradient: its visible end',
      ]);
      for (const check of uses) {
        expect(check.minimum).toBe(3);
        expect(check.foreground).toBe('#FFFFFF');
        expect(check.brand).toBe(true);
      }
    }
  });

  it('would catch a failing AI tile: a pale brand stop, and a bright stop too pale for the halo', () => {
    const pale = {
      ...resolvePalette('light'),
      '--nova-color-primary': '#FDE68A',
    };
    expect(
      legibilityFailures(pale, 'light', 'glass').map((f) => f.usedBy),
    ).toContain('the AI tile glyph (white) on the AI gradient: the brand stop');
    const white = {
      ...resolvePalette('light'),
      '--nova-color-ai-bright': '#FFFFFF',
    };
    expect(
      legibilityFailures(white, 'light', 'glass').map((f) => f.usedBy),
    ).toContain(
      'the AI tile glyph (white) on the AI gradient: the bright stop',
    );
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

  // The pairings the components draw on opaque grounds are named checks here, each with the use it
  // proves, measured for every brand, scheme and material with the rest (the sweep below).
  it.each([
    ['the AI trust batch', AI_TRUST_PAIRINGS, 18],
    ['the AI conversation batch', AI_CONVERSATION_PAIRINGS, 4],
    ['the AI voice batch', AI_VOICE_PAIRINGS, 11],
    ['the SOAP sections', SOAP_SECTION_PAIRINGS, 7],
    ['the messaging batch', MESSAGING_PAIRINGS, 15],
    ['the extraction review', EXTRACTION_PAIRINGS, 12],
  ] as const)(
    'measures every pairing of %s, in both schemes and every material',
    (_, pairings, count) => {
      expect(pairings).toHaveLength(count);
      for (const scheme of SCHEMES) {
        for (const material of NOVA_MATERIALS) {
          const names = legibilityChecks(
            resolvePalette(scheme),
            scheme,
            material,
          ).map((check) => `${check.usedBy}@${check.minimum}`);
          for (const [usedBy, , , minimum] of pairings) {
            expect(names, `${scheme} ${material}`).toContain(
              `${usedBy}@${minimum}`,
            );
          }
        }
      }
    },
  );

  it('measures every WhatsApp pairing as a named check', () => {
    const names = legibilityChecks(resolvePalette('dark'), 'dark', 'solid').map(
      (check) => check.usedBy,
    );
    for (const [usedBy] of WHATSAPP_PAIRINGS) {
      expect(names).toContain(`WhatsApp: ${usedBy}`);
    }
  });

  // Each batch's own "would catch" case, kept from the spec that held it before.
  it.each([
    [
      '--nova-color-ink-3',
      '#C8C8C8',
      'Why trail sources (ink-3) on the AI wash',
    ],
    [
      '--nova-color-chrome-accent',
      '#2A1B5C',
      'the waveform bars (chrome-accent) on chrome-1',
    ],
    [
      '--nova-color-primary-soft',
      '#8F8F8F',
      'speaker and time (ink-3) on a caller turn',
    ],
    [
      '--nova-color-primary-ghost',
      '#5A5A5A',
      'the test name and value (ink) on a hovered row',
    ],
    ['--nova-color-chrome-ink', '#3A3A3A', 'WhatsApp: the header status tag'],
    ['--nova-color-ink', '#8A8A8A', 'SOAP text (ink) on a draft section'],
    [
      '--nova-color-chrome-1',
      '#8F8AA8',
      'the dock pill label on chrome-1 (AiCopilotDock)',
    ],
  ] as const)(
    'would catch a failing component pair: %s at %s fails "%s"',
    (token, value, usedBy) => {
      const palette = { ...resolvePalette('light'), [token]: value };
      expect(
        legibilityFailures(palette, 'light', 'solid').map((f) => f.usedBy),
      ).toContain(usedBy);
    },
  );

  it('remembers a derived palette: the same brand resolves to the same frozen palette and the same checks', () => {
    const brand = suggestNovaBrand('#0F766E');
    const palette = deriveNovaPalette(brand);
    expect(deriveNovaPalette(brand)).toBe(palette);
    expect(Object.isFrozen(palette.light)).toBe(true);
    const resolved = resolvePalette('dark', palette);
    expect(resolvePalette('dark', palette)).toBe(resolved);
    expect(Object.isFrozen(resolved)).toBe(true);
    const first = legibilityChecks(resolved, 'dark', 'frost');
    const second = legibilityChecks(resolved, 'dark', 'frost');
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    // An unfrozen palette is never remembered: a change to it is measured.
    const edited = { ...resolved };
    expect(legibilityFailures(edited, 'dark', 'frost')).toEqual([]);
    edited['--nova-color-ink'] = edited['--nova-color-surface'];
    expect(legibilityFailures(edited, 'dark', 'frost')).not.toEqual([]);
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

// The sweep is the slowest proof in the library (a few seconds alone; much longer on a machine under
// load), so it carries an explicit, generous timeout rather than the default.
describe('every hospital brand', { timeout: 120_000 }, () => {
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
  });
});
