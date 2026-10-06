import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { NavItem } from '../sidebar/nav-item';
import { Sidebar } from '../sidebar/sidebar';
import { TopBar } from '../top-bar/top-bar';
import { AppShell } from './app-shell';

// jsdom has no matchMedia. This one answers the shell's one query ("min-width: 48rem", desktop)
// from `viewport.desktop`, and lets a test resize.
const viewport = { desktop: true };
const listeners = new Set<() => void>();
function setDesktop(desktop: boolean) {
  viewport.desktop = desktop;
  act(() => {
    for (const listener of listeners) listener();
  });
}

beforeEach(() => {
  viewport.desktop = true;
  listeners.clear();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return viewport.desktop;
    },
    media: query,
    addEventListener: (_type: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      listeners.delete(listener),
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
  Reflect.deleteProperty(window, 'matchMedia');
});

function Shell(
  props: Omit<React.ComponentProps<typeof AppShell>, 'sidebar' | 'children'> & {
    footer?: boolean;
  },
) {
  return (
    <AppShell
      {...props}
      sidebar={
        <Sidebar
          brand={<p>Acme Hospital</p>}
          collapsedBrand={<p>AH</p>}
          footer={props.footer ? <p>Dr. Rao</p> : undefined}
        >
          <NavItem href="/home" icon={<svg />} active>
            Home
          </NavItem>
          <NavItem href="/claims" icon={<svg />}>
            Claims
          </NavItem>
        </Sidebar>
      }
    >
      <TopBar search={<input aria-label="Find" />} />
      <p>Page content</p>
      <button type="button">Outside action</button>
    </AppShell>
  );
}

const toggle = () =>
  screen.getByRole('button', { name: /(collapse|expand) sidebar/i });
const root = (container: HTMLElement) =>
  container.firstElementChild as HTMLElement;

describe('AppShell with the icon rail', () => {
  it('owns the collapsed state: the Sidebar toggle reflows the content column', () => {
    const { container } = render(<Shell />);
    expect(
      root(container).classList.contains(
        '[--nova-shell-w:var(--nova-sidebar-w)]',
      ),
    ).toBe(true);
    fireEvent.click(toggle());
    const shell = root(container);
    expect(shell.dataset['collapsed']).toBe('true');
    expect(
      shell.classList.contains(
        '[--nova-shell-w:var(--nova-sidebar-rail-w,4.25rem)]',
      ),
    ).toBe(true);
    expect(
      shell.classList.contains('[--nova-shell-w:var(--nova-sidebar-w)]'),
    ).toBe(false);
    expect(screen.getByText('AH')).toBeTruthy();
    expect(toggle().getAttribute('aria-label')).toBe('Expand sidebar');
  });

  it('animates the column with the motion tokens, only under motion-safe', () => {
    const { container } = render(<Shell />);
    for (const name of [
      'motion-safe:transition-[grid-template-columns]',
      'duration-base',
      'ease-standard',
    ]) {
      expect(root(container).classList.contains(name), name).toBe(true);
    }
  });

  it('is controlled with collapsed / onCollapsedChange', () => {
    const onCollapsedChange = vi.fn();
    const { rerender, container } = render(
      <Shell collapsed={false} onCollapsedChange={onCollapsedChange} />,
    );
    fireEvent.click(toggle());
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(root(container).dataset['collapsed']).toBeUndefined();
    rerender(<Shell collapsed onCollapsedChange={onCollapsedChange} />);
    expect(root(container).dataset['collapsed']).toBe('true');
  });

  it('starts collapsed with defaultCollapsed', () => {
    const { container } = render(<Shell defaultCollapsed />);
    expect(root(container).dataset['collapsed']).toBe('true');
  });

  it('ignores the Sidebar own collapse props, which the shell replaces', () => {
    const { container } = render(
      <AppShell
        sidebar={
          <Sidebar collapsed>
            <NavItem href="/home">Home</NavItem>
          </Sidebar>
        }
      >
        <p>Page content</p>
      </AppShell>,
    );
    expect(root(container).dataset['collapsed']).toBeUndefined();
    expect(toggle().getAttribute('aria-label')).toBe('Collapse sidebar');
  });

  it('toggles on Ctrl+B, except while typing in a field', () => {
    const { container } = render(<Shell />);
    fireEvent.keyDown(document.body, { key: 'b', ctrlKey: true });
    expect(root(container).dataset['collapsed']).toBe('true');
    fireEvent.keyDown(screen.getByLabelText('Find'), {
      key: 'b',
      ctrlKey: true,
    });
    expect(root(container).dataset['collapsed']).toBe('true');
    fireEvent.keyDown(document.body, { key: 'b', metaKey: true });
    expect(root(container).dataset['collapsed']).toBeUndefined();
  });

  it('does not listen for the shortcut when shortcut is false', () => {
    const { container } = render(<Shell shortcut={false} />);
    fireEvent.keyDown(document.body, { key: 'b', ctrlKey: true });
    expect(root(container).dataset['collapsed']).toBeUndefined();
  });

  it('persists the collapsed state under persistKey and survives broken storage', () => {
    const first = render(<Shell persistKey="nova-test-shell" />);
    fireEvent.click(toggle());
    expect(window.localStorage.getItem('nova-test-shell')).toBe('true');
    first.unmount();
    const { container } = render(<Shell persistKey="nova-test-shell" />);
    expect(root(container).dataset['collapsed']).toBe('true');
    cleanup();

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const broken = render(<Shell persistKey="nova-test-shell" />);
    expect(root(broken.container).dataset['collapsed']).toBeUndefined();
    fireEvent.click(toggle());
    expect(root(broken.container).dataset['collapsed']).toBe('true');
  });

  it('gives the top bar a menu button that only shows below md', () => {
    render(<Shell />);
    const menu = screen.getByRole('button', { name: 'Open menu' });
    expect(menu.classList.contains('md:hidden')).toBe(true);
  });
});

describe('AppShell as a drawer below the breakpoint', () => {
  beforeEach(() => {
    viewport.desktop = false;
  });

  const sidebarEl = (container: HTMLElement) =>
    container.querySelector('[data-surface="sidebar"]') as HTMLElement;

  it('keeps the sidebar off-screen, inert and out of the tab order while closed', () => {
    const { container } = render(<Shell />);
    const sidebar = sidebarEl(container);
    expect(sidebar.hasAttribute('inert')).toBe(true);
    expect(sidebar.classList.contains('-translate-x-full')).toBe(true);
    expect(sidebar.classList.contains('invisible')).toBe(true);
    expect(sidebar.getAttribute('role')).toBeNull();
    expect(container.querySelector('[data-nova-scrim]')).toBeNull();
    expect(screen.getByRole('main').hasAttribute('inert')).toBe(false);
  });

  it('slides over the content as a modal dialog when the menu button opens it', () => {
    const { container } = render(<Shell />);
    const menu = screen.getByRole('button', { name: 'Open menu' });
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(menu);
    const sidebar = sidebarEl(container);
    expect(sidebar.hasAttribute('inert')).toBe(false);
    expect(sidebar.classList.contains('translate-x-0')).toBe(true);
    expect(sidebar.classList.contains('fixed')).toBe(true);
    expect(sidebar.getAttribute('role')).toBe('dialog');
    expect(sidebar.getAttribute('aria-modal')).toBe('true');
    expect(sidebar.getAttribute('aria-label')).toBe('Navigation menu');
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(menu.getAttribute('aria-controls')).toBe(sidebar.id);
    // The page behind is inert, and a scrim covers it.
    expect(screen.getByRole('main').hasAttribute('inert')).toBe(true);
    expect(container.querySelector('[data-nova-scrim]')).toBeTruthy();
  });

  it('always draws the drawer expanded, with a close button in place of the rail toggle', () => {
    const { container } = render(<Shell defaultCollapsed />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(sidebarEl(container).dataset['collapsed']).toBeUndefined();
    expect(screen.getByText('Acme Hospital')).toBeTruthy();
    expect(screen.queryByText('AH')).toBeNull();
    expect(screen.getByRole('button', { name: 'Close sidebar' })).toBeTruthy();
  });

  it('moves focus into the drawer when it opens: the current page, else the first control', () => {
    render(<Shell />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(document.activeElement).toBe(
      screen.getByRole('link', { name: 'Home' }),
    );
  });

  it('closes on Escape and returns focus to the menu button', () => {
    const { container } = render(<Shell />);
    const menu = screen.getByRole('button', { name: 'Open menu' });
    menu.focus();
    fireEvent.click(menu);
    expect(document.activeElement).not.toBe(menu);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(sidebarEl(container).hasAttribute('inert')).toBe(true);
    expect(container.querySelector('[data-nova-scrim]')).toBeNull();
    expect(screen.getByRole('main').hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(menu);
  });

  it('returns focus to the menu button even when the click did not focus it', () => {
    render(<Shell />);
    const menu = screen.getByRole('button', { name: 'Open menu' });
    // Safari does not focus a button on click: focus is still on the body.
    fireEvent.click(menu);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.activeElement).toBe(menu);
  });

  it('closes on a click on the scrim', () => {
    const { container } = render(<Shell />);
    const menu = screen.getByRole('button', { name: 'Open menu' });
    fireEvent.click(menu);
    fireEvent.click(container.querySelector('[data-nova-scrim]') as Element);
    expect(sidebarEl(container).hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(menu);
  });

  it('closes from its close button', () => {
    const { container } = render(<Shell />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close sidebar' }));
    expect(sidebarEl(container).hasAttribute('inert')).toBe(true);
  });

  it('closes when a destination is chosen, even when a router handles the click', () => {
    const { container } = render(<Shell />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const claims = screen.getByRole('link', { name: 'Claims' });
    claims.addEventListener('click', (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(claims);
    expect(sidebarEl(container).hasAttribute('inert')).toBe(true);
  });

  it('keeps Tab inside the open drawer', () => {
    render(<Shell />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const close = screen.getByRole('button', { name: 'Close sidebar' });
    const claims = screen.getByRole('link', { name: 'Claims' });
    claims.focus();
    const forward = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      claims.dispatchEvent(forward);
    });
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(close);
    const backward = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      close.dispatchEvent(backward);
    });
    expect(backward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(claims);
  });

  it('opens and closes on Ctrl+B, returning focus to where it was', () => {
    const { container } = render(<Shell />);
    const outside = screen.getByRole('button', { name: 'Outside action' });
    outside.focus();
    fireEvent.keyDown(document.body, { key: 'b', ctrlKey: true });
    expect(sidebarEl(container).hasAttribute('inert')).toBe(false);
    fireEvent.keyDown(document.body, { key: 'b', ctrlKey: true });
    expect(sidebarEl(container).hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(outside);
  });

  it('is controlled with drawerOpen / onDrawerOpenChange', () => {
    const onDrawerOpenChange = vi.fn();
    const { container, rerender } = render(
      <Shell drawerOpen={false} onDrawerOpenChange={onDrawerOpenChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(onDrawerOpenChange).toHaveBeenCalledWith(true);
    expect(sidebarEl(container).hasAttribute('inert')).toBe(true);
    rerender(<Shell drawerOpen onDrawerOpenChange={onDrawerOpenChange} />);
    expect(sidebarEl(container).hasAttribute('inert')).toBe(false);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDrawerOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('names the drawer with drawerLabel', () => {
    const { container } = render(
      <Shell defaultDrawerOpen drawerLabel="Main menu" />,
    );
    expect(sidebarEl(container).getAttribute('aria-label')).toBe('Main menu');
  });

  it('puts the drawer away when the window grows to desktop width', () => {
    const onDrawerOpenChange = vi.fn();
    const { container } = render(
      <Shell onDrawerOpenChange={onDrawerOpenChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    setDesktop(true);
    expect(onDrawerOpenChange).toHaveBeenLastCalledWith(false);
    const sidebar = sidebarEl(container);
    expect(sidebar.hasAttribute('inert')).toBe(false);
    expect(sidebar.getAttribute('role')).toBeNull();
    expect(container.querySelector('[data-nova-scrim]')).toBeNull();
    expect(screen.getByRole('main').hasAttribute('inert')).toBe(false);
    // And it does not pop back open when the window shrinks again.
    setDesktop(false);
    expect(sidebarEl(container).hasAttribute('inert')).toBe(true);
  });

  it('layers the scrim above the top bar and the drawer above the scrim', () => {
    const { container } = render(<Shell defaultDrawerOpen />);
    const scrim = container.querySelector('[data-nova-scrim]') as HTMLElement;
    expect(scrim.classList.contains('z-60')).toBe(true);
    expect(sidebarEl(container).classList.contains('z-70')).toBe(true);
    expect(scrim.getAttribute('aria-hidden')).toBe('true');
  });
});
