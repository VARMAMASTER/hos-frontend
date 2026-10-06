import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from './chart';
import {
  ChartDataTable,
  type ChartDataTableProps,
  type ChartDataTableTotal,
} from './chart-data-table';
import type { ChartConfig } from './chart-utils';

export type ChartDatum = Record<string, unknown>;

// What every ready-made chart takes. It extends the native div attributes, so className, style, id
// and data-* reach the figure.
export interface ChartBaseProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
  data: ReadonlyArray<ChartDatum>;
  // Series key -> label and colour (a palette slot such as 'chart-1', or any CSS colour).
  config: ChartConfig;
  // The accessible name of the chart.
  ariaLabel: string;
  description?: string;
  // The key of each datum that names its category (the x axis of a column chart).
  categoryKey: string;
  height?: number;
  // Drops the chart's own opaque surface when it sits inside one already (a data Card).
  bare?: boolean;
  // Formats a figure on the value axis, in the tooltip and in the data table.
  valueFormatter?: (value: number) => string;
  // Size used before the chart is measured (server rendering, tests).
  initialDimension?: { width: number; height: number };
}

export interface CartesianChartProps extends ChartBaseProps {
  seriesKeys: ReadonlyArray<string>;
  // A legend is always present for two or more series and absent for one, whose title names it.
  // Pass true or false to override.
  legend?: boolean;
}

// Axis text: quiet ink at a readable size. Value axes set their figures in the mono font.
export const CATEGORY_TICK = {
  fill: 'var(--nova-color-ink-3)',
  fontSize: 12,
} as const;
export const VALUE_TICK = {
  ...CATEGORY_TICK,
  fontFamily: 'var(--nova-font-mono)',
} as const;

// A hairline in the border token, one step off the surface and never dashed.
export const GRID_STROKE = 'var(--nova-color-border)';
export const SURFACE = 'var(--nova-color-surface)';

// Marks are at most this thick; the band's leftover is air.
export const MAX_BAR_THICKNESS = 24;

// Recharts animates marks in; someone who asked their system for less motion gets none. Where the
// preference cannot be read (server rendering, jsdom) there is no animation either, so the first
// frame is the finished chart.
export function animationActive(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function showLegend(
  seriesKeys: ReadonlyArray<string>,
  legend: boolean | undefined,
): boolean {
  return legend ?? seriesKeys.length >= 2;
}

// The tooltip every cartesian chart shares: a value formatter in, the Nova readout out.
export function tooltipFor(
  valueFormatter: ChartBaseProps['valueFormatter'],
  cursor: object | false,
) {
  return (
    <ChartTooltip
      cursor={cursor}
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
  );
}

export function legendFor(
  seriesKeys: ReadonlyArray<string>,
  legend: boolean | undefined,
  nameKey?: string,
) {
  return showLegend(seriesKeys, legend) ? (
    <ChartLegend
      verticalAlign="bottom"
      // Series order, not Recharts' alphabetical default.
      itemSorter={null}
      content={<ChartLegendContent nameKey={nameKey} />}
    />
  ) : null;
}

interface ChartFrameProps extends ChartBaseProps {
  seriesKeys: ReadonlyArray<string>;
  total?: ChartDataTableTotal;
  overlay?: ReactNode;
  // A legend drawn under the plot, outside Recharts.
  legend?: ReactNode;
  formatCell?: ChartDataTableProps['formatCell'];
  formatCategory?: ChartDataTableProps['formatCategory'];
  // The table's rows and columns when they differ from the plotted data (a derived column).
  tableData?: ReadonlyArray<ChartDatum>;
  tableKeys?: ReadonlyArray<string>;
  children: ReactElement;
}

// The frame of a chart: the labelled opaque figure, the Recharts chart inside it, and the
// data-table alternative beside it. Every ready-made chart is a frame around its own Recharts chart.
export function ChartFrame({
  data,
  config,
  ariaLabel,
  categoryKey,
  seriesKeys,
  valueFormatter,
  total,
  overlay,
  formatCell,
  formatCategory,
  tableData,
  tableKeys,
  children,
  ...container
}: ChartFrameProps) {
  return (
    <ChartContainer
      config={config}
      ariaLabel={ariaLabel}
      overlay={overlay}
      table={
        <ChartDataTable
          caption={ariaLabel}
          data={tableData ?? data}
          config={config}
          categoryKey={categoryKey}
          seriesKeys={tableKeys ?? seriesKeys}
          formatValue={valueFormatter}
          total={total}
          formatCell={formatCell}
          formatCategory={formatCategory}
        />
      }
      {...container}
    >
      {children}
    </ChartContainer>
  );
}
