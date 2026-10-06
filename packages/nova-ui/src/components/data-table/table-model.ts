import type { DataTableColumn, SortState } from './types';

// The table's logic with no React in it: sorting, searching and which columns are shown. Everything
// takes and returns plain data, so each rule is tested on its own and the component only wires it up.

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

const isEmpty = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  value === '' ||
  (typeof value === 'number' && Number.isNaN(value));

// A Date, or text that is a date the engine reads (an ISO string), as milliseconds; otherwise NaN.
function timeOf(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') return Date.parse(value);
  return Number.NaN;
}

// The default ascending comparison. Numbers by value, dates by time, booleans false before true, and
// everything else as text with case ignored and digit runs read as numbers ("Bed 9" before "Bed 10").
// A Date against a string is a date comparison when the string parses as one.
export function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  }
  if (a instanceof Date || b instanceof Date) {
    const left = timeOf(a);
    const right = timeOf(b);
    if (!Number.isNaN(left) && !Number.isNaN(right)) return left - right;
  }
  return collator.compare(String(a), String(b));
}

// A stable sort. Equal values keep the order they arrived in, in both directions, and empty values
// stay at the end whichever way it sorts, because "no value" is not the smallest or the largest.
// A column's own `compare` replaces the default and is reversed for descending.
export function sortRows<Row>(
  rows: readonly Row[],
  columns: readonly DataTableColumn<Row>[],
  sort: SortState | null,
): Row[] {
  const column = sort
    ? columns.find((candidate) => candidate.id === sort.columnId)
    : undefined;
  if (!sort || !column) return [...rows];
  const sign = sort.direction === 'asc' ? 1 : -1;
  const { accessor, compare } = column;
  if (!compare && !accessor) return [...rows];

  const decorated = rows.map((row, index) => ({
    row,
    index,
    value: accessor ? accessor(row) : undefined,
  }));
  decorated.sort((left, right) => {
    let order: number;
    if (compare) {
      order = sign * compare(left.row, right.row);
    } else {
      const leftEmpty = isEmpty(left.value);
      const rightEmpty = isEmpty(right.value);
      if (leftEmpty || rightEmpty) {
        order = leftEmpty === rightEmpty ? 0 : leftEmpty ? 1 : -1;
      } else {
        order = sign * compareValues(left.value, right.value);
      }
    }
    return order || left.index - right.index;
  });
  return decorated.map((entry) => entry.row);
}

// The header-click cycle: none, ascending, descending, none. Another column starts at ascending.
export function nextSort(
  current: SortState | null,
  columnId: string,
): SortState | null {
  if (!current || current.columnId !== columnId) {
    return { columnId, direction: 'asc' };
  }
  return current.direction === 'asc' ? { columnId, direction: 'desc' } : null;
}

function textOf(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  }
  if (typeof value === 'object') return '';
  return String(value);
}

function searchTextOf<Row>(
  row: Row,
  columns: readonly DataTableColumn<Row>[],
): string {
  const parts: string[] = [];
  for (const column of columns) {
    if (column.searchValue === false) continue;
    if (column.searchValue) {
      parts.push(column.searchValue(row));
    } else if (column.accessor) {
      parts.push(textOf(column.accessor(row)));
    }
  }
  return parts.join(' ').toLowerCase();
}

// The client-side global search: every word of the query must appear somewhere in the row, in any of
// the searched columns, ignoring case. An empty or blank query keeps every row.
export function filterRows<Row>(
  rows: readonly Row[],
  columns: readonly DataTableColumn<Row>[],
  query: string,
): Row[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [...rows];
  return rows.filter((row) => {
    const haystack = searchTextOf(row, columns);
    return terms.every((term) => haystack.includes(term));
  });
}

// A column that cannot be hidden is always shown, whatever the hidden list says.
export function visibleColumns<Row>(
  columns: readonly DataTableColumn<Row>[],
  hiddenIds: readonly string[],
): DataTableColumn<Row>[] {
  return columns.filter(
    (column) => !(column.hideable && hiddenIds.includes(column.id)),
  );
}
