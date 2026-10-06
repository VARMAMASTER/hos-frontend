import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartLegend, ChartLegendContent } from './chart';
import {
  animationActive,
  CATEGORY_TICK,
  ChartFrame,
  GRID_STROKE,
  SURFACE,
  tooltipFor,
  VALUE_TICK,
  type CartesianChartProps,
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
  RULE,
} from './hospital-shared';

export interface OccupancyAreaChartProps
  extends Omit<CartesianChartProps, 'legend'> {
  // The beds (or cots, or trolleys) there are. Above it the plot is tinted and each period over it
  // is marked.
  capacity: number;
  // What is counted, for the legend and the description.
  unit?: string;
}

// The key of the derived total, which is also its column header in the data table.
const TOTAL = 'Total';

// Bed occupancy over time, stacked by ward, against the capacity: the capacity is a solid ink rule;
// the zone above it is tinted in the critical status colour; each period over capacity carries a
// diamond on its total, and the table says by how much.
export function OccupancyAreaChart({
  data,
  seriesKeys,
  capacity,
  unit = 'beds',
  valueFormatter,
  description,
  ...frame
}: OccupancyAreaChartProps) {
  const animate = animationActive();
  const rows = useMemo(
    () =>
      data.map((row) => {
        const clean: ChartDatum = { ...row };
        const values = seriesKeys.map((key) => reading(row[key]));
        seriesKeys.forEach((key, index) => {
          clean[key] = values[index];
        });
        const present = values.filter(isReading);
        clean[TOTAL] =
          present.length > 0 ? present.reduce((sum, n) => sum + n, 0) : null;
        return clean;
      }),
    [data, seriesKeys],
  );
  const over = rows.filter(
    (row): row is ChartDatum & { [TOTAL]: number } =>
      isReading(row[TOTAL]) && row[TOTAL] > capacity,
  );
  const top = niceCeiling(
    Math.max(capacity, ...rows.map((row) => row[TOTAL]).filter(isReading)) *
      1.1,
  );
  const show = (value: number) =>
    valueFormatter ? valueFormatter(value) : String(formatChartValue(value));
  const name = (row: ChartDatum) => String(row[frame.categoryKey]);

  const summary = joinWords([
    description,
    `Capacity ${show(capacity)} ${unit}.`,
    over.length > 0
      ? `Over capacity on ${over.map(name).join(', ')}.`
      : 'Never over capacity.',
  ]);

  return (
    <ChartFrame
      {...frame}
      data={rows}
      description={summary}
      seriesKeys={seriesKeys}
      tableKeys={[...seriesKeys, TOTAL]}
      valueFormatter={valueFormatter}
      formatCell={(value, key) =>
        key === TOTAL && isReading(value) && value > capacity
          ? `${show(value)} (over capacity by ${show(value - capacity)})`
          : undefined
      }
    >
      <AreaChart
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
          tickFormatter={valueFormatter}
          width="auto"
        />
        <ReferenceArea
          y1={capacity}
          y2={top}
          fill={CRIT}
          fillOpacity={0.06}
          stroke="none"
          ifOverflow="hidden"
        />
        {tooltipFor(valueFormatter, {
          stroke: 'var(--nova-color-border-strong)',
        })}
        <ChartLegend
          verticalAlign="bottom"
          itemSorter={null}
          content={
            <ChartLegendContent
              extra={[
                {
                  key: 'capacity',
                  label: `Capacity (${show(capacity)} ${unit})`,
                  mark: 'line',
                  color: RULE,
                },
                {
                  key: 'over',
                  label: 'Over capacity',
                  mark: 'diamond',
                  color: CRIT,
                },
              ]}
            />
          }
        />
        {seriesKeys.map((key) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="occupancy"
            stroke={chartColorVar(key)}
            strokeWidth={2}
            fill={chartColorVar(key)}
            fillOpacity={0.12}
            dot={false}
            activeDot={{
              r: 5,
              fill: chartColorVar(key),
              stroke: SURFACE,
              strokeWidth: 2,
            }}
            isAnimationActive={animate}
          />
        ))}
        <ReferenceLine
          y={capacity}
          stroke={RULE}
          strokeWidth={1.5}
          label={{
            value: `Capacity ${show(capacity)}`,
            position: 'insideTopLeft',
            fill: 'var(--nova-color-ink-2)',
            fontSize: 11,
          }}
        />
        {over.map((row) => (
          <ReferenceDot
            key={`over-${name(row)}`}
            x={row[frame.categoryKey] as string | number}
            y={row[TOTAL]}
            shape={markerShape('diamond', CRIT, {
              'data-occupancy-over': name(row),
            })}
          />
        ))}
      </AreaChart>
    </ChartFrame>
  );
}
