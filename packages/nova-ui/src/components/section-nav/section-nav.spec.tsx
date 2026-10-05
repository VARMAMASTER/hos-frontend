import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  SectionNav,
  type SectionNavItem,
  type SectionNavProps,
} from './section-nav';

afterEach(() => cleanup());

const items: SectionNavItem[] = [
  { id: 'queue', label: 'My queue', active: true },
  { id: 'approvals', label: 'Approvals', badge: 12, badgeLabel: 'pending' },
  { id: 'billing', label: 'Billing', href: '/billing' },
  { id: 'reports', label: 'Reports', disabled: true },
];

describe('SectionNav', () => {
  it('is a navigation landmark with the name it was given, holding a list', () => {
    render(<SectionNav items={items} ariaLabel="Ward sections" />);
    const nav = screen.getByRole('navigation', { name: 'Ward sections' });
    const list = within(nav).getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('renders items without an href as buttons and items with one as links', () => {
    render(<SectionNav items={items} ariaLabel="Sections" />);
    expect(screen.getByRole('button', { name: 'My queue' })).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Billing' });
    expect(link.getAttribute('href')).toBe('/billing');
  });

  it('never submits a surrounding form from a button item', () => {
    render(
      <form>
        <SectionNav items={items} ariaLabel="Sections" />
      </form>,
    );
    expect(
      screen.getByRole('button', { name: 'My queue' }).getAttribute('type'),
    ).toBe('button');
  });

  describe('the active item', () => {
    it('exposes aria-current="page" and only the active one does', () => {
      render(<SectionNav items={items} ariaLabel="Sections" />);
      expect(
        screen
          .getByRole('button', { name: 'My queue' })
          .getAttribute('aria-current'),
      ).toBe('page');
      expect(
        screen
          .getByRole('link', { name: 'Billing' })
          .getAttribute('aria-current'),
      ).toBeNull();
    });

    it('exposes aria-current on an active link too', () => {
      render(
        <SectionNav
          items={[
            { id: 'billing', label: 'Billing', href: '/b', active: true },
          ]}
          ariaLabel="Sections"
        />,
      );
      expect(
        screen
          .getByRole('link', { name: 'Billing' })
          .getAttribute('aria-current'),
      ).toBe('page');
    });

    it('is also bold, so it is not marked by colour alone', () => {
      render(<SectionNav items={items} ariaLabel="Sections" />);
      expect(
        screen
          .getByRole('button', { name: 'My queue' })
          .classList.contains('font-semibold'),
      ).toBe(true);
      expect(
        screen
          .getByRole('link', { name: 'Billing' })
          .classList.contains('font-semibold'),
      ).toBe(false);
    });
  });

  describe('selecting', () => {
    it('calls onSelect with the id of a pressed button item', () => {
      const onSelect = vi.fn();
      render(
        <SectionNav items={items} onSelect={onSelect} ariaLabel="Sections" />,
      );
      fireEvent.click(screen.getByRole('button', { name: /^Approvals/ }));
      expect(onSelect).toHaveBeenCalledWith('approvals');
    });

    it('calls onSelect with the id of a followed link item', () => {
      // jsdom cannot navigate; cancelling the default keeps the run free of "not implemented" noise.
      const cancelNavigation = (event: Event) => event.preventDefault();
      document.addEventListener('click', cancelNavigation);
      try {
        const onSelect = vi.fn();
        render(
          <SectionNav items={items} onSelect={onSelect} ariaLabel="Sections" />,
        );
        fireEvent.click(screen.getByRole('link', { name: 'Billing' }));
        expect(onSelect).toHaveBeenCalledWith('billing');
      } finally {
        document.removeEventListener('click', cancelNavigation);
      }
    });

    it('works without an onSelect', () => {
      render(<SectionNav items={items} ariaLabel="Sections" />);
      expect(() =>
        fireEvent.click(screen.getByRole('button', { name: 'My queue' })),
      ).not.toThrow();
    });
  });

  describe('a disabled item', () => {
    it('is a disabled button that cannot be activated', () => {
      const onSelect = vi.fn();
      render(
        <SectionNav items={items} onSelect={onSelect} ariaLabel="Sections" />,
      );
      const reports = screen.getByRole('button', { name: 'Reports' });
      expect((reports as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(reports);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('stays announced as unavailable, rather than vanishing', () => {
      render(<SectionNav items={items} ariaLabel="Sections" />);
      expect(screen.getByRole('button', { name: 'Reports' })).toBeTruthy();
    });

    it('is no longer followable when it was a link: no href, announced as disabled, never selected', () => {
      const onSelect = vi.fn();
      render(
        <SectionNav
          items={[
            { id: 'billing', label: 'Billing', href: '/b', disabled: true },
          ]}
          onSelect={onSelect}
          ariaLabel="Sections"
        />,
      );
      const link = screen.getByRole('link', { name: 'Billing' });
      expect(link.getAttribute('href')).toBeNull();
      expect(link.getAttribute('aria-disabled')).toBe('true');
      expect(link.getAttribute('tabindex')).toBeNull();
      fireEvent.click(link);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('is never marked as the current page', () => {
      render(
        <SectionNav
          items={[{ id: 'x', label: 'Reports', disabled: true, active: true }]}
          ariaLabel="Sections"
        />,
      );
      expect(
        screen
          .getByRole('button', { name: 'Reports' })
          .getAttribute('aria-current'),
      ).toBeNull();
    });
  });

  describe('badges', () => {
    it('shows the number', () => {
      render(<SectionNav items={items} ariaLabel="Sections" />);
      expect(screen.getByText('12')).toBeTruthy();
    });

    it('exposes the number together with its meaning, not a bare 12', () => {
      render(<SectionNav items={items} ariaLabel="Sections" />);
      expect(
        screen.getByRole('button', { name: 'Approvals 12 pending' }),
      ).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Approvals 12' })).toBeNull();
    });

    it('does not hide the number from assistive technology', () => {
      render(<SectionNav items={items} ariaLabel="Sections" />);
      let node: HTMLElement | null = screen.getByText('12');
      while (node && node.tagName !== 'BUTTON') {
        expect(node.getAttribute('aria-hidden')).toBeNull();
        node = node.parentElement;
      }
    });

    it('keeps the meaning visually hidden, so the badge itself stays a small number', () => {
      render(<SectionNav items={items} ariaLabel="Sections" />);
      expect(screen.getByText('pending').classList.contains('sr-only')).toBe(
        true,
      );
    });

    it('reads a badge on a link item as a number and its meaning too', () => {
      render(
        <SectionNav
          items={[
            {
              id: 'alerts',
              label: 'Alerts',
              href: '/alerts',
              badge: 3,
              badgeLabel: 'unread',
            },
          ]}
          ariaLabel="Sections"
        />,
      );
      expect(
        screen.getByRole('link', { name: 'Alerts 3 unread' }),
      ).toBeTruthy();
    });

    it('renders no badge for an item without one', () => {
      render(<SectionNav items={[items[0]]} ariaLabel="Sections" />);
      expect(screen.getByRole('button').textContent).toBe('My queue');
    });

    it('requires a meaning for every badge, and a name for the navigation', () => {
      // Compile-time checks: typecheck fails if either @ts-expect-error stops being an error.
      // Each error sits on the one line under its directive, so Prettier cannot separate them.
      const compileChecks = () => {
        // @ts-expect-error a badge without badgeLabel would be a bare number to a screen reader
        const bareBadge: SectionNavItem = { id: 'a', label: 'A', badge: 3 };
        // @ts-expect-error ariaLabel is required, a nav landmark needs a name
        const unnamedNav: SectionNavProps = { items: [] };
        return [bareBadge, unnamedNav];
      };
      expect(typeof compileChecks).toBe('function');
    });
  });

  it('hides the icon from assistive technology, since the label names the item', () => {
    render(
      <SectionNav
        items={[
          {
            id: 'beds',
            label: 'Beds',
            icon: <svg data-testid="icon" viewBox="0 0 24 24" />,
          },
        ]}
        ariaLabel="Sections"
      />,
    );
    expect(
      screen.getByTestId('icon').parentElement?.getAttribute('aria-hidden'),
    ).toBe('true');
    expect(screen.getByRole('button', { name: 'Beds' })).toBeTruthy();
  });

  it('merges a caller className onto the nav', () => {
    render(<SectionNav items={items} ariaLabel="Sections" className="w-56" />);
    expect(screen.getByRole('navigation').classList.contains('w-56')).toBe(
      true,
    );
  });
});
