import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { Tooltip, type TooltipProps } from './tooltip';

afterEach(() => cleanup());

function renderTooltip(props: Partial<TooltipProps> = {}) {
  render(
    <Tooltip content="Hold for 10 seconds" {...props}>
      <button type="button">Hold</button>
    </Tooltip>,
  );
  return screen.getByRole('button', { name: 'Hold' });
}

describe('Tooltip visibility', () => {
  it('is hidden until the trigger is hovered or focused', () => {
    const trigger = renderTooltip();
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(screen.queryByText('Hold for 10 seconds')).toBeNull();
    expect(trigger.getAttribute('aria-describedby')).toBeNull();
  });

  it('shows on focus, so keyboard users get it too', () => {
    const trigger = renderTooltip();
    act(() => trigger.focus());
    expect(screen.getByRole('tooltip').textContent).toBe('Hold for 10 seconds');
  });

  it('shows on hover', () => {
    const trigger = renderTooltip();
    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole('tooltip').textContent).toBe('Hold for 10 seconds');
  });

  it('hides on blur and on mouse leave', () => {
    const trigger = renderTooltip();
    act(() => trigger.focus());
    act(() => trigger.blur());
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseOut(trigger, { relatedTarget: document.body });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('stays while either hover or focus is still present', () => {
    const trigger = renderTooltip();
    act(() => trigger.focus());
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseOut(trigger, { relatedTarget: document.body });
    expect(screen.queryByRole('tooltip')).not.toBeNull();
    act(() => trigger.blur());
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('stays open while the pointer moves from the trigger onto the tooltip (hoverable)', () => {
    const trigger = renderTooltip();
    fireEvent.mouseEnter(trigger);
    const tip = screen.getByRole('tooltip');
    fireEvent.mouseOut(trigger, { relatedTarget: tip });
    expect(screen.queryByRole('tooltip')).not.toBeNull();
    fireEvent.mouseOut(tip, { relatedTarget: document.body });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});

describe('Tooltip Escape', () => {
  it('hides on Escape while the trigger keeps focus', () => {
    const trigger = renderTooltip();
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute('aria-describedby')).toBeNull();
  });

  it('comes back when the trigger is engaged again', () => {
    const trigger = renderTooltip();
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: 'Escape' });
    act(() => trigger.blur());
    act(() => trigger.focus());
    expect(screen.queryByRole('tooltip')).not.toBeNull();
  });

  it('stays dismissed while the pointer is still over it, until it re-enters', () => {
    const trigger = renderTooltip();
    fireEvent.mouseEnter(trigger);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.mouseOut(trigger, { relatedTarget: document.body });
    fireEvent.mouseEnter(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeNull();
  });

  it('dismisses before any enclosing layer sees Escape, so a dialog around it stays open', () => {
    const enclosing = vi.fn();
    document.addEventListener('keydown', enclosing);
    try {
      const trigger = renderTooltip();
      act(() => trigger.focus());
      fireEvent.keyDown(trigger, { key: 'Escape' });
      expect(screen.queryByRole('tooltip')).toBeNull();
      expect(enclosing).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', enclosing);
    }
  });

  it('does not swallow Escape when no tooltip is showing', () => {
    const enclosing = vi.fn();
    document.addEventListener('keydown', enclosing);
    try {
      const trigger = renderTooltip();
      act(() => trigger.focus());
      fireEvent.keyDown(trigger, { key: 'Escape' });
      enclosing.mockClear();
      expect(fireEvent.keyDown(trigger, { key: 'Escape' })).toBe(true);
      expect(enclosing).toHaveBeenCalledTimes(1);
    } finally {
      document.removeEventListener('keydown', enclosing);
    }
  });

  it('ignores other keys', () => {
    const trigger = renderTooltip();
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: 'a' });
    expect(screen.queryByRole('tooltip')).not.toBeNull();
  });
});

describe('Tooltip accessibility link', () => {
  it('points the trigger aria-describedby at the tooltip', () => {
    const trigger = renderTooltip();
    act(() => trigger.focus());
    const tip = screen.getByRole('tooltip');
    expect(tip.id).not.toBe('');
    expect(trigger.getAttribute('aria-describedby')).toBe(tip.id);
  });

  it('keeps a description the trigger already had, ahead of the tooltip', () => {
    render(
      <Tooltip content="Hold for 10 seconds">
        <button type="button" aria-describedby="shift-note">
          Hold
        </button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Hold' });
    expect(trigger.getAttribute('aria-describedby')).toBe('shift-note');
    act(() => trigger.focus());
    expect(trigger.getAttribute('aria-describedby')).toBe(
      `shift-note ${screen.getByRole('tooltip').id}`,
    );
  });

  it('gives each tooltip its own id', () => {
    render(
      <>
        <Tooltip content="First tip">
          <button type="button">One</button>
        </Tooltip>
        <Tooltip content="Second tip">
          <button type="button">Two</button>
        </Tooltip>
      </>,
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'One' }));
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Two' }));
    const [first, second] = screen.getAllByRole('tooltip');
    expect(first?.id).not.toBe(second?.id);
  });

  it('keeps the trigger interactive: its own handlers still run', () => {
    const onClick = vi.fn();
    render(
      <Tooltip content="Hold for 10 seconds">
        <button type="button" onClick={onClick}>
          Hold
        </button>
      </Tooltip>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Hold' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Tooltip placement and material', () => {
  it('sits above the trigger by default', () => {
    const trigger = renderTooltip();
    fireEvent.mouseEnter(trigger);
    const tip = screen.getByRole('tooltip');
    expect(tip.dataset['placement']).toBe('top');
    expect(tip.classList).toContain('bottom-full');
    expect(tip.classList).not.toContain('top-full');
  });

  it('can sit below the trigger', () => {
    const trigger = renderTooltip({ placement: 'bottom' });
    fireEvent.mouseEnter(trigger);
    const tip = screen.getByRole('tooltip');
    expect(tip.dataset['placement']).toBe('bottom');
    expect(tip.classList).toContain('top-full');
    expect(tip.classList).not.toContain('bottom-full');
  });

  it('leaves no gap between trigger and tooltip for the pointer to fall through', () => {
    const trigger = renderTooltip();
    fireEvent.mouseEnter(trigger);
    // Padding on the positioned box (inside the hover area) rather than a margin outside it.
    expect(screen.getByRole('tooltip').classList).toContain('pb-2');
  });

  it('draws the tooltip on the nova-overlay material', () => {
    const trigger = renderTooltip();
    fireEvent.mouseEnter(trigger);
    expect(
      screen.getByRole('tooltip').querySelector('.nova-overlay'),
    ).not.toBeNull();
  });

  it('accepts rich content and a wrapper className', () => {
    render(
      <Tooltip content={<strong>Critical</strong>} className="ml-2">
        <button type="button">Hold</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Hold' });
    fireEvent.mouseEnter(trigger);
    expect(
      screen.getByRole('tooltip').querySelector('strong')?.textContent,
    ).toBe('Critical');
    expect(trigger.closest('.ml-2')).not.toBeNull();
  });
});
