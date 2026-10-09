/// <reference lib="dom" />
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockReceptionSource } from '../../data/mock';
import { pending, renderTab, stubSource } from '../../testing/render';
import { AppointmentsWidget } from './appointments-view';

afterEach(() => cleanup());

const FOLLOW_UP = 'Follow-up drafted from a discharge summary — B. Srinu';

describe('AppointmentsWidget', () => {
  it('shows the figures, the channel mix, the slots and the no-show list', async () => {
    renderTab(<AppointmentsWidget />);
    const figures = await screen.findByRole('region', {
      name: 'Appointment figures',
    });
    expect(within(figures).getByText('Prepaid at booking')).toBeTruthy();
    expect(within(figures).getByText('9.1%')).toBeTruthy();

    const channels = screen.getByRole('list', { name: 'Booking channels' });
    expect(within(channels).getAllByRole('listitem')).toHaveLength(5);
    expect(within(channels).getByText('WhatsApp assistant')).toBeTruthy();

    const slots = screen.getByRole('region', {
      name: 'Slot discovery — Mon 20 Jul 2026',
    });
    expect(within(slots).getByText('11 free')).toBeTruthy();
    expect(
      within(slots).getAllByRole('button', { name: /^Book .* with Dr\./ }),
    ).toHaveLength(11);
    expect(within(slots).getByText('11:00 · OT')).toBeTruthy();

    const risks = screen.getByRole('table', {
      name: "No-show risk — tomorrow's list",
    });
    expect(within(risks).getByText('78% · High')).toBeTruthy();
    expect(within(risks).getByText('M. Sailoo')).toBeTruthy();
  });

  it('marks every AI element with ✦ and words, and books nothing before approval', async () => {
    const source = stubSource();
    const approveFollowUp = vi.spyOn(source, 'approveFollowUp');
    renderTab(<AppointmentsWidget />, source);
    const draft = await screen.findByRole('group', { name: FOLLOW_UP });
    expect(within(draft).getByText('AI draft')).toBeTruthy();
    expect(within(draft).getAllByText('✦').length).toBeGreaterThan(0);
    expect(within(draft).getByText('Draft — awaiting approval')).toBeTruthy();
    expect(approveFollowUp).not.toHaveBeenCalled();

    const channels = screen.getByRole('list', { name: 'Booking channels' });
    expect(within(channels).getAllByText('AI channel')).toHaveLength(2);
  });

  it('books the discharge follow-up when a person approves it', async () => {
    const source = stubSource();
    const approveFollowUp = vi.spyOn(source, 'approveFollowUp');
    renderTab(<AppointmentsWidget />, source);
    const draft = await screen.findByRole('group', { name: FOLLOW_UP });
    fireEvent.click(
      within(draft).getByRole('button', {
        name: `Approve & book ${FOLLOW_UP}`,
      }),
    );
    await waitFor(() => expect(approveFollowUp).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText('Follow-up booked — Mon 27 Jul 2026 · 10:30 AM'),
    ).toBeTruthy();
    expect(within(draft).getByText(/^Booked · /)).toBeTruthy();
  });

  it('books a free slot in a dialog, with accessible validation', async () => {
    renderTab(<AppointmentsWidget />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Book 09:30 AM with Dr. K. Ramesh',
      }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Book an appointment' });
    const doctor = within(dialog).getByLabelText('Doctor') as HTMLSelectElement;
    expect(doctor.value).toBe('dr-ramesh');
    const slot = within(dialog).getByLabelText(
      'Slot · Mon 20 Jul',
    ) as HTMLSelectElement;
    expect(slot.value).toBe('dr-ramesh-09:30');

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Book & send UPI link' }),
    );
    const name = within(dialog).getByLabelText('Patient name');
    expect(name.getAttribute('aria-invalid')).toBe('true');
    const describedBy = name.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)?.textContent).toContain(
      "Enter the patient's name",
    );
    expect(document.activeElement).toBe(name);

    fireEvent.change(name, { target: { value: 'Ramesh' } });
    fireEvent.change(
      within(dialog).getByLabelText('Mobile (for UPI + confirmation)'),
      { target: { value: '+91 98765 00000' } },
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Book & send UPI link' }),
    );
    expect(
      await screen.findByText('Booked — 09:30 AM · Dr. K. Ramesh'),
    ).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    const slots = screen.getByRole('region', {
      name: 'Slot discovery — Mon 20 Jul 2026',
    });
    expect(within(slots).getByText('10 free')).toBeTruthy();
    expect(
      screen.queryByRole('button', {
        name: 'Book 09:30 AM with Dr. K. Ramesh',
      }),
    ).toBeNull();
    const session = screen.getByRole('list', {
      name: 'Booked in this session',
    });
    expect(within(session).getByText(/Ramesh · Dr\. K\. Ramesh/)).toBeTruthy();
  });

  it('filters the slot grid by doctor', async () => {
    renderTab(<AppointmentsWidget />);
    const filter = (await screen.findByLabelText(
      'Show slots for',
    )) as HTMLSelectElement;
    fireEvent.change(filter, { target: { value: 'dr-sunitha' } });
    const slots = screen.getByRole('region', {
      name: 'Slot discovery — Mon 20 Jul 2026',
    });
    expect(
      within(slots).queryAllByRole('button', { name: /with Dr\. K\. Ramesh$/ }),
    ).toHaveLength(0);
    expect(
      within(slots).getAllByRole('button', { name: /with Dr\. Sunitha Rao$/ }),
    ).toHaveLength(5);
    expect(within(slots).getByText('5 free')).toBeTruthy();
  });

  it('shows the loading state', () => {
    renderTab(<AppointmentsWidget />, stubSource({ getAppointments: pending }));
    expect(screen.getByRole('heading', { name: 'Appointments' })).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
  });

  it('shows the error state with a retry', async () => {
    renderTab(
      <AppointmentsWidget />,
      stubSource({
        getAppointments: () => Promise.reject(new Error('timeout')),
      }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Could not load appointments.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('shows the empty state when no session is open', async () => {
    const real = createMockReceptionSource();
    renderTab(
      <AppointmentsWidget />,
      stubSource({
        getAppointments: async () => ({
          ...(await real.getAppointments()),
          doctors: [],
          slots: [],
        }),
      }),
    );
    expect(
      await screen.findByRole('heading', { name: 'No OPD sessions to book' }),
    ).toBeTruthy();
  });

  it('keeps every control named and reachable', async () => {
    renderTab(<AppointmentsWidget />);
    const open = await screen.findByRole('button', {
      name: 'Book & take payment',
    });
    open.focus();
    expect(document.activeElement).toBe(open);
    fireEvent.click(open);
    const dialog = screen.getByRole('dialog', { name: 'Book an appointment' });
    expect(
      within(dialog).getByRole('radiogroup', { name: 'Channel' }),
    ).toBeTruthy();
    expect(
      within(dialog).getByRole('radiogroup', { name: 'Consultation ₹500' }),
    ).toBeTruthy();
    expect(within(dialog).getByLabelText('Patient name')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
