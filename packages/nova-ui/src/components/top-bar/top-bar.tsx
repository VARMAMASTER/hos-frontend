import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { Surface } from '../../primitives/surface';

export interface TopBarProps extends HTMLAttributes<HTMLElement> {
  // Usually a SearchField. It is wrapped in a search landmark, so assistive tech can jump to it.
  search?: ReactNode;
  // Buttons and chips, kept together at the end of the row.
  actions?: ReactNode;
  // Anything else for the row: sits between the search and the actions.
  children?: ReactNode;
}

// The prototype's .topbar: a frame, not a card, so its corners are straight; 12px by 24px of padding,
// 16px between its parts, sticky above the page.
const bar = 'rounded-none sticky top-0 z-50 flex items-center gap-4 px-6 py-3';

export function TopBar({
  search,
  actions,
  children,
  className,
  ...rest
}: TopBarProps) {
  return (
    <Surface
      as="header"
      material="chrome"
      className={cx(bar, className)}
      {...rest}
    >
      {search ? (
        <div role="search" className="min-w-0 max-w-[440px] flex-1">
          {search}
        </div>
      ) : null}
      {children}
      {actions ? (
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {actions}
        </div>
      ) : null}
    </Surface>
  );
}
