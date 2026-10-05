import type { ComponentType, ReactNode } from 'react';
import { resolveChartColor } from './palette';

// One entry per series (or per slice, for a donut). The colour is a palette slot ('chart-1' to
// 'chart-6') or any CSS colour; left out, the series takes the next slot in order.
export interface ChartConfigEntry {
  label?: ReactNode;
  icon?: ComponentType;
  color?: string;
}

export type ChartConfig = Record<string, ChartConfigEntry>;

// The custom property a series colour is published under. A key that is not a CSS identifier (a
// category such as "Cash / self pay") has its other characters replaced with "-".
export function chartVarName(key: string): string {
  return `--color-${key.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

// What a Recharts mark writes: fill={chartColorVar('revenue')}.
export function chartColorVar(key: string): string {
  return `var(${chartVarName(key)})`;
}

export function chartColourVars(config: ChartConfig): Record<string, string> {
  const vars: Record<string, string> = {};
  Object.entries(config).forEach(([key, entry], index) => {
    vars[chartVarName(key)] = resolveChartColor(entry.color, index);
  });
  return vars;
}

export const NO_DATA = 'No data';

// Numbers read the way an Indian hospital reads them (12,34,567); the formatters of a chart replace
// this where a figure needs a unit.
export function formatChartValue(value: unknown): ReactNode {
  if (typeof value === 'number') {
    return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
  if (value === null || value === undefined || value === '') {
    return NO_DATA;
  }
  return String(value);
}
