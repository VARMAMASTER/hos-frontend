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

  it('forwards its ref to the underlying <button>', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
