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
  className,
}: ChartDataTableProps) {
  const show = (value: unknown): ReactNode =>
    typeof value === 'number' && formatValue
      ? formatValue(value)
      : formatChartValue(value);
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
              <th scope="row">{String(row[categoryKey] ?? NO_DATA)}</th>
              {seriesKeys.map((key) => (
                <td key={key}>{show(row[key])}</td>
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
