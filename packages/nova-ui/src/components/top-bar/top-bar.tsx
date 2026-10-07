import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Surface } from '../../primitives/surface';
import { useSidebarContext } from '../sidebar/sidebar-context';

export interface TopBarProps extends HTMLAttributes<HTMLElement> {
  // Usually a SearchField. It is wrapped in a search landmark, so assistive tech can jump to it.
  search?: ReactNode;
  // Buttons and chips, kept together at the end of the row.
  actions?: ReactNode;
  // Anything else for the row: sits between the search and the actions.
  children?: ReactNode;
  // A menu button, first in the row and only shown below md, where the sidebar becomes a drawer.
  // Inside an AppShell it opens the drawer by itself; give this to open something else, or when the
  // TopBar is used without an AppShell.
  onMenuClick?: () => void;
  menuLabel?: string;
}

// The prototype's .topbar: a frame, not a card, so its corners are straight; 12px by 24px of padding
// (py-s5, px-s8), 16px between its parts (gap-s6), sticky above the page.
const bar = 'sticky top-0 z-50 flex items-center gap-s6 px-s8 py-s5';

// A 36px square (the chrome tile, as the brand mark is) in the chrome's ink; hover lifts it with a faint white, as a nav item does.
const menuButton =
  'inline-flex size-chrome-tile shrink-0 cursor-pointer items-center justify-center rounded-card text-on-primary transition-colors hover:bg-chrome-ink/10 md:hidden';

export function TopBar({
  search,
  actions,
  children,
  onMenuClick,
  menuLabel = 'Open menu',
  className,
  ...rest
}: TopBarProps) {
  const sidebar = useSidebarContext();
  const hasMenu = sidebar.shell || onMenuClick !== undefined;
  return (
    <Surface
      as="header"
      material="chrome"
      radius="none"
      className={cx(bar, className)}
      {...rest}
    >
      {hasMenu ? (
        <button
          type="button"
          aria-label={menuLabel}
          aria-haspopup={sidebar.shell ? 'dialog' : undefined}
          aria-expanded={sidebar.shell ? sidebar.drawerOpen : undefined}
          aria-controls={sidebar.shell ? sidebar.sidebarId : undefined}
          onClick={(event) => {
            if (onMenuClick) onMenuClick();
            else sidebar.openDrawer(event.currentTarget);
          }}
          className={cx(menuButton, focusRing)}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            aria-hidden="true"
            focusable="false"
            className="size-icon-lg"
          >
            <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" />
          </svg>
        </button>
      ) : null}
      {search ? (
        <div role="search" className="min-w-0 max-w-topbar-search flex-1">
          {search}
        </div>
      ) : null}
      {children}
      {actions ? (
        <div className="ml-auto flex shrink-0 items-center gap-s3">
          {actions}
        </div>
      ) : null}
    </Surface>
  );
}
