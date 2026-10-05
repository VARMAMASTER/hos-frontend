import {
  Bar,
  BarChart as RechartsBarChart,
  BarStack,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { chartColorVar } from './chart-utils';
import {
  animationActive,
  CATEGORY_TICK,
  ChartFrame,
  GRID_STROKE,
  legendFor,
  MAX_BAR_THICKNESS,
  SURFACE,
  tooltipFor,
  VALUE_TICK,
  type CartesianChartProps,
} from './chart-shared';

export interface BarChartProps extends CartesianChartProps {
  // 'vertical' draws columns (the default); 'horizontal' draws bars, for long category names.
  orientation?: 'vertical' | 'horizontal';
  // Stacks the series into one bar per category. Right for parts of a whole.
  stacked?: boolean;
}

// 4px at the data end, square at the baseline.
const COLUMN_RADIUS: [number, number, number, number] = [4, 4, 0, 0];
const BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];

export function BarChart({
  seriesKeys,
  legend,
  orientation = 'vertical',
  stacked = false,
  valueFormatter,
  ...frame
}: BarChartProps) {
  const horizontal = orientation === 'horizontal';
  const radius = horizontal ? BAR_RADIUS : COLUMN_RADIUS;
  const animate = animationActive();
  const bars = seriesKeys.map((key) => (
    <Bar
      key={key}
      dataKey={key}
      fill={chartColorVar(key)}
      // Touching segments are separated by a 2px gap in the surface colour, not by a border.
      stroke={stacked ? SURFACE : undefined}
      strokeWidth={stacked ? 2 : undefined}
      radius={stacked ? undefined : radius}
      maxBarSize={MAX_BAR_THICKNESS}
      isAnimationActive={animate}
    />
  ));
  return (
    <ChartFrame
      {...frame}
      seriesKeys={seriesKeys}
      valueFormatter={valueFormatter}
    >
      <RechartsBarChart
        accessibilityLayer
        data={frame.data as Array<Record<string, unknown>>}
        layout={horizontal ? 'vertical' : 'horizontal'}
        barGap={2}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <CartesianGrid
          horizontal={!horizontal}
          vertical={horizontal}
          stroke={GRID_STROKE}
        />
        {horizontal ? (
          <>
            <YAxis
              type="category"
              dataKey={frame.categoryKey}
              tickLine={false}
              axisLine={false}
              tick={CATEGORY_TICK}
              width="auto"
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={VALUE_TICK}
              tickFormatter={valueFormatter}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={frame.categoryKey}
              tickLine={false}
              axisLine={false}
              tick={CATEGORY_TICK}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={VALUE_TICK}
              tickFormatter={valueFormatter}
              width="auto"
            />
          </>
        )}
        {tooltipFor(valueFormatter, { fill: 'var(--nova-color-surface-2)' })}
        {legendFor(seriesKeys, legend)}
        {stacked ? <BarStack radius={radius}>{bars}</BarStack> : bars}
      </RechartsBarChart>
    </ChartFrame>
  );
}
