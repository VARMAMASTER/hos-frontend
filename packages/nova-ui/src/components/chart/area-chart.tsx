import {
  Area,
  AreaChart as RechartsAreaChart,
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
  SURFACE,
  tooltipFor,
  VALUE_TICK,
  type CartesianChartProps,
} from './chart-shared';

export interface AreaChartProps extends CartesianChartProps {
  // Stacks the series. Right for parts of a whole over time.
  stacked?: boolean;
}

// A line with a wash under it: the series colour at 12% opacity, never a saturated block.
export function AreaChart({
  seriesKeys,
  legend,
  stacked = false,
  valueFormatter,
  ...frame
}: AreaChartProps) {
  const animate = animationActive();
  return (
    <ChartFrame
      {...frame}
      seriesKeys={seriesKeys}
      valueFormatter={valueFormatter}
    >
      <RechartsAreaChart
        data={frame.data as Array<Record<string, unknown>>}
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
          tickLine={false}
          axisLine={false}
          tick={VALUE_TICK}
          tickFormatter={valueFormatter}
          width="auto"
        />
        {tooltipFor(valueFormatter, {
          stroke: 'var(--nova-color-border-strong)',
        })}
        {legendFor(seriesKeys, legend)}
        {seriesKeys.map((key) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId={stacked ? 'stack' : undefined}
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
      </RechartsAreaChart>
    </ChartFrame>
  );
}
