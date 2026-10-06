import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { Switch } from './switch';

afterEach(() => cleanup());

describe('Switch semantics', () => {
  it('exposes role="switch" named by its label, off by default', () => {
    render(<Switch label="SMS reminders" />);
    const toggle = screen.getByRole('switch', { name: 'SMS reminders' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  it('is a real <button type="button">, so Space and Enter activate it natively', () => {
    render(
      <form>
        <Switch label="SMS reminders" />
      </form>,
    );
    const toggle = screen.getByRole('switch');
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle.getAttribute('type')).toBe('button');
    act(() => toggle.focus());
    expect(document.activeElement).toBe(toggle);
    expect(toggle.getAttribute('tabindex')).toBeNull();
  });

  it('does not swallow Space or Enter, which would break the native activation', () => {
    render(<Switch label="SMS reminders" />);
    const toggle = screen.getByRole('switch');
    // fireEvent returns false when a handler called preventDefault.
    expect(fireEvent.keyDown(toggle, { key: 'Enter' })).toBe(true);
    expect(fireEvent.keyDown(toggle, { key: ' ' })).toBe(true);
    expect(fireEvent.keyUp(toggle, { key: ' ' })).toBe(true);
  });

  it('ties the <label> to the switch by a generated id, and lets a caller id win', () => {
    const { rerender } = render(<Switch label="SMS reminders" />);
    const generated = screen.getByRole('switch');
    expect(generated.id).not.toBe('');
    expect(screen.getByText('SMS reminders').getAttribute('for')).toBe(
      generated.id,
    );
    rerender(<Switch id="sms" label="SMS reminders" />);
    expect(screen.getByRole('switch').id).toBe('sms');
    expect(screen.getByText('SMS reminders').getAttribute('for')).toBe('sms');
  });

  it('keeps the thumb decorative and shows state by position, not colour alone', () => {
    render(<Switch label="SMS reminders" />);
    const thumb = screen.getByRole('switch').querySelector('span');
    expect(thumb?.getAttribute('aria-hidden')).toBe('true');
    expect(thumb?.getAttribute('class')).toContain(
      'group-aria-checked:translate-x',
    );
  });
});

describe('Switch behaviour', () => {
  it('toggles on click and reports the new state', () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="SMS reminders" onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
    expect(onCheckedChange).toHaveBeenCalledTimes(2);
  });

  it('toggles when its label text is clicked', () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="SMS reminders" onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByText('SMS reminders'));
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('honours defaultChecked', () => {
    render(<Switch label="SMS reminders" defaultChecked />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('is fully controlled when checked is given: it asks, the parent decides', () => {
    const onCheckedChange = vi.fn();
    const { rerender } = render(
      <Switch
        label="SMS reminders"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    rerender(
      <Switch
        label="SMS reminders"
        checked
        onCheckedChange={onCheckedChange}
      />,
    );
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });

  it('works with a state-owning parent', () => {
    function Parent() {
      const [on, setOn] = useState(false);
      return (
        <Switch label="SMS reminders" checked={on} onCheckedChange={setOn} />
      );
    }
    render(<Parent />);
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('blocks the handler while disabled', () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        label="SMS reminders"
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );
    const toggle = screen.getByRole<HTMLButtonElement>('switch');
    expect(toggle.disabled).toBe(true);
    fireEvent.click(toggle);
    fireEvent.click(screen.getByText('SMS reminders'));
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  it('still calls a consumer onClick, and lets it veto the toggle with preventDefault', () => {
    const onCheckedChange = vi.fn();
    const onClick = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    render(
      <Switch
        label="SMS reminders"
        onClick={onClick}
        onCheckedChange={onCheckedChange}
      />,
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'false',
    );
  });
});

describe('Switch element', () => {
  it('forwards its ref to the <button> and is a nova-field control', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Switch label="SMS reminders" ref={ref} />);
    const toggle = screen.getByRole('switch');
    expect(ref.current).toBe(toggle);
    expect(toggle.classList).toContain('nova-field');
  });

  it('puts className on the wrapper, not the button', () => {
    render(<Switch label="SMS reminders" className="mt-4" />);
    const toggle = screen.getByRole('switch');
    expect(toggle.className).not.toContain('mt-4');
    expect(toggle.closest('.mt-4')).not.toBeNull();
  });
});

describe('Switch, iOS-style', () => {
  it('is a pill track with a white circular thumb in both states', () => {
    render(<Switch label="Ramesh SMS" />);
    const track = screen.getByRole('switch');
    expect([...track.classList]).toEqual(
      expect.arrayContaining([
        'rounded-full',
        '[corner-shape:round]',
        'h-7',
        'w-12',
      ]),
    );
    const thumb = track.querySelector('span') as HTMLElement;
    expect([...thumb.classList]).toEqual(
      expect.arrayContaining([
        'bg-on-primary',
        'rounded-full',
        '[corner-shape:round]',
        'size-6',
      ]),
    );
    expect(thumb.className).not.toMatch(/bg-ink-3/);
  });

  // The off track is filled with the 3:1 control ink, so the track is its own boundary and the white
  // thumb reads on it (4.8:1); on fills with the primary.
  it('fills the off track with the control ink and the on track with the primary', () => {
    render(<Switch label="Ramesh SMS" />);
    const track = screen.getByRole('switch');
    expect(track.classList).toContain(
      '[--nova-field-fill:var(--nova-color-border-control)]',
    );
    expect(track.classList).toContain('aria-checked:bg-primary');
  });

  it('gives the row a 44px minimum touch target and body-size label text', () => {
    render(<Switch label="Ramesh SMS" />);
    const row = screen.getByRole('switch').parentElement as HTMLElement;
    expect(row.classList).toContain('min-h-11');
    expect(screen.getByText('Ramesh SMS').classList).toContain('text-body');
  });
});
