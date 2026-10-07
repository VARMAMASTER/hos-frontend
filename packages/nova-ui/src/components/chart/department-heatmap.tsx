import { useMemo, useState, type HTMLAttributes, type MouseEvent } from 'react';
import { cx } from '../../primitives/cx';
import { ChartFigure, ChartTooltipContent } from './chart';
import { ChartDataTable } from './chart-data-table';
import type { ChartDatum } from './chart-shared';
import {
  chartColorVar,
  formatChartValue,
  NO_DATA,
  type ChartConfig,
} from './chart-utils';
import {
  HEAT_STEPS,
  heatFill,
  heatLevel,
  isReading,
  joinWords,
  reading,
} from './hospital-shared';

type Key = string | number;

export interface DepartmentHeatmapProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
  // One datum per cell, in long form: { day: 'Mon', hour: 9, arrivals: 42 }.
  data: ReadonlyArray<ChartDatum>;
  ariaLabel: string;
  description?: string;
  // The key naming each row (the day), each column (the hour) and the figure of the cell.
  rowKey: string;
  columnKey: string;
  valueKey: string;
  // What the figure counts, for the tooltip, the legend and the description: "ED arrivals".
  valueLabel?: string;
  // The order of the rows and columns. Left out, the order they first appear in the data.
  rows?: ReadonlyArray<Key>;
  columns?: ReadonlyArray<Key>;
  rowFormatter?: (row: Key) => string;
  columnFormatter?: (column: Key) => string;
  valueFormatter?: (value: number) => string;
  // The palette slot of the scale. Default chart-1.
  color?: string;
  // Label every nth column. Left out, every column up to 12, then every third (24 hours).
  columnLabelEvery?: number;
  bare?: boolean;
}

interface Hover {
  row: string;
  column: string;
  value: number | null;
  left: number;
  top: number;
}

const cellKey = (row: Key, column: Key) => `${row}\u0000${column}`;

function firstSeen(data: ReadonlyArray<ChartDatum>, key: string): Key[] {
  const seen = new Map<string, Key>();
  data.forEach((datum) => {
    const value = datum[key];
    if (
      (typeof value === 'string' || typeof value === 'number') &&
      !seen.has(String(value))
    ) {
      seen.set(String(value), value);
    }
  });
  return [...seen.values()];
}

// A day x hour grid (appointments, ED arrivals) on a sequential scale: one palette hue in five
// steps of strength, mixed into the surface, so it reads for every colour vision and in the dark
// scheme. Hovering a cell shows its figure; the legend gives the scale from zero to the maximum in
// numbers; the data table (a row per day, a column per hour) is the reading for assistive technology,
// so the drawn grid is hidden from it and is never a tab stop.
export function DepartmentHeatmap({
  data,
  ariaLabel,
  description,
  rowKey,
  columnKey,
  valueKey,
  valueLabel,
  rows,
  columns,
  rowFormatter = String,
  columnFormatter = String,
  valueFormatter,
  color = 'chart-1',
  columnLabelEvery,
  bare,
  ...figure
}: DepartmentHeatmapProps) {
  const [hover, setHover] = useState<Hover | null>(null);
  const rowOrder = useMemo(
    () => rows ?? firstSeen(data, rowKey),
    [rows, data, rowKey],
  );
  const columnOrder = useMemo(
    () => columns ?? firstSeen(data, columnKey),
    [columns, data, columnKey],
  );
  // The last datum for a cell wins.
  const values = useMemo(() => {
    const cells = new Map<string, number | null>();
    data.forEach((datum) => {
      const row = datum[rowKey];
      const column = datum[columnKey];
      if (
        (typeof row === 'string' || typeof row === 'number') &&
        (typeof column === 'string' || typeof column === 'number')
      ) {
        cells.set(cellKey(row, column), reading(datum[valueKey]));
      }
    });
    return cells;
  }, [data, rowKey, columnKey, valueKey]);

  const readings = [...values.values()].filter(isReading);
  const max = readings.length > 0 ? Math.max(0, ...readings) : 0;
  const show = (value: number) =>
    valueFormatter ? valueFormatter(value) : String(formatChartValue(value));
  const label = valueLabel ?? valueKey;
  const colour = chartColorVar(valueKey);
  const config: ChartConfig = { [valueKey]: { label, color } };
  const every = columnLabelEvery ?? (columnOrder.length > 12 ? 3 : 1);

  let highest: { row: Key; column: Key; value: number } | undefined;
  rowOrder.forEach((row) =>
    columnOrder.forEach((column) => {
      const value = values.get(cellKey(row, column));
      if (isReading(value) && (!highest || value > highest.value)) {
        highest = { row, column, value };
      }
    }),
  );
  const summary = joinWords([
    description,
    highest
      ? `Highest ${label}: ${rowFormatter(highest.row)} ${columnFormatter(highest.column)}, ${show(highest.value)}.`
      : undefined,
  ]);

  // The table: a row per row, a column per column, keyed by the column's text.
  const tableRows = rowOrder.map((row) => {
    const datum: ChartDatum = { [rowKey]: row };
    columnOrder.forEach((column) => {
      datum[String(column)] = values.get(cellKey(row, column)) ?? null;
    });
    return datum;
  });
  const tableConfig: ChartConfig = Object.fromEntries(
    columnOrder.map((column) => [
      String(column),
      { label: columnFormatter(column) },
    ]),
  );

  const enter = (row: Key, column: Key) => (event: MouseEvent<HTMLElement>) => {
    const cell = event.currentTarget;
    setHover({
      row: rowFormatter(row),
      column: columnFormatter(column),
      value: values.get(cellKey(row, column)) ?? null,
      left: cell.offsetLeft + cell.offsetWidth / 2,
      top: cell.offsetTop,
    });
  };

  return (
    <ChartFigure
      {...figure}
      config={config}
      ariaLabel={ariaLabel}
      description={summary || undefined}
      bare={bare}
      legend={
        <div data-heat-legend="">
          <ul className="flex flex-wrap items-center justify-center gap-x-s2 gap-y-s1 pt-s5 text-label text-ink-2">
            <li className="me-s5">{label}</li>
            <li className="flex items-center gap-s2">
              {show(0)}
              <span aria-hidden="true" className="flex">
                {Array.from({ length: HEAT_STEPS }, (_, level) => (
                  <span
                    key={level}
                    data-heat-swatch=""
                    className="h-s4 w-legend-mark"
                    style={{ backgroundColor: heatFill(colour, level) }}
                  />
                ))}
              </span>
            </li>
            <li>{show(max)}</li>
            <li className="ms-s5 flex items-center gap-s2">
              <span
                aria-hidden="true"
                className="size-s4 shrink-0 border border-border-strong"
              />
              No data
            </li>
          </ul>
        </div>
      }
      table={
        <ChartDataTable
          caption={ariaLabel}
          data={tableRows}
          config={tableConfig}
          categoryKey={rowKey}
          seriesKeys={columnOrder.map(String)}
          formatValue={valueFormatter}
          formatCategory={(row) =>
            typeof row === 'string' || typeof row === 'number'
              ? rowFormatter(row)
              : String(row)
          }
        />
      }
    >
      <div
        data-heat-grid=""
        aria-hidden="true"
        className="relative overflow-x-auto"
        onMouseLeave={() => setHover(null)}
      >
        <div
          className="grid min-w-0 items-center gap-s0"
          style={{
            gridTemplateColumns: `auto repeat(${columnOrder.length}, minmax(0, 1fr))`,
          }}
        >
          <span />
          {columnOrder.map((column, index) => (
            <span
              key={`head-${String(column)}`}
              data-heat-column=""
              // Labelled columns are spaced out, so a label may run over its unlabelled neighbours.
              className="overflow-visible whitespace-nowrap pb-s1 text-center text-meta text-ink-2 tabular-nums"
            >
              {index % every === 0 ? columnFormatter(column) : ''}
            </span>
          ))}
          {rowOrder.map((row) => [
            <span
              key={`row-${String(row)}`}
              className="whitespace-nowrap pe-s3 text-label text-ink-2"
            >
              {rowFormatter(row)}
            </span>,
            ...columnOrder.map((column) => {
              const value = values.get(cellKey(row, column)) ?? null;
              const level = isReading(value) ? heatLevel(value, max) : null;
              return (
                <div
                  key={cellKey(row, column)}
                  data-heat-cell=""
                  data-heat-level={level === null ? 'none' : String(level)}
                  onMouseEnter={enter(row, column)}
                  className={cx(
                    'h-s8 min-w-0 rounded-none',
                    level === null && 'border border-border-strong',
                  )}
                  style={
                    level === null
                      ? undefined
                      : { backgroundColor: heatFill(colour, level) }
                  }
                />
              );
            }),
          ])}
        </div>
        {hover ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{ left: hover.left, top: hover.top - 4 }}
          >
            <ChartTooltipContent
              active
              label={`${hover.row} · ${hover.column}`}
              payload={
                [
                  {
                    dataKey: valueKey,
                    name: valueKey,
                    value: hover.value ?? NO_DATA,
                    color: colour,
                    payload: {},
                  },
                ] as never
              }
              formatter={(value) =>
                typeof value === 'number'
                  ? show(value)
                  : formatChartValue(value)
              }
            />
          </div>
        ) : null}
      </div>
    </ChartFigure>
  );
}
