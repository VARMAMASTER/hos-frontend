import {
  useMemo,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { useControllableState } from '../../primitives/use-controllable-state';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { Button } from '../button/button';
import { EmptyState } from '../empty-state/empty-state';
import { Menu } from '../menu/menu';
import { PaginationBar } from '../pagination/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../table/table';
import { TextField } from '../text-field/text-field';
import {
  ColumnToggle,
  ColumnsIcon,
  DensityToggle,
  MoreIcon,
  SearchIcon,
  SelectBox,
  SkeletonBar,
  SortButton,
} from './data-table-parts';
import { filterRows, nextSort, sortRows, visibleColumns } from './table-model';
import type {
  BulkActionContext,
  DataTableColumn,
  Density,
  PaginationState,
  SortState,
} from './types';

export type {
  BulkActionContext,
  CellContext,
  DataTableColumn,
  Density,
  PaginationState,
  SortDirection,
  SortState,
} from './types';

export interface DataTableProps<Row>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  // Names the table for assistive technology (a visually hidden <caption>).
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  // A row's identity: stable across sorting, filtering and paging, and unique. It keys the row and
  // the selection.
  getRowId: (row: Row) => string;
  // The name a row goes by in "Select …" and "Actions for …". Never the row's position alone if a
  // better name exists. Defaults to "row 3".
  getRowLabel?: (row: Row, index: number) => string;

  // The server does the sorting, searching and paging: `rows` is the current page as it arrived and
  // is shown untouched, `rowCount` is the total, and the change callbacks are how the caller learns
  // what to fetch. Without it the table does all three itself.
  manual?: boolean;
  rowCount?: number;

  sort?: SortState | null;
  defaultSort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;

  // Pages. Without `pagination` the table keeps its own, starting at page 1 of 25.
  paginate?: boolean;
  pagination?: PaginationState;
  defaultPagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  pageSizeOptions?: readonly number[];

  // A checkbox column, a select-all for the current page, and a bulk-action bar.
  selectable?: boolean;
  selectedRowIds?: readonly string[];
  defaultSelectedRowIds?: readonly string[];
  onSelectedRowIdsChange?: (ids: string[]) => void;
  bulkActions?: (context: BulkActionContext<Row>) => ReactNode;

  searchable?: boolean;
  search?: string;
  defaultSearch?: string;
  onSearchChange?: (search: string) => void;
  searchLabel?: string;
  searchPlaceholder?: string;

  // The ids of the columns hidden through the Columns menu.
  hiddenColumnIds?: readonly string[];
  onHiddenColumnIdsChange?: (ids: string[]) => void;

  density?: Density;
  defaultDensity?: Density;
  onDensityChange?: (density: Density) => void;
  // The Comfortable / Compact toggle. On by default.
  densityToggle?: boolean;

  // The height at which the body starts to scroll under a sticky header. A number is pixels. The
  // default is the --nova-table-max-h token (36rem).
  maxHeight?: string | number;
  stickyHeader?: boolean;
  // Keeps the first column (after the select column, if any) in view while the table scrolls sideways.
  stickyFirstColumn?: boolean;

  // A trailing ⋯ menu per row: return MenuItems. The row's menu button is named by getRowLabel.
  rowActions?: (row: Row) => ReactNode;

  // Arrow keys, Home and End move between rows, and Space toggles a selectable row. Rows become one
  // roving tab stop.
  keyboardNavigation?: boolean;

  loading?: boolean;
  // How many placeholder rows to show while loading.
  loadingRows?: number;
  // Shown in place of the rows when set (a failed request). Rendered as an alert.
  error?: ReactNode;
  // Replace the default "nothing here" and "no results" states.
  emptyState?: ReactNode;
  noResultsState?: ReactNode;
  // More controls, after the search box.
  toolbar?: ReactNode;
}

const DEFAULT_PAGINATION: PaginationState = { page: 1, pageSize: 25 };

// The checkbox column is as wide as its padding and the box (--nova-table-select-w): the first data
// column pins after it, at left-table-select.
const SELECT_COLUMN = 'w-table-select min-w-table-select';

// The overlay menu is absolutely positioned under its trigger and clipped by the table's scroller,
// so a row's menu opens toward the table's inside: aligned to the trigger's end, and upward from
// the last rows, where there is no room below.
const MENU_END =
  '[&>[data-surface=overlay]]:right-0 [&>[data-surface=overlay]]:left-auto';
const MENU_UP =
  '[&>[data-surface=overlay]]:top-auto [&>[data-surface=overlay]]:bottom-full [&>[data-surface=overlay]]:mt-0 [&>[data-surface=overlay]]:mb-s1';

function labelOf<Row>(column: DataTableColumn<Row>): string {
  return (
    column.label ??
    (typeof column.header === 'string' ? column.header : column.id)
  );
}

function defaultCell(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') return '—';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? '—'
      : value.toLocaleDateString(undefined, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
  }
  if (typeof value === 'object') return '—';
  return String(value);
}

// A full-featured data table: sorting, pagination, row selection with bulk actions, search, a Columns
// menu, density, a sticky header, row actions, loading / empty / error states and keyboard row
// navigation, built on the low-level Table. Every piece of state is controlled-or-uncontrolled
// (useControllableState), and `manual` hands sorting, search and paging to the server.
//
// Dense data never sits on glass: the table is the opaque data material. Health data stays out of
// the logs: the component writes nothing to the console, and search text is only ever shown, never
// sent anywhere but the caller's own callback.
export function DataTable<Row>({
  caption,
  columns,
  rows,
  getRowId,
  getRowLabel,
  manual = false,
  rowCount,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  paginate = true,
  pagination: paginationProp,
  defaultPagination = DEFAULT_PAGINATION,
  onPaginationChange,
  pageSizeOptions,
  selectable = false,
  selectedRowIds,
  defaultSelectedRowIds = [],
  onSelectedRowIdsChange,
  bulkActions,
  searchable = true,
  search: searchProp,
  defaultSearch = '',
  onSearchChange,
  searchLabel = 'Search',
  searchPlaceholder,
  hiddenColumnIds,
  onHiddenColumnIdsChange,
  density: densityProp,
  defaultDensity = 'comfortable',
  onDensityChange,
  densityToggle = true,
  maxHeight = 'var(--nova-table-max-h)',
  stickyHeader = true,
  stickyFirstColumn = false,
  rowActions,
  keyboardNavigation = false,
  loading = false,
  loadingRows = 8,
  error,
  emptyState,
  noResultsState,
  toolbar,
  className,
  ...rest
}: DataTableProps<Row>) {
  const [sort, setSort] = useControllableState<SortState | null>({
    value: sortProp,
    defaultValue: defaultSort,
    onChange: onSortChange,
  });
  const [pagination, setPagination] = useControllableState<PaginationState>({
    value: paginationProp,
    defaultValue: defaultPagination,
    onChange: onPaginationChange,
  });
  const [search, setSearch] = useControllableState<string>({
    value: searchProp,
    defaultValue: defaultSearch,
    onChange: onSearchChange,
  });
  const [selectedIds, setSelectedIds] = useControllableState<string[]>({
    value: selectedRowIds ? [...selectedRowIds] : undefined,
    defaultValue: [...defaultSelectedRowIds],
    onChange: onSelectedRowIdsChange,
  });
  const [hiddenIds, setHiddenIds] = useControllableState<string[]>({
    value: hiddenColumnIds ? [...hiddenColumnIds] : undefined,
    defaultValue: columns
      .filter((column) => column.hideable && column.defaultHidden)
      .map((column) => column.id),
    onChange: onHiddenColumnIdsChange,
  });
  const [density, setDensity] = useControllableState<Density>({
    value: densityProp,
    defaultValue: defaultDensity,
    onChange: onDensityChange,
  });
  const [announcement, setAnnouncement] = useState('');
  const [activeRow, setActiveRow] = useState(0);

  const shownColumns = visibleColumns(columns, hiddenIds);
  const hideable = columns.filter((column) => column.hideable);

  // Sorting and searching run on the whole row set before it is cut into pages. In manual mode the
  // rows are already what the server chose to send.
  const processed = useMemo(
    () =>
      manual
        ? rows
        : sortRows(filterRows(rows, columns, search), columns, sort),
    [manual, rows, columns, search, sort],
  );

  const total = manual ? (rowCount ?? rows.length) : processed.length;
  const pageSize = Math.max(1, pagination.pageSize);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // A page past the end (rows were removed, or a stale controlled value) reads as the last page.
  const page = Math.min(Math.max(1, pagination.page), pageCount);
  const pageRows = useMemo(
    () =>
      manual || !paginate
        ? processed
        : processed.slice((page - 1) * pageSize, page * pageSize),
    [manual, paginate, processed, page, pageSize],
  );

  function firstPage() {
    if (pagination.page !== 1) setPagination({ ...pagination, page: 1 });
  }

  function changeSort(columnId: string, label: string) {
    const next = nextSort(sort, columnId);
    setAnnouncement(
      next
        ? `Sorted by ${label}, ${next.direction === 'asc' ? 'ascending' : 'descending'}`
        : 'Sort cleared',
    );
    setSort(next);
    firstPage();
  }

  function changeSearch(value: string) {
    setSearch(value);
    firstPage();
  }

  const selectedSet = new Set(selectedIds);
  const pageIds = pageRows.map(getRowId);
  const selectedOnPage = pageIds.filter((id) => selectedSet.has(id)).length;
  const allOnPage = pageIds.length > 0 && selectedOnPage === pageIds.length;

  function toggleRow(id: string) {
    setSelectedIds(
      selectedSet.has(id)
        ? selectedIds.filter((selected) => selected !== id)
        : [...selectedIds, id],
    );
  }

  // Select-all is scoped to the page in view: it never reaches rows the user cannot see.
  function toggleAllOnPage() {
    if (allOnPage) {
      const onPage = new Set(pageIds);
      setSelectedIds(selectedIds.filter((id) => !onPage.has(id)));
    } else {
      setSelectedIds([
        ...selectedIds,
        ...pageIds.filter((id) => !selectedSet.has(id)),
      ]);
    }
  }

  function toggleColumn(id: string) {
    setHiddenIds(
      hiddenIds.includes(id)
        ? hiddenIds.filter((hidden) => hidden !== id)
        : [...hiddenIds, id],
    );
  }

  function rowLabel(row: Row, index: number): string {
    return getRowLabel ? getRowLabel(row, index) : `row ${index + 1}`;
  }

  function onRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    index: number,
    id: string,
  ) {
    // Only the row itself: a key pressed inside a checkbox or a menu belongs to that control.
    if (event.target !== event.currentTarget) return;
    if (event.key === ' ' && selectable) {
      event.preventDefault();
      toggleRow(id);
      return;
    }
    const siblings = Array.from(
      event.currentTarget.parentElement?.children ?? [],
    ).filter((element) => element.hasAttribute('data-row'));
    let target: number;
    switch (event.key) {
      case 'ArrowDown':
        target = Math.min(index + 1, siblings.length - 1);
        break;
      case 'ArrowUp':
        target = Math.max(index - 1, 0);
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = siblings.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    setActiveRow(target);
    (siblings[target] as HTMLElement | undefined)?.focus();
  }

  const hasError = error !== undefined && error !== null && error !== false;
  const searching = search.trim() !== '';
  const columnCount =
    shownColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);
  const rowOffset = manual && paginate ? (page - 1) * pageSize : 0;
  const lastRow = pageRows.length - 1;
  const focusableRow = Math.min(activeRow, Math.max(lastRow, 0));

  const showColumns = hideable.length > 0;
  const hasToolbar = searchable || showColumns || densityToggle || toolbar;

  const bulk: BulkActionContext<Row> = {
    selectedIds,
    selectedRows: rows.filter((row) => selectedSet.has(getRowId(row))),
    clearSelection: () => setSelectedIds([]),
  };

  function renderState() {
    if (hasError) {
      return (
        <tr>
          <td colSpan={columnCount} className="p-s6">
            <div role="alert">{error}</div>
          </td>
        </tr>
      );
    }
    const state = searching
      ? (noResultsState ?? (
          <EmptyState
            title={`No results for “${search.trim()}”`}
            description="Check the spelling, or try fewer or different words."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeSearch('')}
              >
                Clear search
              </Button>
            }
          />
        ))
      : (emptyState ?? (
          <EmptyState
            title="Nothing here yet"
            description="There are no records to show."
          />
        ));
    return (
      <tr>
        <td colSpan={columnCount} className="p-s6">
          {state}
        </td>
      </tr>
    );
  }

  return (
    <div className={cx('flex flex-col gap-s5', className)} {...rest}>
      {hasToolbar ? (
        <div className="flex flex-wrap items-center gap-s3">
          {searchable ? (
            <TextField
              type="search"
              className="-mt-s1 w-table-search max-w-full"
              label={<VisuallyHidden>{searchLabel}</VisuallyHidden>}
              placeholder={searchPlaceholder}
              leadingIcon={<SearchIcon />}
              value={search}
              onChange={(event) => changeSearch(event.currentTarget.value)}
            />
          ) : null}
          {toolbar}
          <div className="ml-auto flex flex-wrap items-center gap-s3">
            {showColumns ? (
              <Menu
                header="Show columns"
                trigger={
                  <Button variant="outline" size="sm">
                    <ColumnsIcon />
                    Columns
                  </Button>
                }
              >
                {hideable.map((column) => (
                  <ColumnToggle
                    key={column.id}
                    label={labelOf(column)}
                    checked={!hiddenIds.includes(column.id)}
                    onToggle={() => toggleColumn(column.id)}
                  />
                ))}
              </Menu>
            ) : null}
            {densityToggle ? (
              <DensityToggle density={density} onChange={setDensity} />
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Always mounted, so a change of text is announced: the sort, and loading. */}
      <VisuallyHidden role="status" aria-live="polite">
        {loading ? 'Loading rows' : announcement}
      </VisuallyHidden>

      {selectable && selectedIds.length > 0 ? (
        <div
          role="region"
          aria-label="Bulk actions"
          className="flex flex-wrap items-center gap-s5 rounded-card border border-primary bg-primary-soft px-s6 py-s3"
        >
          <span
            aria-live="polite"
            className="text-control font-semibold tabular-nums slashed-zero text-primary-strong"
          >
            {selectedIds.length} selected
          </span>
          {bulkActions?.(bulk)}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={bulk.clearSelection}
          >
            Clear selection
          </Button>
        </div>
      ) : null}

      <Table
        caption={caption}
        density={density}
        maxHeight={maxHeight}
        aria-busy={loading || undefined}
        aria-rowcount={total + 1}
      >
        <TableHead sticky={stickyHeader}>
          <TableRow>
            {selectable ? (
              <TableHeaderCell
                stickyStart={stickyFirstColumn}
                className={cx(SELECT_COLUMN, stickyFirstColumn && 'left-0')}
              >
                <SelectBox
                  label="Select all rows on this page"
                  checked={allOnPage}
                  indeterminate={selectedOnPage > 0 && !allOnPage}
                  onChange={toggleAllOnPage}
                />
              </TableHeaderCell>
            ) : null}
            {shownColumns.map((column, columnIndex) => {
              const active = sort?.columnId === column.id ? sort : null;
              const pinned = stickyFirstColumn && columnIndex === 0;
              return (
                <TableHeaderCell
                  key={column.id}
                  data-column={column.id}
                  align={column.align}
                  numeric={column.numeric}
                  stickyStart={pinned}
                  style={
                    column.width === undefined
                      ? undefined
                      : { width: column.width }
                  }
                  className={cx(
                    pinned && (selectable ? 'left-table-select' : 'left-0'),
                  )}
                  aria-sort={
                    column.sortable
                      ? active
                        ? active.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                >
                  {column.sortable ? (
                    <SortButton
                      direction={active?.direction ?? null}
                      onClick={() => changeSort(column.id, labelOf(column))}
                    >
                      {column.header}
                    </SortButton>
                  ) : (
                    column.header
                  )}
                  {column.filter ? (
                    <div className="mt-s2 text-control font-normal tracking-normal normal-case">
                      {column.filter}
                    </div>
                  ) : null}
                </TableHeaderCell>
              );
            })}
            {rowActions ? (
              <TableHeaderCell align="right" className="w-s10">
                <VisuallyHidden>Actions</VisuallyHidden>
              </TableHeaderCell>
            ) : null}
          </TableRow>
        </TableHead>
        <TableBody aria-hidden={loading || undefined}>
          {loading
            ? Array.from({ length: loadingRows }, (_, rowIndex) => (
                <tr key={rowIndex} data-skeleton-row="">
                  {Array.from({ length: columnCount }, (_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <SkeletonBar index={rowIndex + cellIndex} />
                    </TableCell>
                  ))}
                </tr>
              ))
            : hasError || pageRows.length === 0
              ? renderState()
              : pageRows.map((row, index) => {
                  const id = getRowId(row);
                  const label = rowLabel(row, index);
                  return (
                    <TableRow
                      key={id}
                      data-row=""
                      selected={selectable && selectedSet.has(id)}
                      aria-rowindex={rowOffset + index + 2}
                      tabIndex={
                        keyboardNavigation
                          ? index === focusableRow
                            ? 0
                            : -1
                          : undefined
                      }
                      onFocus={
                        keyboardNavigation
                          ? () => setActiveRow(index)
                          : undefined
                      }
                      onKeyDown={
                        keyboardNavigation
                          ? (event) => onRowKeyDown(event, index, id)
                          : undefined
                      }
                      className={cx(keyboardNavigation && focusRing)}
                    >
                      {selectable ? (
                        <TableCell
                          stickyStart={stickyFirstColumn}
                          className={cx(
                            SELECT_COLUMN,
                            stickyFirstColumn && 'left-0',
                            // A selected row's accent: the highlight rail down its first cell,
                            // beside the checked box and aria-selected, which say the same.
                            selectedSet.has(id) && 'nova-highlight-rail',
                          )}
                        >
                          <SelectBox
                            label={`Select ${label}`}
                            checked={selectedSet.has(id)}
                            onChange={() => toggleRow(id)}
                          />
                        </TableCell>
                      ) : null}
                      {shownColumns.map((column, columnIndex) => {
                        const pinned = stickyFirstColumn && columnIndex === 0;
                        return (
                          <TableCell
                            key={column.id}
                            data-column={column.id}
                            align={column.align}
                            numeric={column.numeric}
                            mono={column.mono}
                            stickyStart={pinned}
                            className={cx(
                              pinned &&
                                (selectable ? 'left-table-select' : 'left-0'),
                              column.nowrap && 'whitespace-nowrap',
                            )}
                          >
                            {column.cell
                              ? column.cell(row, { rowIndex: index })
                              : defaultCell(column.accessor?.(row))}
                          </TableCell>
                        );
                      })}
                      {rowActions ? (
                        <TableCell align="right">
                          <Menu
                            className={cx(
                              MENU_END,
                              pageRows.length > 4 &&
                                index >= lastRow - 1 &&
                                MENU_UP,
                            )}
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Actions for ${label}`}
                              >
                                <MoreIcon />
                              </Button>
                            }
                          >
                            {rowActions(row)}
                          </Menu>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
        </TableBody>
      </Table>

      {paginate && !hasError && !(loading && total === 0) ? (
        <PaginationBar
          page={page}
          pageSize={pageSize}
          total={total}
          pageSizeOptions={pageSizeOptions}
          onPageChange={(next) => setPagination({ ...pagination, page: next })}
          onPageSizeChange={(size) =>
            setPagination({ page: 1, pageSize: size })
          }
        />
      ) : null}
    </div>
  );
}
