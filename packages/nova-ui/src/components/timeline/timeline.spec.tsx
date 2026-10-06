import { afterEach, describe, expect, it } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { Timeline, type TimelineItem } from './timeline';

afterEach(() => cleanup());

const history: TimelineItem[] = [
  {
    id: 'admit',
    time: '09:02',
    title: 'Admitted',
    description: 'Via emergency, bed 4B',
    tone: 'info',
  },
  { id: 'labs', time: '10:15', title: 'Labs drawn' },
  { id: 'alert', time: '11:40', title: 'Potassium flagged high', tone: 'crit' },
];

// Noon UTC on 6 Oct 2026. Every test that formats a time pins it, and the zone, so none depends on
// the clock or the machine's locale.
const NOW = '2026-10-06T12:00:00Z';
const pinned = { now: NOW, timeZone: 'UTC' } as const;

function markers(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-marker]'));
}

function connectors(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[data-connector]'),
  ).map((el) => el.dataset['connector']);
}

describe('Timeline semantics', () => {
  it('is an ordered list, because the order of events is meaningful', () => {
    render(<Timeline items={history} />);
    expect(screen.getByRole('list').tagName).toBe('OL');
  });

  it('keeps list semantics even where a browser drops them for list-style: none', () => {
    render(<Timeline items={history} />);
    expect(screen.getByRole('list').getAttribute('role')).toBe('list');
  });

  it('renders every item in the order given, without re-sorting', () => {
    render(
      <Timeline
        items={[
          { id: 'c', time: '11:40', title: 'Third' },
          { id: 'a', time: '09:02', title: 'First' },
          { id: 'b', time: '10:15', title: 'Second' },
        ]}
      />,
    );
    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining('Third'),
      expect.stringContaining('First'),
      expect.stringContaining('Second'),
    ]);
  });

  it('shows each time and title, and the description when there is one', () => {
    render(<Timeline items={history} />);
    expect(screen.getByText('09:02')).toBeTruthy();
    expect(screen.getByText('Admitted')).toBeTruthy();
    expect(screen.getByText('Via emergency, bed 4B')).toBeTruthy();
    // An item with nothing but a time and a title is just those two.
    expect(screen.getAllByRole('listitem')[1]?.textContent).toBe(
      '10:15Labs drawn',
    );
  });

  it('passes list attributes through and merges a className', () => {
    render(
      <Timeline items={history} aria-label="Event history" className="mt-4" />,
    );
    const list = screen.getByRole('list', { name: 'Event history' });
    expect(list.classList.contains('mt-4')).toBe(true);
  });

  it('puts nothing in the tab order when no event is interactive', () => {
    const { container } = render(<Timeline items={history} />);
    expect(
      container.querySelectorAll('button, a, input, [tabindex]'),
    ).toHaveLength(0);
  });

  it('hides the rail and nodes from assistive technology', () => {
    const { container } = render(<Timeline items={history} />);
    for (const marker of markers(container)) {
      expect(marker.closest('[aria-hidden="true"]')).not.toBeNull();
    }
    for (const rail of container.querySelectorAll('[data-connector]')) {
      expect(rail.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });
});

describe('Timeline nodes', () => {
  it.each(['neutral', 'good', 'warn', 'crit', 'info'] as const)(
    'draws a round %s node with a glyph shape of its own, and no text',
    (tone) => {
      const { container } = render(
        <Timeline items={[{ id: 'e', time: '09:00', title: 'Event', tone }]} />,
      );
      const [node] = markers(container);
      expect(node?.dataset['tone']).toBe(tone);
      expect(node?.classList.contains('rounded-full')).toBe(true);
      expect(node?.querySelector('svg')).not.toBeNull();
      expect(node?.textContent).toBe('');
    },
  );

  it('gives every tone a different glyph shape, so status is not colour alone', () => {
    const tones = ['neutral', 'good', 'warn', 'crit', 'info'] as const;
    const { container } = render(
      <Timeline
        items={tones.map((tone) => ({
          id: tone,
          time: '09:00',
          title: tone,
          tone,
        }))}
      />,
    );
    const shapes = markers(container).map((node) =>
      node.querySelector('[data-glyph]')?.getAttribute('data-glyph'),
    );
    expect(new Set(shapes).size).toBe(tones.length);
  });

  it('fills the AI node with the AI gradient and the spark', () => {
    const { container } = render(
      <Timeline
        items={[{ id: 'ai', time: '09:12', title: 'Draft', tone: 'ai' }]}
      />,
    );
    const [node] = markers(container);
    expect(node?.textContent).toBe('✦');
    expect(node?.classList.contains('nova-ai-grad')).toBe(true);
  });

  it('defaults an item to the neutral tone', () => {
    const { container } = render(<Timeline items={history} />);
    expect(markers(container).map((node) => node.dataset['tone'])).toEqual([
      'info',
      'neutral',
      'crit',
    ]);
  });

  it('shows the icon an event brings, in place of the tone glyph', () => {
    const { container } = render(
      <Timeline
        items={[
          {
            id: 'bed',
            time: '09:00',
            title: 'Bed assigned',
            icon: <svg data-testid="bed" />,
          },
        ]}
      />,
    );
    const [node] = markers(container);
    expect(within(node as HTMLElement).getByTestId('bed')).toBeTruthy();
    expect(node?.querySelector('[data-glyph]')).toBeNull();
  });

  it('never marks an AI event by colour alone: a spark node and the visible AI badge', () => {
    render(
      <Timeline
        items={[
          { id: 'draft', time: '09:12', title: 'Triage note', tone: 'ai' },
          { id: 'vitals', time: '09:30', title: 'Vitals', tone: 'good' },
        ]}
      />,
    );
    const rows = screen.getAllByRole('listitem');
    expect(
      rows[0]?.querySelector('[data-badge][data-tone="ai"]'),
    ).not.toBeNull();
    expect(rows[1]?.textContent).not.toContain('AI');
    expect(rows[1]?.textContent).toContain('GoodVitals');
  });

  it('names a toned event in words, and says nothing for a neutral one', () => {
    render(<Timeline items={history} />);
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]?.textContent).toContain('Info');
    expect(rows[2]?.textContent).toContain('Critical');
    expect(rows[1]?.textContent).not.toMatch(/Info|Good|Warning|Critical/);
  });
});

describe('Timeline connector', () => {
  it('runs from the first node down, through every node, and stops at the last one', () => {
    const { container } = render(<Timeline items={history} />);
    expect(connectors(container)).toEqual(['from-node', 'full', 'to-node']);
  });

  it('draws no line for a single event', () => {
    const { container } = render(
      <Timeline items={[history[0] as TimelineItem]} />,
    );
    expect(connectors(container)).toEqual([]);
  });
});

describe('Timeline time', () => {
  const at = (iso: string, id = iso): TimelineItem => ({
    id,
    at: iso,
    title: 'Event',
  });

  it('renders the relative time and the absolute time inside a <time dateTime>', () => {
    const { container } = render(
      <Timeline {...pinned} items={[at('2026-10-06T10:00:00Z')]} />,
    );
    const time = container.querySelector('time');
    expect(time?.getAttribute('datetime')).toBe('2026-10-06T10:00:00.000Z');
    expect(time?.textContent).toContain('2 h ago');
    expect(time?.textContent).toContain('10:00');
    const absolute = within(time as HTMLElement).getByText('10:00');
    expect(absolute.classList.contains('font-mono')).toBe(true);
  });

  it.each([
    ['2026-10-06T11:59:40Z', 'just now'],
    ['2026-10-06T11:55:00Z', '5 min ago'],
    ['2026-10-06T09:00:00Z', '3 h ago'],
    ['2026-10-04T12:00:00Z', '2 d ago'],
    ['2026-10-06T12:10:00Z', 'in 10 min'],
  ])('says %s is "%s"', (iso, words) => {
    const { container } = render(<Timeline {...pinned} items={[at(iso)]} />);
    expect(container.querySelector('time')?.textContent).toContain(words);
  });

  it('shows the date as well as the time for an event on another day, when not grouped', () => {
    const { container } = render(
      <Timeline {...pinned} items={[at('2026-10-03T14:05:00Z')]} />,
    );
    expect(container.querySelector('time')?.textContent).toContain(
      '3 Oct, 14:05',
    );
  });

  it('shows the year when it is not this one', () => {
    const { container } = render(
      <Timeline {...pinned} items={[at('2025-12-24T14:05:00Z')]} />,
    );
    expect(container.querySelector('time')?.textContent).toContain(
      '24 Dec 2025, 14:05',
    );
  });

  it('reads the clock in the zone it is given', () => {
    const { container } = render(
      <Timeline
        now={NOW}
        timeZone="Asia/Kolkata"
        items={[at('2026-10-06T10:00:00Z')]}
      />,
    );
    expect(container.querySelector('time')?.textContent).toContain('15:30');
  });

  it('shows a time as given when the event has no instant, and says nothing when it has neither', () => {
    const { container } = render(
      <Timeline
        items={[
          {
            id: 'a',
            time: <time dateTime="2026-10-06">Today</time>,
            title: 'A',
          },
          { id: 'b', title: 'B' },
        ]}
      />,
    );
    expect(container.querySelectorAll('time')).toHaveLength(1);
    expect(screen.getAllByRole('listitem')[1]?.textContent).toBe('B');
  });

  it('lets an explicit time override what is derived from the instant, and keeps the instant machine-readable', () => {
    const { container } = render(
      <Timeline
        {...pinned}
        items={[
          { id: 'a', at: '2026-10-06T10:00:00Z', time: 'Shift 2', title: 'A' },
        ]}
      />,
    );
    const time = container.querySelector('time');
    expect(time?.textContent).toBe('Shift 2');
    expect(time?.getAttribute('datetime')).toBe('2026-10-06T10:00:00.000Z');
  });
});

describe('Timeline day groups', () => {
  const days: TimelineItem[] = [
    { id: 'a', at: '2026-10-06T10:00:00Z', title: 'Today event' },
    { id: 'b', at: '2026-10-06T08:30:00Z', title: 'Earlier today' },
    { id: 'c', at: '2026-10-05T16:00:00Z', title: 'Yesterday event' },
    { id: 'd', at: '2026-10-03T14:05:00Z', title: 'Older event' },
  ];

  it('is off unless asked for', () => {
    render(<Timeline {...pinned} items={days} />);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
    expect(screen.getAllByRole('list')).toHaveLength(1);
  });

  it('heads each day as "Today", "Yesterday" or the date, in the order given', () => {
    render(<Timeline {...pinned} groupByDay items={days} />);
    expect(
      screen.getAllByRole('heading').map((heading) => heading.textContent),
    ).toEqual(['Today', 'Yesterday', '3 Oct 2026']);
  });

  it('nests each day as a list inside one ordered list, with the events under their day', () => {
    render(
      <Timeline {...pinned} groupByDay items={days} aria-label="History" />,
    );
    const outer = screen.getByRole('list', { name: 'History' });
    expect(outer.tagName).toBe('OL');
    const today = screen.getByRole('heading', { name: 'Today' }).closest('li');
    const inner = within(today as HTMLElement).getByRole('list');
    expect(inner.tagName).toBe('OL');
    expect(within(inner).getAllByRole('listitem')).toHaveLength(2);
  });

  it('uses the zone for the day boundary', () => {
    render(
      <Timeline
        now={NOW}
        timeZone="Asia/Kolkata"
        groupByDay
        items={[
          // 00:30 on 6 Oct in India, though still 5 Oct in UTC.
          { id: 'a', at: '2026-10-05T19:00:00Z', title: 'Just after midnight' },
        ]}
      />,
    );
    expect(screen.getByRole('heading').textContent).toBe('Today');
  });

  it('shows only the clock time under a day heading, since the heading has the date', () => {
    const { container } = render(
      <Timeline {...pinned} groupByDay items={days} />,
    );
    const last = Array.from(container.querySelectorAll('time')).at(-1);
    expect(last?.textContent).toContain('14:05');
    expect(last?.textContent).not.toContain('3 Oct');
  });

  it('heads a day at the level asked for', () => {
    render(<Timeline {...pinned} groupByDay headingLevel={4} items={days} />);
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(3);
  });

  it('keeps an event with no instant in the day before it', () => {
    render(
      <Timeline
        {...pinned}
        groupByDay
        items={[
          days[0] as TimelineItem,
          { id: 'x', time: '09:00', title: 'No instant' },
        ]}
      />,
    );
    const today = screen.getByRole('heading', { name: 'Today' }).closest('li');
    expect(within(today as HTMLElement).getByText('No instant')).toBeTruthy();
  });

  it('carries the line through the day headings without a break', () => {
    const { container } = render(
      <Timeline {...pinned} groupByDay items={days} />,
    );
    // Every heading has a rail, and only the last event's ends at its node.
    const headers = container.querySelectorAll(
      '[data-day-header] [data-connector]',
    );
    expect(headers).toHaveLength(3);
    const events = Array.from(
      container.querySelectorAll('li li [data-connector]'),
    ).map((el) => (el as HTMLElement).dataset['connector']);
    expect(events).toEqual(['full', 'full', 'full', 'to-node']);
  });
});

describe('Timeline actor', () => {
  it('shows who did it, and their role', () => {
    render(
      <Timeline
        items={[
          {
            id: 'a',
            time: '09:00',
            title: 'Discharged',
            actor: { name: 'Dr. Meera Iyer', role: 'Consultant' },
          },
        ]}
      />,
    );
    const row = screen.getByRole('listitem');
    expect(row.textContent).toContain('Dr. Meera Iyer');
    expect(row.textContent).toContain('Consultant');
  });

  it('shows an avatar only when asked, and announces the name once', () => {
    render(
      <Timeline
        items={[
          {
            id: 'a',
            time: '09:00',
            title: 'With avatar',
            actor: { name: 'Asha Rao', avatar: true },
          },
          {
            id: 'b',
            time: '09:05',
            title: 'Without',
            actor: { name: 'Ravi Kumar' },
          },
        ]}
      />,
    );
    const [first, second] = screen.getAllByRole('listitem');
    const avatar = first?.querySelector('[data-size]');
    expect(avatar).not.toBeNull();
    expect(avatar?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(second?.querySelector('[data-size]')).toBeNull();
  });
});

describe('Timeline details', () => {
  const withDetails: TimelineItem[] = [
    {
      id: 'labs',
      time: '10:15',
      title: 'Labs resulted',
      details: <p>Potassium 6.1 mmol/L</p>,
    },
    { id: 'plain', time: '11:00', title: 'Seen by nurse' },
  ];

  it('offers a disclosure button only where there are details', () => {
    render(<Timeline items={withDetails} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('starts collapsed, with the button reporting it and the region hidden', () => {
    render(<Timeline items={withDetails} />);
    const button = screen.getByRole('button', { name: /Details/ });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('type')).toBe('button');
    const region = document.getElementById(
      button.getAttribute('aria-controls') ?? '',
    );
    expect(region?.hasAttribute('hidden')).toBe(true);
    expect(screen.queryByText('Potassium 6.1 mmol/L')).toBeNull();
  });

  it('expands and collapses, keeping aria-expanded and the region in step', () => {
    render(<Timeline items={withDetails} />);
    const button = screen.getByRole('button', { name: /Details/ });
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const region = screen.getByRole('region');
    expect(region.hasAttribute('hidden')).toBe(false);
    expect(region.id).toBe(button.getAttribute('aria-controls'));
    expect(within(region).getByText('Potassium 6.1 mmol/L')).toBeTruthy();
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('names the region by the button, and the button by its event', () => {
    render(<Timeline items={withDetails} />);
    const button = screen.getByRole('button', { name: /Details/ });
    const title = screen.getByText('Labs resulted');
    expect(button.getAttribute('aria-describedby')).toBe(title.id);
    fireEvent.click(button);
    expect(screen.getByRole('region').getAttribute('aria-labelledby')).toBe(
      button.id,
    );
  });

  it('can start expanded', () => {
    render(
      <Timeline
        items={[{ ...(withDetails[0] as TimelineItem), defaultExpanded: true }]}
      />,
    );
    expect(
      screen
        .getByRole('button', { name: /Details/ })
        .getAttribute('aria-expanded'),
    ).toBe('true');
    expect(screen.getByText('Potassium 6.1 mmol/L')).toBeTruthy();
  });

  it('expands each event on its own', () => {
    render(
      <Timeline
        items={[
          ...withDetails,
          { id: 'x', time: '12:00', title: 'Other', details: 'More' },
        ]}
      />,
    );
    const [first, second] = screen.getAllByRole('button');
    fireEvent.click(first as HTMLElement);
    expect(first?.getAttribute('aria-expanded')).toBe('true');
    expect(second?.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('Timeline density', () => {
  it('is comfortable by default and can be compact, with smaller nodes', () => {
    const { container, rerender } = render(<Timeline items={history} />);
    const root = screen.getByRole('list');
    expect(root.getAttribute('data-density')).toBe('comfortable');
    const comfortable = markers(container)[0]?.className;
    rerender(<Timeline items={history} density="compact" />);
    expect(screen.getByRole('list').getAttribute('data-density')).toBe(
      'compact',
    );
    expect(markers(container)[0]?.className).not.toBe(comfortable);
    expect(markers(container)[0]?.classList.contains('size-5')).toBe(true);
  });
});

describe('Timeline loading and empty', () => {
  it('shows a busy skeleton, not a list, while loading', () => {
    render(<Timeline items={[]} loading aria-label="Event history" />);
    expect(screen.queryByRole('list')).toBeNull();
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-busy')).toBe('true');
    expect(status.textContent).toContain('Loading events');
  });

  it('animates the skeleton only for people who allow motion', () => {
    const { container } = render(<Timeline items={[]} loading />);
    const bars = container.querySelectorAll('[data-skeleton]');
    expect(bars.length).toBeGreaterThan(0);
    for (const bar of bars) {
      expect(bar.classList.contains('motion-safe:animate-pulse')).toBe(true);
      expect(bar.classList.contains('animate-pulse')).toBe(false);
    }
  });

  it('draws as many skeleton events as asked', () => {
    const { container } = render(
      <Timeline items={[]} loading skeletonCount={5} />,
    );
    expect(container.querySelectorAll('[data-skeleton-row]')).toHaveLength(5);
  });

  it('prefers the skeleton to stale items while loading', () => {
    render(<Timeline items={history} loading />);
    expect(screen.queryByText('Admitted')).toBeNull();
  });

  it('shows an empty state, with a default message, when there are no events', () => {
    render(<Timeline items={[]} />);
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.getByRole('heading', { name: 'No events yet' })).toBeTruthy();
  });

  it('shows the empty state a caller gives', () => {
    render(
      <Timeline items={[]} empty={<p>Nothing recorded for this stay</p>} />,
    );
    expect(screen.getByText('Nothing recorded for this stay')).toBeTruthy();
    expect(screen.queryByText('No events yet')).toBeNull();
  });

  it('keeps the caller attributes on the wrapper in both states', () => {
    const { rerender } = render(
      <Timeline items={[]} loading data-testid="root" className="mt-4" />,
    );
    expect(screen.getByTestId('root').classList.contains('mt-4')).toBe(true);
    rerender(<Timeline items={[]} data-testid="root" className="mt-4" />);
    expect(screen.getByTestId('root').classList.contains('mt-4')).toBe(true);
  });
});
