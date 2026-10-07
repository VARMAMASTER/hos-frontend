import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { KpiTile } from './kpi-tile';

afterEach(() => cleanup());

const classesOf = (element: HTMLElement) => Array.from(element.classList);

describe('KpiTile', () => {
  it('renders the label, the value and the delta', () => {
    render(<KpiTile label="Collections today" value="₹4.2L" delta="+12%" />);
    expect(screen.getByText('Collections today')).toBeTruthy();
    expect(screen.getByText('₹4.2L')).toBeTruthy();
    expect(screen.getByText('+12%')).toBeTruthy();
  });

  // The prototype's .kpi-v and .kpi-l.
  it('shows the value at 26px bold in the display face with tabular numerals, under a 12px label at 500', () => {
    render(<KpiTile label="Beds free" value="14" />);
    const value = classesOf(screen.getByText('14'));
    for (const name of [
      'font-display',
      'text-kpi',
      'font-bold',
      'tabular-nums',
      'slashed-zero',
    ]) {
      expect(value).toContain(name);
    }
    expect(classesOf(screen.getByText('Beds free'))).toEqual(
      expect.arrayContaining(['text-label', 'font-medium', 'text-ink-2']),
    );
  });

  it('renders a value of zero rather than dropping it', () => {
    render(<KpiTile label="Overdue claims" value={0} />);
    expect(screen.getByText('0')).toBeTruthy();
  });

  // The prototype's .kpi: the card corner, the card's 16px of padding, its own gradient edge, lifting
  // 2px on hover.
  it('is an opaque, rounded, padded data tile with the KPI gradient edge', () => {
    render(<KpiTile label="Beds free" value="14" data-testid="tile" />);
    const tile = classesOf(screen.getByTestId('tile'));
    for (const name of [
      'nova-data',
      'rounded-card',
      'p-card',
      '[--nova-data-edge:var(--nova-gradient-edge-kpi)]',
      'hover:[--nova-data-lift:var(--nova-shadow-lg)]',
      'motion-safe:hover:-translate-y-s0',
    ]) {
      expect(tile).toContain(name);
    }
    expect(tile).not.toContain('nova-surface');
  });

  it('merges className and passes attributes through', () => {
    render(
      <KpiTile
        label="Beds free"
        value="14"
        className="w-48"
        data-testid="tile"
        id="beds"
      />,
    );
    const tile = screen.getByTestId('tile');
    expect(tile.classList.contains('w-48')).toBe(true);
    expect(tile.classList.contains('nova-data')).toBe(true);
    expect(tile.id).toBe('beds');
  });

  it('draws no delta when it has neither a delta nor a trend', () => {
    render(<KpiTile label="Beds free" value="14" data-testid="tile" />);
    expect(screen.getByTestId('tile').querySelector('[data-delta]')).toBeNull();
    expect(screen.getByTestId('tile').textContent).toBe('Beds free14');
  });

  it('renders a delta of zero rather than dropping it', () => {
    render(<KpiTile label="Overdue claims" value="3" delta={0} />);
    expect(screen.getByText('0')).toBeTruthy();
  });
});

describe('KpiTile tone', () => {
  // The delta sits on the -soft fill in the -deep ink of its status; neutral uses the surface tokens.
  const expected = {
    neutral: ['text-ink-3'],
    good: ['text-good-deep'],
    warn: ['text-warn-deep'],
    crit: ['text-crit-deep'],
  } as const;

  it('is neutral by default', () => {
    render(
      <KpiTile label="Beds free" value="14" delta="+2" data-testid="tile" />,
    );
    expect(screen.getByTestId('tile').dataset['tone']).toBe('neutral');
    const delta = classesOf(screen.getByText('+2'));
    for (const name of expected.neutral) expect(delta).toContain(name);
    for (const status of ['good', 'warn', 'crit']) {
      expect(delta.some((name) => name.includes(status))).toBe(false);
    }
  });

  it.each(['neutral', 'good', 'warn', 'crit'] as const)(
    'maps the %s tone to its text ink (the prototype .kpi-d), and fills nothing',
    (tone) => {
      render(
        <KpiTile
          label="Claims"
          value="31"
          delta="+4"
          tone={tone}
          data-testid="tile"
        />,
      );
      expect(screen.getByTestId('tile').dataset['tone']).toBe(tone);
      const [ink] = expected[tone];
      const delta = classesOf(screen.getByText('+4'));
      // text-caption is the size, not a colour.
      expect(delta.filter((name) => name.startsWith('bg-'))).toEqual([]);
      expect(
        delta.filter((name) => /^text-/.test(name) && name !== 'text-caption'),
      ).toEqual([ink]);
    },
  );
});

describe('KpiTile trend', () => {
  it.each([
    ['up', '↑', 'Up'],
    ['down', '↓', 'Down'],
    ['flat', '→', 'Unchanged'],
  ] as const)(
    'marks a %s trend with a %s glyph and a text label, so colour is not the only signal',
    (trend, glyph, label) => {
      render(<KpiTile label="Claims" value="31" delta="12%" trend={trend} />);
      const marker = screen.getByText(glyph);
      expect(marker.getAttribute('aria-hidden')).toBe('true');
      const spoken = screen.getByText(label);
      expect(spoken.classList.contains('sr-only')).toBe(true);
      expect(spoken.getAttribute('aria-hidden')).toBeNull();
    },
  );

  it('reads the direction before the figure, so assistive tech says "Up 12%"', () => {
    render(<KpiTile label="Claims" value="31" delta="12%" trend="up" />);
    expect(screen.getByText('12%').textContent).toBe('↑Up12%');
  });

  it('draws the marker without a delta figure when only a trend is given', () => {
    render(<KpiTile label="Claims" value="31" trend="down" />);
    expect(screen.getByText('↓')).toBeTruthy();
    expect(screen.getByText('Down')).toBeTruthy();
  });

  it('adds no marker when there is no trend', () => {
    render(<KpiTile label="Claims" value="31" delta="12%" />);
    expect(screen.queryByText('↑')).toBeNull();
    expect(screen.queryByText('↓')).toBeNull();
    expect(screen.queryByText('→')).toBeNull();
    expect(screen.getByText('12%').textContent).toBe('12%');
  });

  it('keeps the direction and the sentiment independent: rising rejections are up and critical', () => {
    render(
      <KpiTile
        label="Claim rejections"
        value="9"
        delta="3"
        trend="up"
        tone="crit"
      />,
    );
    expect(screen.getByText('↑')).toBeTruthy();
    const delta = classesOf(screen.getByText('3'));
    expect(delta).toContain('text-crit-deep');
  });

  it('does not colour the delta from the trend alone', () => {
    render(<KpiTile label="Claims" value="31" delta="12%" trend="up" />);
    const delta = classesOf(screen.getByText('12%'));
    expect(delta).toContain('text-ink-3');
    expect(delta.some((name) => name.includes('good'))).toBe(false);
  });
});

describe('KpiTile visual slot', () => {
  it('lays a trailing visual (a sparkline) beside the figures, inside the tile', () => {
    render(
      <KpiTile
        label="Collections"
        value="₹4.2L"
        visual={<svg data-testid="spark" />}
        data-testid="tile"
      />,
    );
    const tile = screen.getByTestId('tile');
    const slot = screen.getByTestId('spark').closest('[data-visual]');
    expect(slot).not.toBeNull();
    expect(tile.contains(slot)).toBe(true);
    expect(slot?.contains(screen.getByText('₹4.2L'))).toBe(false);
  });

  it('draws no slot without a visual', () => {
    render(<KpiTile label="Beds" value="14" data-testid="tile" />);
    expect(
      screen.getByTestId('tile').querySelector('[data-visual]'),
    ).toBeNull();
  });
});
