import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { Surface } from '../../primitives/surface';

export interface SidebarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  brand?: ReactNode;
  footer?: ReactNode;
  // Names the <nav> landmark. Give each navigation on a page its own name.
  navLabel?: string;
  // The nav items.
  children: ReactNode;
}

// The prototype's .sidebar: a frame, not a card, so its corners are straight; 20px by 12px of
// padding and 4px between its parts. Stacked above the page below md, it is only pinned to the
// viewport (and scrolls on its own) once it sits beside the content.
const frame =
  'rounded-none flex flex-col gap-1 px-3 py-5 md:sticky md:top-0 md:h-screen md:overflow-y-auto';

export function Sidebar({
  brand,
  footer,
  navLabel = 'Primary',
  children,
  className,
  ...rest
}: SidebarProps) {
  return (
    <Surface material="sidebar" className={cx(frame, className)} {...rest}>
      {/* .brand: 4px 8px 16px around the lockup. */}
      {brand ? <div className="px-2 pt-1 pb-4">{brand}</div> : null}
      <nav aria-label={navLabel} className="flex flex-col">
        {children}
      </nav>
      {footer ? (
        // .sidebar-foot: pinned to the bottom, 12px 10px 4px, under the chrome line.
        <div className="mt-auto border-t border-chrome-line px-2.5 pt-3 pb-1">
          {footer}
        </div>
      ) : null}
    </Surface>
  );
}
