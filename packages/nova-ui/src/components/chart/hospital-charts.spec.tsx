import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { fireEvent } from '@testing-library/react';
import { DepartmentHeatmap } from './department-heatmap';
import { FunnelChart } from './funnel-chart';
import { heatFill, heatLevel } from './hospital-shared';
import { OccupancyAreaChart } from './occupancy-area-chart';
import { PatientFlowChart } from './patient-flow-chart';
import { VitalsChart, type VitalsConfig } from './vitals-chart';
import { WaitTimeChart } from './wait-time-chart';

// Health data never reaches a log: render with the probe patient and figure, and read every console
// call back.
function expectNothingLogged(element: ReactElement, probes: RegExp) {
  const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
    (method) => vi.spyOn(console, method).mockImplementation(() => undefined),
  );
  try {
    render(element);
    const logged = spies
      .flatMap((spy) => spy.mock.calls.flat())
      .map((arg) => String(arg));
    expect(logged.filter((text) => probes.test(text))).toEqual([]);
  } finally {
    spies.forEach((spy) => spy.mockRestore());
  }
}

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

describe('OccupancyAreaChart', () => {
  const week = [
    { day: 'Mon', icu: 10, wardA: 40 },
    { day: 'Tue', icu: 12, wardA: 46 },
    { day: 'Wed', icu: 14, wardA: 50 },
    { day: 'Thu', icu: 11, wardA: 44 },
  ];
  const props = {
    data: week,
    config: {
      icu: { label: 'ICU', color: 'chart-1' },
      wardA: { label: 'Ward A', color: 'chart-2' },
    },
    categoryKey: 'day',
    seriesKeys: ['icu', 'wardA'],
    capacity: 60,
    ariaLabel: 'Bed occupancy this week',
  };

  it('is a named figure on an opaque data surface', () => {
    render(<OccupancyAreaChart {...props} />);
    expect(
      screen
        .getByRole('figure', { name: 'Bed occupancy this week' })
        .classList.contains('nova-data'),
    ).toBe(true);
  });

  it('stacks a washed area per ward', () => {
    const { container } = render(<OccupancyAreaChart {...props} />);
    expect(container.querySelectorAll('.recharts-area-area')).toHaveLength(2);
  });

  it('rules the capacity in quiet ink and tints the zone above it in the critical status colour', () => {
    const { container } = render(<OccupancyAreaChart {...props} />);
    const rule = container.querySelector('.recharts-reference-line-line');
    expect(rule?.getAttribute('stroke')).toBe('var(--nova-color-ink-2)');
    const zone = container.querySelector('.recharts-reference-area-rect');
    expect(zone?.getAttribute('fill')).toBe('var(--nova-color-crit)');
  });

  it('marks each over-capacity period with a diamond on the total', () => {
    const { container } = render(<OccupancyAreaChart {...props} />);
    // Wed is 64 of 60; Tue is 58, under.
    expect(flags(container, 'data-occupancy-over')).toEqual(['Wed']);
    expect(
      container.querySelector('[data-occupancy-over]')?.tagName.toLowerCase(),
    ).toBe('polygon');
  });

  it('names the wards, the capacity and the over-capacity marker in its legend', () => {
    render(<OccupancyAreaChart {...props} />);
    expect(
      legendLabels(
        screen.getByRole('figure', { name: 'Bed occupancy this week' }),
      ),
    ).toEqual(['ICU', 'Ward A', 'Capacity (60 beds)', 'Over capacity']);
  });

  it('carries a data table with each ward, the total and the over-capacity periods in words', () => {
    render(<OccupancyAreaChart {...props} />);
    expect(tableRows('Bed occupancy this week')).toEqual([
      ['day', 'ICU', 'Ward A', 'Total'],
      ['Mon', '10', '40', '50'],
      ['Tue', '12', '46', '58'],
      ['Wed', '14', '50', '64 (over capacity by 4)'],
      ['Thu', '11', '44', '55'],
    ]);
  });

  it('says the capacity and when it was exceeded in its description', () => {
    render(<OccupancyAreaChart {...props} description="A busy week." />);
    expect(
      describedText(
        screen.getByRole('figure', { name: 'Bed occupancy this week' }),
      ),
    ).toBe('A busy week. Capacity 60 beds. Over capacity on Wed.');
  });

  it('handles no data, one point and null values', () => {
    render(<OccupancyAreaChart {...props} data={[]} />);
    expect(tableRows('Bed occupancy this week')).toHaveLength(1);
    cleanup();
    const one = render(<OccupancyAreaChart {...props} data={[week[2]]} />);
    expect(flags(one.container, 'data-occupancy-over')).toEqual(['Wed']);
    cleanup();
    expect(() =>
      render(
        <OccupancyAreaChart
          {...props}
          data={[
            { day: 'Mon', icu: null, wardA: 40 },
            { day: 'Tue', icu: 'n/a' },
          ]}
        />,
      ),
    ).not.toThrow();
    expect(tableRows('Bed occupancy this week')[2]).toEqual([
      'Tue',
      'No data',
      'No data',
      'No data',
    ]);
  });

  it('never logs a figure', () => {
    expectNothingLogged(
      <OccupancyAreaChart
        {...props}
        ariaLabel="Ramesh ward"
        data={[{ day: 'Mon', icu: 999, wardA: 1 }]}
      />,
      /Ramesh|999/,
    );
  });
});

describe('PatientFlowChart', () => {
  const days = [
    { day: 'Mon', admitted: 12, discharged: 10, census: 52 },
    { day: 'Tue', admitted: 9, discharged: 12, census: 49 },
    { day: 'Wed', admitted: 14, discharged: 14, census: 49 },
  ];
  const props = {
    data: days,
    config: {
      admitted: { label: 'Admissions', color: 'chart-1' },
      discharged: { label: 'Discharges', color: 'chart-2' },
      census: { label: 'Census', color: 'chart-3' },
    },
    categoryKey: 'day',
    admissionsKey: 'admitted',
    dischargesKey: 'discharged',
    censusKey: 'census',
    ariaLabel: 'Patient flow this week',
  };

  it('is a named figure on an opaque data surface', () => {
    render(<PatientFlowChart {...props} />);
    expect(
      screen
        .getByRole('figure', { name: 'Patient flow this week' })
        .classList.contains('nova-data'),
    ).toBe(true);
  });

  it('draws admissions and discharges as columns and the census as an area on its own axis', () => {
    const { container } = render(<PatientFlowChart {...props} />);
    expect(container.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(
      6,
    );
    expect(container.querySelectorAll('.recharts-area-area')).toHaveLength(1);
    expect(container.querySelectorAll('.recharts-yAxis')).toHaveLength(2);
  });

  it('names the three series in its legend', () => {
    render(<PatientFlowChart {...props} />);
    expect(
      legendLabels(
        screen.getByRole('figure', { name: 'Patient flow this week' }),
      ),
    ).toEqual(['Admissions', 'Discharges', 'Census']);
  });

  it('carries a data table with the net movement of each period, signed', () => {
    render(<PatientFlowChart {...props} />);
    expect(tableRows('Patient flow this week')).toEqual([
      ['day', 'Admissions', 'Discharges', 'Census', 'Net'],
      ['Mon', '12', '10', '52', '+2'],
      ['Tue', '9', '12', '49', '−3'],
      ['Wed', '14', '14', '49', '0'],
    ]);
  });

  it('handles no data, one period and null values', () => {
    render(<PatientFlowChart {...props} data={[]} />);
    expect(tableRows('Patient flow this week')).toHaveLength(1);
    cleanup();
    const one = render(<PatientFlowChart {...props} data={[days[0]]} />);
    expect(
      one.container.querySelectorAll('.recharts-bar-rectangle'),
    ).toHaveLength(2);
    cleanup();
    expect(() =>
      render(
        <PatientFlowChart
          {...props}
          data={[{ day: 'Mon', admitted: null, discharged: 4, census: null }]}
        />,
      ),
    ).not.toThrow();
    expect(tableRows('Patient flow this week')[1]).toEqual([
      'Mon',
      'No data',
      '4',
      'No data',
      'No data',
    ]);
  });

  it('never logs a figure', () => {
    expectNothingLogged(
      <PatientFlowChart
        {...props}
        ariaLabel="Ramesh flow"
        data={[{ day: 'Mon', admitted: 999, discharged: 1, census: 2 }]}
      />,
      /Ramesh|999/,
    );
  });
});

describe('WaitTimeChart', () => {
  const hours = [
    { hour: '08:00', p50: 18, p90: 26 },
    { hour: '09:00', p50: 24, p90: 41 },
    { hour: '10:00', p50: 35, p90: 58 },
    { hour: '11:00', p50: 20, p90: 29 },
  ];
  const props = {
    data: hours,
    config: {
      p50: { label: 'Median wait', color: 'chart-1' },
      p90: { label: '90th percentile' },
    },
    categoryKey: 'hour',
    p50Key: 'p50',
    p90Key: 'p90',
    target: 30,
    ariaLabel: 'ED wait time today',
  };

  it('is a named figure on an opaque data surface', () => {
    render(<WaitTimeChart {...props} />);
    expect(
      screen
        .getByRole('figure', { name: 'ED wait time today' })
        .classList.contains('nova-data'),
    ).toBe(true);
  });

  it('draws the median as a line over a p50 to p90 band, both in the series colour', () => {
    const { container } = render(<WaitTimeChart {...props} />);
    expect(container.querySelectorAll('.recharts-area-area')).toHaveLength(1);
    expect(container.querySelectorAll('.recharts-line-curve')).toHaveLength(1);
    expect(
      container.querySelector('.recharts-line-curve')?.getAttribute('stroke'),
    ).toBe('var(--color-p50)');
  });

  it('rules the target as the prototype draws a target line: ink, dashed 4 4', () => {
    const { container } = render(<WaitTimeChart {...props} />);
    const rule = container.querySelector('.recharts-reference-line-line');
    expect(rule?.getAttribute('stroke')).toBe('var(--nova-color-ink-3)');
    expect(rule?.getAttribute('stroke-dasharray')).toBe('4 4');
  });

  it('marks a breach by shape: a triangle for the median, a diamond for the 90th percentile', () => {
    const { container } = render(<WaitTimeChart {...props} />);
    expect(flags(container, 'data-wait-breach')).toEqual(['p90', 'p90', 'p50']);
    const median = container.querySelector('[data-wait-breach="p50"]');
    expect(median?.getAttribute('data-shape')).toBe('triangle-up');
    expect(
      container
        .querySelector('[data-wait-breach="p90"]')
        ?.getAttribute('data-shape'),
    ).toBe('diamond');
  });

  it('names the median, the band, the target and both markers in its legend', () => {
    render(<WaitTimeChart {...props} />);
    expect(
      legendLabels(screen.getByRole('figure', { name: 'ED wait time today' })),
    ).toEqual([
      'Median wait',
      'Median to 90th percentile',
      'Target (30 min)',
      'Median above target',
      '90th percentile above target',
    ]);
  });

  it('carries a data table with each percentile and the status in words', () => {
    render(<WaitTimeChart {...props} />);
    expect(tableRows('ED wait time today')).toEqual([
      ['hour', 'Median wait', '90th percentile', 'Status'],
      ['08:00', '18 min', '26 min', 'Within target'],
      ['09:00', '24 min', '41 min', '90th percentile above target'],
      ['10:00', '35 min', '58 min', 'Median above target'],
      ['11:00', '20 min', '29 min', 'Within target'],
    ]);
  });

  it('says the target and the breaches in its description', () => {
    render(<WaitTimeChart {...props} />);
    expect(
      describedText(screen.getByRole('figure', { name: 'ED wait time today' })),
    ).toBe(
      'Target 30 min. Median above target at 10:00. 90th percentile above target at 09:00, 10:00.',
    );
  });

  it('handles no data, one point and null values', () => {
    render(<WaitTimeChart {...props} data={[]} />);
    expect(tableRows('ED wait time today')).toHaveLength(1);
    cleanup();
    const one = render(<WaitTimeChart {...props} data={[hours[2]]} />);
    expect(flags(one.container, 'data-wait-breach').sort()).toEqual([
      'p50',
      'p90',
    ]);
    cleanup();
    expect(() =>
      render(
        <WaitTimeChart
          {...props}
          data={[
            { hour: '08:00', p50: null, p90: 20 },
            { hour: '09:00', p50: 12 },
          ]}
        />,
      ),
    ).not.toThrow();
    expect(tableRows('ED wait time today')[1]).toEqual([
      '08:00',
      'No data',
      '20 min',
      'No data',
    ]);
  });

  it('never logs a figure', () => {
    expectNothingLogged(
      <WaitTimeChart
        {...props}
        ariaLabel="Ramesh wait"
        data={[{ hour: '08:00', p50: 999, p90: 1000 }]}
      />,
      /Ramesh|999/,
    );
  });
});

describe('the heatmap scale', () => {
  it('bins a value into one of five steps from zero to the maximum', () => {
    expect(heatLevel(0, 40)).toBe(0);
    expect(heatLevel(7, 40)).toBe(0);
    expect(heatLevel(8, 40)).toBe(1);
    expect(heatLevel(39, 40)).toBe(4);
    expect(heatLevel(40, 40)).toBe(4);
    expect(heatLevel(5, 0)).toBe(0);
  });

  // One hue, rising in strength from the surface: a lightness ramp reads for every colour vision
  // and, mixed into the scheme's own surface, runs dark to bright in the dark scheme.
  it('is one palette hue mixed into the surface, stronger at every step', () => {
    const steps = [0, 1, 2, 3, 4].map((level) =>
      heatFill('var(--color-arrivals)', level),
    );
    steps.forEach((fill) => {
      expect(fill).toMatch(
        /^color-mix\(in oklab, var\(--color-arrivals\) \d+%, var\(--nova-color-surface\)\)$/,
      );
    });
    const strengths = steps.map((fill) => Number(/(\d+)%/.exec(fill)?.[1]));
    expect(strengths).toEqual([...strengths].sort((a, b) => a - b));
    expect(new Set(strengths).size).toBe(5);
    expect(strengths[4]).toBe(100);
  });
});

describe('DepartmentHeatmap', () => {
  const arrivals = [
    { day: 'Mon', hour: 8, arrivals: 4 },
    { day: 'Mon', hour: 9, arrivals: 40 },
    { day: 'Mon', hour: 10, arrivals: 22 },
    { day: 'Tue', hour: 8, arrivals: 0 },
    { day: 'Tue', hour: 9, arrivals: null },
    { day: 'Tue', hour: 10, arrivals: 31 },
  ];
  const props = {
    data: arrivals,
    rowKey: 'day',
    columnKey: 'hour',
    valueKey: 'arrivals',
    valueLabel: 'ED arrivals',
    columnFormatter: (hour: string | number) =>
      `${String(hour).padStart(2, '0')}:00`,
    ariaLabel: 'ED arrivals by day and hour',
  };

  it('is a named figure on an opaque data surface', () => {
    render(<DepartmentHeatmap {...props} />);
    expect(
      screen
        .getByRole('figure', { name: 'ED arrivals by day and hour' })
        .classList.contains('nova-data'),
    ).toBe(true);
  });

  it('draws a cell per day and hour, binned on the sequential scale, a missing value as no data', () => {
    const { container } = render(<DepartmentHeatmap {...props} />);
    expect(flags(container, 'data-heat-level')).toEqual([
      '0',
      '4',
      '2',
      '0',
      'none',
      '3',
    ]);
  });

  it('keeps the drawn grid away from assistive technology: the table is its reading', () => {
    const { container } = render(<DepartmentHeatmap {...props} />);
    expect(
      container
        .querySelector('[data-heat-cell]')
        ?.closest('[aria-hidden="true"]'),
    ).toBeTruthy();
  });

  it('shows the figure of a cell in a tooltip on hover, and hides it on leaving', () => {
    const { container } = render(<DepartmentHeatmap {...props} />);
    const cells = container.querySelectorAll('[data-heat-cell]');
    fireEvent.mouseEnter(cells[1]);
    // A pointer readout inside the hidden grid: the table already gives every figure to a reader.
    const tip = screen.getByRole('tooltip', { hidden: true });
    expect(within(tip).getByText('Mon · 09:00')).toBeTruthy();
    expect(within(tip).getByText('ED arrivals')).toBeTruthy();
    expect(within(tip).getByText('40')).toBeTruthy();
    fireEvent.mouseLeave(
      container.querySelector('[data-heat-grid]') as Element,
    );
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
  });

  it('has a scale legend from zero to the maximum, and no data, in words', () => {
    const { container } = render(<DepartmentHeatmap {...props} />);
    const legend = container.querySelector('[data-heat-legend]');
    expect(
      Array.from(legend?.querySelectorAll('li') ?? []).map(
        (item) => item.textContent,
      ),
    ).toEqual(['ED arrivals', '0', '40', 'No data']);
    expect(legend?.querySelectorAll('[data-heat-swatch]')).toHaveLength(5);
  });

  it('carries a data table: a row per day, a column per hour', () => {
    render(<DepartmentHeatmap {...props} />);
    expect(tableRows('ED arrivals by day and hour')).toEqual([
      ['day', '08:00', '09:00', '10:00'],
      ['Mon', '4', '40', '22'],
      ['Tue', '0', 'No data', '31'],
    ]);
  });

  it('names the busiest cell in its description', () => {
    render(<DepartmentHeatmap {...props} description="Last week." />);
    expect(
      describedText(
        screen.getByRole('figure', { name: 'ED arrivals by day and hour' }),
      ),
    ).toBe('Last week. Highest ED arrivals: Mon 09:00, 40.');
  });

  it('takes the row and column order it is given', () => {
    render(
      <DepartmentHeatmap
        {...props}
        rows={['Tue', 'Mon']}
        columns={[10, 9, 8]}
      />,
    );
    expect(tableRows('ED arrivals by day and hour')[0]).toEqual([
      'day',
      '10:00',
      '09:00',
      '08:00',
    ]);
    expect(tableRows('ED arrivals by day and hour')[1][0]).toBe('Tue');
  });

  it('handles no data, one cell and non-numeric values', () => {
    render(<DepartmentHeatmap {...props} data={[]} />);
    expect(tableRows('ED arrivals by day and hour')).toHaveLength(1);
    cleanup();
    const one = render(
      <DepartmentHeatmap
        {...props}
        data={[{ day: 'Mon', hour: 8, arrivals: 3 }]}
      />,
    );
    expect(flags(one.container, 'data-heat-level')).toEqual(['4']);
    cleanup();
    expect(() =>
      render(
        <DepartmentHeatmap
          {...props}
          data={[
            { day: 'Mon', hour: 8, arrivals: 'n/a' },
            { day: null, hour: 9, arrivals: 2 },
          ]}
        />,
      ),
    ).not.toThrow();
  });

  it('never logs a figure', () => {
    expectNothingLogged(
      <DepartmentHeatmap
        {...props}
        ariaLabel="Ramesh arrivals"
        data={[{ day: 'Mon', hour: 8, arrivals: 999 }]}
      />,
      /Ramesh|999/,
    );
  });
});

describe('FunnelChart', () => {
  const pathway = [
    { stage: 'Registered', patients: 1240 },
    { stage: 'Consulted', patients: 1180 },
    { stage: 'Investigated', patients: 826 },
    { stage: 'Admitted', patients: 310 },
    { stage: 'Discharged', patients: 298 },
  ];
  const props = {
    data: pathway,
    config: { patients: { label: 'Patients', color: 'chart-1' } },
    categoryKey: 'stage',
    valueKey: 'patients',
    ariaLabel: 'Patient pathway this month',
  };

  it('is a named figure on an opaque data surface', () => {
    render(<FunnelChart {...props} />);
    expect(
      screen
        .getByRole('figure', { name: 'Patient pathway this month' })
        .classList.contains('nova-data'),
    ).toBe(true);
  });

  it('draws a bar per stage, in order, on a track', () => {
    const { container } = render(<FunnelChart {...props} />);
    expect(container.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(
      5,
    );
    expect(
      Array.from(
        container.querySelectorAll('.recharts-yAxis-tick-labels text'),
      ).map((tick) => tick.textContent),
    ).toEqual([
      'Registered',
      'Consulted',
      'Investigated',
      'Admitted',
      'Discharged',
    ]);
    expect(
      container.querySelectorAll('.recharts-bar-background-rectangle'),
    ).toHaveLength(5);
  });

  it('labels each bar with its count and the drop-off from the stage before', () => {
    const { container } = render(<FunnelChart {...props} />);
    expect(
      Array.from(container.querySelectorAll('[data-funnel-label]')).map(
        (label) => label.textContent,
      ),
    ).toEqual([
      '1,240',
      '1,180 · −5%',
      '826 · −30%',
      '310 · −62%',
      '298 · −4%',
    ]);
  });

  it('carries a data table with the share of the first stage and the drop-off', () => {
    render(<FunnelChart {...props} />);
    expect(tableRows('Patient pathway this month')).toEqual([
      ['stage', 'Patients', 'Share of first stage', 'Drop-off'],
      ['Registered', '1,240', '100%', '—'],
      ['Consulted', '1,180', '95%', '5%'],
      ['Investigated', '826', '67%', '30%'],
      ['Admitted', '310', '25%', '62%'],
      ['Discharged', '298', '24%', '4%'],
    ]);
  });

  it('says where the pathway ends up and where it loses the most', () => {
    render(<FunnelChart {...props} />);
    expect(
      describedText(
        screen.getByRole('figure', { name: 'Patient pathway this month' }),
      ),
    ).toBe(
      '24% of Registered reached Discharged. Largest drop-off: Investigated to Admitted, 62%.',
    );
  });

  it('handles no data, one stage and null values', () => {
    render(<FunnelChart {...props} data={[]} />);
    expect(tableRows('Patient pathway this month')).toHaveLength(1);
    cleanup();
    const one = render(<FunnelChart {...props} data={[pathway[0]]} />);
    expect(one.container.querySelectorAll('[data-funnel-label]')).toHaveLength(
      1,
    );
    cleanup();
    expect(() =>
      render(
        <FunnelChart
          {...props}
          data={[
            { stage: 'Registered', patients: 0 },
            { stage: 'Consulted', patients: null },
            { stage: 'Admitted', patients: 3 },
          ]}
        />,
      ),
    ).not.toThrow();
    expect(tableRows('Patient pathway this month').slice(1)).toEqual([
      ['Registered', '0', '—', '—'],
      ['Consulted', 'No data', 'No data', 'No data'],
      ['Admitted', '3', '—', 'No data'],
    ]);
  });

  it('never logs a figure', () => {
    expectNothingLogged(
      <FunnelChart
        {...props}
        ariaLabel="Ramesh pathway"
        data={[{ stage: 'Registered', patients: 999 }]}
      />,
      /Ramesh|999/,
    );
  });
});
