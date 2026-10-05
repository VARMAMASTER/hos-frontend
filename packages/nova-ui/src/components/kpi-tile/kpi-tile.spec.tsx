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

  it('shows the value in the mono font at a large size, under a quiet label', () => {
    render(<KpiTile label="Beds free" value="14" />);
    const value = classesOf(screen.getByText('14'));
    expect(value).toContain('font-mono');
    expect(value).toContain('text-3xl');
    expect(classesOf(screen.getByText('Beds free'))).toContain('text-ink-3');
  });

  it('renders a value of zero rather than dropping it', () => {
    render(<KpiTile label="Overdue claims" value={0} />);
    expect(screen.getByText('0')).toBeTruthy();
  });

  it('is an opaque, rounded, padded data tile', () => {
    render(<KpiTile label="Beds free" value="14" data-testid="tile" />);
    const tile = classesOf(screen.getByTestId('tile'));
    expect(tile).toContain('nova-data');
    expect(tile).toContain('rounded-lg');
    expect(tile.some((name) => /^p-\d/.test(name))).toBe(true);
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
    default: ['bg-surface-2', 'text-ink-2'],
    good: ['bg-good-soft', 'text-good-deep'],
    warn: ['bg-warn-soft', 'text-warn-deep'],
    crit: ['bg-crit-soft', 'text-crit-deep'],
  } as const;

  it('is neutral by default', () => {
    render(
      <KpiTile label="Beds free" value="14" delta="+2" data-testid="tile" />,
    );
    expect(screen.getByTestId('tile').dataset['tone']).toBe('default');
    const delta = classesOf(screen.getByText('+2'));
    for (const name of expected.default) expect(delta).toContain(name);
    for (const status of ['good', 'warn', 'crit']) {
      expect(delta.some((name) => name.includes(status))).toBe(false);
    }
  });

  it.each(['default', 'good', 'warn', 'crit'] as const)(
    'maps the %s tone to its soft fill and deep ink, and colours nothing else',
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
      const [fill, ink] = expected[tone];
      const delta = classesOf(screen.getByText('+4'));
      // text-xs is the size, not a colour.
      expect(delta.filter((name) => name.startsWith('bg-'))).toEqual([fill]);
      expect(delta.filter((name) => /^text-(?!xs$)/.test(name))).toEqual([ink]);
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
    expect(delta).toContain('bg-crit-soft');
    expect(delta).toContain('text-crit-deep');
  });

  it('does not colour the delta from the trend alone', () => {
    render(<KpiTile label="Claims" value="31" delta="12%" trend="up" />);
    const delta = classesOf(screen.getByText('12%'));
    expect(delta).toContain('bg-surface-2');
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
