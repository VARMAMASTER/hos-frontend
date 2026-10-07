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

  // Pressed is a filled primary pill and a tick, so the state never rests on colour alone. The tick
  // is always in the DOM (it slides in rather than popping), hidden and collapsed while off.
  it('slides a decorative tick in at the leading edge when pressed, outside the accessible name', () => {
    render(<FilterChip>ICU</FilterChip>);
    const chip = screen.getByRole('button', { name: 'ICU' });
    const tick = chip.querySelector('svg') as SVGElement;
    const slot = tick.parentElement as HTMLElement;
    expect(chip.firstElementChild).toBe(slot);
    expect(tick.getAttribute('aria-hidden')).toBe('true');
    expect(slot.dataset['state']).toBe('off');
    expect([...slot.classList]).toEqual(
      expect.arrayContaining([
        'max-w-0',
        'opacity-0',
        '-translate-x-s3',
        '-mr-s2',
      ]),
    );
    fireEvent.click(chip);
    expect(slot.dataset['state']).toBe('on');
    expect([...slot.classList]).toEqual(
      expect.arrayContaining(['max-w-s6', 'opacity-100', 'translate-x-0']),
    );
    expect([...slot.classList]).not.toContain('max-w-0');
    expect(screen.getByRole('button', { name: 'ICU' })).toBe(chip);
  });

  it('animates the tick under motion-safe only, so reduced motion is instant', () => {
    render(<FilterChip>ICU</FilterChip>);
    const slot = screen
      .getByRole('button', { name: 'ICU' })
      .querySelector('svg')?.parentElement as HTMLElement;
    expect(slot.className).toMatch(/motion-safe:transition-\[/);
    expect(slot.className).not.toMatch(/(^|\s)(?:transition|duration)-/);
  });

  // 02-reception.html .fchip: a 12px / 600 pill, a --line-strong edge on the panel, ink-2 text; on,
  // it fills with the brand (.is-active). Off, the corners are soft; pressed, they morph to a pill.
  it('is the prototype .fchip: a 12px chip, an outlined panel when off, brand-filled when on', () => {
    render(<FilterChip>ICU</FilterChip>);
    const chip = screen.getByRole('button', { name: 'ICU' });
    expect([...chip.classList]).toEqual(
      expect.arrayContaining([
        'text-label',
        'font-semibold',
        'border-border-strong',
        'bg-surface',
        'text-ink-2',
        'px-s4',
        'py-s2',
        'gap-s2',
        'motion-safe:duration-base',
        'motion-safe:ease-standard',
      ]),
    );
    fireEvent.click(chip);
    expect([...chip.classList]).toEqual(
      expect.arrayContaining([
        'bg-primary',
        'border-primary',
        'text-on-primary',
      ]),
    );
    expect(chip.className).not.toMatch(
      /shadow|font-medium|corner-shape|text-caption|bg-surface-2/,
    );
  });

  // Corner morph: the radius is the one property that changes shape. 8px to 18px, because the chip is
  // about 30px tall, so 18px is already the full pill and the change shows across the whole transition
  // (animating to 999px would finish in the first percent).
  it('morphs its corners from the control corner to a pill when pressed, animating the radius under motion-safe', () => {
    render(<FilterChip>ICU</FilterChip>);
    const chip = screen.getByRole('button', { name: 'ICU' });
    expect([...chip.classList]).toContain('rounded-control');
    expect([...chip.classList]).not.toContain('rounded-filter-on');
    fireEvent.click(chip);
    expect([...chip.classList]).toContain('rounded-filter-on');
    expect([...chip.classList]).not.toContain('rounded-control');
    expect(chip.className).toMatch(
      /motion-safe:transition-\[[^\]]*border-radius/,
    );
    expect(chip.className).not.toMatch(/(^|\s)(?:transition|duration)-/);
  });

  it('scales down while pressed, under motion-safe only', () => {
    render(<FilterChip>ICU</FilterChip>);
    const chip = screen.getByRole('button', { name: 'ICU' });
    expect([...chip.classList]).toContain('motion-safe:active:scale-95');
  });

  it('turns the edge and the text brand on hover while off, like .fchip:hover', () => {
    render(<FilterChip>ICU</FilterChip>);
    const chip = screen.getByRole('button', { name: 'ICU' });
    expect([...chip.classList]).toEqual(
      expect.arrayContaining([
        'hover:border-primary',
        'hover:text-primary-strong',
      ]),
    );
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
