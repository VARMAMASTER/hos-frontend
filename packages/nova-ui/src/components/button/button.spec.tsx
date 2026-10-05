import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Button } from './button';

afterEach(() => cleanup());

describe('Button', () => {
  it('defaults to type="button" so it never submits a surrounding form by accident', () => {
    render(
      <form>
        <Button>Save</Button>
      </form>,
    );
    expect(
      screen.getByRole('button', { name: 'Save' }).getAttribute('type'),
    ).toBe('button');
  });

  it('calls onClick when pressed', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick while disabled', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('stays focusable but does nothing while aria-disabled, so focus is never dropped', () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" aria-disabled onClick={onClick}>
          Save
        </Button>
      </form>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    button.focus();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('exposes its variant and size, defaulting to primary / md', () => {
    render(
      <>
        <Button>Default</Button>
        <Button variant="ai" size="sm">
          Draft
        </Button>
      </>,
    );
    const fallback = screen.getByRole('button', { name: 'Default' });
    expect([fallback.dataset['variant'], fallback.dataset['size']]).toEqual([
      'primary',
      'md',
    ]);
    const ai = screen.getByRole('button', { name: 'Draft' });
    expect([ai.dataset['variant'], ai.dataset['size']]).toEqual(['ai', 'sm']);
  });

  // The secondary button's border is its only boundary, so it takes the control border that
  // material.spec.ts proves at 3:1, not the decorative border-strong.
  it('draws the secondary variant with the 3:1 control border', () => {
    render(<Button variant="secondary">Edit</Button>);
    const button = screen.getByRole('button', { name: 'Edit' });
    expect(button.classList.contains('border-border-control')).toBe(true);
    expect(button.classList.contains('border-border-strong')).toBe(false);
  });

  it('forwards its ref to the underlying <button>', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
