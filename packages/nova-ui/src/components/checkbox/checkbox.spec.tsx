import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Checkbox } from './checkbox';

afterEach(() => cleanup());

describe('Checkbox', () => {
  it('is a checkbox found by its label', () => {
    render(<Checkbox label="Consent given" />);
    const box = screen.getByLabelText('Consent given');
    expect(box).toBeInstanceOf(HTMLInputElement);
    expect(box.getAttribute('type')).toBe('checkbox');
    expect(screen.getByRole('checkbox', { name: 'Consent given' })).toBe(box);
  });

  it('ties the <label> to the input by a generated id, and lets a caller id win', () => {
    const { rerender } = render(<Checkbox label="Consent given" />);
    const generated = screen.getByLabelText('Consent given');
    expect(generated.id).not.toBe('');
    expect(screen.getByText('Consent given').getAttribute('for')).toBe(
      generated.id,
    );
    rerender(<Checkbox id="consent" label="Consent given" />);
    expect(screen.getByLabelText('Consent given').id).toBe('consent');
    expect(screen.getByText('Consent given').getAttribute('for')).toBe(
      'consent',
    );
  });

  it('toggles on click and fires the handler', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Consent given" onChange={onChange} />);
    const box = screen.getByLabelText<HTMLInputElement>('Consent given');
    expect(box.checked).toBe(false);
    fireEvent.click(box);
    expect(box.checked).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.click(box);
    expect(box.checked).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('toggles when its label text is clicked', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Consent given" onChange={onChange} />);
    fireEvent.click(screen.getByText('Consent given'));
    expect(
      screen.getByLabelText<HTMLInputElement>('Consent given').checked,
    ).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('honours defaultChecked', () => {
    render(<Checkbox label="Consent given" defaultChecked />);
    expect(
      screen.getByLabelText<HTMLInputElement>('Consent given').checked,
    ).toBe(true);
  });

  it('honours a controlled checked value', () => {
    function Controlled() {
      const [checked, setChecked] = useState(true);
      return (
        <Checkbox
          label="Consent given"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
      );
    }
    render(<Controlled />);
    const box = screen.getByLabelText<HTMLInputElement>('Consent given');
    expect(box.checked).toBe(true);
    fireEvent.click(box);
    expect(box.checked).toBe(false);
  });

  it('blocks the handler while disabled', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Consent given" disabled onChange={onChange} />);
    const box = screen.getByLabelText<HTMLInputElement>('Consent given');
    expect(box.disabled).toBe(true);
    fireEvent.click(box);
    fireEvent.click(screen.getByText('Consent given'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('uses the native required attribute', () => {
    render(<Checkbox label="Consent given" required />);
    expect(
      screen.getByLabelText<HTMLInputElement>('Consent given').required,
    ).toBe(true);
  });

  it('shows its checked state with a shape, not colour alone', () => {
    render(<Checkbox label="Consent given" />);
    const box = screen.getByLabelText('Consent given');
    const mark = box.parentElement?.querySelector('svg');
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    expect(box.classList).toContain('peer');
    expect(mark?.getAttribute('class')).toContain(
      'peer-[:checked:not(:indeterminate)]:opacity-100',
    );
  });

  it('forwards its ref and is a nova-field control', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox label="Consent given" ref={ref} />);
    const box = screen.getByLabelText('Consent given');
    expect(ref.current).toBe(box);
    expect(box.classList).toContain('nova-field');
  });

  it('puts className on the wrapper, not the input', () => {
    render(<Checkbox label="Consent given" className="mt-4" />);
    const box = screen.getByLabelText('Consent given');
    expect(box.className).not.toContain('mt-4');
    expect(box.closest('.mt-4')).not.toBeNull();
  });
});

describe('Checkbox, the prototype form control', () => {
  it('gives the row a 44px minimum touch target and the prototype 13.5px label text', () => {
    render(<Checkbox label="Ramesh consents" />);
    const control = screen.getByLabelText('Ramesh consents');
    const row = control.closest('div') as HTMLElement;
    expect(row.classList).toContain('min-h-touch');
    const label = screen.getByText('Ramesh consents');
    expect(label.classList).toContain('text-input');
    expect(label.className).not.toMatch(/text-sm/);
  });
});

describe('Checkbox, the animated check', () => {
  it('draws the tick as a path, offset out while unchecked and drawn in when checked', () => {
    render(<Checkbox label="Ramesh consents" />);
    const box = screen.getByLabelText('Ramesh consents');
    const tick = box.parentElement?.querySelector(
      'svg[data-mark="check"]',
    ) as SVGElement;
    expect(tick.querySelector('path')?.getAttribute('pathLength')).toBe('1');
    expect([...tick.classList]).toEqual(
      expect.arrayContaining([
        '[stroke-dasharray:1]',
        '[stroke-dashoffset:1]',
        'peer-[:checked:not(:indeterminate)]:[stroke-dashoffset:0]',
        'motion-safe:transition-[stroke-dashoffset,opacity]',
      ]),
    );
  });

  it('presses in under motion-safe only', () => {
    render(<Checkbox label="Ramesh consents" />);
    const box = screen.getByLabelText('Ramesh consents');
    expect([...box.classList]).toContain('motion-safe:active:scale-90');
    expect(box.className).not.toMatch(/(^|\s)(?:transition|duration)-/);
  });
});

describe('Checkbox, indeterminate', () => {
  it('sets the input indeterminate property, which assistive technology reads as mixed', () => {
    render(<Checkbox label="All wards" indeterminate />);
    const box = screen.getByLabelText<HTMLInputElement>('All wards');
    expect(box.indeterminate).toBe(true);
    // The platform exposes mixed itself; aria-checked on a native checkbox is the wrong tool.
    expect(box.getAttribute('aria-checked')).toBeNull();
  });

  it('is off by default', () => {
    render(<Checkbox label="All wards" />);
    expect(
      screen.getByLabelText<HTMLInputElement>('All wards').indeterminate,
    ).toBe(false);
  });

  it('follows the prop as it changes, and survives a re-render after the browser clears it', () => {
    const { rerender } = render(<Checkbox label="All wards" indeterminate />);
    const box = screen.getByLabelText<HTMLInputElement>('All wards');
    rerender(<Checkbox label="All wards" indeterminate={false} />);
    expect(box.indeterminate).toBe(false);
    rerender(<Checkbox label="All wards" indeterminate />);
    expect(box.indeterminate).toBe(true);
    // A click clears it natively; a parent that keeps indeterminate true gets it back on re-render.
    fireEvent.click(box);
    expect(box.indeterminate).toBe(true);
  });

  it('shows a dash, a shape, in place of the tick', () => {
    render(<Checkbox label="All wards" indeterminate />);
    const box = screen.getByLabelText('All wards');
    const dash = box.parentElement?.querySelector('svg[data-mark="mixed"]');
    expect(dash?.getAttribute('aria-hidden')).toBe('true');
    expect(dash?.getAttribute('class')).toContain(
      'peer-indeterminate:opacity-100',
    );
    expect([...box.classList]).toEqual(
      expect.arrayContaining([
        'indeterminate:bg-primary',
        'indeterminate:[--nova-field-edge:var(--nova-color-primary)]',
      ]),
    );
  });

  it('keeps the 44px row', () => {
    render(<Checkbox label="All wards" indeterminate />);
    const row = screen.getByLabelText('All wards').closest('div');
    expect(row?.classList).toContain('min-h-touch');
  });

  it('still forwards its ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox label="All wards" indeterminate ref={ref} />);
    expect(ref.current?.indeterminate).toBe(true);
  });
});
