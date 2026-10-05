import type { HTMLAttributes, ReactNode } from 'react';

export interface AppShellProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  sidebar: ReactNode;
  children: ReactNode;
}

// The sidebar column is `--nova-sidebar-w` wide and falls back to 248px when nothing sets it. The
// token is not declared in theme.css / NOVA_DEFAULTS: semantic.spec.ts compares those two exactly,
// so it can only be added to both together. Once it is, this fallback can be dropped.
const grid =
  'grid min-h-screen grid-cols-1 md:grid-cols-[var(--nova-sidebar-w,248px)_1fr]';

export function AppShell({
  sidebar,
  children,
  className,
  ...rest
}: AppShellProps) {
  return (
    <div className={[grid, className].filter(Boolean).join(' ')} {...rest}>
      {sidebar}
      <main className="nova-canvas min-w-0">{children}</main>
    </div>
  );
}
