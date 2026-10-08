import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { FleetKillSwitch } from './fleet-kill-switch';
import { ReasonDialog } from './reason-dialog';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const REASON = 'Edit distance tripled at 2 tenants; off until root-caused.';
const at = () => '18 Jul, 04:20 PM';

const base = {
  worker: 'Discharge Drafter',
  scope: 'fleet' as const,
  impact: "Stops 14 hospitals' discharge drafts",
  actor: 'Dr. G. Prakash',
  formatTime: at,
};

const toggle = () =>
  screen.getByRole('switch', { name: 'Discharge Drafter enabled fleet-wide' });
const reasonBox = () =>
  screen.getByRole('textbox', { name: /Why are you doing this/ });
const confirmButton = (name: RegExp) => screen.getByRole('button', { name });

function typeReason(value: string) {
  fireEvent.change(reasonBox(), { target: { value } });
}

describe('FleetKillSwitch', () => {
  it('is a switch named for the worker and its scope, on by default', () => {
    render(<FleetKillSwitch {...base} />);
    expect(toggle().getAttribute('aria-checked')).toBe('true');
    expect(document.body.textContent).toContain('Enabled');
  });

  it('turning it off opens a reason dialog that states the impact; the switch stays on meanwhile', () => {
    render(<FleetKillSwitch {...base} />);
    fireEvent.click(toggle());
    const dialog = screen.getByRole('alertdialog', {
      name: 'Disable Discharge Drafter fleet-wide',
    });
    expect(dialog.textContent).toContain(
      "Stops 14 hospitals' discharge drafts",
    );
    expect(toggle().getAttribute('aria-checked')).toBe('true');
  });

  it('opens on Cancel, never on the confirm button, which stays locked until a reason is given', () => {
    render(<FleetKillSwitch {...base} />);
    fireEvent.click(toggle());
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Cancel' }),
    );
    const confirm = confirmButton(/^Disable fleet-wide$/);
    expect(confirm.getAttribute('aria-disabled')).toBe('true');
    typeReason('too short');
    expect(confirm.getAttribute('aria-disabled')).toBe('true');
    expect(document.body.textContent).toContain('6 to go');
    fireEvent.click(confirm);
    expect(screen.queryByRole('alertdialog')).not.toBe(null);
    expect(toggle().getAttribute('aria-checked')).toBe('true');
  });

  it('confirms with a reason: off, and who, when and why shown in a visible line', () => {
    const onDisable = vi.fn();
    render(<FleetKillSwitch {...base} onDisable={onDisable} />);
    fireEvent.click(toggle());
    typeReason(`  ${REASON}  `);
    const confirm = confirmButton(/^Disable fleet-wide$/);
    expect(confirm.getAttribute('aria-disabled')).toBe(null);
    fireEvent.click(confirm);
    expect(screen.queryByRole('alertdialog')).toBe(null);
    expect(onDisable).toHaveBeenCalledWith(REASON);
    expect(toggle().getAttribute('aria-checked')).toBe('false');
    const record = document.querySelector('[data-record]') as HTMLElement;
    expect(record.textContent).toContain(
      'Disabled fleet-wide by Dr. G. Prakash · 18 Jul, 04:20 PM',
    );
    expect(record.textContent).toContain(REASON);
  });

  it('Cancel leaves it on and records nothing', () => {
    const onDisable = vi.fn();
    render(<FleetKillSwitch {...base} onDisable={onDisable} />);
    fireEvent.click(toggle());
    typeReason(REASON);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDisable).not.toHaveBeenCalled();
    expect(toggle().getAttribute('aria-checked')).toBe('true');
    expect(document.querySelector('[data-record]')).toBe(null);
  });

  it('takes the minimum reason length from a prop', () => {
    render(<FleetKillSwitch {...base} minReasonLength={40} />);
    fireEvent.click(toggle());
    typeReason('Twenty characters ok');
    expect(
      confirmButton(/^Disable fleet-wide$/).getAttribute('aria-disabled'),
    ).toBe('true');
    expect(document.body.textContent).toContain('Minimum 40 characters');
  });

  it('offers a rollback, gated by a reason too, and shows rolling back until it lands', async () => {
    let finish: () => void = () => undefined;
    const onRollback = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(
      <FleetKillSwitch
        {...base}
        defaultState="disabled"
        defaultRecord={{
          action: 'disabled',
          by: 'Dr. G. Prakash',
          at: '18 Jul, 04:20 PM',
          reason: REASON,
        }}
        onRollback={onRollback}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Roll back' }));
    const dialog = screen.getByRole('dialog', {
      name: 'Re-enable Discharge Drafter fleet-wide',
    });
    expect(dialog).toBeTruthy();
    typeReason('Prompt fix v2.5 shipped and the suite is green.');
    fireEvent.click(confirmButton(/^Re-enable fleet-wide$/));
    expect(onRollback).toHaveBeenCalledWith(
      'Prompt fix v2.5 shipped and the suite is green.',
    );
    expect(document.body.textContent).toContain('Rolling back…');
    expect(toggle().hasAttribute('disabled')).toBe(true);
    await act(async () => {
      finish();
      await Promise.resolve();
    });
    expect(toggle().getAttribute('aria-checked')).toBe('true');
    expect(
      (document.querySelector('[data-record]') as HTMLElement).textContent,
    ).toContain('Re-enabled fleet-wide by Dr. G. Prakash');
  });

  it('turning the switch back on is the same gated rollback', () => {
    render(<FleetKillSwitch {...base} defaultState="disabled" />);
    fireEvent.click(toggle());
    expect(
      screen.getByRole('dialog', {
        name: 'Re-enable Discharge Drafter fleet-wide',
      }),
    ).toBeTruthy();
    expect(toggle().getAttribute('aria-checked')).toBe('false');
  });

  it('locks a RED-tier row: a disabled switch, described by a "Why blocked" reason the keyboard reaches', () => {
    render(
      <FleetKillSwitch
        {...base}
        worker="Sepsis prediction"
        tier="red"
        lockedReason="Needs a CDSCO Class C licence."
      />,
    );
    const sw = screen.getByRole('switch', {
      name: 'Sepsis prediction enabled fleet-wide',
    });
    expect(sw.hasAttribute('disabled')).toBe(true);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    const why = screen.getByRole('button', { name: 'Why blocked' });
    expect(why.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(why);
    expect(why.getAttribute('aria-expanded')).toBe('true');
    const reason = document.getElementById(
      sw.getAttribute('aria-describedby') ?? '',
    );
    expect(reason?.textContent).toContain('Needs a CDSCO Class C licence.');
    expect(reason?.hidden).toBe(false);
    expect(document.body.textContent).toContain('Locked');
  });

  it('speaks of the tenant at tenant scope', () => {
    render(
      <FleetKillSwitch
        {...base}
        scope="tenant"
        scopeName="Sri Venkateshwara"
      />,
    );
    fireEvent.click(
      screen.getByRole('switch', {
        name: 'Discharge Drafter enabled for Sri Venkateshwara',
      }),
    );
    expect(
      screen.getByRole('alertdialog', {
        name: 'Disable Discharge Drafter for Sri Venkateshwara',
      }),
    ).toBeTruthy();
  });

  it('is controllable: it reports, the parent decides', () => {
    const onStateChange = vi.fn();
    render(
      <FleetKillSwitch
        {...base}
        state="enabled"
        onStateChange={onStateChange}
      />,
    );
    fireEvent.click(toggle());
    typeReason(REASON);
    fireEvent.click(confirmButton(/^Disable fleet-wide$/));
    expect(onStateChange).toHaveBeenCalledWith('disabled');
    expect(toggle().getAttribute('aria-checked')).toBe('true');
  });

  it('never writes the reason to the console', () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method),
    );
    render(<FleetKillSwitch {...base} />);
    fireEvent.click(toggle());
    typeReason('Ramesh complained the drafts were wrong for his father.');
    fireEvent.click(confirmButton(/^Disable fleet-wide$/));
    for (const spy of spies) {
      for (const call of spy.mock.calls) {
        expect(JSON.stringify(call)).not.toContain('Ramesh');
      }
    }
  });

  it('takes every fixed word as a prop', () => {
    render(
      <FleetKillSwitch
        {...base}
        labels={{ fleetWide: 'पूरे बेड़े में', enabled: 'चालू' }}
      />,
    );
    expect(
      screen.getByRole('switch', {
        name: 'Discharge Drafter enabled पूरे बेड़े में',
      }),
    ).toBeTruthy();
    expect(document.body.textContent).toContain('चालू');
  });
});

describe('ReasonDialog', () => {
  it('gives the reason box a required label and says the record cannot be edited', () => {
    render(
      <ReasonDialog
        open
        title="Promote AI Scribe v4.3 to canary"
        confirmLabel="Promote to canary"
        danger={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Promote AI Scribe v4.3 to canary',
    });
    expect(reasonBox().hasAttribute('required')).toBe(true);
    expect(dialog.textContent).toContain('cannot be edited');
    expect(
      within(dialog)
        .getByRole('button', { name: 'Promote to canary' })
        .getAttribute('aria-disabled'),
    ).toBe('true');
  });

  it('shows loading spinner on confirm button and disables cancel button when busy', () => {
    render(
      <ReasonDialog
        open
        busy
        title="Promote AI Scribe v4.3 to canary"
        confirmLabel="Promote to canary"
        danger={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Promote AI Scribe v4.3 to canary',
    });
    const confirm = within(dialog).getByRole('button', {
      name: 'Promote to canary',
    });
    expect(confirm.getAttribute('aria-busy')).toBe('true');
    expect(confirm.querySelector('[data-spinner]')).not.toBeNull();
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' });
    expect((cancel as HTMLButtonElement).disabled).toBe(true);
  });
});
