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
    expect(screen.getByLabelText<HTMLInputElement>('Consent given').checked).toBe(
      true,
    );
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('honours defaultChecked', () => {
    render(<Checkbox label="Consent given" defaultChecked />);
    expect(screen.getByLabelText<HTMLInputElement>('Consent given').checked).toBe(
      true,
    );
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
    expect(screen.getByLabelText<HTMLInputElement>('Consent given').required).toBe(
      true,
    );
  });

  it('shows its checked state with a shape, not colour alone', () => {
    render(<Checkbox label="Consent given" />);
    const box = screen.getByLabelText('Consent given');
    const mark = box.parentElement?.querySelector('svg');
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    expect(box.classList).toContain('peer');
    expect(mark?.getAttribute('class')).toContain('peer-checked:opacity-100');
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
