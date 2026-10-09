/// <reference lib="dom" />
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { pending, renderTab, stubSource } from '../../testing/render';
import { ScheduleWidget } from './schedule-view';

afterEach(() => cleanup());

const CALENDAR = 'Doctor day calendar — 18 Jul 2026';

describe('ScheduleWidget', () => {
  it('shows the day calendar: a row per slot, a column per doctor', async () => {
    renderTab(<ScheduleWidget />);
    const table = await screen.findByRole('table', { name: CALENDAR });
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual([
      'Time',
      'Dr. K. RameshGeneral Medicine · Room 3',
      'Dr. Sunitha RaoGynecology · Room 5',
    ]);
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(9);
    expect(within(rows[1]).getByRole('rowheader').textContent).toBe('09:00');
    expect(within(rows[1]).getByText('Ch. Lakshmi')).toBeTruthy();
    expect(within(rows[1]).getByText('Follow-up · fever, 3 days')).toBeTruthy();
    expect(within(rows[7]).getByText('Lunch break')).toBeTruthy();
    expect(
      within(table).getByRole('button', {
        name: 'Book 10:00 with Dr. Sunitha Rao',
      }),
    ).toBeTruthy();
  });

  it('books a free slot in a dialog', async () => {
    renderTab(<ScheduleWidget />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Book 10:00 with Dr. Sunitha Rao',
      }),
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Book 10:00 · Dr. Sunitha Rao',
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Book slot' }));
    const name = within(dialog).getByLabelText('Patient name');
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(name);
    fireEvent.change(name, { target: { value: 'Ramesh' } });
    fireEvent.change(within(dialog).getByLabelText('Reason'), {
      target: { value: 'New consult · joint pain' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Book slot' }));
    expect(
      await screen.findByText('Slot booked — 10:00 · Dr. Sunitha Rao'),
    ).toBeTruthy();
    const table = screen.getByRole('table', { name: CALENDAR });
    expect(within(table).getByText('Ramesh')).toBeTruthy();
    expect(within(table).getByText('T-27')).toBeTruthy();
  });

  it('reschedules a booking to the doctor’s free slot', async () => {
    renderTab(<ScheduleWidget />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Reschedule T-21 D. Anitha' }),
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Reschedule T-21 · D. Anitha',
    });
    const moveTo = within(dialog).getByLabelText(
      'Move to',
    ) as HTMLSelectElement;
    expect(moveTo.value).toBe('dr-sunitha-10:00');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Move appointment' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const table = screen.getByRole('table', { name: CALENDAR });
    const rows = within(table).getAllByRole('row');
    expect(within(rows[3]).getByText('D. Anitha')).toBeTruthy();
    expect(
      within(rows[1]).getByRole('button', {
        name: 'Book 09:00 with Dr. Sunitha Rao',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Moved — T-21 · D. Anitha to 10:00')).toBeTruthy();
  });

  it('filters the calendar to one doctor', async () => {
    renderTab(<ScheduleWidget />);
    fireEvent.change(await screen.findByLabelText('Show the day for'), {
      target: { value: 'dr-ramesh' },
    });
    const table = screen.getByRole('table', { name: CALENDAR });
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
    expect(within(table).queryByText('D. Anitha')).toBeNull();
  });

  it('shows the loading, error and empty states', async () => {
    renderTab(<ScheduleWidget />, stubSource({ getSchedule: pending }));
    expect(screen.getByRole('heading', { name: 'Day Schedule' })).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
    cleanup();

    renderTab(
      <ScheduleWidget />,
      stubSource({ getSchedule: () => Promise.reject(new Error('down')) }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Could not load the day schedule.',
    );
    cleanup();

    renderTab(
      <ScheduleWidget />,
      stubSource({
        getSchedule: async () => ({
          date: '18 Jul 2026',
          session: '',
          doctors: [],
          times: [],
          entries: [],
        }),
      }),
    );
    expect(
      await screen.findByRole('heading', {
        name: 'No doctors on the floor this session',
      }),
    ).toBeTruthy();
  });

  it('opens the general booking dialog from the header, reachable by keyboard', async () => {
    renderTab(<ScheduleWidget />);
    const open = await screen.findByRole('button', {
      name: 'Book appointment',
    });
    open.focus();
    expect(document.activeElement).toBe(open);
    fireEvent.click(open);
    const dialog = screen.getByRole('dialog', { name: 'Book appointment' });
    const slot = within(dialog).getByLabelText(
      'Free slot',
    ) as HTMLSelectElement;
    expect(slot.value).toBe('dr-sunitha-10:00');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
