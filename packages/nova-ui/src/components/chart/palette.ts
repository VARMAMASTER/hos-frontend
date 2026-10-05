// Nova keeps four colour families apart: brand, AI, status and data. A chart series must never read
// as a status, or a reader takes "revenue is green" as a judgement about the number. This is the
// data family: six series slots whose colours are the --nova-chart-1..6 tokens (semantic.ts and
// theme.css), fixed for every hospital and never in the theme allow-list. Chart code reads the
// tokens; the colours themselves, and the checks that they stay apart from status and legible on the
// surface, live in the token layer.

export const NOVA_CHART_SLOTS = Object.freeze([
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-6',
] as const);

export type NovaChartSlot = (typeof NOVA_CHART_SLOTS)[number];

// Each slot as the CSS a chart paints with, in slot order: sky, gold, rose, olive, lavender, plum.
export const NOVA_CHART_PALETTE: readonly string[] = Object.freeze(
  NOVA_CHART_SLOTS.map((slot) => `var(--nova-${slot})`),
);

// Past six series nothing generates a seventh hue (it would be indistinguishable from an existing
// one): the series is neutral, the "Other" of the chart. Fold a long tail into "Other" or facet.
const NEUTRAL = 'var(--nova-color-ink-3)';

// A palette slot becomes its token, any other CSS colour passes through, and a series with no
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
