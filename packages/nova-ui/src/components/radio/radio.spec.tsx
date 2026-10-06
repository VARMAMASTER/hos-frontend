import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Radio } from './radio';

afterEach(() => cleanup());

describe('Radio', () => {
  it('is a radio found by its label and carries its name and value', () => {
    render(<Radio name="sex" value="f" label="Female" />);
    const radio = screen.getByLabelText<HTMLInputElement>('Female');
    expect(radio.getAttribute('type')).toBe('radio');
    expect(radio.name).toBe('sex');
    expect(radio.value).toBe('f');
    expect(screen.getByRole('radio', { name: 'Female' })).toBe(radio);
  });

  it('ties the <label> to the input by a generated id, and lets a caller id win', () => {
    const { rerender } = render(<Radio name="sex" label="Female" />);
    const generated = screen.getByLabelText('Female');
    expect(generated.id).not.toBe('');
    expect(screen.getByText('Female').getAttribute('for')).toBe(generated.id);
    rerender(<Radio id="sex-f" name="sex" label="Female" />);
    expect(screen.getByLabelText('Female').id).toBe('sex-f');
  });

  it('selects on click and fires the handler', () => {
    const onChange = vi.fn();
    render(<Radio name="sex" value="f" label="Female" onChange={onChange} />);
    const radio = screen.getByLabelText<HTMLInputElement>('Female');
    fireEvent.click(radio);
    expect(radio.checked).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('selects when its label text is clicked', () => {
    render(<Radio name="sex" value="f" label="Female" />);
    fireEvent.click(screen.getByText('Female'));
    expect(screen.getByLabelText<HTMLInputElement>('Female').checked).toBe(
      true,
    );
  });

  it('keeps a group to one choice by name', () => {
    const onChange = vi.fn();
    render(
      <fieldset>
        <legend>Sex</legend>
        <Radio name="sex" value="f" label="Female" onChange={onChange} />
        <Radio name="sex" value="m" label="Male" onChange={onChange} />
      </fieldset>,
    );
    const female = screen.getByLabelText<HTMLInputElement>('Female');
    const male = screen.getByLabelText<HTMLInputElement>('Male');
    fireEvent.click(female);
    fireEvent.click(male);
    expect(female.checked).toBe(false);
    expect(male.checked).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('group', { name: 'Sex' })).toBeTruthy();
  });

  it('honours defaultChecked', () => {
    render(<Radio name="sex" value="f" label="Female" defaultChecked />);
    expect(screen.getByLabelText<HTMLInputElement>('Female').checked).toBe(
      true,
    );
  });

  it('honours a controlled group', () => {
    function Group() {
      const [value, setValue] = useState('m');
      return (
        <>
          {[
            ['f', 'Female'],
            ['m', 'Male'],
          ].map(([v, label]) => (
            <Radio
              key={v}
              name="sex"
              value={v}
              label={label ?? v}
              checked={value === v}
              onChange={() => setValue(v ?? '')}
            />
          ))}
        </>
      );
    }
    render(<Group />);
    expect(screen.getByLabelText<HTMLInputElement>('Male').checked).toBe(true);
    fireEvent.click(screen.getByLabelText('Female'));
    expect(screen.getByLabelText<HTMLInputElement>('Female').checked).toBe(
      true,
    );
    expect(screen.getByLabelText<HTMLInputElement>('Male').checked).toBe(false);
  });

  it('blocks the handler while disabled', () => {
    const onChange = vi.fn();
    render(
      <Radio
        name="sex"
        value="f"
        label="Female"
        disabled
        onChange={onChange}
      />,
    );
    const radio = screen.getByLabelText<HTMLInputElement>('Female');
    expect(radio.disabled).toBe(true);
    fireEvent.click(radio);
    fireEvent.click(screen.getByText('Female'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows its checked state with a shape, not colour alone', () => {
    render(<Radio name="sex" label="Female" />);
    const radio = screen.getByLabelText('Female');
    const dot = radio.parentElement?.querySelector('svg');
    expect(dot?.getAttribute('aria-hidden')).toBe('true');
    expect(radio.classList).toContain('peer');
    expect(dot?.getAttribute('class')).toContain('peer-checked:opacity-100');
  });

  it('forwards its ref and is a nova-field control', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Radio name="sex" label="Female" ref={ref} />);
    const radio = screen.getByLabelText('Female');
    expect(ref.current).toBe(radio);
    expect(radio.classList).toContain('nova-field');
  });

  it('puts className on the wrapper, not the input', () => {
    render(<Radio name="sex" label="Female" className="mt-4" />);
    const radio = screen.getByLabelText('Female');
    expect(radio.className).not.toContain('mt-4');
    expect(radio.closest('.mt-4')).not.toBeNull();
  });
});

describe('Radio, Apple-refined', () => {
  it('gives the row a 44px minimum touch target and the prototype 13.5px label text', () => {
    render(<Radio name="triage" label="Ramesh consents" />);
    const control = screen.getByLabelText('Ramesh consents');
    const row = control.closest('div') as HTMLElement;
    expect(row.classList).toContain('min-h-11');
    const label = screen.getByText('Ramesh consents');
    expect(label.classList).toContain('text-[13.5px]');
    expect(label.className).not.toMatch(/text-sm/);
  });
});

describe('Radio shape', () => {
  it('is a circle with a plain border-radius, as every prototype corner is', () => {
    render(<Radio name="triage" label="Red" />);
    const input = screen.getByLabelText('Red');
    expect(input.classList).toContain('rounded-full');
    expect(input.className).not.toMatch(/corner-shape/);
  });
});
