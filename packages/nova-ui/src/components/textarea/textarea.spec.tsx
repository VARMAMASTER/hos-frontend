import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Textarea } from './textarea';

afterEach(() => cleanup());

function describedByIds(element: Element): string[] {
  return (element.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter(Boolean);
}

describe('Textarea', () => {
  it('is a real <textarea> found by its label', () => {
    render(<Textarea label="Presenting complaint" />);
    const field = screen.getByLabelText('Presenting complaint');
    expect(field).toBeInstanceOf(HTMLTextAreaElement);
    expect(screen.getByText('Presenting complaint').getAttribute('for')).toBe(
      field.id,
    );
  });

  it('lets a caller-supplied id win', () => {
    render(<Textarea id="notes" label="Notes" hint="Keep it brief" />);
    expect(screen.getByLabelText('Notes').id).toBe('notes');
    expect(screen.getByText('Keep it brief').id).toBe('notes-hint');
  });

  it('announces an error with aria-invalid and aria-describedby, and takes a crit border', () => {
    render(<Textarea label="Notes" error="Add at least one line" />);
    const field = screen.getByLabelText('Notes');
    const message = screen.getByText('Add at least one line');
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(describedByIds(field)).toContain(message.id);
    expect(field.classList.contains('nova-field')).toBe(true);
    expect(field.className).not.toMatch(/border-/);
  });

  it('is neither invalid nor described when there is no hint and no error', () => {
    render(<Textarea label="Notes" />);
    const field = screen.getByLabelText('Notes');
    expect(field.getAttribute('aria-invalid')).toBeNull();
    expect(field.getAttribute('aria-describedby')).toBeNull();
  });

  it('uses the native required attribute', () => {
    render(<Textarea label="Notes" required />);
    expect(screen.getByLabelText<HTMLTextAreaElement>('Notes').required).toBe(
      true,
    );
  });

  it('defaults to 3 rows and honours an explicit rows', () => {
    const { rerender } = render(<Textarea label="Notes" />);
    expect(screen.getByLabelText<HTMLTextAreaElement>('Notes').rows).toBe(3);
    rerender(<Textarea label="Notes" rows={6} />);
    expect(screen.getByLabelText<HTMLTextAreaElement>('Notes').rows).toBe(6);
  });

  it('accepts multi-line typing and reports the change', () => {
    const onChange = vi.fn();
    render(<Textarea label="Notes" onChange={onChange} />);
    const field = screen.getByLabelText<HTMLTextAreaElement>('Notes');
    fireEvent.change(field, { target: { value: 'Ramesh\nstable' } });
    expect(field.value).toBe('Ramesh\nstable');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('forwards its ref and is a nova-field control', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea label="Notes" ref={ref} />);
    const field = screen.getByLabelText('Notes');
    expect(ref.current).toBe(field);
    expect(field.classList).toContain('nova-field');
  });

  it('puts className on the wrapper, not the textarea', () => {
    render(<Textarea label="Notes" className="max-w-md" />);
    const field = screen.getByLabelText('Notes');
    expect(field.className).not.toContain('max-w-md');
    expect(field.closest('.max-w-md')).not.toBeNull();
  });
});

describe('Textarea, the prototype form control', () => {
  it('follows the .f-input spec: 13.5px, padded 10 x 8, radius sm', () => {
    render(<Textarea label="Notes" />);
    const field = screen.getByLabelText('Notes');
    expect([...field.classList]).toEqual(
      expect.arrayContaining(['text-[13.5px]', 'px-2.5', 'py-2', 'rounded-sm']),
    );
    expect(field.className).not.toMatch(/text-sm/);
  });
});
