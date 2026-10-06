import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TextField } from './text-field';

afterEach(() => cleanup());

function describedByIds(element: Element): string[] {
  return (element.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter(Boolean);
}

describe('TextField label', () => {
  it('is found by its label text and is a text input by default', () => {
    render(<TextField label="Patient name" />);
    const input = screen.getByLabelText('Patient name');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.getAttribute('type')).toBe('text');
  });

  it('ties the <label> to the input by id when the caller gives none', () => {
    render(<TextField label="Patient name" />);
    const input = screen.getByLabelText('Patient name');
    const label = screen.getByText('Patient name');
    expect(label.tagName).toBe('LABEL');
    expect(input.id).not.toBe('');
    expect(label.getAttribute('for')).toBe(input.id);
  });

  it('generates a distinct id for every field', () => {
    render(
      <>
        <TextField label="First" />
        <TextField label="Second" />
      </>,
    );
    expect(screen.getByLabelText('First').id).not.toBe(
      screen.getByLabelText('Second').id,
    );
  });

  it('lets a caller-supplied id win, and derives the hint and error ids from it', () => {
    render(
      <TextField
        id="mrn"
        label="MRN"
        hint="Printed on the wristband"
        error="No such record"
      />,
    );
    const input = screen.getByLabelText('MRN');
    expect(input.id).toBe('mrn');
    expect(screen.getByText('MRN').getAttribute('for')).toBe('mrn');
    expect(screen.getByText('Printed on the wristband').id).toBe('mrn-hint');
    expect(screen.getByText('No such record').id).toBe('mrn-error');
  });
});

describe('TextField required', () => {
  it('uses the native required attribute, not only an asterisk', () => {
    render(<TextField label="Phone" required />);
    const input = screen.getByLabelText<HTMLInputElement>('Phone');
    expect(input.required).toBe(true);
  });

  it('draws the asterisk outside the <label> and hides it from assistive tech', () => {
    render(<TextField label="Phone" required />);
    // getByLabelText('Phone') above only matches because the asterisk is not part of the label text.
    const star = screen.getByText('*');
    expect(star.getAttribute('aria-hidden')).toBe('true');
    expect(star.closest('label')).toBeNull();
  });

  it('shows no asterisk and no required attribute when not required', () => {
    render(<TextField label="Phone" />);
    expect(screen.queryByText('*')).toBeNull();
    expect(screen.getByLabelText<HTMLInputElement>('Phone').required).toBe(
      false,
    );
  });
});

describe('TextField error', () => {
  it('announces the error: aria-invalid plus aria-describedby pointing at the message', () => {
    render(<TextField label="Phone" error="Enter a 10-digit number" />);
    const input = screen.getByLabelText('Phone');
    const message = screen.getByText('Enter a 10-digit number');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(message.id).not.toBe('');
    expect(describedByIds(input)).toContain(message.id);
  });

  // nova-field turns its own edge crit on aria-invalid (utilities.spec.ts), so the control carries
  // no border class of its own to fight the utility with.
  it('takes the crit edge through aria-invalid when invalid, and no border override either way', () => {
    const { rerender } = render(<TextField label="Phone" />);
    expect(screen.getByLabelText('Phone').hasAttribute('aria-invalid')).toBe(
      false,
    );
    expect(screen.getByLabelText('Phone').className).not.toMatch(/border-/);
    rerender(<TextField label="Phone" error="Required" />);
    const input = screen.getByLabelText('Phone');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.classList.contains('nova-field')).toBe(true);
    expect(input.className).not.toMatch(/border-/);
    expect(input.dataset['invalid']).toBe('true');
  });

  it('is neither invalid nor described when there is no hint and no error', () => {
    render(<TextField label="Phone" />);
    const input = screen.getByLabelText('Phone');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBeNull();
    expect(input.dataset['invalid']).toBeUndefined();
  });

  it('does not use colour alone: the message is text with a decorative icon', () => {
    render(<TextField label="Phone" error="Enter a 10-digit number" />);
    const message = screen.getByText('Enter a 10-digit number');
    const icon = message.querySelector('svg');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    // The icon adds no text, so the description is exactly the message.
    expect(message.textContent).toBe('Enter a 10-digit number');
  });

  it('renders the error inside a polite live region that exists before the error does', () => {
    const { container, rerender } = render(<TextField label="Phone" />);
    const region = container.querySelector('[aria-live="polite"]');
    expect(region).not.toBeNull();
    expect(region?.textContent).toBe('');
    rerender(<TextField label="Phone" error="Required" />);
    expect(container.querySelector('[aria-live="polite"]')).toBe(region);
    expect(region?.textContent).toBe('Required');
  });
});

describe('TextField hint', () => {
  it('describes the field by its hint', () => {
    render(<TextField label="MRN" hint="Printed on the wristband" />);
    const input = screen.getByLabelText('MRN');
    expect(describedByIds(input)).toEqual([
      screen.getByText('Printed on the wristband').id,
    ]);
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('describes by the hint first, then the error', () => {
    render(
      <TextField label="MRN" hint="Printed on the wristband" error="Bad" />,
    );
    expect(describedByIds(screen.getByLabelText('MRN'))).toEqual([
      screen.getByText('Printed on the wristband').id,
      screen.getByText('Bad').id,
    ]);
  });

  it("keeps the caller's own aria-describedby ahead of the hint and error", () => {
    render(
      <>
        <p id="ward-note">Ward policy applies</p>
        <TextField
          label="MRN"
          hint="Printed on the wristband"
          aria-describedby="ward-note"
        />
      </>,
    );
    expect(describedByIds(screen.getByLabelText('MRN'))).toEqual([
      'ward-note',
      screen.getByText('Printed on the wristband').id,
    ]);
  });
});

describe('TextField input behaviour', () => {
  it('accepts typing and reports the change', () => {
    const onChange = vi.fn();
    render(<TextField label="Patient name" onChange={onChange} />);
    const input = screen.getByLabelText<HTMLInputElement>('Patient name');
    fireEvent.change(input, { target: { value: 'Ramesh' } });
    expect(input.value).toBe('Ramesh');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('works as a controlled input', () => {
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <TextField
          label="Patient name"
          value={value}
          onChange={(event) => setValue(event.target.value.toUpperCase())}
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByLabelText<HTMLInputElement>('Patient name');
    fireEvent.change(input, { target: { value: 'Ramesh' } });
    expect(input.value).toBe('RAMESH');
  });

  it('passes native attributes through to the <input>', () => {
    render(
      <TextField
        label="Email"
        type="email"
        name="email"
        placeholder="name@hospital.in"
        autoComplete="email"
        disabled
      />,
    );
    const input = screen.getByLabelText<HTMLInputElement>('Email');
    expect(input.type).toBe('email');
    expect(input.name).toBe('email');
    expect(input.placeholder).toBe('name@hospital.in');
    expect(input.autocomplete).toBe('email');
    expect(input.disabled).toBe(true);
  });

  it('forwards its ref to the underlying <input>', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextField label="Patient name" ref={ref} />);
    expect(ref.current).toBe(screen.getByLabelText('Patient name'));
  });

  it('puts className on the wrapper, not the input', () => {
    render(<TextField label="Patient name" className="max-w-sm" />);
    const input = screen.getByLabelText('Patient name');
    expect(input.className).not.toContain('max-w-sm');
    expect(input.closest('.max-w-sm')).not.toBeNull();
  });

  it('is a nova-field control', () => {
    render(<TextField label="Patient name" />);
    expect(screen.getByLabelText('Patient name').classList).toContain(
      'nova-field',
    );
  });
});

describe('TextField icons', () => {
  it('renders leading and trailing icons as decorative, outside the accessible name', () => {
    render(
      <TextField
        label="Search"
        leadingIcon={<svg data-testid="lead" />}
        trailingIcon={<svg data-testid="trail" />}
      />,
    );
    expect(
      screen.getByTestId('lead').closest('[aria-hidden="true"]'),
    ).not.toBeNull();
    expect(
      screen.getByTestId('trail').closest('[aria-hidden="true"]'),
    ).not.toBeNull();
    expect(screen.getByLabelText('Search')).toBeInstanceOf(HTMLInputElement);
  });

  it('makes room for each icon only when it is present', () => {
    const { rerender } = render(<TextField label="Search" />);
    const plain = screen.getByLabelText('Search').classList;
    expect([...plain]).toEqual(expect.arrayContaining(['pl-4', 'pr-4']));
    expect(plain).not.toContain('pl-12');
    rerender(
      <TextField label="Search" leadingIcon={<svg />} trailingIcon={<svg />} />,
    );
    const withIcons = screen.getByLabelText('Search').classList;
    expect([...withIcons]).toEqual(expect.arrayContaining(['pl-12', 'pr-12']));
    expect(withIcons).not.toContain('pl-4');
    expect(withIcons).not.toContain('pr-4');
  });
});

describe('TextField, Apple-refined', () => {
  it('sets the label at 600 callout, the field at body 17 padded 16 x 12 on radius md, and the hint at caption', () => {
    render(<TextField label="Patient" hint="As on the ID card" />);
    const label = screen.getByText('Patient');
    expect([...label.classList]).toEqual(
      expect.arrayContaining(['text-callout', 'font-semibold']),
    );
    const input = screen.getByLabelText('Patient');
    expect([...input.classList]).toEqual(
      expect.arrayContaining(['text-body', 'py-3', 'rounded-md']),
    );
    expect(input.className).not.toMatch(/\bh-10\b|text-sm/);
    expect(screen.getByText('As on the ID card').classList).toContain(
      'text-caption',
    );
  });

  it('draws the error line at caption in crit', () => {
    render(<TextField label="Patient" error="Enter the full name of Ramesh" />);
    const error = screen.getByText('Enter the full name of Ramesh');
    expect([...error.classList]).toEqual(
      expect.arrayContaining(['text-caption', 'text-crit-deep']),
    );
  });

  it('sizes the decorative icons at 18px', () => {
    render(
      <TextField label="Search" leadingIcon={<svg data-testid="lead" />} />,
    );
    const slot = screen.getByTestId('lead').parentElement as HTMLElement;
    expect(slot.classList).toContain('[&_svg]:size-4.5');
  });
});
