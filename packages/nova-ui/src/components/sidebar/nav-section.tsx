import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { useSidebarContext } from './sidebar-context';

export interface NavSectionProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  // The section heading. In the icon rail it becomes a thin divider, and stays the group's name.
  label: string;
  children: ReactNode;
}

// The prototype's .nav-label: 10.5px at 600 (text-overline), uppercase, 0.08em tracking
// (tracking-eyebrow), 12px / 10px / 6px around it (pt-s5, the nav row's inset, pb-s2), in the chrome's secondary ink (which the proofs cover; the prototype's .42 alpha does not).
const heading =
  'px-nav-item pt-s5 pb-s2 text-overline font-semibold tracking-eyebrow uppercase text-[color:var(--nova-chrome-ink-2)]';

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
          className="mx-s3 my-s3 h-px bg-chrome-line motion-safe:animate-fade-in"
        />
      ) : null}
      <p id={headingId} className={collapsed ? 'sr-only' : heading}>
        {label}
      </p>
      {children}
    </div>
  );
}
