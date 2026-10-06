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

// The prototype's .nav a: 13.5px at 500, 8px by 10px, 10px between icon and label (its 10px radius
// is off the --r-* scale, so sm). Resting text reads the chrome's secondary ink, which
// material.spec.ts proves is 4.5:1 for every brand; hover lifts the row with a faint white and
// whitens the text. Active is the chrome accent's soft fill with its 1px inner ring, white and
// semibold, so it is marked by weight as well as colour.
const base =
  'flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-[13.5px] font-medium transition-colors';
const resting =
  'text-[color:var(--nova-chrome-ink-2)] hover:bg-chrome-ink/5 hover:text-on-primary focus-visible:bg-chrome-ink/5 focus-visible:text-on-primary';
const current =
  'bg-chrome-accent-soft font-semibold text-on-primary ring-1 ring-inset ring-chrome-accent/35';

function classes(active: boolean, className: string | undefined): string {
  return cx(base, focusRing, active ? current : resting, className);
}

function Content({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <>
      {icon ? (
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center"
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
