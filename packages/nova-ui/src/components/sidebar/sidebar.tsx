import {
  useContext,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Surface } from '../../primitives/surface';
import {
  DEFAULT_SIDEBAR_CONTEXT,
  SidebarContext,
  type SidebarContextValue,
} from './sidebar-context';
import { useSidebarShortcut, useSidebarState } from './use-sidebar-state';

export interface SidebarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  brand?: ReactNode;
  // The brand in the icon rail: the hospital's logo mark. Without it the rail shows no brand.
  collapsedBrand?: ReactNode;
  footer?: ReactNode;
  // The footer in the icon rail: the user's avatar. Without it the rail shows no footer.
  collapsedFooter?: ReactNode;
  // Names the <nav> landmark. Give each navigation on a page its own name.
  navLabel?: string;
  // The nav items.
  children: ReactNode;
  // The icon rail. Controlled with `collapsed`; uncontrolled from `defaultCollapsed`. Inside an
  // AppShell the shell owns this state: set these on the AppShell instead.
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  // A localStorage key the collapsed state is saved to and restored from (a Sidebar on its own).
  persistKey?: string;
  // Ctrl/Cmd+B toggles the rail (a Sidebar on its own). Never fires while typing in a field.
  shortcut?: boolean;
}

// The prototype's .sidebar: a frame, not a card, so its corners are straight; 20px by 12px of
// padding and 4px between its parts.
const frame = 'rounded-none flex flex-col gap-1 px-3 py-5';

// Beside the content, it is pinned to the viewport and scrolls on its own. As the rail it does not
// scroll: a scroll container would clip the labels that pop out beside the icons. The sidebar sits
// above the page (still below the top bar) for the same reason.
const pinned = 'md:sticky md:top-0 md:z-40 md:h-screen';
const scrolls = 'md:overflow-y-auto md:overflow-x-hidden';
const railFrame = 'md:overflow-visible';

// Its own width when nothing else sizes it: the --nova-sidebar-w token, or the rail token. In an
// AppShell the grid column sizes it, and animates.
const standaloneExpanded = 'w-full md:w-[var(--nova-sidebar-w)]';
const standaloneRail = 'w-[var(--nova-sidebar-rail-w,4.25rem)]';
const widthMotion =
  'motion-safe:transition-[width] duration-base ease-standard';

// The drawer: over the content, off to the left until it is opened.
const drawerFrame =
  'fixed inset-y-0 left-0 z-70 h-dvh w-[min(var(--nova-sidebar-w),85vw)] overflow-y-auto overflow-x-hidden shadow-lg outline-none motion-safe:transition-[transform,visibility] duration-base ease-standard';

const toggleButton =
  'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-[color:var(--nova-chrome-ink-2)] transition-colors hover:bg-chrome-ink/5 hover:text-on-primary focus-visible:bg-chrome-ink/5 focus-visible:text-on-primary';

function ToggleIcon({
  collapsed,
  drawer,
}: {
  collapsed: boolean;
  drawer: boolean;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cx(
        'size-4 motion-safe:transition-transform duration-base ease-standard',
        collapsed && 'rotate-180',
      )}
    >
      {drawer ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M12 5l-5 5 5 5" />}
    </svg>
  );
}

interface ViewProps
  extends Omit<
    SidebarProps,
    | 'collapsed'
    | 'defaultCollapsed'
    | 'onCollapsedChange'
    | 'persistKey'
    | 'shortcut'
  > {
  state: SidebarContextValue;
}

function SidebarView({
  brand,
  collapsedBrand,
  footer,
  collapsedFooter,
  navLabel = 'Primary',
  children,
  className,
  id,
  state,
  ...rest
}: ViewProps) {
  const { collapsed, drawer, drawerOpen, shell } = state;
  const sidebarId = id ?? state.sidebarId;
  const toggleLabel = drawer
    ? 'Close sidebar'
    : collapsed
      ? 'Expand sidebar'
      : 'Collapse sidebar';
  const brandBlock = collapsed ? collapsedBrand : brand;
  const footerBlock = collapsed ? collapsedFooter : footer;
  // A hidden drawer cannot be tabbed into or read; an open one is a modal dialog.
  const drawerProps = drawer
    ? drawerOpen
      ? {
          role: 'dialog',
          'aria-modal': true as const,
          'aria-label': state.drawerLabel,
          tabIndex: -1,
        }
      : { inert: true, tabIndex: -1 }
    : {};
  const layout = drawer
    ? cx(
        frame,
        drawerFrame,
        drawerOpen ? 'translate-x-0' : 'invisible -translate-x-full',
      )
    : cx(
        frame,
        pinned,
        collapsed ? railFrame : scrolls,
        shell
          ? 'w-full'
          : cx(collapsed ? standaloneRail : standaloneExpanded, widthMotion),
      );
  return (
    <Surface
      ref={state.panelRef}
      material="sidebar"
      id={sidebarId}
      data-collapsed={collapsed ? 'true' : undefined}
      className={cx(layout, className)}
      {...drawerProps}
      {...rest}
    >
      {/* The header: the brand (the logo mark in the rail) and the toggle. .brand is 4px 8px 16px. */}
      <div
        className={cx(
          'flex gap-2 pt-1 pb-4',
          collapsed
            ? 'flex-col items-center'
            : 'items-start justify-between px-2',
        )}
      >
        {brandBlock ? (
          <div
            key={collapsed ? 'mark' : 'brand'}
            className={cx(
              'min-w-0 motion-safe:animate-fade-in',
              !collapsed && 'flex-1',
            )}
          >
            {brandBlock}
          </div>
        ) : null}
        <button
          type="button"
          aria-label={toggleLabel}
          aria-expanded={drawer ? drawerOpen : !collapsed}
          aria-controls={sidebarId}
          onClick={state.toggle}
          className={cx(toggleButton, focusRing)}
        >
          <ToggleIcon collapsed={collapsed} drawer={drawer} />
        </button>
      </div>
      <nav aria-label={navLabel} className="flex flex-col">
        {children}
      </nav>
      {footerBlock ? (
        // .sidebar-foot: pinned to the bottom, 12px 10px 4px, under the chrome line.
        <div
          key={collapsed ? 'avatar' : 'user'}
          className={cx(
            'mt-auto border-t border-chrome-line pt-3 pb-1 motion-safe:animate-fade-in',
            collapsed ? 'flex justify-center' : 'px-2.5',
          )}
        >
          {footerBlock}
        </div>
      ) : null}
    </Surface>
  );
}

// A sidebar on its own owns its collapsed state, its shortcut and its storage.
function StandaloneSidebar({
  collapsed: collapsedProp,
  defaultCollapsed,
  onCollapsedChange,
  persistKey,
  shortcut = true,
  ...rest
}: SidebarProps) {
  const sidebarId = useId();
  const panelRef = useRef<HTMLElement | null>(null);
  const { collapsed, toggle } = useSidebarState({
    collapsed: collapsedProp,
    defaultCollapsed,
    onCollapsedChange,
    persistKey,
  });
  useSidebarShortcut(shortcut, toggle);
  const state: SidebarContextValue = {
    ...DEFAULT_SIDEBAR_CONTEXT,
    collapsed,
    sidebarId,
    toggle,
    panelRef,
  };
  return (
    <SidebarContext.Provider value={state}>
      <SidebarView state={state} {...rest} />
    </SidebarContext.Provider>
  );
}

export function Sidebar(props: SidebarProps) {
  const shell = useContext(SidebarContext);
  // Inside an AppShell, the shell owns the state and the Sidebar only draws it.
  if (shell.shell) {
    const {
      collapsed: _collapsed,
      defaultCollapsed: _default,
      onCollapsedChange: _onChange,
      persistKey: _persist,
      shortcut: _shortcut,
      ...rest
    } = props;
    return <SidebarView state={shell} {...rest} />;
  }
  return <StandaloneSidebar {...props} />;
}
