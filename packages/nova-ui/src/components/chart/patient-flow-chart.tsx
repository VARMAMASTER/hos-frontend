import { useMemo } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartLegend, ChartLegendContent } from './chart';
import {
  animationActive,
  CATEGORY_TICK,
  ChartFrame,
  GRID_STROKE,
  MAX_BAR_THICKNESS,
  showLegend,
  SURFACE,
  tooltipFor,
  VALUE_TICK,
  type ChartBaseProps,
  type ChartDatum,
} from './chart-shared';
import { chartColorVar, formatChartValue } from './chart-utils';
import { isReading, reading, signed } from './hospital-shared';

export interface PatientFlowChartProps extends ChartBaseProps {
  admissionsKey: string;
  dischargesKey: string;
  // The census (patients in beds) at the end of each period, drawn on its own axis. Optional.
  censusKey?: string;
  // The legend is on by default: there are always two or more series.
  legend?: boolean;
}

// The key of the derived net movement, which is also its column header in the data table.
const NET = 'Net';

const COLUMN_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

// Patients in and out, per hour or per day: admissions and discharges as paired columns, the census
// as a washed area on its own right-hand axis (it is tens of beds where movement is a handful), and
// the net movement of each period, signed, in the data table.
export function PatientFlowChart({
  data,
  admissionsKey,
  dischargesKey,
  censusKey,
  legend,
  valueFormatter,
  ...frame
}: PatientFlowChartProps) {
  const animate = animationActive();
  const flowKeys = [admissionsKey, dischargesKey];
  const seriesKeys = useMemo(
    () =>
      censusKey
        ? [admissionsKey, dischargesKey, censusKey]
        : [admissionsKey, dischargesKey],
    [admissionsKey, dischargesKey, censusKey],
  );
  const rows = useMemo(
    () =>
      data.map((row) => {
        const clean: ChartDatum = { ...row };
        seriesKeys.forEach((key) => {
          clean[key] = reading(row[key]);
        });
        const admitted = clean[admissionsKey];
        const discharged = clean[dischargesKey];
        clean[NET] =
          isReading(admitted) && isReading(discharged)
            ? admitted - discharged
            : null;
        return clean;
      }),
    [data, seriesKeys, admissionsKey, dischargesKey],
  );
  const show = (value: number) =>
    valueFormatter ? valueFormatter(value) : String(formatChartValue(value));

  return (
    <ChartFrame
      {...frame}
      data={rows}
      seriesKeys={seriesKeys}
      tableKeys={[...seriesKeys, NET]}
      valueFormatter={valueFormatter}
      formatCell={(value, key) =>
        key === NET && isReading(value) ? signed(value, show) : undefined
      }
    >
      <ComposedChart
        data={rows as Array<Record<string, unknown>>}
        barGap={2}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis
          dataKey={frame.categoryKey}
          tickLine={false}
          axisLine={false}
          tick={CATEGORY_TICK}
        />
        <YAxis
          yAxisId="flow"
          tickLine={false}
          axisLine={false}
          tick={VALUE_TICK}
          tickFormatter={valueFormatter}
          width="auto"
          allowDecimals={false}
        />
        {censusKey ? (
          <YAxis
            yAxisId="census"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tick={VALUE_TICK}
            tickFormatter={valueFormatter}
            width="auto"
            allowDecimals={false}
          />
        ) : null}
        {tooltipFor(valueFormatter, { fill: 'var(--nova-color-surface-2)' })}
        {showLegend(seriesKeys, legend) ? (
          <ChartLegend
            verticalAlign="bottom"
            // The census is drawn first (behind the columns), but listed last.
            itemSorter={(item) => seriesKeys.indexOf(String(item.dataKey))}
            content={<ChartLegendContent />}
          />
        ) : null}
        {censusKey ? (
          <Area
            yAxisId="census"
            type="monotone"
            dataKey={censusKey}
            stroke={chartColorVar(censusKey)}
            strokeWidth={2}
            fill={chartColorVar(censusKey)}
            fillOpacity={0.12}
            dot={false}
            activeDot={{
              r: 5,
              fill: chartColorVar(censusKey),
              stroke: SURFACE,
              strokeWidth: 2,
            }}
            isAnimationActive={animate}
          />
        ) : null}
        {flowKeys.map((key) => (
          <Bar
            key={key}
            yAxisId="flow"
            dataKey={key}
            fill={chartColorVar(key)}
            radius={COLUMN_RADIUS}
            maxBarSize={MAX_BAR_THICKNESS}
            isAnimationActive={animate}
          />
        ))}
      </ComposedChart>
    </ChartFrame>
  );
}
