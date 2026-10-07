import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  useMemo,
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import {
  Legend,
  ResponsiveContainer,
  Tooltip,
  type LegendPayload,
  type TooltipPayloadEntry,
} from 'recharts';
import { cx } from '../../primitives/cx';
import { Surface } from '../../primitives/surface';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import {
  chartColorVar,
  chartColourVars,
  formatChartValue,
  type ChartConfig,
} from './chart-utils';

// The primitives follow shadcn/ui's chart API (ChartContainer, ChartTooltip, ChartTooltipContent,
// ChartLegend, ChartLegendContent, ChartConfig), so anyone who knows shadcn charts can use them.
// They are adapted to Nova: series colours come from the fixed --nova-chart-* tokens instead of
// tenant theme variables, the surface is opaque nova-data, and every chart is a labelled figure that
// is not itself a tab stop.
export {
  chartColorVar,
  chartVarName,
  formatChartValue,
  type ChartConfig,
  type ChartConfigEntry,
} from './chart-utils';

export interface ChartContextValue {
  config: ChartConfig;
}

// Exported for the chart folder's own tests and wrappers; the package barrel leaves it out.
export const ChartContext = createContext<ChartContextValue | null>(null);

// Tooltip and legend content render inside the container. Outside one they fall back to an empty
// config, so they still show the raw keys rather than throwing.
function useChartConfig(): ChartConfig {
  return useContext(ChartContext)?.config ?? {};
}

function DataSurface(props: HTMLAttributes<HTMLDivElement>) {
  return <Surface material="data" radius="overlay" {...props} />;
}

export interface ChartContainerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
  // Series key -> label and colour. Each colour is published as --color-<key>.
  config: ChartConfig;
  // The accessible name of the figure. Required: a chart with no name is an unlabelled image.
  ariaLabel: string;
  // A longer reading of the chart for assistive technology (what it shows, the headline).
  description?: string;
  // One Recharts chart (BarChart, LineChart, ...), sized by the container.
  children: ComponentProps<typeof ResponsiveContainer>['children'];
  // Height of the plot area, in px.
  height?: number;
  // Drops the container's own opaque surface and padding, for a chart that already sits inside an
  // opaque one (a data Card, a KPI tile).
  bare?: boolean;
  // The data-table alternative, rendered visually hidden beside the plot.
  table?: ReactNode;
  // A legend drawn under the plot, outside Recharts (ChartLegendList).
  legend?: ReactNode;
  // Painted over the middle of the plot (the total of a donut). Not interactive.
  overlay?: ReactNode;
  // Size used before the container has been measured (server rendering, tests).
  initialDimension?: { width: number; height: number };
}

// Recharts' accessibility layer makes the plot an unnamed role="application" tab stop whose arrow
// keys move a tooltip nothing announces: eight of them on a dashboard, each switching a screen
// reader into application mode with nothing to say. The named figure and its data table are the
// accessible chart, so the layer is switched off here, once, for every chart, and a chart is never
// a tab stop.
function withoutAccessibilityLayer(
  chart: ChartContainerProps['children'],
): ChartContainerProps['children'] {
  return isValidElement<{ accessibilityLayer?: boolean }>(chart)
    ? cloneElement(chart, { accessibilityLayer: false })
    : chart;
}

export interface ChartFigureProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  config: ChartConfig;
  ariaLabel: string;
  description?: string;
  bare?: boolean;
  // Drawn after the plots: a legend built outside Recharts (several plots share one, or the chart is
  // not a Recharts chart at all).
  legend?: ReactNode;
  table?: ReactNode;
}

// The figure every chart is: the series colours published as variables, the labelled opaque data
// surface (or a plain box when bare), its description, then the plots, a shared legend and the
// data-table alternative. ChartContainer is a figure around one plot; a chart drawn as small
// multiples, or without Recharts (a heatmap, a gauge), uses the figure directly. Exported for the
// chart folder; the package barrel leaves it out.
export function ChartFigure({
  config,
  ariaLabel,
  description,
  bare = false,
  legend,
  table,
  children,
  className,
  style,
  ...rest
}: ChartFigureProps) {
  const descriptionId = useId();
  const value = useMemo(() => ({ config }), [config]);
  const vars = useMemo(() => chartColourVars(config), [config]);
  // The container is an opaque data surface; inside one that already is, it is a plain box.
  const Root = bare ? 'div' : DataSurface;
  return (
    <ChartContext.Provider value={value}>
      <Root
        {...rest}
        role="figure"
        aria-label={ariaLabel}
        aria-describedby={description ? descriptionId : undefined}
        className={cx(!bare && 'p-card', 'text-label', className)}
        style={{ ...vars, ...style } as CSSProperties}
      >
        {description ? (
          <VisuallyHidden id={descriptionId}>{description}</VisuallyHidden>
        ) : null}
        {children}
        {legend}
        {table}
      </Root>
    </ChartContext.Provider>
  );
}

export interface ChartPlotProps {
  children: ComponentProps<typeof ResponsiveContainer>['children'];
  height: number;
  overlay?: ReactNode;
  initialDimension?: { width: number; height: number };
}

// One sized plot: a Recharts chart in a ResponsiveContainer, never a tab stop.
export function ChartPlot({
  children,
  height,
  overlay,
  initialDimension,
}: ChartPlotProps) {
  return (
    <div className="relative w-full" style={{ height }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={initialDimension}
      >
        {withoutAccessibilityLayer(children)}
      </ResponsiveContainer>
      {overlay ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {overlay}
        </div>
      ) : null}
    </div>
  );
}

export function ChartContainer({
  children,
  height = 256,
  overlay,
  initialDimension,
  ...figure
}: ChartContainerProps) {
  return (
    <ChartFigure {...figure}>
      <ChartPlot
        height={height}
        overlay={overlay}
        initialDimension={initialDimension}
      >
        {children}
      </ChartPlot>
    </ChartFigure>
  );
}

export const ChartTooltip = Tooltip;
export const ChartLegend = Legend;

type TooltipItem = Omit<TooltipPayloadEntry, 'graphicalItemId'> & {
  graphicalItemId?: string;
};

export interface ChartTooltipContentProps {
  // Recharts supplies these when it renders the content.
  active?: boolean;
  payload?: ReadonlyArray<TooltipItem>;
  label?: ReactNode;
  className?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  // A short stroke (default) or a dot, in the series colour.
  indicator?: 'line' | 'dot';
  // Look the series name up under this key of the datum (a donut names slices by a datum field).
  nameKey?: string;
  // Take the heading from this key of the datum instead of the axis label.
  labelKey?: string;
  formatter?: (
    value: number | string,
    name: string,
    item: TooltipItem,
    index: number,
  ) => ReactNode;
  labelFormatter?: (
    label: ReactNode,
    payload: ReadonlyArray<TooltipItem>,
  ) => ReactNode;
}

function configKey(item: TooltipItem | LegendPayload, nameKey?: string) {
  const datum = (item.payload ?? {}) as Record<string, unknown>;
  if (nameKey && datum[nameKey] !== undefined) {
    return String(datum[nameKey]);
  }
  const key = (item as TooltipItem).name ?? item.dataKey ?? item.value;
  return key === undefined ? '' : String(key);
}

// The hover readout: on the overlay material, the category as a heading, then one row per series.
// Values lead, so the figure is the strong element: ink, mono, semibold; names are secondary.
export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
  hideIndicator = false,
  indicator = 'line',
  nameKey,
  labelKey,
  formatter,
  labelFormatter,
}: ChartTooltipContentProps) {
  const config = useChartConfig();
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const rawLabel: ReactNode =
    labelKey && payload[0]?.payload
      ? (payload[0].payload as Record<string, ReactNode>)[labelKey]
      : label;
  const heading = labelFormatter ? labelFormatter(rawLabel, payload) : rawLabel;
  const showHeading =
    !hideLabel && heading !== undefined && heading !== null && heading !== '';
  return (
    <Surface
      material="overlay"
      radius="card"
      role="tooltip"
      className={cx(
        'grid min-w-chart-tooltip gap-s1 px-s4 py-s3 text-label',
        className,
      )}
    >
      {showHeading ? (
        <div className="font-semibold text-ink">{heading}</div>
      ) : null}
      <ul className="grid gap-s1">
        {payload.map((item, index) => {
          const key = configKey(item, nameKey);
          const entry = config[key];
          const Icon = entry?.icon;
          const name = entry?.label ?? item.name ?? key;
          const colour = item.color ?? item.fill ?? chartColorVar(key);
          const value = item.value as number | string | undefined;
          return (
            <li
              key={`${item.dataKey ?? key}-${index}`}
              className="flex items-center gap-s3"
            >
              {Icon ? (
                <Icon />
              ) : hideIndicator ? null : (
                <span
                  aria-hidden="true"
                  data-indicator={indicator}
                  className={cx(
                    'shrink-0',
                    indicator === 'line'
                      ? 'h-s0 w-s5 rounded-full'
                      : 'size-s3 rounded-full',
                  )}
                  style={{ backgroundColor: colour }}
                />
              )}
              <span className="flex flex-1 items-baseline justify-between gap-s6">
                <span className="text-ink-2">{name}</span>
                {value === undefined || value === null ? null : (
                  <span className="font-mono font-semibold text-ink">
                    {formatter
                      ? formatter(value, key, item, index)
                      : formatChartValue(value)}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Surface>
  );
}

// How a legend entry is keyed. A series is a stroke ('line') or a square ('rect'); a reference is a
// shaded band, a dashed rule (a threshold or a target), a marker shape (a flagged reading), a short
// upright tick (a target on a bar), or an empty outline (no data). Every entry also names itself in
// words, so nothing in a chart is told by colour alone.
export type ChartLegendMark =
  | 'line'
  | 'rect'
  | 'band'
  | 'dashed'
  | 'triangle-up'
  | 'triangle-down'
  | 'diamond'
  | 'tick'
  | 'outline';

export interface ChartLegendItem {
  key: string;
  label: ReactNode;
  mark: ChartLegendMark;
  // A series colour, or a status / ink token for a reference.
  color: string;
}

const MARKER_POINTS: Partial<Record<ChartLegendMark, string>> = {
  'triangle-up': '5,0 10,10 0,10',
  'triangle-down': '0,0 10,0 5,10',
  diamond: '5,0 10,5 5,10 0,5',
};

function LegendMark({ mark, color }: Pick<ChartLegendItem, 'mark' | 'color'>) {
  const points = MARKER_POINTS[mark];
  if (points) {
    return (
      <svg
        aria-hidden="true"
        data-legend-mark={mark}
        viewBox="0 0 10 10"
        className="size-s4 shrink-0"
      >
        <polygon points={points} fill={color} />
      </svg>
    );
  }
  const shapes: Record<string, string> = {
    line: 'h-s0 w-legend-mark rounded-full',
    rect: 'size-s4 rounded-none',
    band: 'h-s4 w-legend-mark rounded-none',
    dashed: 'h-0 w-legend-mark border-t-emphasis border-dashed',
    tick: 'h-s5 w-s0 rounded-full',
    outline: 'size-s4 rounded-none border',
  };
  const style: CSSProperties =
    mark === 'dashed' || mark === 'outline'
      ? { borderColor: color }
      : mark === 'band'
        ? // The band as the chart draws it: a light wash of its colour.
          { backgroundColor: `color-mix(in srgb, ${color} 24%, transparent)` }
        : { backgroundColor: color };
  return (
    <span
      aria-hidden="true"
      data-legend-mark={mark}
      className={cx('shrink-0', shapes[mark])}
      style={style}
    />
  );
}

export interface ChartLegendListProps {
  items: ReadonlyArray<ChartLegendItem & { icon?: ComponentType }>;
  className?: string;
  hideIcon?: boolean;
}

// The legend list itself, for a chart drawn without Recharts' Legend (small multiples, a heatmap, a
// gauge). The prototype's .chart-legend: 12px secondary ink (text-label), 16px between entries.
export function ChartLegendList({
  items,
  className,
  hideIcon = false,
}: ChartLegendListProps) {
  if (items.length === 0) {
    return null;
  }
  return (
    <ul
      className={cx(
        'flex flex-wrap items-center justify-center gap-x-s6 gap-y-s1 pt-s5 text-label',
        className,
      )}
    >
      {items.map(({ key, label, mark, color, icon: Icon }, index) => (
        <li
          key={`${key}-${index}`}
          className="flex items-center gap-s2 text-ink-2"
        >
          {Icon ? (
            <Icon />
          ) : hideIcon ? null : (
            <LegendMark mark={mark} color={color} />
          )}
          <span className="text-ink-2">{label}</span>
        </li>
      ))}
    </ul>
  );
}

export interface ChartLegendContentProps {
  // Recharts supplies the payload when it renders the content.
  payload?: ReadonlyArray<LegendPayload>;
  className?: string;
  hideIcon?: boolean;
  // Look the label up under this key of the datum (a donut names slices by a datum field).
  nameKey?: string;
  // Reference entries listed after the series: a normal range, a threshold, a target, a marker.
  extra?: ReadonlyArray<ChartLegendItem>;
}

// The legend: a mark in the series colour beside the label, which stays in a text token (a light
// series colour is illegible as text). The mark mirrors the chart: a stroke for lines, a rounded
// square for bars, areas and slices.
export function ChartLegendContent({
  payload,
  className,
  hideIcon = false,
  nameKey,
  extra = [],
}: ChartLegendContentProps) {
  const config = useChartConfig();
  const series = (payload ?? [])
    .filter((item) => item.type !== 'none')
    .map((item) => {
      const key = configKey(item, nameKey);
      const entry = config[key];
      return {
        key,
        label: entry?.label ?? item.value ?? key,
        mark: (item.type === 'line' ? 'line' : 'rect') as ChartLegendMark,
        color: item.color ?? chartColorVar(key),
        icon: entry?.icon,
      };
    });
  return (
    <ChartLegendList
      items={[...series, ...extra]}
      className={className}
      hideIcon={hideIcon}
    />
  );
}
