import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
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

export type LineChartProps = CartesianChartProps;

// Change over time. 2px lines; the hover marker is 10px with a 2px ring in the surface colour, so it
// stays legible where lines cross.
export function LineChart({
  seriesKeys,
  legend,
  valueFormatter,
  ...frame
}: LineChartProps) {
  const animate = animationActive();
  return (
    <ChartFrame
      {...frame}
      seriesKeys={seriesKeys}
      valueFormatter={valueFormatter}
    >
      <RechartsLineChart
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
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={chartColorVar(key)}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
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
      </RechartsLineChart>
    </ChartFrame>
  );
}
