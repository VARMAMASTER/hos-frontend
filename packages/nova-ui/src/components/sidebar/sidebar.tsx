import type { HTMLAttributes, ReactNode } from 'react';

export interface SidebarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  brand?: ReactNode;
  footer?: ReactNode;
  // Names the <nav> landmark. Give each navigation on a page its own name.
  navLabel?: string;
  // The nav items.
  children: ReactNode;
}

// Stacked above the page below md, so it is only pinned to the viewport (and scrolls on its own)
// once it sits beside the content.
const frame =
  'nova-chrome flex flex-col gap-6 p-4 md:sticky md:top-0 md:h-screen md:overflow-y-auto';

export function Sidebar({
  brand,
  footer,
  navLabel = 'Primary',
  children,
  className,
  ...rest
}: SidebarProps) {
  return (
    <div className={[frame, className].filter(Boolean).join(' ')} {...rest}>
      {brand ? <div className="px-2 pt-1">{brand}</div> : null}
      <nav aria-label={navLabel} className="flex flex-col gap-1">
        {children}
      </nav>
      {footer ? (
        <div className="mt-auto border-t border-on-primary/12 pt-4">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
