import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { Surface } from '../../primitives/surface';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { TONE_WORDS } from '../chip/chip';

export type KpiTrend = 'up' | 'down' | 'flat';
export type KpiTone = 'default' | 'good' | 'warn' | 'crit';

export interface KpiTileProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  // Which way the figure moved. Drawn as a glyph plus a text label, never by colour alone.
  trend?: KpiTrend;
  // Whether that movement is good news. Separate from `trend` because direction is not sentiment:
  // rising claim rejections are up and critical, rising free beds are up and good.
  tone?: KpiTone;
  // A small trailing visual beside the figures, such as a Sparkline (which brings no surface of its
  // own, since the tile is already opaque). The slot is 6rem wide and sits beside the value.
  visual?: ReactNode;
  // Emphasis for the one figure a screen leads with: the highlight edge (brand into highlight) in
  // place of the KPI edge, and the figure in gradient text. Emphasis, not state: say in the label
  // why it matters.
  highlight?: boolean;
}

const trends: Record<KpiTrend, { glyph: string; label: string }> = {
  up: { glyph: '↑', label: 'Up' },
  down: { glyph: '↓', label: 'Down' },
  flat: { glyph: '→', label: 'Unchanged' },
};

// The prototype's .kpi-d: the delta is text in the -deep status ink (the pairing that holds 4.5:1 on
// the panel); neutral is the small-print ink.
const deltaTones: Record<KpiTone, string> = {
  default: 'text-ink-3',
  good: 'text-good-deep',
  warn: 'text-warn-deep',
  crit: 'text-crit-deep',
};

// A delta of 0 is a real figure, so only the empty ReactNodes count as absent.
function hasContent(node: ReactNode): boolean {
  return (
    node !== undefined &&
    node !== null &&
    typeof node !== 'boolean' &&
    node !== ''
  );
}

// A headline number: the prototype's .kpi. It is nova-data with the KPI tile's own gradient edge, so
// it stays opaque under glass (these are financial and clinical figures, and translucency would cost
// legibility). 16px of padding, a 12px label at 500, the figure at 26px bold in the display face with
// tabular, slashed-zero numerals, and the delta at 11.5px semibold. It lifts 2px to shadow-lg on
// hover, only when motion is welcome.
export function KpiTile({
  label,
  value,
  delta,
  trend,
  tone = 'default',
  visual,
  highlight = false,
  className,
  ...rest
}: KpiTileProps) {
  const marker = trend ? trends[trend] : undefined;
  return (
    <Surface
      material="data"
      radius="md"
      data-tone={tone}
      data-highlight={highlight ? 'true' : undefined}
      className={cx(
        'p-4',
        highlight
          ? '[--nova-data-edge:var(--nova-gradient-highlight-edge)]'
          : '[--nova-data-edge:var(--nova-gradient-edge-kpi)]',
        'transition-[transform,box-shadow] duration-150 ease-out motion-reduce:transition-none hover:[--nova-data-lift:var(--nova-shadow-lg)] motion-safe:hover:-translate-y-0.5',
        className,
      )}
      {...rest}
    >
      <div className="text-[12px] font-medium text-ink-2">{label}</div>
      <div className="mt-0.5 flex items-end justify-between gap-3">
        <div className="min-w-0 font-display text-[26px] font-bold tabular-nums slashed-zero text-ink">
          {/* The gradient figure is large display text (26px bold), where 3:1 is the floor the
              legibility proof holds it to, point by point; unclipped it is the deep ink. */}
          {highlight ? (
            <span className="nova-highlight-text">{value}</span>
          ) : (
            value
          )}
        </div>
        {visual ? (
          <div data-visual="" className="w-24 min-w-0 shrink">
            {visual}
          </div>
        ) : null}
      </div>
      {marker || hasContent(delta) ? (
        <div
          data-delta=""
          data-trend={trend}
          className={cx(
            'mt-0.5 flex w-fit items-center gap-1 text-[11.5px] font-semibold',
            deltaTones[tone],
          )}
        >
          {marker ? (
            <>
              <span aria-hidden="true">{marker.glyph}</span>
              <VisuallyHidden>{marker.label}</VisuallyHidden>
            </>
          ) : null}
          {delta}
          {/* The sentiment as a word, not only the pill's colour: "up" is not good or bad news on
              its own, and a colour-blind reader or a greyscale print must still be told which. */}
          {tone === 'default' ? null : (
            <span data-sentiment="" className="ml-1 font-semibold">
              {TONE_WORDS[tone]}
            </span>
          )}
        </div>
      ) : null}
    </Surface>
  );
}
