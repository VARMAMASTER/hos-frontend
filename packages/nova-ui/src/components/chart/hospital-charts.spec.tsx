import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { VitalsChart, type VitalsConfig } from './vitals-chart';

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

function tableRows(name: string): string[][] {
  const table = screen.getByRole('table', { name });
  return within(table)
    .getAllByRole('row')
    .map((row) =>
      Array.from(row.querySelectorAll('th, td')).map(
        (cell) => cell.textContent ?? '',
      ),
    );
}

function legendLabels(figure: HTMLElement): string[] {
  return within(figure)
    .getAllByRole('listitem')
    .map((item) => item.textContent ?? '');
}

function describedText(figure: HTMLElement): string {
  return (
    document.getElementById(figure.getAttribute('aria-describedby') ?? '')
      ?.textContent ?? ''
  );
}

// A breach marker never relies on colour: its shape says high or low.
function flags(container: HTMLElement, attribute: string): string[] {
  return Array.from(container.querySelectorAll(`[${attribute}]`)).map(
    (node) => node.getAttribute(attribute) ?? '',
  );
}

describe('VitalsChart', () => {
  const config = {
    hr: {
      label: 'Heart rate',
      unit: 'bpm',
      color: 'chart-1',
      normal: { min: 60, max: 100 },
      thresholds: [{ value: 130, label: 'Tachycardia', level: 'crit' }],
    },
    spo2: {
      label: 'SpO₂',
      unit: '%',
      color: 'chart-2',
      normal: { min: 95, max: 100 },
      thresholds: [{ value: 92, label: 'Hypoxia', level: 'crit' }],
    },
  } satisfies VitalsConfig;

  const readings = [
    { time: '06:00', hr: 82, spo2: 97 },
    { time: '07:00', hr: 112, spo2: 96 },
    { time: '08:00', hr: null, spo2: 91 },
    { time: '09:00', hr: 88, spo2: 95 },
  ];

  const props = {
    data: readings,
    config,
    categoryKey: 'time',
    seriesKeys: ['hr', 'spo2'],
    ariaLabel: 'Vitals, last 4 hours',
  };

  it('is a figure with the accessible name it is given, on an opaque data surface', () => {
    render(<VitalsChart {...props} />);
    const figure = screen.getByRole('figure', { name: 'Vitals, last 4 hours' });
    expect(figure.classList.contains('nova-data')).toBe(true);
  });

  it('draws one panel per vital sign, each on its own scale, sharing the time axis', () => {
    const { container } = render(<VitalsChart {...props} />);
    expect(container.querySelectorAll('svg.recharts-surface')).toHaveLength(2);
    expect(container.querySelectorAll('.recharts-line-curve')).toHaveLength(2);
    expect(screen.getByText('Heart rate')).toBeTruthy();
    expect(screen.getByText('SpO₂')).toBeTruthy();
  });

  it('shades the normal range of each vital and says it in words', () => {
    const { container } = render(<VitalsChart {...props} />);
    expect(
      container.querySelectorAll('.recharts-reference-area-rect'),
    ).toHaveLength(2);
    expect(screen.getByText('bpm · normal 60–100')).toBeTruthy();
    expect(screen.getByText('% · normal 95–100')).toBeTruthy();
  });

  it('draws each threshold as a dashed rule in its status colour', () => {
    const { container } = render(<VitalsChart {...props} />);
    const rules = Array.from(
      container.querySelectorAll('.recharts-reference-line-line'),
    );
    expect(rules).toHaveLength(2);
    rules.forEach((rule) => {
      expect(rule.getAttribute('stroke')).toBe('var(--nova-color-crit)');
      expect(rule.getAttribute('stroke-dasharray')).toBe('4 4');
    });
  });

  it('marks an out-of-range reading by shape (up for high, down for low), never by colour alone', () => {
    const { container } = render(<VitalsChart {...props} />);
    expect(flags(container, 'data-vital-flag').sort()).toEqual(['high', 'low']);
    // The SpO₂ of 91 is past the critical threshold of 92; the heart rate of 112 is only high.
    const low = container.querySelector('[data-vital-flag="low"]');
    expect(low?.tagName.toLowerCase()).toBe('polygon');
    expect(low?.getAttribute('fill')).toBe('var(--nova-color-crit)');
    expect(
      container.querySelector('[data-vital-flag="high"]')?.getAttribute('fill'),
    ).toBe('var(--nova-color-warn)');
  });

  it('leaves a gap for a missing reading rather than joining across it', () => {
    const { container } = render(<VitalsChart {...props} />);
    const hr = container.querySelector('.recharts-line-curve');
    expect((hr?.getAttribute('d') ?? '').match(/M/g)).toHaveLength(2);
  });

  it('names the series, the normal range, the thresholds and the markers in its legend', () => {
    render(<VitalsChart {...props} />);
    const figure = screen.getByRole('figure', { name: 'Vitals, last 4 hours' });
    expect(legendLabels(figure)).toEqual([
      'Heart rate (bpm)',
      'SpO₂ (%)',
      'Normal range',
      'Critical threshold',
      'Above normal',
      'Below normal',
    ]);
  });

  it('carries a data table with every reading, flagging an out-of-range one in words', () => {
    render(<VitalsChart {...props} />);
    expect(tableRows('Vitals, last 4 hours')).toEqual([
      ['time', 'Heart rate (bpm)', 'SpO₂ (%)'],
      ['06:00', '82', '97'],
      ['07:00', '112 (high)', '96'],
      ['08:00', 'No data', '91 (low, critical)'],
      ['09:00', '88', '95'],
    ]);
  });

  it('reads the ranges and thresholds to assistive technology after its own description', () => {
    render(<VitalsChart {...props} description="Stable overnight." />);
    const figure = screen.getByRole('figure', { name: 'Vitals, last 4 hours' });
    expect(describedText(figure)).toBe(
      'Stable overnight. Normal ranges: Heart rate 60–100 bpm; SpO₂ 95–100 %. Thresholds: Heart rate Tachycardia 130 bpm (critical); SpO₂ Hypoxia 92 % (critical). 2 readings out of range.',
    );
  });

  it('marks now with a labelled rule', () => {
    const { container } = render(<VitalsChart {...props} now="08:00" />);
    expect(
      container.querySelectorAll('[data-vital-now]').length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('Now').length).toBeGreaterThan(0);
  });

  it('groups series into one panel when asked (systolic and diastolic blood pressure)', () => {
    const { container } = render(
      <VitalsChart
        ariaLabel="Blood pressure"
        data={[
          { time: '06:00', sys: 128, dia: 82 },
          { time: '07:00', sys: 150, dia: 95 },
        ]}
        config={{
          sys: {
            label: 'Systolic',
            unit: 'mmHg',
            normal: { min: 90, max: 140 },
          },
          dia: {
            label: 'Diastolic',
            unit: 'mmHg',
            normal: { min: 60, max: 90 },
          },
        }}
        categoryKey="time"
        seriesKeys={['sys', 'dia']}
        panels={[
          {
            key: 'bp',
            label: 'Blood pressure',
            unit: 'mmHg',
            seriesKeys: ['sys', 'dia'],
          },
        ]}
      />,
    );
    expect(container.querySelectorAll('svg.recharts-surface')).toHaveLength(1);
    expect(container.querySelectorAll('.recharts-line-curve')).toHaveLength(2);
    expect(
      screen.getByText('Blood pressure', { selector: 'span' }),
    ).toBeTruthy();
    expect(
      screen.getByText('mmHg · normal Systolic 90–140, Diastolic 60–90'),
    ).toBeTruthy();
  });

  it('formats a numeric time with the time formatter, in the table too', () => {
    render(
      <VitalsChart
        {...props}
        data={[
          { t: 0, hr: 70, spo2: 98 },
          { t: 3_600_000, hr: 72, spo2: 97 },
        ]}
        categoryKey="t"
        timeFormatter={(value) => `T+${Number(value) / 3_600_000}h`}
      />,
    );
    expect(tableRows('Vitals, last 4 hours').map((row) => row[0])).toEqual([
      't',
      'T+0h',
      'T+1h',
    ]);
  });

  it('renders an empty figure and table for no readings', () => {
    render(<VitalsChart {...props} data={[]} />);
    expect(
      screen.getByRole('figure', { name: 'Vitals, last 4 hours' }),
    ).toBeTruthy();
    expect(tableRows('Vitals, last 4 hours')).toHaveLength(1);
  });

  it('draws a single reading as a point', () => {
    const { container } = render(
      <VitalsChart {...props} data={[readings[0]]} />,
    );
    expect(container.querySelectorAll('[data-vital-point]')).toHaveLength(2);
  });

  it('does not throw on null, missing or non-numeric values', () => {
    expect(() =>
      render(
        <VitalsChart
          {...props}
          data={[
            { time: '06:00', hr: null, spo2: undefined },
            { time: '07:00', hr: 'n/a', spo2: Number.NaN },
            { time: null },
          ]}
        />,
      ),
    ).not.toThrow();
  });

  it('never logs a reading', () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    render(
      <VitalsChart
        {...props}
        ariaLabel="Ramesh vitals"
        data={[{ time: '06:00', hr: 999, spo2: 1 }]}
      />,
    );
    const logged = spies
      .flatMap((spy) => spy.mock.calls.flat())
      .map((arg) => String(arg));
    expect(logged.filter((text) => /Ramesh|999/.test(text))).toEqual([]);
    spies.forEach((spy) => spy.mockRestore());
  });
});
