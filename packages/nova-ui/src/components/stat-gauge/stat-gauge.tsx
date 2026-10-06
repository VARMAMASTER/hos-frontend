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

// A metric as a loader: the figure and its label in text, and a thin track filled in proportion.
// The track is the meter (role="meter"), named by the label and read as the value text, so the
// figure is never only a bar. It is nova-data, so it stays opaque under glass.
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
      radius="lg"
      className={cx('flex flex-col gap-2 border border-border p-5', className)}
      {...rest}
    >
      <p className="text-headline font-semibold text-ink">{text}</p>
      <p id={labelId} className="text-caption text-ink-2">
        {label}
      </p>
      <div
        role="meter"
        aria-labelledby={labelId}
        aria-valuenow={now}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={text}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </Surface>
  );
}
