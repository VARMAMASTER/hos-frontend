import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { Surface } from '../../primitives/surface';

export interface StatGaugeProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: ReactNode;
  value: number;
  min?: number;
  max?: number;
  // The value as shown and announced ("42 of 60 beds"). Defaults to the percentage of the range.
  valueText?: string;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

// A metric as a loader, after the prototype's KPI tile (hos.css .kpi) and its sidebar bar (.sb-bar):
// the label and the figure in text, and a thin track filled in proportion. The track is the meter
// (role="meter"), named by the label and read as the value text, so the figure is never only a bar.
// It is nova-data, so it stays opaque under glass.
export function StatGauge({
  label,
  value,
  min = 0,
  max = 100,
  valueText,
  className,
  ...rest
}: StatGaugeProps) {
  const labelId = useId();
  const now = clamp(value, min, max);
  const range = max - min;
  const percent = range > 0 ? ((now - min) / range) * 100 : 0;
  const text = valueText ?? `${Math.round(percent)}%`;
  return (
    <Surface
      material="data"
      radius="card"
      // .kpi: the card corner, a 1px line border, the card padding, --shadow-sm.
      className={cx(
        'flex flex-col border border-border p-card shadow-sm',
        className,
      )}
      {...rest}
    >
      {/* .kpi-l: the label role (12px) / 500 in ink-2. */}
      <p id={labelId} className="text-label font-medium text-ink-2">
        {label}
      </p>
      {/* .kpi-v: the kpi role (26px) / 700, tabular figures with a slashed zero, an s0 (2px) gap under
          the label. */}
      <p className="mt-s0 text-kpi font-bold tabular-nums slashed-zero text-ink">
        {text}
      </p>
      {/* .sb-bar: a 5px track (--nova-dot-sm), a full radius, an s3 (8px) gap above. The fill extends the prototype's
          .sb-bar gradient to a panel: the brand into the highlight (nova-highlight-grad). */}
      <div
        role="meter"
        aria-labelledby={labelId}
        aria-valuenow={now}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={text}
        className="mt-s3 h-(--nova-dot-sm) w-full overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full rounded-full nova-highlight-grad motion-safe:transition-[width] motion-safe:duration-base"
          style={{ width: `${percent}%` }}
        />
      </div>
    </Surface>
  );
}
