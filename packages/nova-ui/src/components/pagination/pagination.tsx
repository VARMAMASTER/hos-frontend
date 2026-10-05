import type { HTMLAttributes } from 'react';
import { Button } from '../button/button';

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
            variant="secondary"
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
            variant="secondary"
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
