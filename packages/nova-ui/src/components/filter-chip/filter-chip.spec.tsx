import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FilterChip } from './filter-chip';

afterEach(() => cleanup());

describe('FilterChip', () => {
  it('is a toggle button, off by default, that never submits a form', () => {
    render(
      <form>
        <FilterChip>ICU</FilterChip>
      </form>,
    );
    const chip = screen.getByRole('button', { name: 'ICU' });
    expect(chip.getAttribute('type')).toBe('button');
    expect(chip.getAttribute('aria-pressed')).toBe('false');
  });

  it('toggles aria-pressed on click and reports the new state', () => {
    const onPressedChange = vi.fn();
    render(<FilterChip onPressedChange={onPressedChange}>ICU</FilterChip>);
    const chip = screen.getByRole('button', { name: 'ICU' });
    fireEvent.click(chip);
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(onPressedChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(chip);
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    expect(onPressedChange).toHaveBeenLastCalledWith(false);
  });

  it('starts pressed with defaultPressed', () => {
    render(<FilterChip defaultPressed>ICU</FilterChip>);
    expect(
      screen.getByRole('button', { name: 'ICU' }).getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('only asks when controlled: the parent decides', () => {
    const onPressedChange = vi.fn();
    render(
      <FilterChip pressed={false} onPressedChange={onPressedChange}>
        ICU
      </FilterChip>,
    );
    const chip = screen.getByRole('button', { name: 'ICU' });
    fireEvent.click(chip);
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(chip.getAttribute('aria-pressed')).toBe('false');
  });

  it('lets a caller cancel the toggle from its own onClick', () => {
    render(
      <FilterChip onClick={(event) => event.preventDefault()}>ICU</FilterChip>,
    );
    const chip = screen.getByRole('button', { name: 'ICU' });
    fireEvent.click(chip);
    expect(chip.getAttribute('aria-pressed')).toBe('false');
  });

  it('does not toggle while disabled', () => {
    const onPressedChange = vi.fn();
    render(
      <FilterChip disabled onPressedChange={onPressedChange}>
        ICU
      </FilterChip>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'ICU' }));
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  // Pressed is a filled primary pill and a tick, so the state never rests on colour alone.
  it('shows a decorative tick only while pressed, outside the accessible name', () => {
    render(<FilterChip>ICU</FilterChip>);
    const chip = screen.getByRole('button', { name: 'ICU' });
    expect(chip.querySelector('svg')).toBeNull();
    fireEvent.click(chip);
    expect(chip.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('button', { name: 'ICU' })).toBe(chip);
  });

  it('is a caption-size pill: parchment when off, primary when on, pressing to 0.96', () => {
    render(<FilterChip>ICU</FilterChip>);
    const chip = screen.getByRole('button', { name: 'ICU' });
    expect([...chip.classList]).toEqual(
      expect.arrayContaining([
        'rounded-full',
        'text-caption',
        'bg-surface-2',
        'motion-safe:active:scale-[0.96]',
      ]),
    );
    fireEvent.click(chip);
    expect([...chip.classList]).toEqual(
      expect.arrayContaining(['bg-primary', 'text-on-primary']),
    );
    expect(chip.className).not.toMatch(/shadow|font-medium/);
  });

  it('forwards its ref, merges className and passes attributes through', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <FilterChip ref={ref} className="ml-2" data-testid="icu">
        ICU
      </FilterChip>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.classList.contains('ml-2')).toBe(true);
    expect(ref.current?.dataset['testid']).toBe('icu');
  });
});
