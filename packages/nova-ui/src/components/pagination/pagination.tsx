import type { HTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { Button } from '../button/button';
import { Select } from '../select/select';

export interface PaginationProps extends HTMLAttributes<HTMLElement> {
  // The page shown, counting from 1. A value outside 1..pageCount is treated as the nearest real page.
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

type PageItem = { kind: 'page'; page: number } | { kind: 'gap'; after: number };

// First and last page, the current page and one either side. A gap of a single page is shown
// rather than elided: "…" would take the same room as the page it hides.
function pageItems(current: number, count: number): PageItem[] {
  const wanted = new Set([1, count, current - 1, current, current + 1]);
  const pages = [...wanted]
    .filter((page) => page >= 1 && page <= count)
    .sort((a, b) => a - b);
  const items: PageItem[] = [];
  let previous = 0;
  for (const page of pages) {
    if (page - previous === 2) {
      items.push({ kind: 'page', page: previous + 1 });
    } else if (page - previous > 2) {
      items.push({ kind: 'gap', after: previous });
    }
    items.push({ kind: 'page', page });
    previous = page;
  }
  return items;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  ...rest
}: PaginationProps) {
  const count = Math.max(1, Math.floor(pageCount));
  const current = Math.min(Math.max(1, Math.floor(page)), count);

  // The bounds and the page already shown are no-ops, so a caller never refetches for them.
  function goTo(target: number) {
    if (target < 1 || target > count || target === current) return;
    onPageChange(target);
  }

  return (
    <nav aria-label="Pagination" {...rest}>
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Button
            variant="outline"
            size="sm"
            disabled={current <= 1}
            onClick={() => goTo(current - 1)}
          >
            Previous
          </Button>
        </li>
        {pageItems(current, count).map((item) =>
          item.kind === 'gap' ? (
            <li
              key={`gap-after-${item.after}`}
              aria-hidden="true"
              className="px-1 text-ink-3"
            >
              …
            </li>
          ) : (
            <li key={item.page}>
              <Button
                variant={item.page === current ? 'primary' : 'ghost'}
                size="sm"
                aria-label={`Page ${item.page}`}
                aria-current={item.page === current ? 'page' : undefined}
                onClick={() => goTo(item.page)}
              >
                {item.page}
              </Button>
            </li>
          ),
        )}
        <li>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= count}
            onClick={() => goTo(current + 1)}
          >
            Next
          </Button>
        </li>
      </ol>
    </nav>
  );
}

// The page sizes a table offers.
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const pageCountOf = (total: number, pageSize: number) =>
  Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

// "Showing 1–25 of 312": the rows on the page out of all of them. A page past the end reads as the
// last page, and a single row has no range to write.
export function formatPaginationRange(
  page: number,
  pageSize: number,
  total: number,
): string {
  if (total <= 0) return 'Showing 0 of 0';
  const size = Math.max(1, Math.floor(pageSize));
  const current = Math.min(
    Math.max(1, Math.floor(page)),
    pageCountOf(total, size),
  );
  const first = (current - 1) * size + 1;
  const last = Math.min(current * size, total);
  return first === last
    ? `Showing ${first} of ${total}`
    : `Showing ${first}–${last} of ${total}`;
}

export interface PaginationBarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  // The page shown, counting from 1.
  page: number;
  pageSize: number;
  // Every row, not only the page's: the bar works out the page count.
  total: number;
  pageSizeOptions?: readonly number[];
  onPageChange: (page: number) => void;
  // Without it the "Rows per page" select is left out.
  onPageSizeChange?: (pageSize: number) => void;
}

// The footer of a data table: the range label, the page size and the page buttons. The range is a
// polite live region, so paging or filtering is announced as the new range.
export function PaginationBar({
  page,
  pageSize,
  total,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
  className,
  ...rest
}: PaginationBarProps) {
  // A size the caller starts with that is not on the list stays selectable.
  const sizes = pageSizeOptions.includes(pageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, pageSize].sort((a, b) => a - b);
  return (
    <div
      className={cx(
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 text-[12.5px] text-ink-2',
        className,
      )}
      {...rest}
    >
      <p aria-live="polite" className="tabular-nums slashed-zero">
        {formatPaginationRange(page, pageSize, total)}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <span aria-hidden="true">Rows per page</span>
            {/* The Select's label sits above its control; here the visible words are beside it, so
                the label is visually hidden and the field's top margin is taken back. */}
            <Select
              className="-mt-1"
              label={<VisuallyHidden>Rows per page</VisuallyHidden>}
              value={String(pageSize)}
              options={sizes.map((size) => ({
                value: String(size),
                label: String(size),
              }))}
              onChange={(event) =>
                onPageSizeChange(Number(event.currentTarget.value))
              }
            />
          </div>
        ) : null}
        <Pagination
          page={page}
          pageCount={pageCountOf(total, pageSize)}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
