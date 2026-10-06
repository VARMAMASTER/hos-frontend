import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  useMemo,
  type ComponentProps,
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
  return <Surface material="data" {...props} />;
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

export function ChartContainer({
  config,
  ariaLabel,
  description,
  children,
  height = 256,
  bare = false,
  table,
  overlay,
  initialDimension,
  className,
  style,
  ...rest
}: ChartContainerProps) {
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
        className={cx(!bare && 'p-4', 'text-caption', className)}
        style={{ ...vars, ...style } as CSSProperties}
      >
        {description ? (
          <VisuallyHidden id={descriptionId}>{description}</VisuallyHidden>
        ) : null}
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
        {table}
      </Root>
    </ChartContext.Provider>
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
      radius="md"
      role="tooltip"
      className={cx('grid min-w-32 gap-1 px-3 py-2 text-caption', className)}
    >
      {showHeading ? (
        <div className="font-semibold text-ink">{heading}</div>
      ) : null}
      <ul className="grid gap-1">
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
              className="flex items-center gap-2"
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
                      ? 'h-0.5 w-3 rounded-full'
                      : 'size-2 rounded-full',
                  )}
                  style={{ backgroundColor: colour }}
                />
              )}
              <span className="flex flex-1 items-baseline justify-between gap-4">
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

export interface ChartLegendContentProps {
  // Recharts supplies the payload when it renders the content.
  payload?: ReadonlyArray<LegendPayload>;
  className?: string;
  hideIcon?: boolean;
  // Look the label up under this key of the datum (a donut names slices by a datum field).
  nameKey?: string;
}

// The legend: a mark in the series colour beside the label, which stays in a text token (a light
// series colour is illegible as text). The mark mirrors the chart: a stroke for lines, a rounded
// square for bars, areas and slices.
export function ChartLegendContent({
  payload,
  className,
  hideIcon = false,
  nameKey,
}: ChartLegendContentProps) {
  const config = useChartConfig();
  if (!payload || payload.length === 0) {
    return null;
  }
  return (
    <ul
      className={cx(
        'flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3 text-caption',
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== 'none')
        .map((item, index) => {
          const key = configKey(item, nameKey);
          const entry = config[key];
          const Icon = entry?.icon;
          return (
            <li
              key={`${key}-${index}`}
              className="flex items-center gap-2 text-ink-2"
            >
              {Icon ? (
                <Icon />
              ) : hideIcon ? null : (
                <span
                  aria-hidden="true"
                  data-legend-mark={item.type === 'line' ? 'line' : 'rect'}
                  className={cx(
                    'shrink-0',
                    item.type === 'line'
                      ? 'h-0.5 w-3.5 rounded-full'
                      : 'size-2.5 rounded-none',
                  )}
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-ink-2">
                {entry?.label ?? item.value ?? key}
              </span>
            </li>
          );
        })}
    </ul>
  );
}
