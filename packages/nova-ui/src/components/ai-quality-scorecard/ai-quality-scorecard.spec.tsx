import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  AiQualityScorecard,
  AiQualityStatusChip,
  aiQualityStatus,
  type AiQualityThreshold,
} from './ai-quality-scorecard';

// jsdom has no ResizeObserver; the sparkline measures its box. The stub reports a fixed one.
class FixedResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ target, contentRect: { width: 96, height: 40 } }] as never,
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

const RULE: AiQualityThreshold[] = [
  { metric: 'approvedAsIs', watch: 75, drift: 60 },
  { metric: 'avgEdits', watch: 2, drift: 3 },
];

const HEALTHY = {
  drafts: 1842,
  approvedAsIs: 84.1,
  avgEdits: 0.9,
  rejected: 1.8,
};
const WATCH = { drafts: 612, approvedAsIs: 71.9, avgEdits: 1.7, rejected: 5.6 };
const DRIFT = { drafts: 178, approvedAsIs: 58.4, avgEdits: 3.6, rejected: 9 };

const card = () => screen.getByRole('region', { name: /Discharge Drafter/ });

describe('aiQualityStatus', () => {
  it('applies the caller’s thresholds: lower is worse for approved as-is, higher for edits and rejections', () => {
    expect(aiQualityStatus(HEALTHY, RULE).status).toBe('healthy');
    expect(aiQualityStatus(WATCH, RULE).status).toBe('watch');
    const drift = aiQualityStatus(DRIFT, RULE);
    expect(drift.status).toBe('drift');
    expect(drift.tripped.map((t) => [t.metric, t.level])).toEqual([
      ['approvedAsIs', 'drift'],
      ['avgEdits', 'drift'],
    ]);
    expect(
      aiQualityStatus(HEALTHY, [{ metric: 'rejected', watch: 1, drift: 5 }])
        .status,
    ).toBe('watch');
  });
});

describe('AiQualityStatusChip', () => {
  it.each([
    ['healthy', 'Healthy', 'good'],
    ['watch', 'Watch', 'warn'],
    ['drift', 'Drift', 'crit'],
  ] as const)('says %s in words with an icon', (status, word, tone) => {
    const { container } = render(<AiQualityStatusChip status={status} />);
    const chip = container.querySelector('[data-tone]') as HTMLElement;
    expect(chip.textContent).toBe(word);
    expect(chip.dataset['tone']).toBe(tone);
    expect(chip.querySelector('[data-slot="icon"] svg')).not.toBe(null);
  });
});

describe('AiQualityScorecard', () => {
  it('is a region named for the worker, with the four metrics as figures', () => {
    render(
      <AiQualityScorecard
        name="Discharge Drafter"
        metrics={HEALTHY}
        thresholds={RULE}
      />,
    );
    const text = card().textContent ?? '';
    expect(text).toContain('Drafts');
    expect(text).toContain('1,842');
    expect(text).toContain('Approved as-is');
    expect(text).toContain('84.1%');
    expect(text).toContain('Average edits');
    expect(text).toContain('0.9');
    expect(text).toContain('Rejected');
    expect(text).toContain('1.8%');
  });

  it.each([
    [HEALTHY, 'Healthy'],
    [WATCH, 'Watch'],
    [DRIFT, 'Drift'],
  ] as const)('shows its status as a chip (%#)', (metrics, word) => {
    render(
      <AiQualityScorecard
        name="Discharge Drafter"
        metrics={metrics}
        thresholds={RULE}
      />,
    );
    expect(card().querySelector('[data-status-chip]')?.textContent).toBe(word);
  });

  it('states the rule it was given', () => {
    render(
      <AiQualityScorecard
        name="Discharge Drafter"
        metrics={HEALTHY}
        thresholds={RULE}
      />,
    );
    expect(card().querySelector('[data-rule]')?.textContent).toBe(
      'Rule: Watch when approved as-is is below 75% or average edits are above 2. Drift when approved as-is is below 60% or average edits are above 3.',
    );
  });

  it('raises a drift alert only on Drift, saying which threshold tripped, with the caller’s action', () => {
    const { rerender } = render(
      <AiQualityScorecard
        name="Discharge Drafter"
        metrics={WATCH}
        thresholds={RULE}
      />,
    );
    expect(screen.queryByRole('alert')).toBe(null);
    rerender(
      <AiQualityScorecard
        name="Discharge Drafter"
        metrics={DRIFT}
        thresholds={RULE}
        driftMessage="Concentrated in Orthopedics since 09 Jul."
        driftAction={<button type="button">Approve re-grounding</button>}
      />,
    );
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Drift alert — Discharge Drafter');
    expect(alert.textContent).toContain(
      'Approved as-is 58.4% is below the drift threshold of 60%.',
    );
    expect(alert.textContent).toContain(
      'Average edits 3.6 is above the drift threshold of 3.',
    );
    expect(alert.textContent).toContain('Concentrated in Orthopedics');
    expect(
      within(alert).getByRole('button', { name: 'Approve re-grounding' }),
    ).toBeTruthy();
  });

  it('draws a trend sparkline on approved as-is when given one', () => {
    render(
      <AiQualityScorecard
        name="Discharge Drafter"
        metrics={DRIFT}
        thresholds={RULE}
        trend={[
          { label: '1 Jul', approvedAsIs: 70 },
          { label: '8 Jul', approvedAsIs: 64 },
          { label: '15 Jul', approvedAsIs: 58.4 },
        ]}
      />,
    );
    expect(
      screen.getByRole('figure', { name: /Approved as-is, trend/ }),
    ).toBeTruthy();
  });

  it('lists what staff keep correcting, with an Open action named for its row', () => {
    const onOpenCorrection = vi.fn();
    render(
      <AiQualityScorecard
        name="Discharge Drafter"
        metrics={DRIFT}
        thresholds={RULE}
        corrections={[
          {
            id: 'c1',
            label: 'Old TKR physio schedule',
            who: 'Dr. P. Anil Kumar',
            count: 12,
            timeLost: '38 min',
          },
          {
            id: 'c2',
            label: 'Telugu register too formal',
            count: 9,
            resolved: 'Fixed 08 Jul',
          },
        ]}
        onOpenCorrection={onOpenCorrection}
      />,
    );
    const table = screen.getByRole('table', {
      name: 'What your staff keep correcting',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    fireEvent.click(
      within(table).getByRole('button', {
        name: 'Open: Old TKR physio schedule',
      }),
    );
    expect(onOpenCorrection).toHaveBeenCalledWith('c1');
    expect(table.textContent).toContain('Fixed 08 Jul');
    expect(within(table).getAllByRole('button')).toHaveLength(1);
  });

  it('lists the rejection reasons with their counts', () => {
    render(
      <AiQualityScorecard
        name="Discharge Drafter"
        metrics={DRIFT}
        thresholds={RULE}
        rejections={[
          {
            id: 'r1',
            reason: 'Carried the old TKR physio schedule',
            count: 11,
            outcome: 'Awaiting your approval',
          },
        ]}
      />,
    );
    const table = screen.getByRole('table', { name: 'Rejection reasons' });
    expect(table.textContent).toContain('Carried the old TKR physio schedule');
    expect(table.textContent).toContain('11');
    expect(table.textContent).toContain('Awaiting your approval');
  });

  it('compares with the fleet in figures and words, the bar itself hidden', () => {
    render(
      <AiQualityScorecard
        name="Discharge Drafter"
        metrics={DRIFT}
        thresholds={RULE}
        fleet={{ approvedAsIs: 71.2 }}
      />,
    );
    const compare = card().querySelector('[data-compare]') as HTMLElement;
    expect(compare.textContent).toContain('58.4% here');
    expect(compare.textContent).toContain('71.2% fleet');
    expect(compare.textContent).toContain('Below the fleet');
    expect(
      compare.querySelector('[data-bar]')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('takes every fixed word as a prop', () => {
    render(
      <AiQualityScorecard
        name="Discharge Drafter"
        metrics={DRIFT}
        thresholds={RULE}
        labels={{
          status: { drift: 'विचलन' },
          metrics: { drafts: 'मसौदे' },
          formatRule: () => 'नियम',
        }}
      />,
    );
    expect(card().querySelector('[data-status-chip]')?.textContent).toBe(
      'विचलन',
    );
    expect(card().textContent).toContain('मसौदे');
    expect(card().querySelector('[data-rule]')?.textContent).toBe('नियम');
  });
});
