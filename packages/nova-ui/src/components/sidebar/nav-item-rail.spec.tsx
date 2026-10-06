import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NavItem } from './nav-item';
import { Sidebar } from './sidebar';

afterEach(() => cleanup());

const icon = <svg data-testid="icon" />;

function rail(children: React.ReactNode) {
  return render(<Sidebar collapsed>{children}</Sidebar>);
}

describe('NavItem in the icon rail', () => {
  it('keeps its accessible name, with the label faded out and clipped rather than removed', () => {
    rail(
      <NavItem href="/patients" icon={icon}>
        Patients
      </NavItem>,
    );
    const link = screen.getByRole('link', { name: 'Patients' });
    const text = screen.getByText('Patients');
    expect(text.classList.contains('opacity-0')).toBe(true);
    expect(text.classList.contains('whitespace-nowrap')).toBe(true);
    // The label never wraps, and the item clips whatever the narrow rail cannot show.
    expect(link.classList.contains('overflow-hidden')).toBe(true);
    // The icon stays.
    expect(screen.getByTestId('icon')).toBeTruthy();
  });

  it('keeps the label fully visible when expanded', () => {
    render(
      <Sidebar>
        <NavItem href="/patients" icon={icon}>
          Patients
        </NavItem>
      </Sidebar>,
    );
    const text = screen.getByText('Patients');
    expect(text.classList.contains('opacity-0')).toBe(false);
    expect(text.classList.contains('whitespace-nowrap')).toBe(true);
  });

  it('fades the label with the motion tokens, only under motion-safe', () => {
    rail(
      <NavItem href="/patients" icon={icon}>
        Patients
      </NavItem>,
    );
    const text = screen.getByText('Patients');
    for (const name of [
      'motion-safe:transition-opacity',
      'duration-base',
      'ease-standard',
    ]) {
      expect(text.classList.contains(name), name).toBe(true);
    }
  });

  it('shows the label as a tooltip on hover', () => {
    rail(
      <NavItem href="/patients" icon={icon}>
        Patients
      </NavItem>,
    );
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Patients' }));
    const tip = screen.getByRole('tooltip');
    expect(tip.textContent).toBe('Patients');
    fireEvent.mouseLeave(screen.getByRole('link', { name: 'Patients' }));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows the label as a tooltip on keyboard focus, and Escape dismisses it', () => {
    rail(
      <NavItem href="/patients" icon={icon}>
        Patients
      </NavItem>,
    );
    const link = screen.getByRole('link', { name: 'Patients' });
    fireEvent.focus(link);
    expect(screen.getByRole('tooltip').textContent).toBe('Patients');
    expect(link.getAttribute('aria-describedby')).toBe(
      screen.getByRole('tooltip').id,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('puts the tooltip beside the rail, not above the item', () => {
    rail(
      <NavItem href="/patients" icon={icon}>
        Patients
      </NavItem>,
    );
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Patients' }));
    const wrapper = screen.getByRole('tooltip').parentElement as HTMLElement;
    expect(wrapper.className).toContain('[&>[role=tooltip]]:left-full');
  });

  it('shows no tooltip when expanded, where the label is already there', () => {
    render(
      <Sidebar>
        <NavItem href="/patients" icon={icon}>
          Patients
        </NavItem>
      </Sidebar>,
    );
    const link = screen.getByRole('link', { name: 'Patients' });
    fireEvent.mouseEnter(link);
    fireEvent.focus(link);
    // Nothing visible repeats the label, and nothing is announced twice.
    const tips = screen.queryAllByRole('tooltip', { hidden: true });
    for (const tip of tips) {
      expect(tip.parentElement?.className).toContain(
        '[&>[role=tooltip]]:hidden',
      );
      expect(tip.textContent).toBe('');
    }
  });

  it('keeps the same element when the rail toggles, so keyboard focus is not lost', () => {
    const { rerender } = render(
      <Sidebar>
        <NavItem href="/patients" icon={icon}>
          Patients
        </NavItem>
      </Sidebar>,
    );
    const link = screen.getByRole('link', { name: 'Patients' });
    link.focus();
    rerender(
      <Sidebar collapsed>
        <NavItem href="/patients" icon={icon}>
          Patients
        </NavItem>
      </Sidebar>,
    );
    expect(screen.getByRole('link', { name: 'Patients' })).toBe(link);
    expect(document.activeElement).toBe(link);
  });

  it('marks the active item with a bar as well as the fill, so it is never colour alone', () => {
    rail(
      <>
        <NavItem href="/a" icon={icon} active>
          Active
        </NavItem>
        <NavItem href="/b" icon={icon}>
          Resting
        </NavItem>
      </>,
    );
    const active = screen.getByRole('link', { name: 'Active' });
    const mark = active.querySelector('[data-nova-active-mark]');
    expect(mark).toBeTruthy();
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    expect(active.getAttribute('aria-current')).toBe('page');
    expect(
      screen
        .getByRole('link', { name: 'Resting' })
        .querySelector('[data-nova-active-mark]'),
    ).toBeNull();
  });

  it('turns a badge into a small count on the icon', () => {
    const { rerender } = render(
      <Sidebar>
        <NavItem href="/claims" icon={icon} badge={3}>
          Claims
        </NavItem>
      </Sidebar>,
    );
    // Expanded: a pill after the label.
    const pill = screen.getByText('3');
    expect(
      pill.closest('[data-nova-badge]')?.getAttribute('data-nova-badge'),
    ).toBe('inline');
    rerender(
      <Sidebar collapsed>
        <NavItem href="/claims" icon={icon} badge={3}>
          Claims
        </NavItem>
      </Sidebar>,
    );
    // Collapsed: the same count, on the icon, still text.
    const count = screen.getByText('3');
    expect(
      count.closest('[data-nova-badge]')?.getAttribute('data-nova-badge'),
    ).toBe('overlay');
    expect(
      screen
        .getByTestId('icon')
        .closest('span[aria-hidden="true"]')
        ?.contains(count),
    ).toBe(false);
    const link = screen.getByRole('link', { name: /Claims/ });
    expect(link.contains(count)).toBe(true);
  });

  it('renders no badge when none is given', () => {
    rail(
      <NavItem href="/claims" icon={icon}>
        Claims
      </NavItem>,
    );
    expect(document.querySelector('[data-nova-badge]')).toBeNull();
  });

  it('falls back to the first letter of the label when there is no icon, in the rail only', () => {
    const { rerender } = render(
      <Sidebar>
        <NavItem href="/patients">Patients</NavItem>
      </Sidebar>,
    );
    expect(document.querySelector('[data-nova-monogram]')).toBeNull();
    rerender(
      <Sidebar collapsed>
        <NavItem href="/patients">Patients</NavItem>
      </Sidebar>,
    );
    const mono = document.querySelector('[data-nova-monogram]');
    expect(mono?.textContent).toBe('P');
    expect(mono?.closest('[aria-hidden="true"]')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Patients' })).toBeTruthy();
  });

  it('is an ordinary expanded item outside any Sidebar', () => {
    render(
      <NavItem href="/patients" icon={icon}>
        Patients
      </NavItem>,
    );
    expect(screen.getByText('Patients').classList.contains('opacity-0')).toBe(
      false,
    );
  });
});
