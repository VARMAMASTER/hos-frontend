import { useId, useMemo, type ReactNode } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartFigure,
  ChartLegendList,
  ChartPlot,
  ChartTooltip,
  ChartTooltipContent,
  type ChartLegendItem,
} from './chart';
import { ChartDataTable } from './chart-data-table';
import {
  animationActive,
  CATEGORY_TICK,
  GRID_STROKE,
  SURFACE,
  VALUE_TICK,
  type ChartBaseProps,
  type ChartDatum,
} from './chart-shared';
import {
  chartColorVar,
  formatChartValue,
  NO_DATA,
  type ChartConfig,
  type ChartConfigEntry,
} from './chart-utils';
import {
  BAND,
  BAND_OPACITY,
  CRIT,
  hasPoint,
  isReading,
  joinWords,
  Marker,
  reading,
  RULE,
  STATUS_COLOUR,
  STATUS_WORD,
  WARN,
  type DotProps,
  type StatusLevel,
} from './hospital-shared';

export interface VitalThreshold {
  value: number;
  // What crossing it means: "Tachycardia", "Hypoxia".
  label: string;
  level: StatusLevel;
}

// A vital sign is a series with clinical context: its unit, the normal range shaded behind it and the
// thresholds ruled across it. It extends the chart config entry, so it is still a ChartConfig.
export interface VitalSignConfigEntry extends ChartConfigEntry {
  unit?: string;
  normal?: { min: number; max: number };
  thresholds?: ReadonlyArray<VitalThreshold>;
  // The value axis of the panel; left out, it fits the readings, the range and the thresholds.
  domain?: readonly [number, number];
}

export type VitalsConfig = Record<string, VitalSignConfigEntry>;

// One panel of the small multiples. Each vital has its own scale (a heart rate of 110 and a
// temperature of 38.2 cannot share an axis); series that do share one (systolic and diastolic blood
// pressure) share a panel.
export interface VitalsPanel {
  key: string;
  label: ReactNode;
  unit?: string;
  seriesKeys: ReadonlyArray<string>;
}

export interface VitalsChartProps
  extends Omit<ChartBaseProps, 'config' | 'height' | 'valueFormatter'> {
  config: VitalsConfig;
  seriesKeys: ReadonlyArray<string>;
  // Left out, each series is a panel of its own.
  panels?: ReadonlyArray<VitalsPanel>;
  // The time (a category, or a timestamp on a numeric time axis) to rule as now.
  now?: number | string;
  // Height of each panel's plot, in px.
  panelHeight?: number;
  // Formats a time on the axis, in the tooltip and in the table. The default writes a timestamp as a
  // 24-hour time of day and a category as itself.
  timeFormatter?: (value: number | string) => string;
}

type Side = 'high' | 'low';

interface Flag {
  side: Side;
  level: StatusLevel;
}

// Outside the normal range is a flag; past a critical threshold on the same side, a critical one.
function flagOf(
  value: number,
  entry: VitalSignConfigEntry | undefined,
): Flag | undefined {
  const normal = entry?.normal;
  if (!normal) {
    return undefined;
  }
  const side: Side | undefined =
    value > normal.max ? 'high' : value < normal.min ? 'low' : undefined;
  if (!side) {
    return undefined;
  }
  const critical = (entry.thresholds ?? []).some(
    (threshold) =>
      threshold.level === 'crit' &&
      (side === 'high'
        ? threshold.value >= normal.max && value >= threshold.value
        : threshold.value <= normal.min && value <= threshold.value),
  );
  return { side, level: critical ? 'crit' : 'warn' };
}

function defaultTime(value: number | string): string {
  return typeof value === 'number'
    ? new Date(value).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : value;
}

function textOf(label: ReactNode, fallback: string): string {
  return typeof label === 'string' || typeof label === 'number'
    ? String(label)
    : fallback;
}

function withUnit(label: ReactNode, unit: string | undefined): ReactNode {
  if (!unit) {
    return label;
  }
  return typeof label === 'string' ? (
    `${label} (${unit})`
  ) : (
    <>
      {label} ({unit})
    </>
  );
}

const range = (min: number, max: number) => `${min}–${max}`;

// The value axis: the entry's own domain, or the readings, ranges and thresholds with 10% air.
function domainOf(
  keys: ReadonlyArray<string>,
  rows: ReadonlyArray<ChartDatum>,
  config: VitalsConfig,
): [number, number] {
  const fixed = keys.map((key) => config[key]?.domain).find(Boolean);
  if (fixed) {
    return [fixed[0], fixed[1]];
  }
  const values = keys.flatMap((key) => {
    const entry = config[key];
    return [
      ...rows.map((row) => row[key]).filter(isReading),
      ...(entry?.normal ? [entry.normal.min, entry.normal.max] : []),
      ...(entry?.thresholds ?? []).map((threshold) => threshold.value),
    ];
  });
  if (values.length === 0) {
    return [0, 1];
  }
  const low = Math.min(...values);
  const high = Math.max(...values);
  const air = (high - low) * 0.1 || 1;
  return [Math.floor(low - air), Math.ceil(high + air)];
}

// Patient vitals over time, as small multiples on one time axis: each panel shades its normal range,
// rules its thresholds in their status colour, leaves a gap for a missing reading, and marks an
// out-of-range reading with a shape (up for high, down for low) before any colour. The legend, the
// panel captions, the description and the table all say the same things in words.
export function VitalsChart({
  data,
  config,
  ariaLabel,
  description,
  categoryKey,
  seriesKeys,
  panels,
  now,
  panelHeight = 112,
  timeFormatter = defaultTime,
  initialDimension,
  ...figure
}: VitalsChartProps) {
  const syncId = useId();
  const animate = animationActive();

  // Every series value is a reading or null, so a string or NaN is a gap and never a throw.
  const rows = useMemo(
    () =>
      data.map((row) => {
        const clean: ChartDatum = { ...row };
        seriesKeys.forEach((key) => {
          clean[key] = reading(row[key]);
        });
        return clean;
      }),
    [data, seriesKeys],
  );
  const plotted = useMemo(
    () =>
      rows.filter(
        (row) => row[categoryKey] !== null && row[categoryKey] !== undefined,
      ),
    [rows, categoryKey],
  );
  const numericTime = plotted.some((row) => isReading(row[categoryKey]));

  const layout: ReadonlyArray<VitalsPanel> =
    panels ??
    seriesKeys.map((key) => ({
      key,
      label: config[key]?.label ?? key,
      unit: config[key]?.unit,
      seriesKeys: [key],
    }));

  const entries = seriesKeys.map((key) => ({ key, entry: config[key] }));
  const nameOf = (key: string) => textOf(config[key]?.label, key);
  const hasNormal = entries.some(({ entry }) => entry?.normal);
  const levels = new Set(
    entries.flatMap(({ entry }) =>
      (entry?.thresholds ?? []).map((threshold) => threshold.level),
    ),
  );

  const flagged = rows.reduce(
    (count, row) =>
      count +
      seriesKeys.filter((key) => {
        const value = row[key];
        return isReading(value) && flagOf(value, config[key]) !== undefined;
      }).length,
    0,
  );

  const legend: ChartLegendItem[] = [
    ...seriesKeys.map((key) => ({
      key,
      label: withUnit(config[key]?.label ?? key, config[key]?.unit),
      mark: 'line' as const,
      color: chartColorVar(key),
    })),
    ...(hasNormal
      ? [
          {
            key: 'normal',
            label: 'Normal range',
            mark: 'band' as const,
            color: BAND,
          },
        ]
      : []),
    ...(levels.has('warn')
      ? [
          {
            key: 'warn',
            label: 'Warning threshold',
            mark: 'dashed' as const,
            color: WARN,
          },
        ]
      : []),
    ...(levels.has('crit')
      ? [
          {
            key: 'crit',
            label: 'Critical threshold',
            mark: 'dashed' as const,
            color: CRIT,
          },
        ]
      : []),
    ...(hasNormal
      ? [
          {
            key: 'high',
            label: 'Above normal',
            mark: 'triangle-up' as const,
            color: WARN,
          },
          {
            key: 'low',
            label: 'Below normal',
            mark: 'triangle-down' as const,
            color: WARN,
          },
        ]
      : []),
    ...(now !== undefined
      ? [{ key: 'now', label: 'Now', mark: 'tick' as const, color: RULE }]
      : []),
  ];

  // What the shading and the rules say, read after the caller's own description.
  const ranges = entries
    .filter(({ entry }) => entry?.normal)
    .map(({ key, entry }) =>
      joinWords([
        nameOf(key),
        range(entry?.normal?.min ?? 0, entry?.normal?.max ?? 0),
        entry?.unit,
      ]),
    );
  const thresholds = entries.flatMap(({ key, entry }) =>
    (entry?.thresholds ?? []).map(
      (threshold) =>
        `${joinWords([nameOf(key), threshold.label, threshold.value, entry?.unit])} (${STATUS_WORD[threshold.level]})`,
    ),
  );
  const summary = joinWords([
    description,
    ranges.length > 0 ? `Normal ranges: ${ranges.join('; ')}.` : undefined,
    thresholds.length > 0 ? `Thresholds: ${thresholds.join('; ')}.` : undefined,
    flagged === 0
      ? 'No readings out of range.'
      : `${flagged} reading${flagged === 1 ? '' : 's'} out of range.`,
  ]);

  const tableConfig: ChartConfig = Object.fromEntries([
    ...Object.entries(config).map(([key, entry]) => [
      key,
      { ...entry, label: withUnit(entry.label ?? key, entry.unit) },
    ]),
  ]);

  const formatTime = (value: unknown) =>
    typeof value === 'number' || typeof value === 'string'
      ? timeFormatter(value)
      : NO_DATA;

  const tickFormatter = (value: number | string) => timeFormatter(value);

  return (
    <ChartFigure
      {...figure}
      config={config}
      ariaLabel={ariaLabel}
      description={summary}
      legend={<ChartLegendList items={legend} />}
      table={
        <ChartDataTable
          caption={ariaLabel}
          data={rows}
          config={tableConfig}
          categoryKey={categoryKey}
          seriesKeys={seriesKeys}
          formatCategory={formatTime}
          formatCell={(value, key) => {
            if (!isReading(value)) {
              return NO_DATA;
            }
            const flag = flagOf(value, config[key]);
            const shown = formatChartValue(value);
            if (!flag) {
              return shown;
            }
            return flag.level === 'crit'
              ? `${shown} (${flag.side}, critical)`
              : `${shown} (${flag.side})`;
          }}
        />
      }
    >
      <div className="grid gap-3">
        {layout.map((panel, panelIndex) => {
          const last = panelIndex === layout.length - 1;
          const first = panelIndex === 0;
          const normals = panel.seriesKeys
            .map((key) => ({ key, normal: config[key]?.normal }))
            .filter((item) => item.normal);
          const caption = joinWords(
            [
              panel.unit,
              normals.length === 1 && normals[0].normal
                ? `normal ${range(normals[0].normal.min, normals[0].normal.max)}`
                : normals.length > 1
                  ? `normal ${normals
                      .map(({ key, normal }) =>
                        normal
                          ? `${nameOf(key)} ${range(normal.min, normal.max)}`
                          : '',
                      )
                      .join(', ')}`
                  : undefined,
            ],
            ' · ',
          );
          return (
            <section key={panel.key} className="grid gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-ink">
                  {panel.label}
                </span>
                {caption ? (
                  <span className="text-[12px] text-ink-2">{caption}</span>
                ) : null}
              </div>
              <ChartPlot
                height={panelHeight + (last ? 24 : 0)}
                initialDimension={initialDimension}
              >
                <LineChart
                  data={plotted as Array<Record<string, unknown>>}
                  syncId={syncId}
                  margin={{ top: 6, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid vertical={false} stroke={GRID_STROKE} />
                  {numericTime ? (
                    <XAxis
                      dataKey={categoryKey}
                      type="number"
                      scale="time"
                      domain={['dataMin', 'dataMax']}
                      hide={!last}
                      tickLine={false}
                      axisLine={false}
                      tick={CATEGORY_TICK}
                      tickFormatter={tickFormatter}
                    />
                  ) : (
                    <XAxis
                      dataKey={categoryKey}
                      hide={!last}
                      padding={{ left: 8, right: 8 }}
                      tickLine={false}
                      axisLine={false}
                      tick={CATEGORY_TICK}
                      tickFormatter={tickFormatter}
                    />
                  )}
                  <YAxis
                    domain={domainOf(panel.seriesKeys, rows, config)}
                    tickLine={false}
                    axisLine={false}
                    tick={VALUE_TICK}
                    width={40}
                    tickCount={4}
                  />
                  {normals.map(({ key, normal }) =>
                    normal ? (
                      <ReferenceArea
                        key={`normal-${key}`}
                        y1={normal.min}
                        y2={normal.max}
                        fill={BAND}
                        fillOpacity={BAND_OPACITY}
                        stroke="none"
                        ifOverflow="extendDomain"
                      />
                    ) : null,
                  )}
                  {panel.seriesKeys.flatMap((key) =>
                    (config[key]?.thresholds ?? []).map((threshold) => (
                      <ReferenceLine
                        key={`threshold-${key}-${threshold.value}`}
                        y={threshold.value}
                        stroke={STATUS_COLOUR[threshold.level]}
                        strokeDasharray="4 4"
                        strokeWidth={1.2}
                        ifOverflow="extendDomain"
                        label={{
                          value: threshold.label,
                          position: 'insideTopRight',
                          fill: 'var(--nova-color-ink-2)',
                          fontSize: 11,
                        }}
                      />
                    )),
                  )}
                  {now !== undefined ? (
                    <ReferenceLine
                      x={now}
                      stroke={RULE}
                      strokeWidth={1.2}
                      shape={(line: {
                        x1?: number;
                        y1?: number;
                        x2?: number;
                        y2?: number;
                      }) => (
                        <line
                          data-vital-now=""
                          x1={line.x1}
                          y1={line.y1}
                          x2={line.x2}
                          y2={line.y2}
                          stroke={RULE}
                          strokeWidth={1.2}
                        />
                      )}
                      label={
                        first
                          ? {
                              value: 'Now',
                              position: 'insideTopLeft',
                              fill: 'var(--nova-color-ink-2)',
                              fontSize: 11,
                            }
                          : undefined
                      }
                    />
                  ) : null}
                  <ChartTooltip
                    cursor={{ stroke: 'var(--nova-color-border-strong)' }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) =>
                          typeof label === 'number' || typeof label === 'string'
                            ? timeFormatter(label)
                            : label
                        }
                        formatter={(value, name) => {
                          const unit = config[name]?.unit;
                          const shown = formatChartValue(value);
                          return unit ? `${String(shown)} ${unit}` : shown;
                        }}
                      />
                    }
                  />
                  {panel.seriesKeys.map((key) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={chartColorVar(key)}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      connectNulls={false}
                      isAnimationActive={animate}
                      activeDot={{
                        r: 5,
                        fill: chartColorVar(key),
                        stroke: SURFACE,
                        strokeWidth: 2,
                      }}
                      dot={(props: DotProps) => {
                        const id = `${key}-${props.index ?? 0}`;
                        const value = props.payload?.[key];
                        if (!hasPoint(props) || !isReading(value)) {
                          return <g key={id} />;
                        }
                        const flag = flagOf(value, config[key]);
                        if (flag) {
                          return (
                            <Marker
                              key={id}
                              data-vital-flag={flag.side}
                              shape={
                                flag.side === 'high'
                                  ? 'triangle-up'
                                  : 'triangle-down'
                              }
                              cx={props.cx}
                              cy={props.cy}
                              colour={STATUS_COLOUR[flag.level]}
                            />
                          );
                        }
                        return (
                          <circle
                            key={id}
                            data-vital-point=""
                            cx={props.cx}
                            cy={props.cy}
                            r={2.5}
                            fill={SURFACE}
                            stroke={chartColorVar(key)}
                            strokeWidth={1.5}
                          />
                        );
                      }}
                    />
                  ))}
                </LineChart>
              </ChartPlot>
            </section>
          );
        })}
      </div>
    </ChartFigure>
  );
}
