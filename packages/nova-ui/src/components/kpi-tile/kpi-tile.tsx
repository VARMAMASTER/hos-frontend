import type { HTMLAttributes, ReactNode } from 'react';

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
  className,
  ...rest
}: KpiTileProps) {
  const marker = trend ? trends[trend] : undefined;
  return (
    <div
      data-tone={tone}
      className={['nova-data rounded-lg p-5', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <div className="text-sm text-ink-3">{label}</div>
      <div className="mt-1 font-mono text-3xl font-semibold text-ink">
        {value}
      </div>
      {marker || hasContent(delta) ? (
        <div
          data-trend={trend}
          className={[
            'mt-3 flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
            deltaTones[tone],
          ].join(' ')}
        >
          {marker ? (
            <>
              <span aria-hidden="true">{marker.glyph}</span>
              <span className="sr-only">{marker.label}</span>
            </>
          ) : null}
          {delta}
        </div>
      ) : null}
    </div>
  );
}
