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

// A frame, not a card, so its corners are straight. Stacked above the page below md, it is only
// pinned to the viewport (and scrolls on its own) once it sits beside the content.
const frame =
  'rounded-none flex flex-col gap-6 p-4 md:sticky md:top-0 md:h-screen md:overflow-y-auto';

export function Sidebar({
  brand,
  footer,
  navLabel = 'Primary',
  children,
  className,
  ...rest
}: SidebarProps) {
  return (
    <Surface material="chrome" className={cx(frame, className)} {...rest}>
      {brand ? <div className="px-2 pt-1">{brand}</div> : null}
      <nav aria-label={navLabel} className="flex flex-col gap-1">
        {children}
      </nav>
      {footer ? (
        <div className="mt-auto border-t border-on-primary/12 pt-4">
          {footer}
        </div>
      ) : null}
    </Surface>
  );
}
