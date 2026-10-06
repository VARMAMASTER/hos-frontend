import type { ReactNode } from 'react';
import type { TableAlign } from '../table/table';

export type SortDirection = 'asc' | 'desc';

// The column being sorted and which way. `null` (no sort) is a value of its own, so a controlled
// table can say "unsorted" without falling back to its own state.
export interface SortState {
  columnId: string;
  direction: SortDirection;
}

// `page` counts from 1, as Pagination does.
export interface PaginationState {
  page: number;
  pageSize: number;
}

export type Density = 'comfortable' | 'compact';

// What a cell renderer is told besides the row.
export interface CellContext {
  // The row's position on the current page, from 0.
  rowIndex: number;
}

export interface DataTableColumn<Row> {
  // Unique and stable: it keys sorting, visibility and the cell, and is never shown.
  id: string;
  // The visible header. For a column menu or an announcement a plain string is used; a non-string
  // header needs `label`.
  header: ReactNode;
  // The plain-text name of the column, for the Columns menu and the sort announcement. Defaults to
  // `header` when that is a string.
  label?: string;
  // The value this column is about. It is what the default cell shows, what sorting compares and what
  // search looks through (unless `searchValue` says otherwise).
  accessor?: (row: Row) => unknown;
  // How the cell is drawn. Without it the accessor's value is shown.
  cell?: (row: Row, context: CellContext) => ReactNode;
  sortable?: boolean;
  // Replaces the default comparison (numbers, dates, text). Return < 0, 0 or > 0 for a before b, in
  // ascending order; the table reverses it for descending.
  compare?: (a: Row, b: Row) => number;
  // The text search matches against. Defaults to the accessor's value as text. `false` keeps the
  // column out of search.
  searchValue?: ((row: Row) => string) | false;
  align?: TableAlign;
  // A CSS width ("12rem", 160). Without one the browser sizes the column.
  width?: string | number;
  // The Columns menu can hide it. A column that is not hideable is always shown.
  hideable?: boolean;
  // Starts hidden (uncontrolled visibility only).
  defaultHidden?: boolean;
  // Figures: right-aligned, tabular slashed-zero numerals.
  numeric?: boolean;
  // IBM Plex Mono, for identifiers (MRNs, order numbers).
  mono?: boolean;
  // A per-column filter control, drawn under the header text. The table does not filter by it: the
  // caller owns that state and passes the filtered rows.
  filter?: ReactNode;
  // Never wrap the cell's text.
  nowrap?: boolean;
}

export interface BulkActionContext<Row> {
  selectedIds: string[];
  // The selected rows the table has in hand. In `manual` mode that is the current page only.
  selectedRows: Row[];
  clearSelection: () => void;
}
