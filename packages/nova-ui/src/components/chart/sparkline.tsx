import { Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartTooltip, ChartTooltipContent } from './chart';
import { chartColorVar } from './chart-utils';
import {
  animationActive,
  ChartFrame,
  SURFACE,
  type CartesianChartProps,
} from './chart-shared';

// A sparkline plots one series: the first of seriesKeys. It takes the list so it shares its props with
// every other chart.
export type SparklineProps = Omit<CartesianChartProps, 'legend'>;

// A line with no axes, grid or legend, small enough to sit beside a KpiTile value. The latest point
// is marked. The data table alternative and the accessible name are still there.
//
// It is bare by default: it lives inside a tile that is already an opaque data surface, so it brings
// no surface of its own (another rim would draw a box inside the box). Pass bare={false} to stand
// it alone on its own opaque surface.
export function Sparkline({
  seriesKeys,
  valueFormatter,
  height = 40,
  bare = true,
  ...frame
}: SparklineProps) {
  const [key] = seriesKeys;
  const last = frame.data.length - 1;
  return (
    <ChartFrame
      {...frame}
      height={height}
      bare={bare}
      seriesKeys={[key]}
      valueFormatter={valueFormatter}
    >
      <LineChart
        accessibilityLayer
        data={frame.data as Array<Record<string, unknown>>}
        margin={{ top: 6, right: 6, bottom: 6, left: 6 }}
      >
        <XAxis dataKey={frame.categoryKey} hide />
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <ChartTooltip
          cursor={{ stroke: 'var(--nova-color-border-strong)' }}
          content={
            <ChartTooltipContent
              formatter={
                valueFormatter
                  ? (value) => valueFormatter(Number(value))
                  : undefined
              }
            />
          }
        />
        <Line
          type="monotone"
          dataKey={key}
          stroke={chartColorVar(key)}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          isAnimationActive={animationActive()}
          activeDot={{
            r: 4,
            fill: chartColorVar(key),
            stroke: SURFACE,
            strokeWidth: 2,
          }}
          dot={({ cx, cy, index }) =>
            index === last ? (
              <circle
                key={`end-${index}`}
                data-sparkline-end=""
                cx={cx}
                cy={cy}
                r={4}
                fill={chartColorVar(key)}
                stroke={SURFACE}
                strokeWidth={2}
              />
            ) : (
              <g key={`dot-${index}`} />
            )
          }
        />
      </LineChart>
    </ChartFrame>
  );
}
