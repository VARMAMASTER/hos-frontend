import { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartLegendList, ChartTooltip, ChartTooltipContent } from './chart';
import {
  animationActive,
  CATEGORY_TICK,
  ChartFrame,
  GRID_STROKE,
  SURFACE,
  VALUE_TICK,
  type ChartBaseProps,
  type ChartDatum,
} from './chart-shared';
import { chartColorVar, formatChartValue } from './chart-utils';
import {
  CRIT,
  isReading,
  joinWords,
  markerShape,
  niceCeiling,
  reading,
  TARGET,
  TARGET_DASH,
  TARGET_WIDTH,
  WARN,
} from './hospital-shared';

export interface WaitTimeChartProps extends ChartBaseProps {
  // The median wait of each period, and its 90th percentile.
  p50Key: string;
  p90Key: string;
  // The wait the department aims to keep under (the ED's door-to-doctor time, OPD's token wait).
  target: number;
  // The unit of a wait, written after every figure. Default: min.
  unit?: string;
}

// Derived keys: the p50-p90 band, and the status column of the data table (its header too).
const RANGE = '__range';
const STATUS = 'Status';

const MEDIAN_ABOVE = 'Median above target';
const P90_ABOVE = '90th percentile above target';

// ED or OPD wait time: the median as a line over a band to the 90th percentile, both in the series
// colour, against the target as the prototype's dashed ink target line. A median over target is a
// critical triangle; a 90th percentile over target a warning diamond. Shape first, colour second.
export function WaitTimeChart({
  data,
  config,
  p50Key,
  p90Key,
  target,
  unit = 'min',
  valueFormatter,
  description,
  ...frame
}: WaitTimeChartProps) {
  const animate = animationActive();
  const format = useMemo(
    () =>
      valueFormatter ??
      ((value: number) => `${String(formatChartValue(value))} ${unit}`),
    [valueFormatter, unit],
  );
  const rows = useMemo(
    () =>
      data.map((row) => {
        const p50 = reading(row[p50Key]);
        const p90 = reading(row[p90Key]);
        const status =
          p50 !== null && p50 > target
            ? MEDIAN_ABOVE
            : p90 !== null && p90 > target
              ? P90_ABOVE
              : p50 !== null && p90 !== null
                ? 'Within target'
                : null;
        const clean: ChartDatum = {
          ...row,
          [p50Key]: p50,
          [p90Key]: p90,
          [RANGE]: p50 !== null && p90 !== null ? [p50, p90] : null,
          [STATUS]: status,
        };
        return clean;
      }),
    [data, p50Key, p90Key, target],
  );
  const name = (row: ChartDatum) => String(row[frame.categoryKey]);
  const p50Over = rows.filter((row) => {
    const value = row[p50Key];
    return isReading(value) && value > target;
  });
  const p90Over = rows.filter((row) => {
    const value = row[p90Key];
    return isReading(value) && value > target;
  });
  const top = niceCeiling(
    Math.max(
      target,
      ...rows.flatMap((row) => [row[p50Key], row[p90Key]]).filter(isReading),
    ) * 1.1,
  );

  const summary = joinWords([
    description,
    `Target ${format(target)}.`,
    p50Over.length > 0
      ? `${MEDIAN_ABOVE} at ${p50Over.map(name).join(', ')}.`
      : undefined,
    p90Over.length > 0
      ? `${P90_ABOVE} at ${p90Over.map(name).join(', ')}.`
      : undefined,
    p50Over.length === 0 && p90Over.length === 0
      ? 'Within target throughout.'
      : undefined,
  ]);

  const colour = chartColorVar(p50Key);
  const medianLabel = config[p50Key]?.label ?? 'Median';

  return (
    <ChartFrame
      {...frame}
      data={rows}
      config={config}
      description={summary}
      seriesKeys={[p50Key, p90Key]}
      tableKeys={[p50Key, p90Key, STATUS]}
      valueFormatter={format}
      legend={
        <ChartLegendList
          items={[
            { key: 'median', label: medianLabel, mark: 'line', color: colour },
            {
              key: 'band',
              label: 'Median to 90th percentile',
              mark: 'band',
              color: colour,
            },
            {
              key: 'target',
              label: `Target (${format(target)})`,
              mark: 'dashed',
              color: TARGET,
            },
            {
              key: 'p50',
              label: MEDIAN_ABOVE,
              mark: 'triangle-up',
              color: CRIT,
            },
            { key: 'p90', label: P90_ABOVE, mark: 'diamond', color: WARN },
          ]}
        />
      }
    >
      <ComposedChart
        data={rows as Array<Record<string, unknown>>}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis
          dataKey={frame.categoryKey}
          padding={{ left: 16, right: 16 }}
          tickLine={false}
          axisLine={false}
          tick={CATEGORY_TICK}
        />
        <YAxis
          domain={[0, top]}
          tickLine={false}
          axisLine={false}
          tick={VALUE_TICK}
          tickFormatter={(value: number) => String(formatChartValue(value))}
          width="auto"
        />
        <ChartTooltip
          cursor={{ stroke: 'var(--nova-color-border-strong)' }}
          content={
            <ChartTooltipContent
              formatter={(value) => {
                const pair = value as unknown;
                return Array.isArray(pair)
                  ? `${format(Number(pair[0]))} – ${format(Number(pair[1]))}`
                  : format(Number(value));
              }}
            />
          }
        />
        <Area
          type="monotone"
          dataKey={RANGE}
          name="Median to 90th percentile"
          stroke="none"
          fill={colour}
          fillOpacity={0.16}
          dot={false}
          activeDot={false}
          isAnimationActive={animate}
        />
        <ReferenceLine
          y={target}
          stroke={TARGET}
          strokeDasharray={TARGET_DASH}
          strokeWidth={TARGET_WIDTH}
          label={{
            value: `Target ${format(target)}`,
            position: 'insideTopRight',
            fill: 'var(--nova-color-ink-2)',
            fontSize: 11,
          }}
        />
        <Line
          type="monotone"
          dataKey={p50Key}
          stroke={colour}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          dot={false}
          activeDot={{ r: 5, fill: colour, stroke: SURFACE, strokeWidth: 2 }}
          isAnimationActive={animate}
        />
        {p90Over.map((row) => (
          <ReferenceDot
            key={`p90-${name(row)}`}
            x={row[frame.categoryKey] as string | number}
            y={row[p90Key] as number}
            shape={markerShape('diamond', WARN, { 'data-wait-breach': 'p90' })}
          />
        ))}
        {p50Over.map((row) => (
          <ReferenceDot
            key={`p50-${name(row)}`}
            x={row[frame.categoryKey] as string | number}
            y={row[p50Key] as number}
            shape={markerShape('triangle-up', CRIT, {
              'data-wait-breach': 'p50',
            })}
          />
        ))}
      </ComposedChart>
    </ChartFrame>
  );
}
