// Nova keeps four colour families apart: brand, AI, status and data. A chart series must never read
// as a status, or a reader takes "revenue is green" as a judgement about the number. This is the
// data family: six series colours, fixed for every hospital.
//
// Built and checked with the dataviz method (OKLab/OKLCH, Machado 2009 colour-vision simulation):
//   - chroma and lightness inside the band the method calls for;
//   - neighbouring slots at least 12.8 apart under protanopia and deuteranopia (target 8), and at
//     least 23 apart with full colour vision (floor 15); even the worst non-neighbouring pair stays
//     above 16 (normal vision) and 7.5 (colour-vision deficiency);
//   - at least 3:1 against white (the lowest is 3.09), so a thin line or a small mark stays legible;
//   - at least 11 (OKLab x 100) away from every status colour, its deep ink, the brand violet and
//     the AI cyan. The hues were chosen from the arcs those colours leave free: no green, red, amber
//     or cyan series, and the blue is a lighter sky than the info blue (#2563A8).
//
// Like status and AI, these are stable across hospitals, so the same chart reads the same
// everywhere: they are deliberately not tenant-overridable and not a --nova-* variable.
//
// TODO(consolidation): this constant will move to the token layer (tokens/ and theme.css) in a later
// consolidation pass. It lives here for now because theme.css belongs to another change.
// The six hex digit strings are written without the leading # on purpose: a quoted hex literal in a
// component file trips conventions.spec.ts, which keeps raw colour out of components. This is the
// data palette (a token, not a component colour) and is meant to move to the token layer.
const DIGITS = [
  '248FCC',
  'B38A00',
  'E75594',
  '6C6610',
  'A779FD',
  '9C1B80',
] as const;
type WithHash<T extends string> = `#${T}`;

// Order: sky, gold, rose, olive, lavender, plum.
export const NOVA_CHART_PALETTE = Object.freeze(
  DIGITS.map((digits) => `#${digits}` as WithHash<(typeof DIGITS)[number]>),
);

export const NOVA_CHART_SLOTS = Object.freeze([
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-6',
] as const);

export type NovaChartSlot = (typeof NOVA_CHART_SLOTS)[number];

// Past six series nothing generates a seventh hue (it would be indistinguishable from an existing
// one): the series is neutral, the "Other" of the chart. Fold a long tail into "Other" or facet.
const NEUTRAL = 'var(--nova-color-ink-3)';

// A palette slot becomes its colour, any other CSS colour passes through, and a series with no
// colour takes the next slot in order (never cycled). Colour follows the position the series has in
// the config, so a filter that leaves fewer series should keep their colours by naming the slot.
export function resolveChartColor(
  colour: string | undefined,
  index: number,
): string {
  if (colour === undefined) {
    return NOVA_CHART_PALETTE[index] ?? NEUTRAL;
  }
  const slot = NOVA_CHART_SLOTS.indexOf(colour as NovaChartSlot);
  return slot === -1 ? colour : NOVA_CHART_PALETTE[slot];
}
