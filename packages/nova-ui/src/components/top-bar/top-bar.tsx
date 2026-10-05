import type { HTMLAttributes, ReactNode } from 'react';

export interface TopBarProps extends HTMLAttributes<HTMLElement> {
  // Usually a SearchField. It is wrapped in a search landmark, so assistive tech can jump to it.
  search?: ReactNode;
  // Buttons and chips, kept together at the end of the row.
  actions?: ReactNode;
  // Anything else for the row: sits between the search and the actions.
  children?: ReactNode;
}

const bar = 'nova-chrome sticky top-0 z-20 flex items-center gap-4 px-6 py-3';

export function TopBar({
  search,
  actions,
  children,
  className,
  ...rest
}: TopBarProps) {
  return (
    <header className={[bar, className].filter(Boolean).join(' ')} {...rest}>
      {search ? (
        <div role="search" className="min-w-0 max-w-lg flex-1">
          {search}
        </div>
      ) : null}
      {children}
      {actions ? (
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
