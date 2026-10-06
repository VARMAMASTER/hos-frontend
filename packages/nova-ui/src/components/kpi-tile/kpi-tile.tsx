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
}

const trends: Record<KpiTrend, { glyph: string; label: string }> = {
  up: { glyph: '↑', label: 'Up' },
  down: { glyph: '↓', label: 'Down' },
  flat: { glyph: '→', label: 'Unchanged' },
};

// The -deep status ink on its -soft fill, like Chip; neutral uses the surface tokens.
const deltaTones: Record<KpiTone, string> = {
  default: 'border border-border bg-surface-2 text-ink-2',
  good: 'bg-good-soft text-good-deep',
  warn: 'bg-warn-soft text-warn-deep',
  crit: 'bg-crit-soft text-crit-deep',
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

// A headline number. It is nova-data, so it stays opaque under glass: these are financial and
// clinical figures, and translucency would cost legibility.
export function KpiTile({
  label,
  value,
  delta,
  trend,
  tone = 'default',
  visual,
  className,
  ...rest
}: KpiTileProps) {
  const marker = trend ? trends[trend] : undefined;
  return (
    <Surface
      material="data"
      data-tone={tone}
      className={cx('p-5', className)}
      {...rest}
    >
      <div className="text-sm text-ink-3">{label}</div>
      <div className="mt-1 flex items-end justify-between gap-3">
        <div className="min-w-0 font-mono text-3xl font-semibold text-ink">
          {value}
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
            'mt-3 flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
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
