import { useMemo, type ReactNode } from 'react';
import { Label, Pie, PieChart } from 'recharts';
import { chartColorVar } from './chart-utils';
import {
  animationActive,
  ChartFrame,
  SURFACE,
  type ChartBaseProps,
} from './chart-shared';
import {
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from './chart';

export interface DonutChartProps extends Omit<ChartBaseProps, 'data'> {
  // One datum per slice.
  data: ReadonlyArray<Record<string, unknown>>;
  // The key of each datum that names its slice. The config is keyed by these names.
  categoryKey: string;
  // The key of each datum that holds the slice's figure.
  valueKey: string;
  // The caption under the total in the centre.
  totalLabel?: ReactNode;
}

const NEUTRAL = 'var(--nova-color-ink-3)';

interface LabelBox {
  cx?: number;
  cy?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

// The middle of the ring. A polar view box carries it; otherwise it is the middle of the plot area,
// which is where the ring is drawn.
function centreOf(box: LabelBox | undefined) {
  if (!box) {
    return undefined;
  }
  if (box.cx !== undefined && box.cy !== undefined) {
    return { cx: box.cx, cy: box.cy };
  }
  if (box.x === undefined || box.y === undefined) {
    return undefined;
  }
  return {
    cx: box.x + (box.width ?? 0) / 2,
    cy: box.y + (box.height ?? 0) / 2,
  };
}

// Part-to-whole at a glance, with the total in the centre. Keep it to six slices or fewer: past
// that, or to compare close values, a bar chart or a table reads better.
export function DonutChart({
  data,
  config,
  categoryKey,
  valueKey,
  totalLabel = 'Total',
  valueFormatter,
  ...frame
}: DonutChartProps) {
  const total = useMemo(
    () =>
      data.reduce<number>((sum, slice) => {
        const value = slice[valueKey];
        return typeof value === 'number' ? sum + value : sum;
      }, 0),
    [data, valueKey],
  );
  const shown = valueFormatter
    ? valueFormatter(total)
    : total.toLocaleString('en-IN');
  // A slice with no entry in the config is neutral rather than an unresolved variable.
  const slices = useMemo(
    () =>
      data.map((slice) => {
        const name = String(slice[categoryKey]);
        return { ...slice, fill: config[name] ? chartColorVar(name) : NEUTRAL };
      }),
    [data, config, categoryKey],
  );
  return (
    <ChartFrame
      {...frame}
      data={data}
      config={config}
      categoryKey={categoryKey}
      seriesKeys={[valueKey]}
      valueFormatter={valueFormatter}
      total={{ label: totalLabel, values: [shown] }}
    >
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              nameKey={categoryKey}
              formatter={
                valueFormatter
                  ? (value) => valueFormatter(Number(value))
                  : undefined
              }
            />
          }
        />
        <ChartLegend
          verticalAlign="bottom"
          // Series order, not Recharts' alphabetical default.
          itemSorter={null}
          content={<ChartLegendContent nameKey={categoryKey} />}
        />
        <Pie
          data={slices}
          dataKey={valueKey}
          nameKey={categoryKey}
          innerRadius="62%"
          outerRadius="92%"
          paddingAngle={2}
          cornerRadius={4}
          stroke={SURFACE}
          strokeWidth={2}
          isAnimationActive={animationActive()}
        >
          <Label
            position="center"
            content={({ viewBox }: { viewBox?: LabelBox }) => {
              const centre = centreOf(viewBox);
              if (!centre) {
                return null;
              }
              const { cx, cy } = centre;
              return (
                <text x={cx} y={cy} textAnchor="middle">
                  <tspan
                    x={cx}
                    y={cy}
                    className="fill-ink font-display text-[17px] font-bold tabular-nums"
                  >
                    {shown}
                  </tspan>
                  <tspan x={cx} y={cy + 20} className="fill-ink-2 text-[12px]">
                    {totalLabel}
                  </tspan>
                </text>
              );
            }}
          />
        </Pie>
      </PieChart>
    </ChartFrame>
  );
}
