/// <reference lib="dom" />
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockDoctorSource } from '../../data/mock';
import {
  pending,
  renderTab,
  stubChartLayout,
  stubSource,
} from '../../testing/render';
import { InsightsWidget } from './insights-view';

beforeEach(() => stubChartLayout());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function analyze() {
  fireEvent.click(
    await screen.findByRole('button', { name: /Analyze my last 30 days/ }),
  );
  return screen.findByRole('group', {
    name: /Clinical pattern — worth a screening habit/,
  });
}

describe('InsightsWidget', () => {
  it('waits to be asked, and says the insights are private suggestions, never report cards', async () => {
    renderTab(<InsightsWidget />);
    await screen.findByRole('button', { name: /Analyze my last 30 days/ });
    expect(
      screen.getByRole('heading', {
        name: /Patterns across your consultations/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Private to you; insights are suggestions, never report cards/,
      ),
    ).toBeTruthy();
    expect(
      screen.queryByRole('group', { name: /Clinical pattern/ }),
    ).toBeNull();
  });

  it('analyses the last 30 days step by step, then shows three insights', async () => {
    renderTab(<InsightsWidget />);
    await analyze();
    expect(
      screen.getByRole('group', {
        name: /Schedule pattern — Tuesday clinic runs late/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('group', { name: /What's working — keep doing this/ }),
    ).toBeTruthy();
    expect(screen.getByText(/visible to you, not to management/)).toBeTruthy();
  });

  it('marks each insight as an AI draft, with where it came from', async () => {
    renderTab(<InsightsWidget />);
    const first = await analyze();
    expect(within(first).getByText('AI draft')).toBeTruthy();
    expect(within(first).getByText('Draft — awaiting approval')).toBeTruthy();
    expect(within(first).getByText('✦ From 412 transcripts')).toBeTruthy();
    expect(within(first).getByText(/14 of your 62 T2DM patients/)).toBeTruthy();
  });

  it('draws the pattern as a chart with a data table', async () => {
    renderTab(<InsightsWidget />);
    await analyze();
    const chart = screen.getByRole('figure', {
      name: /Foot tingling in T2DM patients/,
    });
    expect(within(chart).getAllByText('14').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('figure', { name: /Minutes late by clinic block/ }),
    ).toBeTruthy();
  });

  it('acts on an insight only when the doctor approves it', async () => {
    const source = stubSource();
    const act = vi.spyOn(source, 'actOnInsight');
    renderTab(<InsightsWidget />, source);
    const first = await analyze();
    expect(act).not.toHaveBeenCalled();
    fireEvent.click(
      within(first).getByRole('button', {
        name: /Add screen to T2DM template/,
      }),
    );
    await waitFor(() =>
      expect(act).toHaveBeenCalledWith('neuropathy', 'template'),
    );
    await waitFor(() =>
      expect(within(first).getByText(/Done · Dr\. K\. Ramesh/)).toBeTruthy(),
    );
  });

  it('dismisses an insight with a reason', async () => {
    const source = stubSource();
    const dismiss = vi.spyOn(source, 'dismissInsight');
    renderTab(<InsightsWidget />, source);
    await analyze();
    const second = screen.getByRole('group', { name: /Schedule pattern/ });
    fireEvent.click(within(second).getByRole('button', { name: /Reject/ }));
    fireEvent.change(within(second).getByLabelText(/Why are you rejecting/), {
      target: { value: 'Already handled' },
    });
    fireEvent.click(
      within(second).getByRole('button', { name: /Reject draft/ }),
    );
    await waitFor(() =>
      expect(dismiss).toHaveBeenCalledWith('tuesday', 'Already handled'),
    );
  });

  it('keeps an insight a draft and says why when the source refuses the action', async () => {
    renderTab(
      <InsightsWidget />,
      stubSource({
        actOnInsight: async () => {
          throw new Error('That template is locked.');
        },
      }),
    );
    const first = await analyze();
    fireEvent.click(
      within(first).getByRole('button', {
        name: /Add screen to T2DM template/,
      }),
    );
    expect(await screen.findByText('That template is locked.')).toBeTruthy();
    expect(within(first).getByText('Draft — awaiting approval')).toBeTruthy();
  });

  it('says so when there is nothing new to report', async () => {
    renderTab(
      <InsightsWidget />,
      stubSource({
        analyzeInsights: async () => ({ insights: [], footnote: '' }),
      }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: /Analyze my last 30 days/ }),
    );
    expect(
      await screen.findByRole('heading', {
        name: 'No new patterns in the last 30 days',
      }),
    ).toBeTruthy();
  });

  it('says the analysis could not run, in fixed words, and lets the doctor try again', async () => {
    const real = createMockDoctorSource();
    const analyzeInsights = vi
      .fn()
      .mockRejectedValueOnce(new Error('412 transcripts index offline'))
      .mockImplementation(() => real.analyzeInsights());
    renderTab(<InsightsWidget />, stubSource({ analyzeInsights }));
    fireEvent.click(
      await screen.findByRole('button', { name: /Analyze my last 30 days/ }),
    );
    expect(await screen.findByText(/The analysis could not run/)).toBeTruthy();
    expect(document.body.textContent).not.toContain('index offline');
    fireEvent.click(
      screen.getByRole('button', { name: /Analyze my last 30 days/ }),
    );
    expect(
      await screen.findByRole('group', { name: /Clinical pattern/ }),
    ).toBeTruthy();
  });
});

describe('InsightsWidget: states and access', () => {
  it('shows the loading state with the header in place', () => {
    renderTab(<InsightsWidget />, stubSource({ getInsights: pending }));
    expect(screen.getByRole('heading', { name: 'AI Insights' })).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
  });

  it('shows the error state with fixed words, and loads again on Try again', async () => {
    const real = createMockDoctorSource();
    const getInsights = vi
      .fn()
      .mockRejectedValueOnce(new Error('insights store down'))
      .mockImplementation(() => real.getInsights());
    renderTab(<InsightsWidget />, stubSource({ getInsights }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load your insights.');
    expect(alert.textContent).not.toContain('insights store');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('button', { name: /Analyze my last 30 days/ }),
    ).toBeTruthy();
  });

  it('is reachable from the keyboard, and the insights are named groups', async () => {
    renderTab(<InsightsWidget />);
    const run = await screen.findByRole('button', {
      name: /Analyze my last 30 days/,
    });
    run.focus();
    expect(document.activeElement).toBe(run);
    const first = await analyze();
    expect(
      within(first).getByRole('heading', { name: /Clinical pattern/ }),
    ).toBeTruthy();
  });
});
