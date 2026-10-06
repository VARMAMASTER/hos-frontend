import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { useSidebarContext } from './sidebar-context';

export interface NavSectionProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  // The section heading. In the icon rail it becomes a thin divider, and stays the group's name.
  label: string;
  children: ReactNode;
}

// The prototype's .nav-label: 10.5px at 600, uppercase, 0.08em tracking, 12px / 10px / 6px around
// it, in the chrome's secondary ink (which the proofs cover; the prototype's .42 alpha does not).
const heading =
  'px-2.5 pt-3 pb-1.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase text-[color:var(--nova-chrome-ink-2)]';

export function NavSection({
  label,
  children,
  className,
  ...rest
}: NavSectionProps) {
  const { collapsed } = useSidebarContext();
  const headingId = useId();
  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className={cx('flex flex-col', className)}
      {...rest}
    >
      {collapsed ? (
        <div
          aria-hidden="true"
          data-nova-nav-divider=""
          className="mx-2 my-2 h-px bg-chrome-line motion-safe:animate-fade-in"
        />
      ) : null}
      <p id={headingId} className={collapsed ? 'sr-only' : heading}>
        {label}
      </p>
      {children}
    </div>
  );
}
