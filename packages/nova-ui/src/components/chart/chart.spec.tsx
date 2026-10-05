import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { Bar, BarChart } from 'recharts';
import {
  ChartContainer,
  ChartContext,
  ChartLegendContent,
  ChartTooltipContent,
  chartColorVar,
  type ChartConfig,
} from './chart';
import { ChartDataTable } from './chart-data-table';
import { NOVA_CHART_PALETTE } from './palette';

// jsdom has no layout and no ResizeObserver, and Recharts' ResponsiveContainer measures its parent.
// The stub reports a fixed 600x300 box as soon as it is observed, so the chart really renders.
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
  revenue: { label: 'Revenue', color: 'chart-1' },
  cost: { label: 'Cost', color: '#123456' },
  margin: { label: 'Margin' },
} satisfies ChartConfig;

const data = [
  { month: 'Jan', revenue: 1200, cost: 800 },
  { month: 'Feb', revenue: 1500, cost: 900 },
];

function plot() {
  return (
    <BarChart data={data}>
      <Bar dataKey="revenue" fill={chartColorVar('revenue')} />
    </BarChart>
  );
}

describe('ChartContainer', () => {
  it('is a figure with an accessible name', () => {
    render(
      <ChartContainer config={config} ariaLabel="Revenue by month">
        {plot()}
      </ChartContainer>,
    );
    expect(
      screen.getByRole('figure', { name: 'Revenue by month' }),
    ).toBeTruthy();
  });

  it('really draws the chart inside it (the sizing stub works)', () => {
    const { container } = render(
      <ChartContainer config={config} ariaLabel="Revenue by month">
        {plot()}
      </ChartContainer>,
    );
    expect(container.querySelector('svg.recharts-surface')).toBeTruthy();
    expect(container.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(
      2,
    );
  });

  it('turns the chart into a keyboard-reachable region through the accessibility layer', () => {
    const { container } = render(
      <ChartContainer config={config} ariaLabel="Revenue by month">
        <BarChart data={data} accessibilityLayer>
          <Bar dataKey="revenue" />
        </BarChart>
      </ChartContainer>,
    );
    const surface = container.querySelector('svg.recharts-surface');
    expect(surface?.getAttribute('tabindex')).toBe('0');
    expect(surface?.getAttribute('role')).toBe('application');
  });

  it('describes the figure with the description when there is one', () => {
    render(
      <ChartContainer
        config={config}
        ariaLabel="Revenue by month"
        description="Revenue rose from January to February."
      >
        {plot()}
      </ChartContainer>,
    );
    const figure = screen.getByRole('figure', { name: 'Revenue by month' });
    const describedBy = figure.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)?.textContent).toBe(
      'Revenue rose from January to February.',
    );
  });

  it('has no aria-describedby without a description', () => {
    render(
      <ChartContainer config={config} ariaLabel="Revenue by month">
        {plot()}
      </ChartContainer>,
    );
    expect(
      screen
        .getByRole('figure', { name: 'Revenue by month' })
        .hasAttribute('aria-describedby'),
    ).toBe(false);
  });

  it('exposes each series colour as --color-<key>: a palette slot resolves, a CSS colour passes through, no colour takes the next slot', () => {
    render(
      <ChartContainer config={config} ariaLabel="Revenue by month">
        {plot()}
      </ChartContainer>,
    );
    const figure = screen.getByRole('figure', { name: 'Revenue by month' });
    expect(figure.style.getPropertyValue('--color-revenue')).toBe(
      NOVA_CHART_PALETTE[0],
    );
    expect(figure.style.getPropertyValue('--color-cost')).toBe('#123456');
    expect(figure.style.getPropertyValue('--color-margin')).toBe(
      NOVA_CHART_PALETTE[2],
    );
  });

  it('turns a key that is not a CSS identifier into a safe variable name', () => {
    expect(chartColorVar('Cash / self pay')).toBe(
      'var(--color-Cash---self-pay)',
    );
    render(
      <ChartContainer
        config={{ 'Cash / self pay': { label: 'Cash', color: 'chart-2' } }}
        ariaLabel="Payer mix"
      >
        {plot()}
      </ChartContainer>,
    );
    expect(
      screen
        .getByRole('figure', { name: 'Payer mix' })
        .style.getPropertyValue('--color-Cash---self-pay'),
    ).toBe(NOVA_CHART_PALETTE[1]);
  });

  it('keeps a caller-supplied style next to the colour variables', () => {
    render(
      <ChartContainer
        config={config}
        ariaLabel="Revenue by month"
        style={{ maxWidth: 480 }}
      >
        {plot()}
      </ChartContainer>,
    );
    const figure = screen.getByRole('figure', { name: 'Revenue by month' });
    expect(figure.style.maxWidth).toBe('480px');
    expect(figure.style.getPropertyValue('--color-revenue')).not.toBe('');
  });

  it('is an opaque nova-data container, so glass never sits behind a plot', () => {
    render(
      <ChartContainer
        config={config}
        ariaLabel="Revenue by month"
        className="w-96"
      >
        {plot()}
      </ChartContainer>,
    );
    const classes = Array.from(
      screen.getByRole('figure', { name: 'Revenue by month' }).classList,
    );
    expect(classes).toContain('nova-data');
    expect(classes).toContain('rounded-lg');
    expect(classes).toContain('w-96');
    expect(classes).not.toContain('nova-surface');
  });

  it('drops its own surface when it sits inside one that is already opaque', () => {
    render(
      <ChartContainer config={config} ariaLabel="Revenue by month" bare>
        {plot()}
      </ChartContainer>,
    );
    expect(
      screen
        .getByRole('figure', { name: 'Revenue by month' })
        .classList.contains('nova-data'),
    ).toBe(false);
  });

  it('renders the data table alternative and an overlay it is given', () => {
    render(
      <ChartContainer
        config={config}
        ariaLabel="Revenue by month"
        table={<table data-testid="alt" />}
        overlay={<span>Centre</span>}
      >
        {plot()}
      </ChartContainer>,
    );
    const figure = screen.getByRole('figure', { name: 'Revenue by month' });
    expect(within(figure).getByTestId('alt')).toBeTruthy();
    expect(within(figure).getByText('Centre')).toBeTruthy();
  });
});

describe('ChartTooltipContent', () => {
  const datum = { month: 'Jan', revenue: 1200, cost: 800 };
  const payload = [
    {
      dataKey: 'revenue',
      name: 'revenue',
      value: 1200,
      color: 'var(--color-revenue)',
      payload: datum,
    },
    {
      dataKey: 'cost',
      name: 'cost',
      value: 800,
      color: 'var(--color-cost)',
      payload: datum,
    },
  ] as never;

  function renderTooltip(props: Record<string, unknown> = {}) {
    return render(
      <ChartContext.Provider value={{ config }}>
        <ChartTooltipContent active payload={payload} label="Jan" {...props} />
      </ChartContext.Provider>,
    );
  }

  it('renders nothing while it is not active', () => {
    const { container } = renderTooltip({ active: false });
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing without a payload', () => {
    const { container } = renderTooltip({ payload: [] });
    expect(container.firstChild).toBeNull();
  });

  it('floats on the overlay material', () => {
    renderTooltip({ className: 'min-w-40' });
    const classes = Array.from(screen.getByRole('tooltip').classList);
    expect(classes).toContain('nova-overlay');
    expect(classes).toContain('min-w-40');
  });

  it('shows the category label, the series labels from the config and the values', () => {
    renderTooltip();
    expect(screen.getByText('Jan')).toBeTruthy();
    expect(screen.getByText('Revenue')).toBeTruthy();
    expect(screen.getByText('Cost')).toBeTruthy();
    expect(screen.getByText('1,200')).toBeTruthy();
    expect(screen.getByText('800')).toBeTruthy();
  });

  it('sets figures in the mono font and ink, and words in the secondary ink', () => {
    renderTooltip();
    const figure = Array.from(screen.getByText('1,200').classList);
    expect(figure).toContain('font-mono');
    expect(figure).toContain('text-ink');
    expect(Array.from(screen.getByText('Revenue').classList)).toContain(
      'text-ink-2',
    );
    expect(Array.from(screen.getByText('Jan').classList)).toContain('text-ink');
  });

  it('keys each row with a short stroke in the series colour, hidden from assistive technology', () => {
    const { container } = renderTooltip();
    const keys = container.querySelectorAll<HTMLElement>('[data-indicator]');
    expect(keys).toHaveLength(2);
    expect(keys[0].getAttribute('aria-hidden')).toBe('true');
    expect(keys[0].getAttribute('data-indicator')).toBe('line');
    expect(keys[0].style.backgroundColor).toBe('var(--color-revenue)');
  });

  it('can draw a dot, or no key at all', () => {
    const dot = renderTooltip({ indicator: 'dot' });
    expect(dot.container.querySelector('[data-indicator="dot"]')).toBeTruthy();
    cleanup();
    const none = renderTooltip({ hideIndicator: true });
    expect(none.container.querySelector('[data-indicator]')).toBeNull();
  });

  it('can hide the label', () => {
    renderTooltip({ hideLabel: true });
    expect(screen.queryByText('Jan')).toBeNull();
  });

  it('formats a value and a label with the formatters it is given', () => {
    renderTooltip({
      formatter: (value: number) => `Rs ${value}`,
      labelFormatter: (label: string) => `Month: ${label}`,
    });
    expect(screen.getByText('Rs 1200')).toBeTruthy();
    expect(screen.getByText('Month: Jan')).toBeTruthy();
  });

  it('takes the label from a key of the datum', () => {
    renderTooltip({ label: 'ignored', labelKey: 'month' });
    expect(screen.getByText('Jan')).toBeTruthy();
    expect(screen.queryByText('ignored')).toBeNull();
  });

  it('takes the series name from a key of the datum', () => {
    const slices = [
      {
        dataKey: 'visitors',
        name: 'visitors',
        value: 40,
        color: 'var(--color-cost)',
        payload: { payer: 'cost', visitors: 40 },
      },
    ] as never;
    renderTooltip({ payload: slices, nameKey: 'payer', hideLabel: true });
    expect(screen.getByText('Cost')).toBeTruthy();
  });
});

describe('ChartLegendContent', () => {
  const payload = [
    {
      value: 'revenue',
      dataKey: 'revenue',
      type: 'rect',
      color: 'var(--color-revenue)',
    },
    {
      value: 'cost',
      dataKey: 'cost',
      type: 'line',
      color: 'var(--color-cost)',
    },
  ] as never;

  function renderLegend(props: Record<string, unknown> = {}) {
    return render(
      <ChartContext.Provider value={{ config }}>
        <ChartLegendContent payload={payload} {...props} />
      </ChartContext.Provider>,
    );
  }

  it('lists the series by their config label', () => {
    renderLegend();
    expect(screen.getByText('Revenue')).toBeTruthy();
    expect(screen.getByText('Cost')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('keys each label with a mark in the series colour that mirrors the chart mark', () => {
    const { container } = renderLegend();
    const marks = container.querySelectorAll<HTMLElement>('[data-legend-mark]');
    expect(marks).toHaveLength(2);
    expect(marks[0].getAttribute('data-legend-mark')).toBe('rect');
    expect(marks[0].style.backgroundColor).toBe('var(--color-revenue)');
    expect(marks[1].getAttribute('data-legend-mark')).toBe('line');
    expect(marks[0].getAttribute('aria-hidden')).toBe('true');
  });

  it('wears text tokens, never the series colour', () => {
    renderLegend();
    const label = screen.getByText('Revenue');
    expect(Array.from(label.classList)).toContain('text-ink-2');
    expect(label.style.color).toBe('');
  });

  it('can hide the marks', () => {
    const { container } = renderLegend({ hideIcon: true });
    expect(container.querySelector('[data-legend-mark]')).toBeNull();
  });

  it('renders nothing without a payload', () => {
    const { container } = renderLegend({ payload: [] });
    expect(container.firstChild).toBeNull();
  });

  it('uses the datum key to find the label when asked', () => {
    const slices = [
      {
        value: 'cost',
        dataKey: 'visitors',
        type: 'rect',
        color: 'var(--color-cost)',
        payload: { payer: 'cost' },
      },
    ] as never;
    renderLegend({ payload: slices, nameKey: 'payer' });
    expect(screen.getByText('Cost')).toBeTruthy();
  });
});

describe('ChartDataTable', () => {
  const rows = [
    { month: 'Jan', revenue: 1200, cost: null },
    { month: 'Feb', revenue: 1500, cost: 900 },
  ];

  function renderTable(props: Record<string, unknown> = {}) {
    return render(
      <ChartDataTable
        caption="Revenue by month"
        data={rows}
        config={config}
        categoryKey="month"
        seriesKeys={['revenue', 'cost']}
        {...props}
      />,
    );
  }

  it('is a real table with a caption, read by screen readers and not drawn', () => {
    renderTable();
    const table = screen.getByRole('table', { name: 'Revenue by month' });
    expect(table.closest('.sr-only')).toBeTruthy();
  });

  it('has the category and series labels as column headers', () => {
    renderTable();
    const headers = screen
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent);
    expect(headers).toEqual(['month', 'Revenue', 'Cost']);
  });

  it('contains every value, with the category as the row header', () => {
    renderTable();
    const feb = screen.getByRole('row', { name: /Feb/ });
    expect(within(feb).getByRole('rowheader').textContent).toBe('Feb');
    expect(
      within(feb)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['1,500', '900']);
  });

  it('says so when a value is missing, instead of leaving a silent gap', () => {
    renderTable();
    const jan = screen.getByRole('row', { name: /Jan/ });
    expect(
      within(jan)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['1,200', 'No data']);
  });

  it('formats values with the formatter it is given', () => {
    renderTable({ formatValue: (value: number) => `Rs ${value}` });
    expect(screen.getByText('Rs 1500')).toBeTruthy();
  });

  it('adds a total row when it is given one', () => {
    renderTable({ total: { label: 'Total', values: ['2,700', '900'] } });
    const total = screen.getByRole('row', { name: /Total/ });
    expect(
      within(total)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['2,700', '900']);
  });
});
