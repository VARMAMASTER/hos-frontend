import type { HTMLAttributes } from 'react';
import { ChartFigure, ChartLegendList } from './chart';
import { ChartDataTable } from './chart-data-table';
import {
  chartColorVar,
  formatChartValue,
  NO_DATA,
  type ChartConfig,
} from './chart-utils';
import {
  GAUGE_TRACK,
  isReading,
  joinWords,
  Marker,
  missed,
  TICK,
  WARN,
  type Goal,
} from './hospital-shared';

export interface RadialGaugeProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
  value: number | null;
  ariaLabel: string;
  description?: string;
  // What the figure is, under it and in the table: "Bed occupancy", "Seen within 15 min".
  label?: string;
  min?: number;
  max?: number;
  target?: number;
  // Whether the value should stay at least at the target (SLA compliance) or at most at it (bed
  // occupancy). Default at-least.
  goal?: Goal;
  // Written after the figure: "%" (the default) is set tight, any other unit after a space.
  unit?: string;
  valueFormatter?: (value: number) => string;
  // The palette slot of the value arc. Default chart-1.
  color?: string;
  bare?: boolean;
}

// The arc: a semicircle of radius 80 about (100, 100), from the left end (the minimum) over the top
// to the right end (the maximum), in a 200 x 110 view box.
const CX = 100;
const CY = 100;
const R = 80;
const ARC_WIDTH = 14;

const round = (n: number) => Math.round(n * 100) / 100 + 0;

function polar(fraction: number, radius = R): [number, number] {
  const angle = Math.PI * (1 - fraction);
  return [
    round(CX + radius * Math.cos(angle)),
    round(CY - radius * Math.sin(angle)),
  ];
}

function arc(to: number): string {
  const [x0, y0] = polar(0);
  const [x1, y1] = polar(to);
  return `M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`;
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

// A single figure against its scale and target, as a semicircle: bed occupancy, SLA compliance. The
// value arc is a palette colour on a hairline track; the target is a full-ink tick across the arc;
// the figure is the text in the middle; under it, the label and, against a target, the status in
// words with a marker whose direction (up for above, down for below) tells the breach.
export function RadialGauge({
  value,
  ariaLabel,
  description,
  label,
  min = 0,
  max = 100,
  target,
  goal = 'at-least',
  unit = '%',
  valueFormatter,
  color = 'chart-1',
  bare,
  ...figure
}: RadialGaugeProps) {
  const format =
    valueFormatter ??
    ((n: number) =>
      `${String(formatChartValue(n))}${unit === '%' ? '%' : ` ${unit}`}`);
  const reading = isReading(value) ? value : null;
  const span = max - min;
  const fraction = (n: number) => (span > 0 ? clamp((n - min) / span) : 0);
  const hasTarget = isReading(target);
  const breach =
    reading !== null && hasTarget ? missed(reading, target, goal) : false;
  const status =
    reading === null || !hasTarget
      ? null
      : breach
        ? reading > target
          ? 'Above target'
          : 'Below target'
        : 'Within target';
  const shown = reading === null ? NO_DATA : format(reading);
  const goalWord = goal === 'at-least' ? 'at least' : 'at most';
  const targetText = hasTarget ? `${goalWord} ${format(target)}` : undefined;
  const name = label ?? ariaLabel;

  const summary = joinWords([
    description,
    reading === null
      ? `${name}: no reading.`
      : status && targetText
        ? `${name} ${shown}, target ${targetText}: ${status.toLowerCase()}.`
        : `${name} ${shown}.`,
  ]);

  const config: ChartConfig = { value: { label: name, color } };
  const tableConfig: ChartConfig = {
    measure: { label: 'Measure' },
    value: { label: 'Value' },
    target: { label: 'Target' },
    status: { label: 'Status' },
  };
  const valueEnd = reading === null ? 0 : fraction(reading);
  const tick = hasTarget
    ? [polar(fraction(target), R - 12), polar(fraction(target), R + 12)]
    : null;

  return (
    <ChartFigure
      {...figure}
      config={config}
      ariaLabel={ariaLabel}
      description={summary}
      bare={bare}
      legend={
        hasTarget ? (
          <ChartLegendList
            items={[
              {
                key: 'target',
                label: `Target (${format(target)})`,
                mark: 'tick',
                color: TICK,
              },
            ]}
          />
        ) : null
      }
      table={
        <ChartDataTable
          caption={ariaLabel}
          data={[
            {
              measure: name,
              value: shown,
              target: targetText ?? null,
              status,
            },
          ]}
          config={tableConfig}
          categoryKey="measure"
          seriesKeys={hasTarget ? ['value', 'target', 'status'] : ['value']}
        />
      }
    >
      <div className="mx-auto grid max-w-xs justify-items-center gap-s1">
        <svg
          viewBox="0 0 200 110"
          aria-hidden="true"
          className="w-full overflow-visible"
        >
          <path
            data-gauge-track=""
            d={arc(1)}
            fill="none"
            stroke={GAUGE_TRACK}
            strokeWidth={ARC_WIDTH}
            strokeLinecap="round"
          />
          {reading !== null && valueEnd > 0 ? (
            <path
              data-gauge-value=""
              d={arc(valueEnd)}
              fill="none"
              stroke={chartColorVar('value')}
              strokeWidth={ARC_WIDTH}
              strokeLinecap="round"
            />
          ) : null}
          {tick ? (
            <line
              data-gauge-target=""
              x1={tick[0][0]}
              y1={tick[0][1]}
              x2={tick[1][0]}
              y2={tick[1][1]}
              stroke={TICK}
              strokeWidth={3}
              strokeLinecap="round"
            />
          ) : null}
          <text
            data-gauge-reading=""
            x={CX}
            y={CY - 8}
            textAnchor="middle"
            className="fill-ink font-display text-kpi font-bold tabular-nums"
          >
            {shown}
          </text>
        </svg>
        <span className="text-body-sm font-semibold text-ink">{name}</span>
        {status ? (
          <p className="flex items-center gap-s2 text-label text-ink-2">
            {breach && reading !== null && hasTarget ? (
              <svg
                viewBox="0 0 12 12"
                aria-hidden="true"
                className="size-icon-xs"
              >
                <Marker
                  shape={reading > target ? 'triangle-up' : 'triangle-down'}
                  cx={6}
                  cy={6}
                  size={5}
                  colour={WARN}
                />
              </svg>
            ) : null}
            <span data-gauge-status="">{status}</span>
          </p>
        ) : null}
      </div>
    </ChartFigure>
  );
}
