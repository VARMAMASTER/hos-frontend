import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';

export interface AppShellProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  sidebar: ReactNode;
  children: ReactNode;
}

// The sidebar column's width is the --nova-sidebar-w token (248px by default), so a hospital or a
// page can set it like any other token.
const grid =
  'grid min-h-screen grid-cols-1 md:grid-cols-[var(--nova-sidebar-w)_1fr]';

export function AppShell({
  sidebar,
  children,
  className,
  ...rest
}: AppShellProps) {
  return (
    <div className={cx(grid, className)} {...rest}>
      {sidebar}
      <main className="nova-canvas min-w-0">{children}</main>
    </div>
  );
}
