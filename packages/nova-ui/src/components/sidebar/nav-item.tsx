import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';

interface NavItemOwnProps {
  icon?: ReactNode;
  active?: boolean;
}

export type NavItemAnchorProps = NavItemOwnProps & {
  as?: 'a';
} & AnchorHTMLAttributes<HTMLAnchorElement>;

export type NavItemButtonProps = NavItemOwnProps & {
  as: 'button';
} & ButtonHTMLAttributes<HTMLButtonElement>;

export type NavItemProps = NavItemAnchorProps | NavItemButtonProps;

// White on the chrome is `on-primary` (the stock `white` is removed from the theme). Resting text
// reads the chrome's secondary ink, which material.spec.ts proves is 4.5:1 for every brand.
const base =
  'flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors';
const resting =
  'text-[color:var(--nova-chrome-ink-2)] hover:bg-on-primary/10 hover:text-on-primary focus-visible:bg-on-primary/10 focus-visible:text-on-primary';
const current = 'bg-primary/40 text-on-primary';

function classes(active: boolean, className: string | undefined): string {
  return cx(base, focusRing, active ? current : resting, className);
}

function Content({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <>
      {icon ? (
        <span
          aria-hidden="true"
          className="flex size-5 shrink-0 items-center justify-center"
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">{children}</span>
    </>
  );
}

export function NavItem(props: NavItemProps) {
  if (props.as === 'button') {
    const {
      as: _as,
      icon,
      active = false,
      className,
      children,
      type = 'button',
      ...rest
    } = props;
    // aria-selected is not allowed on role=button, so the active state is aria-current, which any
    // element may carry and assistive tech announces.
    return (
      <button
        type={type}
        aria-current={active ? 'true' : undefined}
        {...rest}
        className={classes(active, className)}
      >
        <Content icon={icon}>{children}</Content>
      </button>
    );
  }
  const { as: _as, icon, active = false, className, children, ...rest } = props;
  return (
    <a
      aria-current={active ? 'page' : undefined}
      {...rest}
      className={classes(active, className)}
    >
      <Content icon={icon}>{children}</Content>
    </a>
  );
}
