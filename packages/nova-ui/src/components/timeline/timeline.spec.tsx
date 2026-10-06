import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
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

function markers(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-marker]'));
}

describe('Timeline', () => {
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
    const titles = screen
      .getAllByRole('listitem')
      .map((item) => item.textContent);
    expect(titles).toEqual([
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
    // An item without a description is just its time and title.
    expect(screen.getAllByRole('listitem')[1]?.textContent).toBe(
      '10:15Labs drawn',
    );
  });

  it.each([
    ['neutral', 'border-primary'],
    ['good', 'border-good'],
    ['warn', 'border-warn'],
    ['crit', 'border-crit'],
    ['info', 'border-info'],
    ['ai', 'bg-ai'],
  ] as const)(
    'maps the %s tone to the %s marker class',
    (tone, markerClass) => {
      const { container } = render(
        <Timeline items={[{ id: 'e', time: '09:00', title: 'Event', tone }]} />,
      );
      const [marker] = markers(container);
      expect(marker?.dataset['tone']).toBe(tone);
      expect(marker?.classList.contains(markerClass)).toBe(true);
    },
  );

  it('draws every marker as a circle, the prototype ring on the panel', () => {
    const { container } = render(<Timeline items={history} />);
    for (const marker of markers(container)) {
      expect([...marker.classList]).toEqual(
        expect.arrayContaining(['rounded-full', 'size-2.5', 'bg-surface']),
      );
    }
  });

  it('defaults an item to the neutral tone', () => {
    const { container } = render(<Timeline items={history} />);
    expect(markers(container).map((marker) => marker.dataset['tone'])).toEqual([
      'info',
      'neutral',
      'crit',
    ]);
  });

  it('hides the rail and markers from assistive technology', () => {
    const { container } = render(<Timeline items={history} />);
    for (const marker of markers(container)) {
      expect(marker.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('draws a connector between events but not after the last one', () => {
    const { container } = render(<Timeline items={history} />);
    expect(container.querySelectorAll('[data-connector]')).toHaveLength(
      history.length - 1,
    );
  });

  it('never marks an AI event by colour alone: a spark marker and the visible AI badge', () => {
    const { container } = render(
      <Timeline
        items={[
          {
            id: 'draft',
            time: '09:12',
            title: 'Triage note drafted',
            tone: 'ai',
          },
          {
            id: 'vitals',
            time: '09:30',
            title: 'Vitals recorded',
            tone: 'good',
          },
        ]}
      />,
    );
    const [ai, plain] = markers(container);
    expect(ai?.textContent).toBe('✦');
    expect(plain?.textContent).toBe('');
    const items = screen.getAllByRole('listitem');
    expect(items[0]?.textContent).toContain('✦AITriage note drafted');
    expect(
      items[0]?.querySelector('[data-badge][data-tone="ai"]'),
    ).not.toBeNull();
    expect(items[1]?.textContent).not.toContain('AI');
    expect(items[1]?.textContent).toContain('GoodVitals recorded');
  });

  it('passes list attributes through', () => {
    render(<Timeline items={history} aria-label="Event history" />);
    expect(screen.getByRole('list', { name: 'Event history' })).toBeTruthy();
  });
});
