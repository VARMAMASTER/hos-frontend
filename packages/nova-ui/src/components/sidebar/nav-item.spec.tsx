import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NavItem } from './nav-item';

afterEach(() => cleanup());

describe('NavItem', () => {
  it('renders an anchor by default', () => {
    render(<NavItem href="/patients">Patients</NavItem>);
    const link = screen.getByRole('link', { name: 'Patients' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/patients');
  });

  it('exposes the active item as the current page', () => {
    render(
      <NavItem href="/dashboard" active>
        Dashboard
      </NavItem>,
    );
    const link = screen.getByRole('link', { name: 'Dashboard' });
    expect(link.getAttribute('aria-current')).toBe('page');
    // The same state through the accessibility tree, the way a screen reader asks for it.
    expect(
      screen.getByRole('link', { name: 'Dashboard', current: 'page' }),
    ).toBe(link);
  });

  it('does not expose an inactive item as current', () => {
    render(<NavItem href="/patients">Patients</NavItem>);
    expect(
      screen
        .getByRole('link', { name: 'Patients' })
        .hasAttribute('aria-current'),
    ).toBe(false);
  });

  it('does not expose an explicitly inactive item as current', () => {
    render(
      <NavItem href="/patients" active={false}>
        Patients
      </NavItem>,
    );
    expect(
      screen
        .getByRole('link', { name: 'Patients' })
        .hasAttribute('aria-current'),
    ).toBe(false);
  });

  it('styles the active item with the brand fill and white text, and a resting one with the chrome secondary ink', () => {
    render(
      <>
        <NavItem href="/a" active>
          Active
        </NavItem>
        <NavItem href="/b">Resting</NavItem>
      </>,
    );
    const active = screen.getByRole('link', { name: 'Active' });
    const resting = screen.getByRole('link', { name: 'Resting' });
    expect(active.classList.contains('bg-primary/40')).toBe(true);
    expect(active.classList.contains('text-on-primary')).toBe(true);
    // Resting reads the chrome's secondary ink and lifts to white on hover.
    expect(resting.classList.contains('bg-primary/40')).toBe(false);
    expect(resting.className).toContain('--nova-chrome-ink-2');
    expect(resting.classList.contains('hover:text-on-primary')).toBe(true);
  });

  it('renders a type="button" button with as="button", without leaking `as` into the DOM', () => {
    const onClick = vi.fn();
    render(
      <NavItem as="button" onClick={onClick}>
        Open menu
      </NavItem>,
    );
    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.hasAttribute('as')).toBe(false);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('exposes an active button as current too, with an attribute buttons support', () => {
    render(
      <>
        <NavItem as="button" active>
          Reports
        </NavItem>
        <NavItem as="button">Settings</NavItem>
      </>,
    );
    expect(
      screen
        .getByRole('button', { name: 'Reports' })
        .getAttribute('aria-current'),
    ).toBe('true');
    expect(
      screen
        .getByRole('button', { name: 'Settings' })
        .hasAttribute('aria-current'),
    ).toBe(false);
    // aria-selected is not allowed on role=button, so it must not be used for this.
    expect(
      screen
        .getByRole('button', { name: 'Reports' })
        .hasAttribute('aria-selected'),
    ).toBe(false);
  });

  it('renders the icon, hidden from assistive tech, beside the label', () => {
    render(
      <NavItem href="/patients" icon={<svg data-testid="icon" />}>
        Patients
      </NavItem>,
    );
    const icon = screen.getByTestId('icon');
    expect(icon).toBeTruthy();
    expect(icon.closest('[aria-hidden="true"]')).toBeTruthy();
    // The accessible name is the label alone.
    expect(screen.getByRole('link', { name: 'Patients' })).toBeTruthy();
  });

  it('calls onClick on an anchor, for router links that intercept the navigation', () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    render(
      <NavItem href="/patients" onClick={onClick}>
        Patients
      </NavItem>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Patients' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes anchor attributes through and merges a caller className', () => {
    render(
      <NavItem
        href="https://example.org/help"
        target="_blank"
        rel="noreferrer"
        className="extra"
      >
        Help
      </NavItem>,
    );
    const link = screen.getByRole('link', { name: 'Help' });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noreferrer');
    expect(link.classList.contains('extra')).toBe(true);
  });
});
