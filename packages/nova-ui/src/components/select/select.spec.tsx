import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Select } from './select';

afterEach(() => cleanup());

const wards = [
  { value: 'gen', label: 'General ward' },
  { value: 'icu', label: 'ICU' },
  { value: 'iso', label: 'Isolation', disabled: true },
];

function describedByIds(element: Element): string[] {
  return (element.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter(Boolean);
}

describe('Select', () => {
  it('is a native <select> found by its label', () => {
    render(<Select label="Ward" options={wards} />);
    const select = screen.getByLabelText('Ward');
    expect(select).toBeInstanceOf(HTMLSelectElement);
    expect(screen.getByText('Ward').getAttribute('for')).toBe(select.id);
    expect(screen.getByRole('combobox', { name: 'Ward' })).toBe(select);
  });

  it('lets a caller-supplied id win', () => {
    render(<Select id="ward" label="Ward" options={wards} hint="Where now" />);
    expect(screen.getByLabelText('Ward').id).toBe('ward');
    expect(screen.getByText('Where now').id).toBe('ward-hint');
  });

  it('renders every option in order with its value and label', () => {
    render(<Select label="Ward" options={wards} />);
    const options = screen
      .getAllByRole<HTMLOptionElement>('option')
      .map((option) => [option.value, option.textContent]);
    expect(options).toEqual([
      ['gen', 'General ward'],
      ['icu', 'ICU'],
      ['iso', 'Isolation'],
    ]);
  });

  it('changes value when the user selects an option', () => {
    const onChange = vi.fn();
    render(<Select label="Ward" options={wards} onChange={onChange} />);
    const select = screen.getByLabelText<HTMLSelectElement>('Ward');
    fireEvent.change(select, { target: { value: 'icu' } });
    expect(select.value).toBe('icu');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('works as a controlled select', () => {
    function Controlled() {
      const [value, setValue] = useState('gen');
      return (
        <Select
          label="Ward"
          options={wards}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      );
    }
    render(<Controlled />);
    const select = screen.getByLabelText<HTMLSelectElement>('Ward');
    expect(select.value).toBe('gen');
    fireEvent.change(select, { target: { value: 'icu' } });
    expect(select.value).toBe('icu');
  });

  it('marks a disabled option disabled and leaves the others enabled', () => {
    render(<Select label="Ward" options={wards} />);
    expect(
      screen.getByRole<HTMLOptionElement>('option', { name: 'Isolation' })
        .disabled,
    ).toBe(true);
    expect(
      screen.getByRole<HTMLOptionElement>('option', { name: 'ICU' }).disabled,
    ).toBe(false);
  });

  it('honours defaultValue', () => {
    render(<Select label="Ward" options={wards} defaultValue="icu" />);
    expect(screen.getByLabelText<HTMLSelectElement>('Ward').value).toBe('icu');
  });
});

describe('Select placeholder', () => {
  it('shows the placeholder first and selected, with an empty value', () => {
    render(<Select label="Ward" options={wards} placeholder="Choose a ward" />);
    const select = screen.getByLabelText<HTMLSelectElement>('Ward');
    expect(select.value).toBe('');
    const first = select.options[0];
    expect(first?.textContent).toBe('Choose a ward');
    expect(first?.value).toBe('');
  });

  it('does not let a defaultValue be overridden by the placeholder', () => {
    render(
      <Select
        label="Ward"
        options={wards}
        placeholder="Choose a ward"
        defaultValue="icu"
      />,
    );
    expect(screen.getByLabelText<HTMLSelectElement>('Ward').value).toBe('icu');
  });

  it('is not selectable when the field is required, so it cannot satisfy the requirement', () => {
    render(
      <Select
        label="Ward"
        options={wards}
        placeholder="Choose a ward"
        required
      />,
    );
    const select = screen.getByLabelText<HTMLSelectElement>('Ward');
    expect(select.required).toBe(true);
    expect(select.options[0]?.disabled).toBe(true);
  });

  it('stays selectable on an optional field so the choice can be cleared', () => {
    render(<Select label="Ward" options={wards} placeholder="No preference" />);
    expect(
      screen.getByLabelText<HTMLSelectElement>('Ward').options[0]?.disabled,
    ).toBe(false);
  });

  it('renders no extra option without a placeholder', () => {
    render(<Select label="Ward" options={wards} />);
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });
});

describe('Select error', () => {
  it('announces an error with aria-invalid and aria-describedby, and takes a crit border', () => {
    render(<Select label="Ward" options={wards} error="Pick a ward" />);
    const select = screen.getByLabelText('Ward');
    const message = screen.getByText('Pick a ward');
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(describedByIds(select)).toContain(message.id);
    expect(select.classList.contains('nova-field')).toBe(true);
    expect(select.className).not.toMatch(/border-/);
  });

  it('describes by the hint first, then the error', () => {
    render(
      <Select
        label="Ward"
        options={wards}
        hint="Where now"
        error="Pick a ward"
      />,
    );
    expect(describedByIds(screen.getByLabelText('Ward'))).toEqual([
      screen.getByText('Where now').id,
      screen.getByText('Pick a ward').id,
    ]);
  });

  it('is neither invalid nor described when there is no hint and no error', () => {
    render(<Select label="Ward" options={wards} />);
    const select = screen.getByLabelText('Ward');
    expect(select.getAttribute('aria-invalid')).toBeNull();
    expect(select.getAttribute('aria-describedby')).toBeNull();
  });
});

describe('Select element', () => {
  it('forwards its ref and is a nova-field control', () => {
    const ref = createRef<HTMLSelectElement>();
    render(<Select label="Ward" options={wards} ref={ref} />);
    const select = screen.getByLabelText('Ward');
    expect(ref.current).toBe(select);
    expect(select.classList).toContain('nova-field');
  });

  it('draws a decorative chevron', () => {
    render(<Select label="Ward" options={wards} />);
    const select = screen.getByLabelText('Ward');
    const chevron = select.parentElement?.querySelector('svg');
    expect(chevron?.getAttribute('aria-hidden')).toBe('true');
  });

  it('passes disabled through and puts className on the wrapper', () => {
    render(
      <Select label="Ward" options={wards} disabled className="max-w-xs" />,
    );
    const select = screen.getByLabelText<HTMLSelectElement>('Ward');
    expect(select.disabled).toBe(true);
    expect(select.className).not.toContain('max-w-xs');
    expect(select.closest('.max-w-xs')).not.toBeNull();
  });
});

describe('Select, Apple-refined', () => {
  it('follows the input spec: body 17, padded 16 x 12, radius md', () => {
    render(<Select label="Ward" options={[{ value: 'a', label: 'A' }]} />);
    const select = screen.getByLabelText('Ward');
    expect([...select.classList]).toEqual(
      expect.arrayContaining(['text-[13.5px]', 'pl-2.5', 'py-2', 'rounded-sm']),
    );
    expect(select.className).not.toMatch(/\bh-10\b|text-sm/);
  });
});
