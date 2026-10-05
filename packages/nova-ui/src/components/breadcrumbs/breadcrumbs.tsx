import type { HTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  // The trail from the root down to the page being viewed, which comes last.
  items: BreadcrumbItem[];
}

function Crumb({ item, current }: { item: BreadcrumbItem; current: boolean }) {
  // The page being viewed is not a link, even when it was given an href.
  if (current) {
    return (
      <span aria-current="page" className="font-medium text-ink">
        {item.label}
      </span>
    );
  }
  if (!item.href) return <span>{item.label}</span>;
  return (
    <a
      href={item.href}
      className={cx(
        'rounded-sm text-primary-strong underline-offset-4 hover:underline',
        focusRing,
      )}
    >
      {item.label}
    </a>
  );
}

export function Breadcrumbs({ items, ...rest }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" {...rest}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-3">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li
              key={`${index}-${item.label}`}
              className="flex items-center gap-2"
            >
              <Crumb item={item} current={current} />
              {current ? null : <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
