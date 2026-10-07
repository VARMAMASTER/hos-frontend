import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { clearToasts, dismissToast, showToast, Toaster } from './toast';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  act(() => clearToasts());
  cleanup();
  vi.useRealTimers();
});

const show = (...args: Parameters<typeof showToast>) => {
  let id = 0;
  act(() => {
    id = showToast(...args);
  });
  return id;
};
const toasts = () => [
  ...document.querySelectorAll<HTMLElement>('[data-toast]'),
];
const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe('Toaster live regions', () => {
  it('is present before any toast, so a screen reader hears the first one', () => {
    render(<Toaster />);
    expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite');
    expect(screen.getByRole('alert').getAttribute('aria-live')).toBe(
      'assertive',
    );
  });

  it('announces info and good news politely', () => {
    render(<Toaster />);
    show('Saved', 'info');
    show('Discharged', 'good');
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Saved');
    expect(status.textContent).toContain('Discharged');
    expect(screen.getByRole('alert').textContent).not.toContain('Saved');
  });

  it('announces an error assertively', () => {
    render(<Toaster />);
    show('Could not save the chart', 'crit');
    const alert = screen.getByRole('alert');
    expect(alert.getAttribute('aria-live')).toBe('assertive');
    expect(alert.textContent).toContain('Could not save the chart');
    expect(screen.getByRole('status').textContent).not.toContain('Could not');
  });

  it('does not re-announce earlier toasts when a new one arrives (aria-atomic false)', () => {
    render(<Toaster />);
    expect(screen.getByRole('status').getAttribute('aria-atomic')).toBe(
      'false',
    );
    expect(screen.getByRole('alert').getAttribute('aria-atomic')).toBe('false');
  });

  it('defaults to info', () => {
    render(<Toaster />);
    show('Hello');
    expect(screen.getByRole('status').textContent).toContain('Hello');
  });

  it('shows the tone as an icon shape as well as colour', () => {
    render(<Toaster />);
    show('a', 'info');
    show('b', 'good');
    show('c', 'crit');
    const shapes = toasts().map(
      (toast) => toast.querySelector('svg')?.innerHTML ?? '',
    );
    expect(new Set(shapes).size).toBe(3);
    expect(shapes.every(Boolean)).toBe(true);
  });
});

describe('Toast elevation', () => {
  // The prototype's .hos-toast sits at --shadow-md (sim.css), like the other raised surfaces.
  it('lifts every toast at shadow-md, like the prototype', () => {
    render(<Toaster />);
    show('a', 'info');
    show('b', 'crit');
    for (const toast of toasts()) {
      expect(toast.classList).toContain('shadow-md');
    }
  });
});

describe('Toast auto-dismiss', () => {
  it('goes away after 3500ms', () => {
    render(<Toaster />);
    show('Saved');
    wait(3499);
    expect(screen.queryByText('Saved')).not.toBeNull();
    wait(1);
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('takes a custom duration', () => {
    render(<Toaster />);
    show('Slow', 'info', { duration: 8000 });
    wait(7999);
    expect(screen.queryByText('Slow')).not.toBeNull();
    wait(1);
    expect(screen.queryByText('Slow')).toBeNull();
  });

  it('stays until dismissed when the duration is 0', () => {
    render(<Toaster />);
    show('Sticky', 'crit', { duration: 0 });
    wait(60_000);
    expect(screen.queryByText('Sticky')).not.toBeNull();
  });

  it('pauses while the pointer is over it, then resumes with the time left', () => {
    render(<Toaster />);
    show('Saved');
    const toast = toasts()[0] as HTMLElement;
    wait(3000);
    fireEvent.mouseEnter(toast);
    wait(60_000);
    expect(screen.queryByText('Saved')).not.toBeNull();
    fireEvent.mouseLeave(toast);
    wait(499);
    expect(screen.queryByText('Saved')).not.toBeNull();
    wait(1);
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('pauses while focus is inside it, and resumes on blur', () => {
    render(<Toaster />);
    show('Saved');
    const dismiss = screen.getByRole('button', {
      name: 'Dismiss notification',
    });
    wait(1000);
    act(() => dismiss.focus());
    wait(60_000);
    expect(screen.queryByText('Saved')).not.toBeNull();
    act(() => dismiss.blur());
    wait(2499);
    expect(screen.queryByText('Saved')).not.toBeNull();
    wait(1);
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('stays paused while either the pointer or focus remains', () => {
    render(<Toaster />);
    show('Saved');
    const toast = toasts()[0] as HTMLElement;
    const dismiss = screen.getByRole('button', {
      name: 'Dismiss notification',
    });
    fireEvent.mouseEnter(toast);
    act(() => dismiss.focus());
    fireEvent.mouseLeave(toast);
    wait(60_000);
    expect(screen.queryByText('Saved')).not.toBeNull();
  });

  it('times each toast on its own', () => {
    render(<Toaster />);
    show('First');
    wait(2000);
    show('Second');
    wait(1500);
    expect(screen.queryByText('First')).toBeNull();
    expect(screen.queryByText('Second')).not.toBeNull();
  });
});

describe('Toast dismissal', () => {
  it('has a dismiss button with an accessible name that removes it', () => {
    render(<Toaster />);
    show('Saved');
    const button = screen.getByRole('button', {
      name: 'Dismiss notification',
    });
    expect(button.getAttribute('type')).toBe('button');
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    fireEvent.click(button);
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('lets the dismiss label be translated', () => {
    render(<Toaster dismissLabel="Close message" />);
    show('Saved');
    expect(screen.getByRole('button', { name: 'Close message' })).toBeTruthy();
  });

  it('dismisses on a tap anywhere on it', () => {
    render(<Toaster />);
    show('Saved');
    fireEvent.click(screen.getByText('Saved'));
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('dismisses by id', () => {
    render(<Toaster />);
    const id = show('Saved');
    show('Other');
    act(() => dismissToast(id));
    expect(screen.queryByText('Saved')).toBeNull();
    expect(screen.queryByText('Other')).not.toBeNull();
  });

  it('shows toasts raised before the Toaster mounted', () => {
    show('Early');
    render(<Toaster />);
    expect(screen.queryByText('Early')).not.toBeNull();
  });

  it('clears its timers when the Toaster unmounts', () => {
    const { unmount } = render(<Toaster />);
    show('Saved');
    unmount();
    expect(() => wait(5000)).not.toThrow();
  });
});

describe('Toast styling rules', () => {
  // sim.css .hos-toast: 13px, --r-md, a 1px line border with a 3px coloured left edge, --shadow-md, 12px
  // 16px padding, an 8px gap: the control text role, the card corner, the rail edge and the scale.
  it('is the prototype toast: the control text role, the card corner, a coloured rail edge, and no shadow but shadow-md', () => {
    render(<Toaster />);
    show('Saved');
    const classes = (toasts()[0] as HTMLElement).className;
    expect(classes).toContain('text-control');
    expect(classes).toContain('rounded-card');
    expect(classes).toContain('bg-surface');
    expect(classes).toContain('border-l-rail');
    expect(classes).toContain('px-s6');
    expect(classes).toContain('py-s5');
    expect(classes).toContain('gap-s3');
    expect(classes.match(/\S*shadow\S*/g)).toEqual(['shadow-md']);
    expect(classes).not.toContain('font-medium');
    expect(classes).not.toMatch(
      /text-(?:callout|body|caption)|shadow-elevation/,
    );
  });

  it('draws the message at weight 600, like the prototype <b>', () => {
    render(<Toaster />);
    show('Saved');
    expect(screen.getByText('Saved').className).toContain('font-semibold');
  });

  it.each([
    ['info', 'border-l-primary', 'bg-primary'],
    ['good', 'border-l-good', 'bg-good'],
    ['crit', 'border-l-crit', 'bg-crit'],
  ] as const)(
    'the %s tone has a %s edge and a %s icon tile',
    (tone, edge, tile) => {
      render(<Toaster />);
      show('x', tone);
      const toast = toasts()[0] as HTMLElement;
      expect(toast.className).toContain(edge);
      expect(toast.querySelector('svg')?.parentElement?.className).toContain(
        tile,
      );
      expect(toast.dataset['tone']).toBe(tone);
    },
  );

  it('sits bottom right, like the prototype .hos-toasts', () => {
    render(<Toaster />);
    const host = screen.getByRole('status').parentElement as HTMLElement;
    expect(host.className).toContain('bottom-s7');
    expect(host.className).toContain('right-s7');
    expect(host.className).toContain('max-w-toast');
    expect(host.className).toContain('z-60');
  });
});
