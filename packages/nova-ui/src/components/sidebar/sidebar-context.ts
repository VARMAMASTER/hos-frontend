import { createContext, useContext, type RefObject } from 'react';

// What the sidebar's parts (NavItem, NavSection, the top bar's menu button) need to know about it.
// Whoever owns the state provides it: AppShell when there is one, the Sidebar itself when it stands
// alone. Outside both, the default below is an ordinary expanded sidebar.
export interface SidebarContextValue {
  // True when an AppShell owns the state (so the TopBar knows it may show a menu button).
  shell: boolean;
  // True only while the sidebar is drawn as the icon rail. A drawer is never a rail.
  collapsed: boolean;
  // True below the breakpoint, where the sidebar is a drawer over the content.
  drawer: boolean;
  drawerOpen: boolean;
  // The sidebar element's id: what the toggle and the menu button control.
  sidebarId: string | undefined;
  // The accessible name of the open drawer.
  drawerLabel: string;
  // Collapses or expands the rail; closes the drawer.
  toggle: () => void;
  closeDrawer: () => void;
  // Opens the drawer; `opener` is where focus returns to when it closes.
  openDrawer: (opener?: HTMLElement | null) => void;
  // The sidebar element, for the shell's focus management.
  panelRef: RefObject<HTMLElement | null> | null;
}

const noop = () => undefined;

export const DEFAULT_SIDEBAR_CONTEXT: SidebarContextValue = {
  shell: false,
  collapsed: false,
  drawer: false,
  drawerOpen: false,
  sidebarId: undefined,
  drawerLabel: 'Navigation menu',
  toggle: noop,
  closeDrawer: noop,
  openDrawer: noop,
  panelRef: null,
};

export const SidebarContext = createContext<SidebarContextValue>(
  DEFAULT_SIDEBAR_CONTEXT,
);

export function useSidebarContext(): SidebarContextValue {
  return useContext(SidebarContext);
}
