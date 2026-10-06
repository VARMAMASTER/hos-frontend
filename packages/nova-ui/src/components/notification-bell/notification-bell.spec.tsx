import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NotificationBell } from './notification-bell';

afterEach(() => cleanup());

describe('NotificationBell name', () => {
  it('is a real button named "Notifications" when nothing is unread', () => {
    render(<NotificationBell count={0} />);
    const button = screen.getByRole('button', { name: 'Notifications' });
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('includes the unread count in the accessible name', () => {
    render(<NotificationBell count={3} />);
    expect(
      screen.getByRole('button', { name: 'Notifications, 3 unread' }),
    ).toBeTruthy();
  });

  it('caps the count at 99+, in the badge and the name', () => {
    render(<NotificationBell count={250} />);
    const button = screen.getByRole('button', {
      name: 'Notifications, 99+ unread',
    });
    expect(button.textContent).toBe('99+');
  });

  it('shows 99 exactly as 99', () => {
    render(<NotificationBell count={99} />);
    expect(
      screen.getByRole('button', { name: 'Notifications, 99 unread' })
        .textContent,
    ).toBe('99');
  });

  it('treats a negative, fractional or missing count sensibly', () => {
    const { rerender } = render(<NotificationBell count={-4} />);
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeTruthy();
    rerender(<NotificationBell count={2.9} />);
    expect(
      screen.getByRole('button', { name: 'Notifications, 2 unread' }),
    ).toBeTruthy();
    rerender(<NotificationBell />);
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeTruthy();
  });

  it('can be translated or made specific', () => {
    render(<NotificationBell count={1} label="Ward alerts" unreadWord="new" />);
    expect(
      screen.getByRole('button', { name: 'Ward alerts, 1 new' }),
    ).toBeTruthy();
  });

  it('does not read the badge twice: the badge and icon are hidden from assistive tech', () => {
    render(<NotificationBell count={3} />);
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(screen.getByText('3').getAttribute('aria-hidden')).toBe('true');
  });
});

describe('NotificationBell badge', () => {
  it('has no badge at zero', () => {
    render(<NotificationBell count={0} />);
    expect(screen.getByRole('button').textContent).toBe('');
  });

  it('is a crit pill with the count as text, so it is not colour-only', () => {
    render(<NotificationBell count={7} />);
    const badge = screen.getByText('7');
    expect(badge.className).toContain('bg-crit');
    expect(badge.className).toContain('rounded-full');
    expect(badge.className).not.toMatch(/shadow|font-medium/);
  });
});

describe('NotificationBell behaviour', () => {
  it('fires onClick and passes other attributes through', () => {
    const onClick = vi.fn();
    render(<NotificationBell count={1} onClick={onClick} data-testid="bell" />);
    fireEvent.click(screen.getByTestId('bell'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is at least 44px square to tap', () => {
    render(<NotificationBell count={1} />);
    const classes = screen.getByRole('button').className;
    expect(classes).toContain('h-11');
    expect(classes).toContain('w-11');
  });
});
