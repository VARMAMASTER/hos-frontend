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

  // The outline button's border is its only boundary, so it takes the brand primary, which
  // material.spec.ts proves at 3:1 on every surface and the bare canvas for any hospital brand.
  it('draws the outline variant with a 1px primary border and the strong primary text', () => {
    render(<Button variant="outline">Edit</Button>);
    const button = screen.getByRole('button', { name: 'Edit' });
    expect(button.dataset['variant']).toBe('outline');
    for (const name of ['border', 'border-primary', 'text-primary-strong']) {
      expect(button.classList.contains(name), name).toBe(true);
    }
    expect(button.classList.contains('border-border-strong')).toBe(false);
  });

  it('keeps secondary as a deprecated alias that renders the outline button', () => {
    render(<Button variant="secondary">Edit</Button>);
    const button = screen.getByRole('button', { name: 'Edit' });
    expect(button.dataset['variant']).toBe('outline');
    expect(button.classList.contains('border-primary')).toBe(true);
  });

  it('draws the danger variant as a crit fill with white text', () => {
    render(<Button variant="danger">Discharge</Button>);
    const button = screen.getByRole('button', { name: 'Discharge' });
    expect(button.dataset['variant']).toBe('danger');
    expect(button.classList.contains('bg-crit')).toBe(true);
    expect(button.classList.contains('text-on-primary')).toBe(true);
  });

  // Generated content with empty alternative text: the spark is seen, never read, and the
  // button's text stays the caller's own words.
  it('marks the ai variant with the spark, kept out of the accessible name and the text', () => {
    render(
      <>
        <Button variant="ai">Draft summary</Button>
        <Button>Plain</Button>
      </>,
    );
    const button = screen.getByRole('button', { name: 'Draft summary' });
    expect(button.textContent).toBe('Draft summary');
    const label = screen.getByText('Draft summary');
    expect(label.classList).toContain("before:content-['✦'_/_'']");
    expect(screen.getByText('Plain').className).not.toMatch(/content-/);
  });

  describe('Apple pill CTA', () => {
    it('is a pill with a regular-weight label: the shape, not the weight, carries emphasis', () => {
      render(
        <>
          <Button>Admit</Button>
          <Button size="sm">Hold</Button>
        </>,
      );
      const md = screen.getByRole('button', { name: 'Admit' });
      const sm = screen.getByRole('button', { name: 'Hold' });
      for (const button of [md, sm]) {
        expect(button.classList.contains('rounded-full')).toBe(true);
        expect(button.classList.contains('font-normal')).toBe(true);
        expect(button.className).not.toMatch(/font-(?:medium|semibold|bold)/);
      }
      expect([...md.classList]).toEqual(
        expect.arrayContaining(['px-6', 'py-3', 'text-body']),
      );
      expect(sm.classList.contains('text-callout')).toBe(true);
    });

    it.each(['primary', 'outline', 'ghost', 'danger', 'ai'] as const)(
      'paints the %s variant with no shadow and no gradient',
      (variant) => {
        render(<Button variant={variant}>Go</Button>);
        const { className } = screen.getByRole('button', { name: 'Go' });
        expect(className).not.toMatch(/shadow|gradient/);
      },
    );

    it('presses to scale(0.95), only when the user has not asked for reduced motion', () => {
      render(<Button>Go</Button>);
      const button = screen.getByRole('button', { name: 'Go' });
      expect(button.classList.contains('motion-safe:active:scale-95')).toBe(
        true,
      );
      expect(button.classList.contains('active:scale-95')).toBe(false);
    });

    it('stretches to its container with fullWidth', () => {
      render(
        <>
          <Button fullWidth>Wide</Button>
          <Button>Snug</Button>
        </>,
      );
      expect(
        screen
          .getByRole('button', { name: 'Wide' })
          .classList.contains('w-full'),
      ).toBe(true);
      expect(
        screen
          .getByRole('button', { name: 'Snug' })
          .classList.contains('w-full'),
      ).toBe(false);
    });
  });

  describe('loading', () => {
    it('is busy, keeps its name, and ignores presses so nothing is submitted twice', () => {
      const onClick = vi.fn();
      const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
        event.preventDefault(),
      );
      render(
        <form onSubmit={onSubmit}>
          <Button type="submit" loading onClick={onClick}>
            Save
          </Button>
        </form>,
      );
      const button = screen.getByRole('button', { name: 'Save' });
      expect(button.getAttribute('aria-busy')).toBe('true');
      button.focus();
      fireEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(button);
    });

    it('swaps the label for a spinner without changing the width', () => {
      const { rerender } = render(<Button>Save</Button>);
      const button = screen.getByRole('button', { name: 'Save' });
      expect(button.querySelector('[data-spinner]')).toBeNull();
      expect(button.getAttribute('aria-busy')).toBeNull();
      rerender(<Button loading>Save</Button>);
      const spinner = button.querySelector('[data-spinner]');
      expect(spinner?.getAttribute('aria-hidden')).toBe('true');
      // The label stays in the layout (and in the accessible name), only invisible, so the
      // button keeps its width; the spinner sits over it.
      const label = screen.getByText('Save');
      expect(label.classList.contains('opacity-0')).toBe(true);
      expect(label.classList.contains('invisible')).toBe(false);
      expect(spinner?.classList.contains('absolute')).toBe(true);
    });
  });

  it('forwards its ref to the underlying <button>', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
