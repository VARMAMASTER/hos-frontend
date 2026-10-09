import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactElement,
  ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Tooltip } from '../tooltip/tooltip';
import { useSidebarContext } from './sidebar-context';

interface NavItemOwnProps {
  icon?: ReactNode;
  active?: boolean;
  // A count or short word shown after the label. In the icon rail it moves onto the icon.
  badge?: ReactNode;
}

export type NavItemAnchorProps = NavItemOwnProps & {
  as?: 'a';
} & AnchorHTMLAttributes<HTMLAnchorElement>;

export type NavItemButtonProps = NavItemOwnProps & {
  as: 'button';
} & ButtonHTMLAttributes<HTMLButtonElement>;

export type NavItemProps = NavItemAnchorProps | NavItemButtonProps;

// The prototype's .nav a: 13.5px at 500 (text-input), 8px by 10px, 10px between icon and label (the
// nav row tokens: px-nav-item, py-nav-item, gap-nav-item; its 10px radius is off the --r-* scale,
// so the control corner). Resting text reads the chrome's secondary ink, which
// material.spec.ts proves is 4.5:1 for every brand; hover lifts the row with a faint white and
// whitens the text. Active is the chrome accent's soft fill with its 1px inner ring, white and
// semibold, so it is marked by weight as well as colour.
//
// The item is the same box expanded and in the icon rail: the icon never moves (the rail is exactly
// the icon, its padding and the sidebar's padding wide), the label fades out and is clipped by the
// item's overflow, and it never wraps, so nothing jumps while the width animates.
const base =
  'relative flex w-full items-center gap-nav-item overflow-hidden rounded-control px-nav-item py-nav-item text-left text-input font-medium transition-colors';
const resting =
  'text-[color:var(--nova-chrome-ink-2)] hover:bg-chrome-ink/5 hover:text-on-primary focus-visible:bg-chrome-ink/5 focus-visible:text-on-primary';
const current =
  'bg-chrome-accent-soft font-semibold text-on-primary ring-hairline ring-inset ring-chrome-accent/35';

function classes(active: boolean, className: string | undefined): string {
  return cx(base, focusRing, active ? current : resting, className);
}

// The label's tooltip sits beside the rail. Tooltip only knows top and bottom, so the rail moves
// its popup to the right of the item from outside; expanded, there is nothing to say twice, so the
// popup is hidden.
const tooltipBeside =
  'w-full [&>[role=tooltip]]:top-1/2 [&>[role=tooltip]]:bottom-auto [&>[role=tooltip]]:left-full [&>[role=tooltip]]:translate-x-0 [&>[role=tooltip]]:-translate-y-1/2 [&>[role=tooltip]]:pb-0 [&>[role=tooltip]]:pl-s3';
const tooltipHidden = 'w-full [&>[role=tooltip]]:hidden';

const badgeShape =
  'inline-flex h-s6 min-w-s6 shrink-0 items-center justify-center rounded-full bg-chrome-accent px-s1 text-badge font-bold leading-none text-chrome-ring';

function firstLetter(label: ReactNode): string {
  return typeof label === 'string' ? label.trim().charAt(0).toUpperCase() : '';
}

function Content({
  icon,
  badge,
  active,
  children,
}: {
  icon: ReactNode;
  badge: ReactNode;
  active: boolean;
  children: ReactNode;
}) {
  const { collapsed } = useSidebarContext();
  const hasBadge = badge !== undefined && badge !== null && badge !== false;
  const glyph =
    icon ??
    (collapsed ? (
      <span data-nova-monogram="" className="text-meta font-bold">
        {firstLetter(children)}
      </span>
    ) : null);
  return (
    <>
      {collapsed && active ? (
        <span
          aria-hidden="true"
          data-nova-active-mark=""
          className="absolute inset-y-s3 left-0 w-nav-mark rounded-full bg-chrome-accent"
        />
      ) : null}
      {glyph ? (
        <span
          aria-hidden="true"
          className="flex size-tile shrink-0 items-center justify-center"
        >
          {glyph}
        </span>
      ) : null}
      <span
        className={cx(
          'min-w-0 flex-1 whitespace-nowrap overflow-hidden text-ellipsis motion-safe:transition-opacity motion-safe:duration-base motion-safe:ease-standard',
          collapsed && 'opacity-0',
        )}
      >
        {children}
      </span>
      {hasBadge ? (
        <span
          data-nova-badge={collapsed ? 'overlay' : 'inline'}
          className={cx(
            badgeShape,
            collapsed && 'absolute top-s0 left-s8 ring-emphasis ring-chrome-1',
          )}
        >
          {badge}
        </span>
      ) : null}
    </>
  );
}

export function NavItem(props: NavItemProps) {
  const { collapsed, drawer, closeDrawer } = useSidebarContext();
  // Choosing a destination in the drawer puts the drawer away.
  // A router that handles the click itself still means the destination was chosen.
  const afterClick = () => {
    if (drawer) closeDrawer();
  };
  const tip = (
    label: ReactNode,
    trigger: ReactElement<{ 'aria-describedby'?: string }>,
  ) => (
    <Tooltip
      content={collapsed ? label : null}
      className={collapsed ? tooltipBeside : tooltipHidden}
    >
      {trigger}
    </Tooltip>
  );

  if (props.as === 'button') {
    const {
      as: _as,
      icon,
      active = false,
      badge,
      className,
      children,
      type = 'button',
      onClick,
      ...rest
    } = props;
    // aria-selected is not allowed on role=button, so the active state is aria-current, which any
    // element may carry and assistive tech announces.
    return tip(
      children,
      <button
        type={type}
        aria-current={active ? 'true' : undefined}
        {...rest}
        onClick={(event) => {
          onClick?.(event);
          afterClick();
        }}
        className={classes(active, className)}
      >
        <Content icon={icon} badge={badge} active={active}>
          {children}
        </Content>
      </button>,
    );
  }
  const {
    as: _as,
    icon,
    active = false,
    badge,
    className,
    children,
    onClick,
    ...rest
  } = props;
  return tip(
    children,
    <a
      aria-current={active ? 'page' : undefined}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        afterClick();
      }}
      className={classes(active, className)}
    >
      <Content icon={icon} badge={badge} active={active}>
        {children}
      </Content>
    </a>,
  );
}
