import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TopBar } from './top-bar';

afterEach(() => cleanup());

describe('TopBar menu button', () => {
  it('has none on its own: there is no sidebar for it to open', () => {
    render(<TopBar search={<input aria-label="Find" />} />);
    expect(screen.queryByRole('button', { name: 'Open menu' })).toBeNull();
  });

  it('shows one when given onMenuClick, only below md, first in the row', () => {
    const onMenuClick = vi.fn();
    const { container } = render(
      <TopBar onMenuClick={onMenuClick} search={<input aria-label="Find" />} />,
    );
    const menu = screen.getByRole('button', { name: 'Open menu' });
    expect(menu.getAttribute('type')).toBe('button');
    expect(menu.classList.contains('md:hidden')).toBe(true);
    // The first thing in the bar.
    expect((container.firstElementChild as HTMLElement).firstElementChild).toBe(
      menu,
    );
    fireEvent.click(menu);
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('names the button with menuLabel and hides its icon from assistive tech', () => {
    render(
      <TopBar onMenuClick={() => undefined} menuLabel="Show navigation" />,
    );
    const menu = screen.getByRole('button', { name: 'Show navigation' });
    expect(menu.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the keyboard focus ring on the button', () => {
    render(<TopBar onMenuClick={() => undefined} />);
    expect(
      screen
        .getByRole('button', { name: 'Open menu' })
        .className.includes('focus-visible:outline-focus'),
    ).toBe(true);
  });
});
