/// <reference lib="dom" />
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockDoctorSource } from '../../data/mock';
import {
  pending,
  renderTab,
  stubChartLayout,
  stubSource,
} from '../../testing/render';
import { QueueWidget } from './queue-view';

beforeEach(() => stubChartLayout());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function roster() {
  return screen.getByRole('group', { name: 'Choose the patient to open' });
}

describe('QueueWidget', () => {
  it('shows the session, the roster, the figures and both charts', async () => {
    renderTab(<QueueWidget />);
    expect(
      await screen.findByRole('heading', { name: "Today's queue" }),
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'My Queue' })).toBeTruthy();
    expect(screen.getByText(/Saturday, 18 Jul 2026/)).toBeTruthy();
    expect(screen.getByText(/Running 12 min behind/)).toBeTruthy();
    expect(screen.getByText('next 7 of 26')).toBeTruthy();

    const people = within(roster()).getAllByRole('radio');
    expect(people).toHaveLength(7);
    expect(people[0].getAttribute('aria-labelledby')).toBeTruthy();
    expect(within(roster()).getByText('Mohd. Irfan')).toBeTruthy();
    expect(within(roster()).getByText('Fever 3 days')).toBeTruthy();

    const figures = screen.getByRole('region', { name: 'Session figures' });
    expect(within(figures).getByText('Consults done today')).toBeTruthy();
    expect(within(figures).getByText('14 / 26')).toBeTruthy();
    expect(within(figures).getByText('12 min')).toBeTruthy();

    expect(
      screen.getByRole('figure', { name: /Consults per hour/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole('figure', { name: /Wait time this week/ }),
    ).toBeTruthy();
    expect(screen.getByText(/17 min avg on Wed/)).toBeTruthy();
  });

  it('says every patient status in words with an icon, never colour alone', async () => {
    renderTab(<QueueWidget />);
    await screen.findByRole('group');
    for (const word of ['In room', 'Done', 'Waiting', 'Booked']) {
      const chips = within(roster()).getAllByText(word);
      expect(chips.length).toBeGreaterThan(0);
      expect(chips[0].querySelector('[data-slot="icon"]')).not.toBeNull();
    }
    // An urgent complaint carries its own mark, as well as its colour.
    const urgent = within(roster()).getByText('Fever 3 days');
    expect(urgent.querySelector('[data-slot="icon"]')).not.toBeNull();
  });

  it('names the selected patient on the start button, and opens that consultation', async () => {
    const source = stubSource();
    const start = vi.spyOn(source, 'startConsultation');
    renderTab(<QueueWidget />, source);
    await screen.findByRole('group');
    // Lakshmi Devi is in the room and pre-selected.
    expect(
      screen.getByRole('button', {
        name: /Start consultation · Lakshmi Devi/,
      }),
    ).toBeTruthy();

    fireEvent.click(
      within(roster()).getByRole('radio', { name: /T-14.*Mohd\. Irfan/ }),
    );
    const button = screen.getByRole('button', {
      name: /Start consultation · Mohd\. Irfan/,
    });
    fireEvent.click(button);
    await waitFor(() => expect(start).toHaveBeenCalledWith('T-14'));
    expect(
      await screen.findByText(/Consultation opened for Mohd\. Irfan/),
    ).toBeTruthy();
    const mohd = within(roster()).getByRole('radio', {
      name: /T-14.*Mohd\. Irfan/,
    });
    expect(
      within(mohd.closest('label') as HTMLElement).getByText('In room'),
    ).toBeTruthy();
  });

  it('will not open a patient who has already been seen', async () => {
    renderTab(<QueueWidget />);
    await screen.findByRole('group');
    fireEvent.click(
      within(roster()).getByRole('radio', { name: /T-10.*Venkatesh Naidu/ }),
    );
    const button = screen.getByRole('button', {
      name: /Start consultation · Venkatesh Naidu/,
    });
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('shows the loading state with the header in place', () => {
    renderTab(<QueueWidget />, stubSource({ getQueue: pending }));
    expect(screen.getByRole('heading', { name: 'My Queue' })).toBeTruthy();
    const loading = screen.getByRole('status');
    expect(loading.getAttribute('aria-busy')).toBe('true');
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('shows the error state and loads again on Try again', async () => {
    const real = createMockDoctorSource();
    const getQueue = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockImplementation(() => real.getQueue());
    renderTab(<QueueWidget />, stubSource({ getQueue }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load your queue.');
    // The source's own error text is never shown.
    expect(alert.textContent).not.toContain('network down');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('group')).toBeTruthy();
    expect(getQueue).toHaveBeenCalledTimes(2);
  });

  it('shows the empty state when nobody is on the list', async () => {
    const queue = await createMockDoctorSource().getQueue();
    renderTab(
      <QueueWidget />,
      stubSource({ getQueue: async () => ({ ...queue, entries: [] }) }),
    );
    expect(
      await screen.findByRole('heading', { name: 'No one is on your list' }),
    ).toBeTruthy();
  });

  it('is reachable from the keyboard and names its controls', async () => {
    renderTab(<QueueWidget />);
    await screen.findByRole('group');
    const button = screen.getByRole('button', { name: /Start consultation/ });
    button.focus();
    expect(document.activeElement).toBe(button);
    for (const radio of within(roster()).getAllByRole('radio')) {
      expect(radio.getAttribute('aria-labelledby')).toBeTruthy();
    }
    expect(
      screen.getByRole('heading', { name: 'Consults per hour' }),
    ).toBeTruthy();
  });
});
