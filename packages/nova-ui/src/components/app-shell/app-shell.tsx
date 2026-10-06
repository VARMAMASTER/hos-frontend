import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { useControllableState } from '../../primitives/use-controllable-state';
import { getTabbables, trapTab } from '../dialog/focus';
import {
  SidebarContext,
  type SidebarContextValue,
} from '../sidebar/sidebar-context';
import { useMediaQuery } from '../sidebar/use-media-query';
import {
  useSidebarShortcut,
  useSidebarState,
} from '../sidebar/use-sidebar-state';

export interface AppShellProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  sidebar: ReactNode;
  children: ReactNode;
  // The icon rail: controlled with `collapsed`, uncontrolled from `defaultCollapsed`. The shell owns
  // it, and the content column reflows with the rail.
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  // A localStorage key the collapsed state is saved to and restored from.
  persistKey?: string;
  // Ctrl/Cmd+B toggles the rail (opens or closes the drawer below md). Never fires while typing.
  shortcut?: boolean;
  // Below md the sidebar is a drawer over the content. Controlled with `drawerOpen`.
  drawerOpen?: boolean;
  defaultDrawerOpen?: boolean;
  onDrawerOpenChange?: (open: boolean) => void;
  // The accessible name of the open drawer.
  drawerLabel?: string;
}

// The sidebar column's width is --nova-shell-w: the --nova-sidebar-w token (248px by default) when
// expanded and the --nova-sidebar-rail-w token (68px: the icon, its padding and the sidebar's) as
// the rail, so a hospital or a page can set either like any other token. The column animates under
// motion-safe, and the Sidebar fills it, so the two never disagree mid-transition.
const grid =
  'grid min-h-screen grid-cols-1 md:grid-cols-[var(--nova-shell-w)_1fr] motion-safe:transition-[grid-template-columns] motion-safe:duration-base motion-safe:ease-standard';
const expandedWidth = '[--nova-shell-w:var(--nova-sidebar-w)]';
const railWidth = '[--nova-shell-w:var(--nova-sidebar-rail-w,4.25rem)]';

// Tailwind's md: the width at which the sidebar stops being a drawer.
const DESKTOP = '(min-width: 48rem)';

function isFocusable(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element !== document.body;
}

export function AppShell({
  sidebar,
  children,
  className,
  collapsed: collapsedProp,
  defaultCollapsed,
  onCollapsedChange,
  persistKey,
  shortcut = true,
  drawerOpen,
  defaultDrawerOpen = false,
  onDrawerOpenChange,
  drawerLabel = 'Navigation menu',
  ...rest
}: AppShellProps) {
  const sidebarId = useId();
  const drawer = !useMediaQuery(DESKTOP, true);
  const rail = useSidebarState({
    collapsed: collapsedProp,
    defaultCollapsed,
    onCollapsedChange,
    persistKey,
  });
  const [open, setOpen] = useControllableState({
    value: drawerOpen,
    defaultValue: defaultDrawerOpen,
    onChange: onDrawerOpenChange,
  });
  const visible = drawer && open;

  const panelRef = useRef<HTMLElement | null>(null);
  // Where focus goes back to when the drawer closes.
  const openerRef = useRef<HTMLElement | null>(null);

  const closeDrawer = useCallback(() => setOpen(false), [setOpen]);
  const openDrawer = useCallback(
    (opener?: HTMLElement | null) => {
      openerRef.current =
        opener ??
        (isFocusable(document.activeElement) ? document.activeElement : null);
      setOpen(true);
    },
    [setOpen],
  );

  // Growing to desktop width puts the drawer away, so it does not reappear on the next shrink.
  useEffect(() => {
    if (!drawer && open) setOpen(false);
  }, [drawer, open, setOpen]);

  useSidebarShortcut(shortcut, () => {
    if (!drawer) rail.toggle();
    else if (open) closeDrawer();
    else openDrawer();
  });

  // The drawer is modal: focus moves in when it opens, Tab stays in, Escape closes, and focus goes
  // back to the opener when it closes.
  useEffect(() => {
    if (!visible) return undefined;
    const panel = panelRef.current;
    if (!panel) return undefined;
    if (openerRef.current === null && isFocusable(document.activeElement)) {
      openerRef.current = document.activeElement;
    }
    const target =
      panel.querySelector<HTMLElement>('[aria-current]') ??
      getTabbables(panel)[0] ??
      panel;
    target.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Something inside (a menu) may have used this Escape already.
        if (event.defaultPrevented || event.isComposing) return;
        event.preventDefault();
        closeDrawer();
      } else if (event.key === 'Tab') {
        trapTab(event, panel);
      }
    };
    // The capture phase: the drawer's nav items sit in Tooltips (hidden while expanded), and a
    // Tooltip takes the first Escape it sees in the capture phase. Registered first, this one
    // answers before it does.
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      const opener = openerRef.current;
      openerRef.current = null;
      // Focus the drawer had, or lost with it, goes back; one the app placed elsewhere stays.
      const current = document.activeElement;
      const lost =
        current === null ||
        current === document.body ||
        panel.contains(current);
      if (lost && opener?.isConnected) opener.focus();
    };
  }, [visible, closeDrawer]);

  const state: SidebarContextValue = {
    shell: true,
    collapsed: !drawer && rail.collapsed,
    drawer,
    drawerOpen: visible,
    sidebarId,
    drawerLabel,
    toggle: drawer ? closeDrawer : rail.toggle,
    closeDrawer,
    openDrawer,
    panelRef,
  };

  return (
    <SidebarContext.Provider value={state}>
      <div
        data-collapsed={state.collapsed ? 'true' : undefined}
        className={cx(
          grid,
          state.collapsed ? railWidth : expandedWidth,
          className,
        )}
        {...rest}
      >
        {sidebar}
        {visible ? (
          // Cancelling mousedown keeps a press on the scrim from moving focus to <body>.
          <div
            aria-hidden="true"
            data-nova-scrim=""
            onMouseDown={(event) => event.preventDefault()}
            onClick={closeDrawer}
            className="fixed inset-0 z-60 bg-ink/40 motion-safe:animate-fade-in"
          />
        ) : null}
        <main className="nova-canvas min-w-0" inert={visible}>
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
