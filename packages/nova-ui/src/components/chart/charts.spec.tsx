import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { AreaChart } from './area-chart';
import { BarChart } from './bar-chart';
import { DonutChart } from './donut-chart';
import { LineChart } from './line-chart';
import { NOVA_CHART_PALETTE } from './palette';
import { Sparkline } from './sparkline';
import type { ChartConfig } from './chart';

// jsdom has no layout and no ResizeObserver, and Recharts' ResponsiveContainer measures its parent.
// The stub reports a fixed 600x300 box as soon as it is observed, so every chart really renders.
class FixedResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ target, contentRect: { width: 600, height: 300 } }] as never,
      this as never,
    );
  }
  unobserve() {
    // Nothing to release.
  }
  disconnect() {
    // Nothing to release.
  }
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', FixedResizeObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const config = {
  admitted: { label: 'Admitted', color: 'chart-1' },
  discharged: { label: 'Discharged' },
} satisfies ChartConfig;

const data = [
  { day: 'Mon', admitted: 42, discharged: 38 },
  { day: 'Tue', admitted: 51, discharged: 40 },
  { day: 'Wed', admitted: 47, discharged: 55 },
];

const cartesian = {
  data,
  config,
  categoryKey: 'day',
  seriesKeys: ['admitted', 'discharged'],
};

function tableValues(name: string): string[][] {
  const table = screen.getByRole('table', { name });
  return within(table)
    .getAllByRole('row')
    .map((row) =>
      Array.from(row.querySelectorAll('th, td')).map(
        (cell) => cell.textContent ?? '',
      ),
    );
}

describe.each([
  ['BarChart', BarChart, '.recharts-bar-rectangle', 6],
  ['LineChart', LineChart, '.recharts-line-curve', 2],
  ['AreaChart', AreaChart, '.recharts-area-curve', 2],
] as const)('%s', (_name, Chart, mark, markCount) => {
  it('is a figure with the accessible name it is given', () => {
    render(<Chart {...cartesian} ariaLabel="Daily movement" />);
    expect(screen.getByRole('figure', { name: 'Daily movement' })).toBeTruthy();
  });

  it('really draws its marks', () => {
    const { container } = render(
      <Chart {...cartesian} ariaLabel="Daily movement" />,
    );
    expect(container.querySelectorAll(mark)).toHaveLength(markCount);
  });

  // The named figure and its data table are the accessible chart. Recharts' accessibility layer
  // would add an unnamed role="application" tab stop per chart, eight on a dashboard.
  it('adds no tab stop and no unnamed application region', () => {
    const { container } = render(
      <Chart {...cartesian} ariaLabel="Daily movement" />,
    );
    const svg = container.querySelector('svg.recharts-surface');
    expect(svg).not.toBeNull();
    expect(svg?.hasAttribute('tabindex')).toBe(false);
    expect(svg?.getAttribute('role')).not.toBe('application');
  });

  it('carries a data table alternative with every value', () => {
    render(<Chart {...cartesian} ariaLabel="Daily movement" />);
    expect(tableValues('Daily movement')).toEqual([
      ['day', 'Admitted', 'Discharged'],
      ['Mon', '42', '38'],
      ['Tue', '51', '40'],
      ['Wed', '47', '55'],
    ]);
  });

  it('formats the table values with the value formatter', () => {
    render(
      <Chart
        {...cartesian}
        ariaLabel="Daily movement"
        valueFormatter={(value) => `${value} pts`}
      />,
    );
    expect(tableValues('Daily movement')[1]).toEqual([
      'Mon',
      '42 pts',
      '38 pts',
    ]);
  });

  it('publishes the series colours from the config', () => {
    render(<Chart {...cartesian} ariaLabel="Daily movement" />);
    const figure = screen.getByRole('figure', { name: 'Daily movement' });
    expect(figure.style.getPropertyValue('--color-admitted')).toBe(
      NOVA_CHART_PALETTE[0],
    );
    expect(figure.style.getPropertyValue('--color-discharged')).toBe(
      NOVA_CHART_PALETTE[1],
    );
  });

  it('has a legend naming every series when there are two or more', () => {
    render(<Chart {...cartesian} ariaLabel="Daily movement" />);
    const figure = screen.getByRole('figure', { name: 'Daily movement' });
    const legend = figure.querySelector('.recharts-legend-wrapper');
    expect(legend).toBeTruthy();
    expect(
      within(legend as HTMLElement)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Admitted', 'Discharged']);
  });

  it('has no legend box for a single series, the title already names it', () => {
    const { container } = render(
      <Chart
        {...cartesian}
        seriesKeys={['admitted']}
        ariaLabel="Daily admissions"
      />,
    );
    expect(container.querySelector('.recharts-legend-wrapper')).toBeNull();
  });

  it('can be told to show or hide the legend', () => {
    const hidden = render(
      <Chart {...cartesian} ariaLabel="Daily movement" legend={false} />,
    );
    expect(
      hidden.container.querySelector('.recharts-legend-wrapper'),
    ).toBeNull();
    cleanup();
    const shown = render(
      <Chart
        {...cartesian}
        seriesKeys={['admitted']}
        ariaLabel="Daily admissions"
        legend
      />,
    );
    expect(
      shown.container.querySelector('.recharts-legend-wrapper'),
    ).toBeTruthy();
  });

  it('describes itself when it has a description', () => {
    render(
      <Chart
        {...cartesian}
        ariaLabel="Daily movement"
        description="Admissions peaked on Tuesday."
      />,
    );
    const figure = screen.getByRole('figure', { name: 'Daily movement' });
    expect(
      document.getElementById(figure.getAttribute('aria-describedby') ?? '')
        ?.textContent,
    ).toBe('Admissions peaked on Tuesday.');
  });

  it('sits on an opaque data surface, or none when asked', () => {
    render(<Chart {...cartesian} ariaLabel="Daily movement" />);
    expect(
      screen
        .getByRole('figure', { name: 'Daily movement' })
        .classList.contains('nova-data'),
    ).toBe(true);
    cleanup();
    render(<Chart {...cartesian} ariaLabel="Daily movement" bare />);
    expect(
      screen
        .getByRole('figure', { name: 'Daily movement' })
        .classList.contains('nova-data'),
    ).toBe(false);
  });

  it('sets axis text in the quiet ink, never in a series colour', () => {
    const { container } = render(
      <Chart {...cartesian} ariaLabel="Daily movement" />,
    );
    const ticks = container.querySelectorAll(
      '.recharts-cartesian-axis-tick-value',
    );
    expect(ticks.length).toBeGreaterThan(0);
    ticks.forEach((tick) => {
      expect(tick.getAttribute('fill')).toBe('var(--nova-color-ink-3)');
    });
  });

  it('merges className and passes attributes through', () => {
    render(
      <Chart
        {...cartesian}
        ariaLabel="Daily movement"
        className="max-w-md"
        data-testid="chart"
      />,
    );
    const figure = screen.getByTestId('chart');
    expect(figure.classList.contains('max-w-md')).toBe(true);
    expect(figure.classList.contains('nova-data')).toBe(true);
  });
});

describe('BarChart options', () => {
  it('draws columns by default and bars when the orientation is horizontal', () => {
    const column = render(<BarChart {...cartesian} ariaLabel="Movement" />);
    expect(
      column.container.querySelector('.recharts-xAxis-tick-labels text')
        ?.textContent,
    ).toBe('Mon');
    cleanup();
    const bars = render(
      <BarChart {...cartesian} ariaLabel="Movement" orientation="horizontal" />,
    );
    expect(
      bars.container.querySelector('.recharts-yAxis-tick-labels text')
        ?.textContent,
    ).toBe('Mon');
  });

  it('stacks the series when asked, still drawing every segment', () => {
    const { container } = render(
      <BarChart {...cartesian} ariaLabel="Movement" stacked />,
    );
    expect(container.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(
      6,
    );
    // The whole stack is clipped to one rounded outline: only the data end is rounded.
    expect(
      container.querySelector('clipPath[id^="recharts-bar-stack-clip-path"]'),
    ).toBeTruthy();
  });
});

describe('AreaChart options', () => {
  it('draws a wash under each line', () => {
    const { container } = render(
      <AreaChart {...cartesian} ariaLabel="Movement" />,
    );
    expect(container.querySelectorAll('.recharts-area-area')).toHaveLength(2);
  });
});

describe('DonutChart', () => {
  const payers = [
    { payer: 'Insurance', patients: 120 },
    { payer: 'Government scheme', patients: 80 },
    { payer: 'Self pay', patients: 40 },
  ];
  const payerConfig = {
    Insurance: { label: 'Insurance', color: 'chart-1' },
    'Government scheme': { label: 'Government scheme', color: 'chart-2' },
    'Self pay': { label: 'Self pay', color: 'chart-3' },
  } satisfies ChartConfig;
  const props = {
    data: payers,
    config: payerConfig,
    categoryKey: 'payer',
    valueKey: 'patients',
    ariaLabel: 'Payer mix',
  };

  it('adds no tab stop', () => {
    const { container } = render(<DonutChart {...props} />);
    expect(
      container.querySelector('svg.recharts-surface')?.hasAttribute('tabindex'),
    ).toBe(false);
  });

  it('is a figure with the accessible name it is given', () => {
    render(<DonutChart {...props} />);
    expect(screen.getByRole('figure', { name: 'Payer mix' })).toBeTruthy();
  });

  it('really draws a slice per category', () => {
    const { container } = render(<DonutChart {...props} />);
    expect(container.querySelectorAll('.recharts-pie-sector')).toHaveLength(3);
  });

  it('shows the total in the centre', () => {
    render(<DonutChart {...props} />);
    const figure = screen.getByRole('figure', { name: 'Payer mix' });
    const centre = figure.querySelector('svg tspan.font-display');
    expect(centre?.textContent).toBe('240');
    expect(figure.querySelector('svg tspan.fill-ink-2')?.textContent).toBe(
      'Total',
    );
  });

  it('can label the total and format it', () => {
    render(
      <DonutChart
        {...props}
        totalLabel="Patients"
        valueFormatter={(value) => `${value} pts`}
      />,
    );
    const figure = screen.getByRole('figure', { name: 'Payer mix' });
    expect(figure.querySelector('svg tspan.font-display')?.textContent).toBe(
      '240 pts',
    );
    expect(figure.querySelector('svg tspan.fill-ink-2')?.textContent).toBe(
      'Patients',
    );
  });

  it('carries a data table alternative with every slice and the total', () => {
    render(<DonutChart {...props} />);
    expect(tableValues('Payer mix')).toEqual([
      ['payer', 'patients'],
      ['Insurance', '120'],
      ['Government scheme', '80'],
      ['Self pay', '40'],
      ['Total', '240'],
    ]);
  });

  it('has a legend naming every slice', async () => {
    const { container } = render(<DonutChart {...props} />);
    // Recharts fills a pie legend in a moment after the first paint.
    await waitFor(() =>
      expect(
        container.querySelectorAll('.recharts-legend-wrapper li'),
      ).toHaveLength(3),
    );
    expect(
      Array.from(container.querySelectorAll('.recharts-legend-wrapper li')).map(
        (item) => item.textContent,
      ),
    ).toEqual(['Insurance', 'Government scheme', 'Self pay']);
  });

  it('publishes the slice colours from the config', () => {
    render(<DonutChart {...props} />);
    const figure = screen.getByRole('figure', { name: 'Payer mix' });
    expect(figure.style.getPropertyValue('--color-Insurance')).toBe(
      NOVA_CHART_PALETTE[0],
    );
    expect(figure.style.getPropertyValue('--color-Government-scheme')).toBe(
      NOVA_CHART_PALETTE[1],
    );
  });

  it('sits on an opaque data surface', () => {
    render(<DonutChart {...props} />);
    expect(
      screen
        .getByRole('figure', { name: 'Payer mix' })
        .classList.contains('nova-data'),
    ).toBe(true);
  });
});

describe('Sparkline', () => {
  const props = {
    data,
    config,
    categoryKey: 'day',
    seriesKeys: ['admitted'],
    ariaLabel: 'Admissions this week',
  };

  it('is a figure with the accessible name it is given', () => {
    render(<Sparkline {...props} />);
    expect(
      screen.getByRole('figure', { name: 'Admissions this week' }),
    ).toBeTruthy();
  });

  it('is never a tab stop', () => {
    const { container } = render(<Sparkline {...props} />);
    expect(
      container.querySelector('svg.recharts-surface')?.hasAttribute('tabindex'),
    ).toBe(false);
  });

  it('renders an empty figure rather than throwing when it is given no series', () => {
    render(<Sparkline {...props} seriesKeys={[]} />);
    expect(
      screen.getByRole('figure', { name: 'Admissions this week' }),
    ).toBeTruthy();
  });

  it('draws one line and no axes, grid or legend', () => {
    const { container } = render(<Sparkline {...props} />);
    expect(container.querySelectorAll('.recharts-line-curve')).toHaveLength(1);
    expect(container.querySelector('.recharts-cartesian-axis')).toBeNull();
    expect(container.querySelector('.recharts-cartesian-grid')).toBeNull();
    expect(container.querySelector('.recharts-legend-wrapper')).toBeNull();
  });

  it('marks the latest point with a dot', () => {
    const { container } = render(<Sparkline {...props} />);
    expect(
      container.querySelectorAll('circle[data-sparkline-end]'),
    ).toHaveLength(1);
  });

  it('carries a data table alternative with every value', () => {
    render(<Sparkline {...props} />);
    expect(tableValues('Admissions this week')).toEqual([
      ['day', 'Admitted'],
      ['Mon', '42'],
      ['Tue', '51'],
      ['Wed', '47'],
    ]);
  });

  it('lives inside a tile that is already opaque, so it brings no surface of its own', () => {
    render(<Sparkline {...props} />);
    expect(
      screen
        .getByRole('figure', { name: 'Admissions this week' })
        .classList.contains('nova-data'),
    ).toBe(false);
  });

  it('is short by default and takes a height', () => {
    render(<Sparkline {...props} height={64} />);
    const figure = screen.getByRole('figure', { name: 'Admissions this week' });
    expect((figure.firstElementChild as HTMLElement).style.height).toBe('64px');
  });
});
