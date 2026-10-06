import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Rectangle,
  ReferenceLine,
  XAxis,
  YAxis,
  type BarShapeProps,
} from 'recharts';
import { ChartLegendList } from './chart';
import {
  animationActive,
  CATEGORY_TICK,
  ChartFrame,
  GRID_STROKE,
  tooltipFor,
  VALUE_TICK,
  type ChartBaseProps,
  type ChartDatum,
} from './chart-shared';
import { chartColorVar, formatChartValue } from './chart-utils';
import {
  isReading,
  joinWords,
  Marker,
  missed,
  niceCeiling,
  reading,
  RULE,
  signed,
  TICK,
  TRACK,
  WARN,
  type Goal,
} from './hospital-shared';

export interface ComparisonBarChartProps extends ChartBaseProps {
  actualKey: string;
  targetKey: string;
  // 'bullet' (the default): the actual as a bar on a track with the target as a tick across it.
  // 'diverging': the difference from target as a bar left or right of a zero rule.
  variant?: 'bullet' | 'diverging';
  // Whether the actual should reach the target (revenue, throughput) or stay under it (wait,
  // length of stay). Default at-least.
  goal?: Goal;
}

// Derived columns of the data table, which are also their headers.
const DIFF = 'Difference';
const STATUS = 'Status';
const MET = 'Met target';

const BAR_SIZE = 12;
// Room right of the bullet track for its figures ("11.2 / 10").
const FIGURES_MARGIN = 88;
const BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];

interface LabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: unknown;
}

interface BulletLabelProps extends LabelProps {
  index?: number;
  // The chart's box, margins included (a cartesian box here; Recharts types it for polar too).
  parentViewBox?: unknown;
}

// The right edge of a cartesian view box, or null for any other shape.
function rightOf(box: unknown): number | null {
  if (typeof box !== 'object' || box === null) {
    return null;
  }
  const { x, width } = box as { x?: unknown; width?: unknown };
  return typeof x === 'number' && typeof width === 'number' ? x + width : null;
}

// Actual against target per department. As a bullet chart, each department is a bar on a track with
// a full-ink tick at its target; a department that missed carries a warning triangle pointing the way
// it missed, and its figures are written after the track. As a diverging chart, the difference from
// target runs left or right of a zero rule, each bar labelled with its sign. Either way the table
// gives the signed difference and the status in words.
export function ComparisonBarChart({
  data,
  config,
  actualKey,
  targetKey,
  variant = 'bullet',
  goal = 'at-least',
  valueFormatter,
  description,
  ...frame
}: ComparisonBarChartProps) {
  const animate = animationActive();
  const missWord = goal === 'at-least' ? 'Below target' : 'Above target';
  const show = (value: number) =>
    valueFormatter ? valueFormatter(value) : String(formatChartValue(value));
  const rows = useMemo(
    () =>
      data.map((row) => {
        const actual = reading(row[actualKey]);
        const target = reading(row[targetKey]);
        const both = actual !== null && target !== null;
        const clean: ChartDatum = {
          ...row,
          [actualKey]: actual,
          [targetKey]: target,
          [DIFF]: both ? actual - target : null,
          [STATUS]: both
            ? missed(actual, target, goal)
              ? missWord
              : MET
            : null,
        };
        return clean;
      }),
    [data, actualKey, targetKey, goal, missWord],
  );
  const name = (row: ChartDatum | undefined) =>
    String(row?.[frame.categoryKey] ?? '');
  const judged = rows.filter((row) => row[STATUS] !== null);
  const misses = judged.filter((row) => row[STATUS] === missWord);
  const summary = joinWords([
    description,
    judged.length === 0
      ? undefined
      : misses.length === 0
        ? `All ${judged.length} met target.`
        : `${judged.length - misses.length} of ${judged.length} met target. ${missWord}: ${misses.map(name).join(', ')}.`,
  ]);

  const colour = chartColorVar(actualKey);
  const targetLabel = config[targetKey]?.label ?? 'Target';
  const table = {
    data: rows,
    config,
    description: summary || undefined,
    seriesKeys: [actualKey, targetKey],
    tableKeys: [actualKey, targetKey, DIFF, STATUS],
    valueFormatter,
    formatCell: (value: unknown, key: string) =>
      key === DIFF && isReading(value) ? signed(value, show) : undefined,
  };

  if (variant === 'diverging') {
    const reach = Math.max(
      0,
      ...rows
        .map((row) => row[DIFF])
        .filter(isReading)
        .map(Math.abs),
    );
    const edge = niceCeiling(reach * 1.1);
    const label = ({ x, y, width, height, value }: LabelProps) => {
      if (!isReading(value)) {
        return null;
      }
      const left = Number(x);
      const right = left + Number(width);
      const ahead = value >= 0;
      return (
        <text
          data-variance-label=""
          x={ahead ? Math.max(left, right) + 6 : Math.min(left, right) - 6}
          y={Number(y) + Number(height) / 2}
          textAnchor={ahead ? 'start' : 'end'}
          dominantBaseline="central"
          className="fill-ink text-[12px] font-semibold tabular-nums"
        >
          {signed(value, show)}
        </text>
      );
    };
    return (
      <ChartFrame
        {...frame}
        {...table}
        legend={
          <ChartLegendList
            items={[
              {
                key: 'difference',
                label: 'Difference from target',
                mark: 'rect',
                color: colour,
              },
            ]}
          />
        }
      >
        <BarChart
          data={rows as Array<Record<string, unknown>>}
          layout="vertical"
          margin={{ top: 8, right: 48, bottom: 0, left: 48 }}
        >
          <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
          <XAxis
            type="number"
            domain={[-edge, edge]}
            tickLine={false}
            axisLine={false}
            tick={VALUE_TICK}
            tickFormatter={(n: number) => signed(n, show)}
          />
          <YAxis
            type="category"
            dataKey={frame.categoryKey}
            tickLine={false}
            axisLine={false}
            tick={CATEGORY_TICK}
            width="auto"
          />
          {tooltipFor(valueFormatter, { fill: 'var(--nova-color-surface-2)' })}
          <ReferenceLine x={0} stroke={RULE} strokeWidth={1.2} />
          <Bar
            dataKey={DIFF}
            name="Difference from target"
            fill={colour}
            barSize={BAR_SIZE}
            // Exactly on target is a 2px sliver on the zero rule, so it still carries its "0".
            minPointSize={2}
            isAnimationActive={animate}
          >
            <LabelList dataKey={DIFF} content={label} />
          </Bar>
        </BarChart>
      </ChartFrame>
    );
  }

  const top = niceCeiling(
    Math.max(
      0,
      ...rows
        .flatMap((row) => [row[actualKey], row[targetKey]])
        .filter(isReading),
    ) * 1.05,
  );

  // The bar and its target tick, drawn together so the tick sits on the track's scale.
  const bullet = (props: BarShapeProps) => {
    const datum = (props.payload ?? {}) as ChartDatum;
    const actual = reading(datum[actualKey]);
    const target = reading(datum[targetKey]);
    const trackX = props.background?.x ?? props.x;
    const trackWidth = props.background?.width ?? 0;
    const tickX =
      target !== null && trackWidth > 0
        ? trackX + (Math.min(target, top) / top) * trackWidth
        : null;
    const miss =
      actual !== null && target !== null && missed(actual, target, goal);
    const middle = props.y + props.height / 2;
    return (
      <g
        data-bullet-actual={name(datum)}
        data-track-x={trackX}
        data-track-width={trackWidth}
      >
        <Rectangle
          x={props.x}
          y={props.y}
          width={props.width}
          height={props.height}
          radius={BAR_RADIUS}
          fill={colour}
        />
        {tickX !== null ? (
          <line
            data-bullet-target=""
            x1={tickX}
            x2={tickX}
            y1={props.y - 5}
            y2={props.y + props.height + 5}
            stroke={TICK}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        ) : null}
        {miss && actual !== null && target !== null ? (
          <Marker
            data-bullet-miss={name(datum)}
            shape={actual < target ? 'triangle-down' : 'triangle-up'}
            cx={props.x + props.width}
            cy={middle}
            size={5}
            colour={WARN}
          />
        ) : null}
      </g>
    );
  };

  // The figures after the track. They are a label list, not part of the bar shape: the bars are
  // clipped to the plot, and the track runs to its right edge.
  const figures = ({ y, height, index, parentViewBox }: BulletLabelProps) => {
    const datum = rows[index ?? -1];
    const actual = reading(datum?.[actualKey]);
    const chartRight = rightOf(parentViewBox);
    if (!datum || actual === null || chartRight === null) {
      return null;
    }
    const target = reading(datum[targetKey]);
    return (
      <text
        data-bullet-label=""
        // The chart box less the right margin is the end of the track.
        x={chartRight - FIGURES_MARGIN + 8}
        y={Number(y) + Number(height) / 2}
        dominantBaseline="central"
        className="fill-ink text-[12px] font-semibold tabular-nums"
      >
        {target !== null ? `${show(actual)} / ${show(target)}` : show(actual)}
      </text>
    );
  };

  return (
    <ChartFrame
      {...frame}
      {...table}
      legend={
        <ChartLegendList
          items={[
            {
              key: actualKey,
              label: config[actualKey]?.label ?? actualKey,
              mark: 'rect',
              color: colour,
            },
            { key: targetKey, label: targetLabel, mark: 'tick', color: TICK },
            {
              key: 'miss',
              label: missWord,
              mark: goal === 'at-least' ? 'triangle-down' : 'triangle-up',
              color: WARN,
            },
          ]}
        />
      }
    >
      <BarChart
        data={rows as Array<Record<string, unknown>>}
        layout="vertical"
        margin={{ top: 8, right: FIGURES_MARGIN, bottom: 0, left: 0 }}
      >
        <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
        <XAxis
          type="number"
          domain={[0, top]}
          allowDataOverflow
          tickLine={false}
          axisLine={false}
          tick={VALUE_TICK}
          tickFormatter={valueFormatter}
        />
        <YAxis
          type="category"
          dataKey={frame.categoryKey}
          tickLine={false}
          axisLine={false}
          tick={CATEGORY_TICK}
          width="auto"
        />
        {tooltipFor(valueFormatter, { fill: 'var(--nova-color-surface-2)' })}
        <Bar
          dataKey={actualKey}
          fill={colour}
          background={{ fill: TRACK }}
          barSize={BAR_SIZE}
          shape={bullet}
          isAnimationActive={animate}
        >
          <LabelList dataKey={actualKey} content={figures} />
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}
