/// <reference lib="dom" />
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockDoctorSource } from '../../data/mock';
import { pending, renderTab, stubSource } from '../../testing/render';
import { OrdersWidget } from './orders-view';

afterEach(() => cleanup());

async function newOrder() {
  return screen.findByRole('region', { name: 'New order' });
}

function assistant() {
  return screen.getByRole('region', { name: 'Prescription assistant' });
}

describe('OrdersWidget: the new order', () => {
  it('lists the labs and screening, with what the record says beside each, as words and marks', async () => {
    renderTab(<OrdersWidget />);
    const order = await newOrder();
    expect(within(order).getByRole('group', { name: 'Lab' })).toBeTruthy();
    expect(
      within(order).getByRole('group', { name: 'Imaging & screening' }),
    ).toBeTruthy();
    const kft = within(order).getByRole('checkbox', {
      name: /Kidney function test/,
    });
    expect((kft as HTMLInputElement).checked).toBe(false);
    const gap = within(order).getByText('none here since Jan 2025');
    expect(gap.querySelector('[data-slot="icon"]')).not.toBeNull();
    // Only what the doctor already ordered is ticked: HbA1c and the lipid profile.
    const ticked = within(order)
      .getAllByRole('checkbox')
      .filter((box) => (box as HTMLInputElement).checked)
      .map((box) => box.getAttribute('aria-label') ?? box.id);
    expect(ticked).toHaveLength(2);
    expect(
      (
        within(order).getByRole('checkbox', {
          name: /HbA1c/,
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    expect(
      (
        within(order).getByRole('checkbox', {
          name: /Lipid profile/,
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
  });

  it('sends exactly what the doctor ticked, and nothing is ordered before', async () => {
    const source = stubSource();
    const send = vi.spyOn(source, 'sendOrder');
    renderTab(<OrdersWidget />, source);
    const order = await newOrder();
    expect(send).not.toHaveBeenCalled();
    fireEvent.click(
      within(order).getByRole('checkbox', { name: /Kidney function test/ }),
    );
    fireEvent.click(
      within(order).getByRole('button', {
        name: /Send order — Lab & Pharmacy/,
      }),
    );
    await waitFor(() =>
      expect(send).toHaveBeenCalledWith({
        itemIds: ['hba1c', 'lipid', 'kft'],
        admit: false,
      }),
    );
    expect(
      await screen.findByText('Order sent to Lab & Pharmacy queues'),
    ).toBeTruthy();
  });

  it('says so when the order is empty', async () => {
    renderTab(<OrdersWidget />);
    const order = await newOrder();
    fireEvent.click(within(order).getByRole('checkbox', { name: /HbA1c/ }));
    fireEvent.click(
      within(order).getByRole('checkbox', { name: /Lipid profile/ }),
    );
    fireEvent.click(
      within(order).getByRole('button', {
        name: /Send order — Lab & Pharmacy/,
      }),
    );
    expect(
      await screen.findByText('Choose at least one item to order.'),
    ).toBeTruthy();
  });

  it('flags an admission as a switch with words, and sends it with the order', async () => {
    const source = stubSource();
    const send = vi.spyOn(source, 'sendOrder');
    renderTab(<OrdersWidget />, source);
    const order = await newOrder();
    const admit = within(order).getByRole('switch', { name: 'Admit to ward' });
    expect(admit.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(admit);
    expect(admit.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Admission flagged')).toBeTruthy();
    fireEvent.click(
      within(order).getByRole('button', {
        name: /Send order — Lab & Pharmacy/,
      }),
    );
    await waitFor(() => expect(send.mock.calls[0][0].admit).toBe(true));
  });
});

describe('OrdersWidget: saved templates', () => {
  it('applies a template by ticking its items, leaving the dose fields blank', async () => {
    renderTab(<OrdersWidget />);
    const order = await newOrder();
    const templates = screen.getByRole('region', { name: 'Saved templates' });
    expect(within(templates).getByText(/dose fields blank/)).toBeTruthy();
    fireEvent.click(
      within(templates).getByRole('button', {
        name: /Use template — T2DM follow-up/,
      }),
    );
    for (const name of [/Kidney function test/, /Urine albumin/]) {
      expect(
        (within(order).getByRole('checkbox', { name }) as HTMLInputElement)
          .checked,
      ).toBe(true);
    }
    expect(
      await screen.findByText('Template applied — T2DM follow-up'),
    ).toBeTruthy();
  });

  it('saves a new template from a dialog, which needs a name', async () => {
    const source = stubSource();
    const save = vi.spyOn(source, 'saveTemplate');
    renderTab(<OrdersWidget />, source);
    await newOrder();
    fireEvent.click(screen.getByRole('button', { name: /New template/ }));
    const dialog = await screen.findByRole('dialog', { name: 'New template' });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Save template' }),
    );
    expect(within(dialog).getByText('Give the template a name.')).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText('Template name'), {
      target: { value: 'Anaemia work-up' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Save template' }),
    );
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0].name).toBe('Anaemia work-up');
    expect(
      await screen.findByText('Template saved to your library'),
    ).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Anaemia work-up' }),
    ).toBeTruthy();
  });
});

describe('OrdersWidget: the prescription assistant', () => {
  it('puts the allergies first, in words, and cites what it used', async () => {
    renderTab(<OrdersWidget />);
    await newOrder();
    const box = assistant();
    expect(
      within(box).getByText('Tier: green · lookup & printing'),
    ).toBeTruthy();
    expect(
      within(box).getByText('Tier: amber · allergy & label alerts'),
    ).toBeTruthy();
    const alert = within(box).getByRole('alert');
    expect(alert.textContent).toMatch(
      /Allergies on file before you write: Penicillin/,
    );
    expect(alert.textContent).toMatch(/Apollo Clinic prescribed Amoxicillin/);
  });

  it('shows what 30 days costs her, from the formulary, and who chooses', async () => {
    renderTab(<OrdersWidget />);
    await newOrder();
    const table = within(assistant()).getByRole('table', {
      name: 'Formulary and generic equivalents',
    });
    expect(within(table).getByText('Tab. Metformin 500mg')).toBeTruthy();
    expect(within(table).getByText('₹161')).toBeTruthy();
    expect(within(table).getByText('₹631')).toBeTruthy();
    expect(
      within(table).getByText(
        /Which one she gets is your prescription, not ours/,
      ),
    ).toBeTruthy();
    // Stock is a word as well as a dot.
    expect(within(table).getByText(/38 tabs · below reorder/)).toBeTruthy();
  });

  it('leaves the dose field empty, and marks a dose recommendation as blocked (RED), not interactive', async () => {
    renderTab(<OrdersWidget />);
    await newOrder();
    const box = assistant();
    const field = within(box).getByLabelText(
      'Metformin daily dose',
    ) as HTMLInputElement;
    expect(field.value).toBe('');
    const red = within(box).getByText(/Tier: red · dose recommendation/);
    expect(red.closest('[aria-disabled="true"]')).not.toBeNull();
    expect(within(box).getByText(/Her recorded eGFR is 44/)).toBeTruthy();
    // The reason is behind a disclosure, not a way round the block.
    const why = within(box).getByRole('button', { name: 'Why blocked' });
    expect(why.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(why);
    expect(why.getAttribute('aria-expanded')).toBe('true');
    expect(
      document.getElementById(why.getAttribute('aria-controls') ?? '')
        ?.textContent,
    ).toMatch(/HOS is not licensed/);
  });

  it('records a dose only when the doctor types one', async () => {
    const source = stubSource();
    const record = vi.spyOn(source, 'recordDose');
    renderTab(<OrdersWidget />, source);
    await newOrder();
    const box = assistant();
    fireEvent.click(
      within(box).getByRole('button', { name: 'Record the dose' }),
    );
    expect(
      await screen.findByText('Type the dose yourself — HOS does not fill it.'),
    ).toBeTruthy();
    fireEvent.change(within(box).getByLabelText('Metformin daily dose'), {
      target: { value: '500mg BD' },
    });
    fireEvent.click(
      within(box).getByRole('button', { name: 'Record the dose' }),
    );
    await waitFor(() =>
      expect(record).toHaveBeenCalledWith('Metformin', '500mg BD'),
    );
    expect(await screen.findByText(/Dose recorded — 500mg BD/)).toBeTruthy();
  });

  it('shows the label bands in a dialog, quoted and not computed', async () => {
    renderTab(<OrdersWidget />);
    await newOrder();
    fireEvent.click(
      within(assistant()).getByRole('button', {
        name: /Show the label's renal bands/,
      }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: /Metformin — the label, in full/,
    });
    expect(within(dialog).getByText(/eGFR 30–44/)).toBeTruthy();
    expect(
      within(dialog).getByText(/does not compute a new dose/),
    ).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('prints in Telugu by default, switches off in words, and queues the sheet', async () => {
    const source = stubSource();
    const print = vi.spyOn(source, 'queuePrint');
    renderTab(<OrdersWidget />, source);
    await newOrder();
    const box = assistant();
    const telugu = within(box).getByRole('switch', {
      name: /Print dosage instructions in Telugu/,
    });
    expect(telugu.getAttribute('aria-checked')).toBe('true');
    expect(within(box).getByText(/రోజుకు రెండు సార్లు/)).toBeTruthy();
    fireEvent.click(telugu);
    expect(telugu.getAttribute('aria-checked')).toBe('false');
    expect(await screen.findByText('Telugu instructions off')).toBeTruthy();
    fireEvent.click(
      within(box).getByRole('button', {
        name: /Print Telugu \+ English sheet/,
      }),
    );
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
  });

  it('prepares a voice note as a draft that goes only with the approved prescription', async () => {
    renderTab(<OrdersWidget />);
    await newOrder();
    fireEvent.click(
      within(assistant()).getByRole('button', { name: /Prepare a voice note/ }),
    );
    expect(
      await screen.findByText(
        /goes with the WhatsApp prescription only after you approve it/,
      ),
    ).toBeTruthy();
  });
});

describe('OrdersWidget: states and access', () => {
  it('shows the loading state with the header in place', () => {
    renderTab(<OrdersWidget />, stubSource({ getOrders: pending }));
    expect(screen.getByRole('heading', { name: 'Orders & Rx' })).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
  });

  it('shows the error state with fixed words, and loads again on Try again', async () => {
    const real = createMockDoctorSource();
    const getOrders = vi
      .fn()
      .mockRejectedValueOnce(new Error('Lakshmi Devi order store down'))
      .mockImplementation(() => real.getOrders());
    renderTab(<OrdersWidget />, stubSource({ getOrders }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(
      'Could not load orders and prescriptions.',
    );
    expect(alert.textContent).not.toContain('order store');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await newOrder()).toBeTruthy();
  });

  it('says so when no chart is open', async () => {
    renderTab(<OrdersWidget />, stubSource({ getOrders: async () => null }));
    expect(
      await screen.findByRole('heading', {
        name: 'No chart is open to order for',
      }),
    ).toBeTruthy();
  });

  it('is reachable from the keyboard, and every field is labelled', async () => {
    renderTab(<OrdersWidget />);
    const order = await newOrder();
    const send = within(order).getByRole('button', { name: /Send order/ });
    send.focus();
    expect(document.activeElement).toBe(send);
    for (const box of within(order).getAllByRole('checkbox')) {
      expect(box.closest('div')?.querySelector('label')).not.toBeNull();
    }
    expect(
      within(assistant()).getByLabelText('Metformin daily dose'),
    ).toBeTruthy();
  });
});
