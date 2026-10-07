import { useMemo } from 'react';
import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts';
import {
  animationActive,
  CATEGORY_TICK,
  ChartFrame,
  MAX_BAR_THICKNESS,
  tooltipFor,
  type ChartBaseProps,
  type ChartDatum,
} from './chart-shared';
import { chartColorVar, formatChartValue, NO_DATA } from './chart-utils';
import {
  isReading,
  joinWords,
  reading,
  signed,
  TRACK,
} from './hospital-shared';

export interface FunnelChartProps extends ChartBaseProps {
  // The key of each stage's count. The stages are the data, in pathway order.
  valueKey: string;
}

// Derived columns of the data table, which are also their headers.
const SHARE = 'Share of first stage';
const DROP = 'Drop-off';
const NOT_APPLICABLE = '—';

const BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];

const percent = (part: number, whole: number) =>
  Math.round((part / whole) * 100);

// A drop-off is written unsigned; a stage that grew instead keeps a true minus.
const dropOff = (drop: number) => (drop >= 0 ? `${drop}%` : `−${-drop}%`);

interface LabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  index?: number;
}

// A patient pathway (registered, consulted, investigated, admitted, discharged) as bars on a track,
// one per stage, longest first. Each bar is labelled with its count and the change from the stage
// before; the table adds each stage's share of the first, and the description names where the most
// patients are lost. Bars rather than trapezoids: lengths compare, slanted areas do not.
export function FunnelChart({
  data,
  valueKey,
  valueFormatter,
  description,
  ...frame
}: FunnelChartProps) {
  const animate = animationActive();
  const show = (value: number) =>
    valueFormatter ? valueFormatter(value) : String(formatChartValue(value));
  const rows = useMemo(() => {
    const first = reading(data[0]?.[valueKey]);
    return data.map((row, index) => {
      const value = reading(row[valueKey]);
      const previous = index > 0 ? reading(data[index - 1][valueKey]) : null;
      const share =
        value === null
          ? NO_DATA
          : first !== null && first > 0
            ? `${percent(value, first)}%`
            : NOT_APPLICABLE;
      const drop =
        index === 0
          ? NOT_APPLICABLE
          : value === null || previous === null
            ? NO_DATA
            : previous > 0
              ? dropOff(percent(previous - value, previous))
              : NOT_APPLICABLE;
      const clean: ChartDatum = {
        ...row,
        [valueKey]: value,
        [SHARE]: share,
        [DROP]: drop,
      };
      return clean;
    });
  }, [data, valueKey]);

  const name = (row: ChartDatum | undefined) =>
    String(row?.[frame.categoryKey] ?? '');
  const values = rows.map((row) => row[valueKey]);
  const first = values[0];
  const lastIndex = values.reduce<number>(
    (found, value, index) => (isReading(value) ? index : found),
    -1,
  );
  const last = values[lastIndex];
  let largest: { from: number; drop: number } | undefined;
  values.forEach((value, index) => {
    const previous = values[index - 1];
    if (index > 0 && isReading(value) && isReading(previous) && previous > 0) {
      const drop = percent(previous - value, previous);
      if (!largest || drop > largest.drop) {
        largest = { from: index - 1, drop };
      }
    }
  });
  const summary = joinWords([
    description,
    isReading(first) && first > 0 && lastIndex > 0 && isReading(last)
      ? `${percent(last, first)}% of ${name(rows[0])} reached ${name(rows[lastIndex])}.`
      : undefined,
    largest && largest.drop > 0
      ? `Largest drop-off: ${name(rows[largest.from])} to ${name(rows[largest.from + 1])}, ${largest.drop}%.`
      : undefined,
  ]);

  const label = ({ x, y, width, height, index }: LabelProps) => {
    const i = index ?? 0;
    const value = values[i];
    if (!isReading(value)) {
      return null;
    }
    const previous = values[i - 1];
    const change =
      i > 0 && isReading(previous) && previous > 0
        ? ` · ${signed(percent(value - previous, previous), (n) => `${n}%`)}`
        : '';
    return (
      <text
        data-funnel-label=""
        x={Number(x) + Number(width) + 8}
        y={Number(y) + Number(height) / 2}
        dominantBaseline="central"
        className="fill-ink text-label font-semibold tabular-nums"
      >
        {`${show(value)}${change}`}
      </text>
    );
  };

  return (
    <ChartFrame
      {...frame}
      data={rows}
      description={summary || undefined}
      seriesKeys={[valueKey]}
      tableKeys={[valueKey, SHARE, DROP]}
      valueFormatter={valueFormatter}
      height={frame.height ?? Math.max(120, rows.length * 44)}
    >
      <BarChart
        data={rows as Array<Record<string, unknown>>}
        layout="vertical"
        barCategoryGap="24%"
        margin={{ top: 0, right: 112, bottom: 0, left: 0 }}
      >
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis
          type="category"
          dataKey={frame.categoryKey}
          tickLine={false}
          axisLine={false}
          tick={CATEGORY_TICK}
          width="auto"
        />
        {tooltipFor(valueFormatter, false)}
        <Bar
          dataKey={valueKey}
          fill={chartColorVar(valueKey)}
          background={{ fill: TRACK }}
          radius={BAR_RADIUS}
          maxBarSize={MAX_BAR_THICKNESS}
          isAnimationActive={animate}
        >
          <LabelList dataKey={valueKey} content={label} />
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}
