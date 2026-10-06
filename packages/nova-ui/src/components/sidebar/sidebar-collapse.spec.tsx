import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { NavItem } from './nav-item';
import { NavSection } from './nav-section';
import { Sidebar } from './sidebar';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

function Nav() {
  return (
    <>
      <NavItem href="/home" icon={<svg data-testid="home-icon" />} active>
        Home
      </NavItem>
      <NavItem href="/claims" icon={<svg />} badge={3}>
        Claims
      </NavItem>
    </>
  );
}

const toggle = () =>
  screen.getByRole('button', { name: /(collapse|expand) sidebar/i });
const label = () => toggle().getAttribute('aria-label');

describe('Sidebar collapse', () => {
  it('has a toggle in the header named for its action, with aria-expanded and aria-controls', () => {
    const { container } = render(
      <Sidebar brand={<p>Acme</p>}>
        <Nav />
      </Sidebar>,
    );
    const root = container.firstElementChild as HTMLElement;
    const button = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(root.id).not.toBe('');
    expect(button.getAttribute('aria-controls')).toBe(root.id);
    expect(
      button.compareDocumentPosition(screen.getByRole('navigation')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(root.dataset['collapsed']).toBeUndefined();
  });

  it('uses the id the caller gives for aria-controls', () => {
    const { container } = render(
      <Sidebar id="main-nav">
        <Nav />
      </Sidebar>,
    );
    expect((container.firstElementChild as HTMLElement).id).toBe('main-nav');
    expect(toggle().getAttribute('aria-controls')).toBe('main-nav');
  });

  it('collapses and expands on click, uncontrolled', () => {
    const { container } = render(
      <Sidebar>
        <Nav />
      </Sidebar>,
    );
    const root = container.firstElementChild as HTMLElement;
    fireEvent.click(toggle());
    expect(label()).toBe('Expand sidebar');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(root.dataset['collapsed']).toBe('true');
    fireEvent.click(toggle());
    expect(label()).toBe('Collapse sidebar');
    expect(root.dataset['collapsed']).toBeUndefined();
  });

  it('starts as the rail with defaultCollapsed', () => {
    render(
      <Sidebar defaultCollapsed>
        <Nav />
      </Sidebar>,
    );
    expect(label()).toBe('Expand sidebar');
  });

  it('is controlled by `collapsed`: it reports the change and the caller decides', () => {
    const onCollapsedChange = vi.fn();
    const { rerender } = render(
      <Sidebar collapsed={false} onCollapsedChange={onCollapsedChange}>
        <Nav />
      </Sidebar>,
    );
    fireEvent.click(toggle());
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(label()).toBe('Collapse sidebar');
    rerender(
      <Sidebar collapsed onCollapsedChange={onCollapsedChange}>
        <Nav />
      </Sidebar>,
    );
    expect(label()).toBe('Expand sidebar');
  });

  it('is the icon rail when collapsed: a narrow width from the rail token, animating under motion-safe', () => {
    const { container } = render(
      <Sidebar collapsed>
        <Nav />
      </Sidebar>,
    );
    const root = container.firstElementChild as HTMLElement;
    for (const name of [
      'w-[var(--nova-sidebar-rail-w,4.25rem)]',
      'motion-safe:transition-[width]',
      'duration-base',
      'ease-standard',
    ]) {
      expect(root.classList.contains(name), name).toBe(true);
    }
    expect(root.classList.contains('md:w-[var(--nova-sidebar-w)]')).toBe(false);
  });

  it('keeps every nav item reachable by its name in the rail, inside the nav landmark', () => {
    render(
      <Sidebar collapsed>
        <Nav />
      </Sidebar>,
    );
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeTruthy();
    const home = screen.getByRole('link', { name: /^Home/ });
    expect(home.getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: /^Claims/ })).toBeTruthy();
  });

  it('swaps the brand for the logo mark and the footer for the avatar in the rail', () => {
    const props = {
      brand: <p>Acme Hospital</p>,
      collapsedBrand: <p>AH</p>,
      footer: <p>Dr. Rao</p>,
      collapsedFooter: <p>DR</p>,
    };
    const { rerender } = render(
      <Sidebar {...props}>
        <Nav />
      </Sidebar>,
    );
    expect(screen.getByText('Acme Hospital')).toBeTruthy();
    expect(screen.queryByText('AH')).toBeNull();
    rerender(
      <Sidebar collapsed {...props}>
        <Nav />
      </Sidebar>,
    );
    expect(screen.queryByText('Acme Hospital')).toBeNull();
    expect(screen.getByText('AH')).toBeTruthy();
    expect(screen.queryByText('Dr. Rao')).toBeNull();
    const avatar = screen.getByText('DR');
    expect(
      (avatar.parentElement as HTMLElement).classList.contains('border-t'),
    ).toBe(true);
  });

  it('shows no footer in the rail when it has no collapsed form', () => {
    render(
      <Sidebar collapsed footer={<p>Dr. Rao</p>}>
        <Nav />
      </Sidebar>,
    );
    expect(screen.queryByText('Dr. Rao')).toBeNull();
  });

  it('turns a section heading into a thin divider in the rail, keeping the group named', () => {
    const { rerender } = render(
      <Sidebar>
        <NavSection label="Clinical">
          <NavItem href="/patients">Patients</NavItem>
        </NavSection>
      </Sidebar>,
    );
    expect(screen.getByText('Clinical').classList.contains('sr-only')).toBe(
      false,
    );
    expect(screen.getByRole('group', { name: 'Clinical' })).toBeTruthy();
    expect(document.querySelector('[data-nova-nav-divider]')).toBeNull();
    rerender(
      <Sidebar collapsed>
        <NavSection label="Clinical">
          <NavItem href="/patients">Patients</NavItem>
        </NavSection>
      </Sidebar>,
    );
    expect(screen.getByText('Clinical').classList.contains('sr-only')).toBe(
      true,
    );
    const group = screen.getByRole('group', { name: 'Clinical' });
    const divider = group.querySelector('[data-nova-nav-divider]');
    expect(divider).toBeTruthy();
    expect(divider?.getAttribute('aria-hidden')).toBe('true');
  });

  describe('keyboard shortcut', () => {
    const press = (target: Element | Document, init: KeyboardEventInit) =>
      fireEvent.keyDown(target, { key: 'b', ...init });

    it('Ctrl+B toggles the rail and stops the browser default', () => {
      render(
        <Sidebar>
          <Nav />
        </Sidebar>,
      );
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        document.body.dispatchEvent(event);
      });
      expect(event.defaultPrevented).toBe(true);
      expect(label()).toBe('Expand sidebar');
      press(document.body, { ctrlKey: true });
      expect(label()).toBe('Collapse sidebar');
    });

    it('Cmd+B does the same', () => {
      render(
        <Sidebar>
          <Nav />
        </Sidebar>,
      );
      press(document.body, { metaKey: true });
      expect(label()).toBe('Expand sidebar');
    });

    it('ignores a bare B and other chords', () => {
      render(
        <Sidebar>
          <Nav />
        </Sidebar>,
      );
      press(document.body, {});
      press(document.body, { ctrlKey: true, shiftKey: true });
      press(document.body, { ctrlKey: true, altKey: true });
      fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
      expect(label()).toBe('Collapse sidebar');
    });

    it.each([
      ['an input', () => document.createElement('input')],
      ['a textarea', () => document.createElement('textarea')],
      ['a select', () => document.createElement('select')],
      [
        'a contenteditable element',
        () => {
          const div = document.createElement('div');
          div.setAttribute('contenteditable', 'true');
          return div;
        },
      ],
      [
        'a child of a contenteditable element',
        () => {
          const div = document.createElement('div');
          div.setAttribute('contenteditable', '');
          const span = document.createElement('span');
          div.append(span);
          document.body.append(div);
          return span;
        },
      ],
    ])('does not fire while typing in %s', (_name, make) => {
      render(
        <Sidebar>
          <Nav />
        </Sidebar>,
      );
      const field = make();
      if (!field.isConnected) document.body.append(field);
      press(field, { ctrlKey: true });
      expect(label()).toBe('Collapse sidebar');
      field.remove();
    });

    it('still fires from a link', () => {
      render(
        <Sidebar>
          <Nav />
        </Sidebar>,
      );
      press(screen.getByRole('link', { name: /^Home/ }), { ctrlKey: true });
      expect(label()).toBe('Expand sidebar');
    });

    it('can be turned off', () => {
      render(
        <Sidebar shortcut={false}>
          <Nav />
        </Sidebar>,
      );
      press(document.body, { ctrlKey: true });
      expect(label()).toBe('Collapse sidebar');
    });

    it('is removed on unmount', () => {
      const onChange = vi.fn();
      const { unmount } = render(
        <Sidebar onCollapsedChange={onChange}>
          <Nav />
        </Sidebar>,
      );
      unmount();
      press(document.body, { ctrlKey: true });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('persistKey', () => {
    it('saves the collapsed state and restores it on the next mount', () => {
      const first = render(
        <Sidebar persistKey="nova-test-sidebar">
          <Nav />
        </Sidebar>,
      );
      fireEvent.click(toggle());
      expect(window.localStorage.getItem('nova-test-sidebar')).toBe('true');
      first.unmount();
      render(
        <Sidebar persistKey="nova-test-sidebar">
          <Nav />
        </Sidebar>,
      );
      expect(label()).toBe('Expand sidebar');
      fireEvent.click(toggle());
      expect(window.localStorage.getItem('nova-test-sidebar')).toBe('false');
    });

    it('lets a stored value win over defaultCollapsed, and a controlled prop win over both', () => {
      window.localStorage.setItem('nova-test-sidebar', 'false');
      const { unmount } = render(
        <Sidebar persistKey="nova-test-sidebar" defaultCollapsed>
          <Nav />
        </Sidebar>,
      );
      expect(label()).toBe('Collapse sidebar');
      unmount();
      render(
        <Sidebar persistKey="nova-test-sidebar" collapsed>
          <Nav />
        </Sidebar>,
      );
      expect(label()).toBe('Expand sidebar');
    });

    it('ignores a stored value that is not true or false', () => {
      window.localStorage.setItem('nova-test-sidebar', '{"x":1}');
      render(
        <Sidebar persistKey="nova-test-sidebar">
          <Nav />
        </Sidebar>,
      );
      expect(label()).toBe('Collapse sidebar');
    });

    it('works when storage throws on read and on write', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });
      render(
        <Sidebar persistKey="nova-test-sidebar">
          <Nav />
        </Sidebar>,
      );
      expect(label()).toBe('Collapse sidebar');
      fireEvent.click(toggle());
      expect(label()).toBe('Expand sidebar');
    });

    it('stores nothing without a persistKey', () => {
      render(
        <Sidebar>
          <Nav />
        </Sidebar>,
      );
      fireEvent.click(toggle());
      expect(window.localStorage.length).toBe(0);
    });
  });
});
