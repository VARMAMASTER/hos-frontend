import { StrictMode, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { AlertDialog, type AlertAction } from './alert-dialog';

afterEach(() => cleanup());

const alert = () => screen.getByRole('alertdialog');
const active = () => document.activeElement as HTMLElement;

const discharge: AlertAction[] = [
  { label: 'Cancel', role: 'cancel' },
  { label: 'Discharge', role: 'destructive' },
];

function setup(
  actions: AlertAction[] = discharge,
  props: { onClose?: () => void; message?: string } = {},
) {
  return render(
    <AlertDialog
      open
      onClose={props.onClose ?? (() => undefined)}
      title="Discharge patient?"
      message={props.message ?? 'The bed will be released.'}
      actions={actions}
    />,
  );
}

describe('AlertDialog semantics', () => {
  it('is a modal alertdialog, not a plain dialog', () => {
    setup();
    expect(alert().getAttribute('aria-modal')).toBe('true');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is labelled by its title and described by its message', () => {
    setup();
    const labelled = document.getElementById(
      alert().getAttribute('aria-labelledby') ?? '',
    );
    const described = document.getElementById(
      alert().getAttribute('aria-describedby') ?? '',
    );
    expect(labelled?.textContent).toBe('Discharge patient?');
    expect(described?.textContent).toBe('The bed will be released.');
    expect(
      screen.getByRole('alertdialog', { name: 'Discharge patient?' }),
    ).toBe(alert());
  });

  it('works without a message, and then describes nothing', () => {
    render(
      <AlertDialog
        open
        onClose={() => undefined}
        title="Sign out?"
        actions={[{ label: 'OK' }]}
      />,
    );
    expect(alert().getAttribute('aria-describedby')).toBeNull();
  });

  it('has no corner close button: the way out is an action', () => {
    setup();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Cancel',
      'Discharge',
    ]);
  });

  it('renders nothing while closed', () => {
    render(
      <AlertDialog
        open={false}
        onClose={() => undefined}
        title="Hi"
        actions={[{ label: 'OK' }]}
      />,
    );
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});

describe('AlertDialog initial focus', () => {
  it('goes to the cancel action, never the destructive one', () => {
    setup();
    expect(active().textContent).toBe('Cancel');
  });

  it('goes to the cancel action even when it is listed after the destructive one', () => {
    setup([
      { label: 'Discharge', role: 'destructive' },
      { label: 'Cancel', role: 'cancel' },
    ]);
    expect(active().textContent).toBe('Cancel');
  });

  it('prefers cancel over a default action, and a default action over a destructive one', () => {
    setup([
      { label: 'Delete', role: 'destructive' },
      { label: 'Save draft' },
      { label: 'Keep editing', role: 'cancel' },
    ]);
    expect(active().textContent).toBe('Keep editing');
    cleanup();
    setup([{ label: 'Delete', role: 'destructive' }, { label: 'Save draft' }]);
    expect(active().textContent).toBe('Save draft');
  });

  it('treats an action with no role as a default action', () => {
    setup([{ label: 'Delete', role: 'destructive' }, { label: 'OK' }]);
    expect(active().textContent).toBe('OK');
  });

  it('with only destructive actions, focuses the dialog itself and no button', () => {
    setup([
      { label: 'Erase', role: 'destructive' },
      { label: 'Wipe', role: 'destructive' },
    ]);
    expect(active()).toBe(alert());
  });

  it('holds under React StrictMode', () => {
    render(
      <StrictMode>
        <AlertDialog
          open
          onClose={() => undefined}
          title="Discharge patient?"
          actions={discharge}
        />
      </StrictMode>,
    );
    expect(active().textContent).toBe('Cancel');
  });

  it('hands focus back to the opener when it closes', () => {
    function Page() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Discharge…
          </button>
          <AlertDialog
            open={open}
            onClose={() => setOpen(false)}
            title="Discharge patient?"
            actions={discharge}
          />
        </>
      );
    }
    render(<Page />);
    const opener = screen.getByRole('button', { name: 'Discharge…' });
    act(() => opener.focus());
    fireEvent.click(opener);
    expect(active().textContent).toBe('Cancel');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(active()).toBe(opener);
  });
});

describe('AlertDialog choosing', () => {
  it('runs the action, then asks to close, in that order', () => {
    const order: string[] = [];
    setup(
      [
        { label: 'Cancel', role: 'cancel' },
        {
          label: 'Discharge',
          role: 'destructive',
          onSelect: () => order.push('select'),
        },
      ],
      { onClose: () => order.push('close') },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Discharge' }));
    expect(order).toEqual(['select', 'close']);
  });

  it('closes on the cancel action without running anything else', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    setup(
      [
        { label: 'Cancel', role: 'cancel' },
        { label: 'Discharge', role: 'destructive', onSelect },
      ],
      { onClose },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('treats Escape as cancel: it closes and runs no action', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    setup(
      [
        { label: 'Cancel', role: 'cancel' },
        { label: 'Discharge', role: 'destructive', onSelect },
      ],
      { onClose },
    );
    fireEvent.keyDown(active(), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not close on a stray click on the scrim', () => {
    const onClose = vi.fn();
    setup(discharge, { onClose });
    fireEvent.click(alert().parentElement?.firstElementChild as Element);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps Tab inside the dialog', () => {
    setup();
    const [first, last] = screen.getAllByRole('button');
    act(() => last?.focus());
    fireEvent.keyDown(last as Element, { key: 'Tab' });
    expect(active()).toBe(first);
  });
});

describe('AlertDialog layout', () => {
  const group = () =>
    document.querySelector('[data-alert-actions]') as HTMLElement;

  it('puts two actions side by side', () => {
    setup();
    expect(group().getAttribute('data-layout')).toBe('row');
    expect(group().className).toContain('flex-row');
  });

  it.each([
    ['one action', [{ label: 'OK' }]],
    [
      'three actions',
      [
        { label: 'Save', role: 'default' as const },
        { label: 'Discard', role: 'destructive' as const },
        { label: 'Cancel', role: 'cancel' as const },
      ],
    ],
    [
      'four actions',
      [
        { label: 'A' },
        { label: 'B' },
        { label: 'C' },
        { label: 'D', role: 'cancel' as const },
      ],
    ],
  ])('stacks %s', (_name, actions) => {
    setup(actions);
    expect(group().getAttribute('data-layout')).toBe('stack');
    expect(group().className).toContain('flex-col');
  });

  // hos-sim.js HOS.confirm: a footer of buttons, right-aligned with an 8px gap, not hairline rows.
  it('right-aligns the actions with an 8px gap, and draws no hairline dividers', () => {
    setup();
    expect(group().className).toContain('justify-end');
    expect(group().className).toContain('gap-s3');
    expect(group().className).not.toMatch(/divide-|border-y/);
    cleanup();
    setup([{ label: 'A' }, { label: 'B' }, { label: 'C' }]);
    expect(group().className).toContain('gap-s3');
    expect(group().className).not.toMatch(/divide-|border-y/);
  });
});

describe('AlertDialog look', () => {
  it('is 280px wide at most', () => {
    setup();
    expect(alert().classList).toContain('max-w-dialog-sm');
    expect(alert().classList).not.toContain('max-w-lg');
  });

  it('marks each action by role, and words the destructive one', () => {
    setup([
      { label: 'Cancel', role: 'cancel' },
      { label: 'Keep' },
      { label: 'Discharge', role: 'destructive' },
    ]);
    const roles = screen
      .getAllByRole('button')
      .map((button) => button.getAttribute('data-role'));
    expect(roles).toEqual(['cancel', 'default', 'destructive']);
  });

  // The prototype confirm is a .btn-ghost Cancel beside a .btn-primary Confirm; a destructive action
  // takes the danger button. They are Nova Buttons, so they follow the Button's look.
  it('draws each role as a Button: outline for cancel, primary for default, danger for destructive', () => {
    setup([
      { label: 'Cancel', role: 'cancel' },
      { label: 'Keep' },
      { label: 'Discharge', role: 'destructive' },
    ]);
    const variant = (name: string) =>
      screen.getByRole('button', { name }).getAttribute('data-variant');
    expect(variant('Cancel')).toBe('outline');
    expect(variant('Keep')).toBe('primary');
    expect(variant('Discharge')).toBe('danger');
  });

  it('stacks full-width buttons when the actions stack, and sizes them naturally in a row', () => {
    setup();
    for (const button of screen.getAllByRole('button')) {
      expect(button.className).not.toContain('w-full');
    }
    cleanup();
    setup([{ label: 'A' }, { label: 'B' }, { label: 'C' }]);
    for (const button of screen.getAllByRole('button')) {
      expect(button.className).toContain('w-full');
    }
  });

  it('casts no shadow of its own: its actions are plain Nova Buttons', () => {
    // The Buttons carry the prototype's own .btn treatment (which may include a shadow); the
    // action row itself adds nothing on top.
    setup([{ label: 'Cancel', role: 'cancel' }, { label: 'Keep' }]);
    const actions = document.querySelector(
      '[data-alert-actions]',
    ) as HTMLElement;
    expect(actions.className).not.toMatch(/shadow|font-medium/);
  });

  it('has real buttons with a focus ring', () => {
    setup();
    for (const button of screen.getAllByRole('button')) {
      expect(button.getAttribute('type')).toBe('button');
      expect(button.className).toContain('focus-visible:outline-focus');
    }
  });
});
