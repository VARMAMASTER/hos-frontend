import type { ReactNode } from 'react';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { formatChartValue, NO_DATA, type ChartConfig } from './chart-utils';

export interface ChartDataTableTotal {
  label: ReactNode;
  values: ReadonlyArray<ReactNode>;
}

export interface ChartDataTableProps {
  caption: ReactNode;
  data: ReadonlyArray<Record<string, unknown>>;
  config: ChartConfig;
  categoryKey: string;
  seriesKeys: ReadonlyArray<string>;
  // Formats a numeric value; the default groups digits the Indian way.
  formatValue?: (value: number) => ReactNode;
  total?: ChartDataTableTotal;
  // Writes a cell itself (a reading flagged "high", a period "over capacity"). Returning null or
  // undefined falls back to the formatted value.
  formatCell?: (
    value: unknown,
    key: string,
    row: Record<string, unknown>,
  ) => ReactNode;
  // Writes the row header (a timestamp as a time of day).
  formatCategory?: (value: unknown) => ReactNode;
  className?: string;
}

// The data-table alternative every chart carries: the same values as the plot, as a real table.
// It is wrapped in a visually hidden div (a table may not sit in a span), so screen readers read it
// and the eye does not, and a clinical or financial figure never depends on sight. A missing value says "No data" instead of leaving a silent gap.
export function ChartDataTable({
  caption,
  data,
  config,
  categoryKey,
  seriesKeys,
  formatValue,
  total,
  formatCell,
  formatCategory,
  className,
}: ChartDataTableProps) {
  const category = (value: unknown): ReactNode =>
    value === null || value === undefined
      ? NO_DATA
      : formatCategory
        ? formatCategory(value)
        : String(value);
  const format = (value: unknown): ReactNode =>
    typeof value === 'number' && formatValue
      ? formatValue(value)
      : formatChartValue(value);
  const show = (
    value: unknown,
    key: string,
    row: Record<string, unknown>,
  ): ReactNode => formatCell?.(value, key, row) ?? format(value);
  return (
    <VisuallyHidden as="div">
      <table className={className}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{config[categoryKey]?.label ?? categoryKey}</th>
            {seriesKeys.map((key) => (
              <th key={key} scope="col">
                {config[key]?.label ?? key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={`${String(row[categoryKey])}-${index}`}>
              <th scope="row">{category(row[categoryKey])}</th>
              {seriesKeys.map((key) => (
                <td key={key}>{show(row[key], key, row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
        {total ? (
          <tfoot>
            <tr>
              <th scope="row">{total.label}</th>
              {total.values.map((value, index) => (
                <td key={index}>{value}</td>
              ))}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </VisuallyHidden>
  );
}
