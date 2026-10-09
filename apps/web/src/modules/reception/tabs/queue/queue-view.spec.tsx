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
import { QueueWidget } from './queue-view';

afterEach(() => cleanup());

describe('QueueWidget', () => {
  it('shows the figures, the token now serving and the six waiting', async () => {
    renderTab(<QueueWidget />);
    const now = await screen.findByRole('region', { name: 'Now serving' });
    expect(within(now).getByText('T-12')).toBeTruthy();
    expect(within(now).getByText('Venkatesh Naidu')).toBeTruthy();

    const figures = screen.getByRole('region', { name: 'Queue figures' });
    expect(within(figures).getByText("Today's appointments")).toBeTruthy();
    expect(within(figures).getByText('64')).toBeTruthy();
    expect(within(figures).getByText('avg wait 14 min')).toBeTruthy();

    const waiting = screen.getByRole('list', { name: 'Waiting tokens' });
    const tiles = within(waiting).getAllByRole('listitem');
    expect(tiles).toHaveLength(6);
    expect(within(tiles[0]).getByText('T-13')).toBeTruthy();
    expect(within(tiles[0]).getByText('Lakshmi Devi')).toBeTruthy();
    expect(within(tiles[0]).getByText('General Medicine')).toBeTruthy();
  });

  it('says every token state in words with an icon, never colour alone', async () => {
    renderTab(<QueueWidget />);
    const now = await screen.findByRole('region', { name: 'Now serving' });
    const consulting = within(now).getByText('In consultation');
    expect(consulting.querySelector('[data-slot="icon"]')).not.toBeNull();

    const waiting = screen.getByRole('list', { name: 'Waiting tokens' });
    const first = within(waiting).getAllByRole('listitem')[0];
    const state = within(first).getByText(/Waiting · 6 min/);
    expect(state.querySelector('[data-slot="icon"]')).not.toBeNull();

    const seen = screen.getByRole('list', { name: 'Seen today' });
    const done = within(seen).getAllByText('Done');
    expect(done.length).toBeGreaterThan(0);
    expect(done[0].querySelector('[data-slot="icon"]')).not.toBeNull();
  });

  it('calls the next token: T-13 is called and T-12 is seen', async () => {
    renderTab(<QueueWidget />);
    const button = await screen.findByRole('button', { name: /call next/i });
    fireEvent.click(button);
    const now = screen.getByRole('region', { name: 'Now serving' });
    await waitFor(() => expect(within(now).getByText('T-13')).toBeTruthy());
    expect(within(now).getByText('Lakshmi Devi')).toBeTruthy();
    expect(within(now).getByText('Called')).toBeTruthy();
    const seen = screen.getByRole('list', { name: 'Seen today' });
    expect(within(seen).getByText('T-12')).toBeTruthy();
    expect(
      within(screen.getByRole('list', { name: 'Waiting tokens' })).getAllByRole(
        'listitem',
      ),
    ).toHaveLength(5);
    expect(
      await screen.findByText('Now serving T-13 · Lakshmi Devi'),
    ).toBeTruthy();
  });

  it('shows the loading state with the header in place', () => {
    renderTab(<QueueWidget />, stubSource({ getQueue: pending }));
    expect(screen.getByRole('heading', { name: 'Live Queue' })).toBeTruthy();
    const loading = screen.getByRole('status');
    expect(loading.getAttribute('aria-busy')).toBe('true');
    expect(screen.queryByRole('region', { name: 'Now serving' })).toBeNull();
  });

  it('shows the error state and loads again on Try again', async () => {
    const real = createMockReceptionSource();
    const getQueue = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockImplementation(() => real.getQueue());
    renderTab(<QueueWidget />, stubSource({ getQueue }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load the live queue.');
    // The source's own error text is never shown.
    expect(alert.textContent).not.toContain('network down');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('region', { name: 'Now serving' }),
    ).toBeTruthy();
    expect(getQueue).toHaveBeenCalledTimes(2);
  });

  it('shows the empty state when nobody is in the queue', async () => {
    renderTab(
      <QueueWidget />,
      stubSource({ getQueue: async () => ({ kpis: [], tokens: [] }) }),
    );
    expect(
      await screen.findByRole('heading', { name: 'No one is in the queue' }),
    ).toBeTruthy();
  });

  it('is reachable from the keyboard and names its controls', async () => {
    renderTab(<QueueWidget />);
    const button = await screen.findByRole('button', { name: /call next/i });
    button.focus();
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute('tabindex')).not.toBe('-1');
    expect(screen.getByRole('heading', { name: 'Now serving' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Waiting' })).toBeTruthy();
  });
});
