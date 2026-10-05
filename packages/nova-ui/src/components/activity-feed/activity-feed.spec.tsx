import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { ActivityFeed, type ActivityFeedItem } from './activity-feed';

afterEach(() => cleanup());

const items: ActivityFeedItem[] = [
  { id: 'a', time: '09:12 AM', title: 'Bed 4 vacated' },
  {
    id: 'b',
    time: '07:48 AM',
    title: 'Ramesh moved to ICU',
    detail: 'Transfer approved by the ward consultant',
    tone: 'warn',
  },
  { id: 'c', time: '04:30 AM', title: 'Alarm raised', tone: 'crit' },
];

function markerOf(row: HTMLElement): HTMLElement {
  const marker = row.querySelector<HTMLElement>('[data-marker]');
  if (!marker) throw new Error('feed row has no marker');
  return marker;
}

describe('ActivityFeed', () => {
  it('is an ordered list, because the order of events is meaningful', () => {
    render(<ActivityFeed items={items} />);
    expect(screen.getByRole('list').tagName).toBe('OL');
  });

  it('renders the items in the order given', () => {
    render(<ActivityFeed items={items} />);
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText('Bed 4 vacated')).toBeTruthy();
    expect(within(rows[1]).getByText('Ramesh moved to ICU')).toBeTruthy();
    expect(within(rows[2]).getByText('Alarm raised')).toBeTruthy();
  });

  it('shows each time in the mono font', () => {
    render(<ActivityFeed items={items} />);
    const time = screen.getByText('09:12 AM');
    expect(time.classList.contains('font-mono')).toBe(true);
  });

  it('shows the detail line only when an item has one', () => {
    render(<ActivityFeed items={items} />);
    expect(
      screen.getByText('Transfer approved by the ward consultant'),
    ).toBeTruthy();
    const rows = screen.getAllByRole('listitem');
    expect(rows[0].querySelectorAll('[data-detail]')).toHaveLength(0);
  });

  it('shows the empty message instead of an empty list', () => {
    render(<ActivityFeed items={[]} emptyMessage="Nothing has happened yet" />);
    expect(screen.getByText('Nothing has happened yet')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('falls back to a default empty message', () => {
    render(<ActivityFeed items={[]} />);
    expect(screen.getByText('No recent activity')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('does not show the empty message when there are items', () => {
    render(<ActivityFeed items={items} emptyMessage="Nothing yet" />);
    expect(screen.queryByText('Nothing yet')).toBeNull();
  });

  it('is neutral unless told otherwise', () => {
    render(<ActivityFeed items={items} />);
    const row = screen.getAllByRole('listitem')[0];
    expect(row.dataset['tone']).toBe('neutral');
    expect(markerOf(row).classList.contains('bg-ink-3')).toBe(true);
  });

  it.each([
    ['neutral', 'bg-ink-3'],
    ['good', 'bg-good'],
    ['warn', 'bg-warn'],
    ['crit', 'bg-crit'],
    ['info', 'bg-info'],
    ['ai', 'text-ai'],
  ] as const)('maps the %s tone to the %s marker', (tone, marker) => {
    render(
      <ActivityFeed items={[{ id: 'x', time: 'now', title: 't', tone }]} />,
    );
    const row = screen.getByRole('listitem');
    expect(row.dataset['tone']).toBe(tone);
    expect(markerOf(row).classList.contains(marker)).toBe(true);
  });

  it('states the tone in text, so severity is never carried by colour alone', () => {
    render(<ActivityFeed items={items} />);
    const rows = screen.getAllByRole('listitem');
    expect(rows[1].textContent).toMatch(/Warning/);
    expect(rows[2].textContent).toMatch(/Critical/);
  });

  it('adds no tone word to a neutral item', () => {
    render(<ActivityFeed items={[items[0]]} />);
    expect(screen.getByRole('listitem').textContent).toBe(
      '09:12 AMBed 4 vacated',
    );
  });

  it('hides the marker dot itself from assistive technology', () => {
    render(<ActivityFeed items={items} />);
    expect(
      markerOf(screen.getAllByRole('listitem')[2]).getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('gives the severe tones a different shape from the rest, as well as a colour', () => {
    render(
      <ActivityFeed
        items={[
          { id: 'g', time: 't', title: 'good', tone: 'good' },
          { id: 'w', time: 't', title: 'warn', tone: 'warn' },
          { id: 'c', time: 't', title: 'crit', tone: 'crit' },
        ]}
      />,
    );
    const [good, warn, crit] = screen
      .getAllByRole('listitem')
      .map((row) => markerOf(row).className);
    expect(good).toContain('rounded-full');
    expect(warn).not.toContain('rounded-full');
    expect(crit).not.toContain('rounded-full');
    expect(warn).not.toBe(crit);
  });

  it('marks AI with the spark, a shape no status marker has', () => {
    render(
      <ActivityFeed items={[{ id: 'a', time: 't', title: 'x', tone: 'ai' }]} />,
    );
    const marker = markerOf(screen.getByRole('listitem'));
    expect(marker.textContent).toBe('✦');
    expect(marker.className).not.toContain('rounded-full');
  });

  it('sits on the opaque data surface, because events are clinical records', () => {
    render(<ActivityFeed items={items} />);
    const list = screen.getByRole('list');
    expect(list.dataset['surface']).toBe('data');
    expect(list.classList.contains('nova-data')).toBe(true);
  });

  it('keeps the same surface under its empty message', () => {
    render(<ActivityFeed items={[]} />);
    const message = screen.getByText('No recent activity');
    expect(
      message.closest('[data-surface]')?.getAttribute('data-surface'),
    ).toBe('data');
  });

  it('names the list when given an aria-label', () => {
    render(<ActivityFeed items={items} aria-label="Ward activity" />);
    expect(screen.getByRole('list', { name: 'Ward activity' })).toBeTruthy();
  });
});
