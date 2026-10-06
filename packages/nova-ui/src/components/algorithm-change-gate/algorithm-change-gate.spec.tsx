import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  AlgorithmChangeGate,
  type ChangeGateCheck,
} from './algorithm-change-gate';

afterEach(() => cleanup());

const PASSING: ChangeGateCheck[] = [
  {
    id: 'g1',
    name: 'Code-switched dictation · 240 synthetic cases',
    result: '97.1%',
    threshold: '≥ 95%',
    status: 'pass',
  },
  {
    id: 'g2',
    name: 'Drug names vs licensed formulary · 180 cases',
    result: '99.2%',
    threshold: '≥ 99%',
    status: 'pass',
  },
  {
    id: 'g3',
    name: 'Negation handling · 120 cases',
    result: '94%',
    threshold: '≥ 90%',
    status: 'pass',
  },
];

const FAILING: ChangeGateCheck[] = [
  ...PASSING.slice(0, 2),
  {
    id: 'g3',
    name: 'Negation handling · 120 cases',
    result: '86.0%',
    threshold: '≥ 90%',
    status: 'fail',
    failure: '17 of 120 cases charted "no chest pain" as chest pain.',
  },
  {
    id: 'g4',
    name: 'Regression vs v4.2 baseline',
    threshold: 'no drop',
    status: 'not-run',
  },
];

const base = {
  title: 'AI Scribe v4.2 → v4.3',
  actor: 'Dr. G. Prakash',
  formatTime: () => '18 Jul, 04:20 PM',
};

const promote = () => screen.getByRole('button', { name: /^Promote/ });
const rowOf = (name: string) =>
  screen.getByText(name).closest('li') as HTMLElement;

describe('AlgorithmChangeGate', () => {
  it('lists each check with its result against the threshold and a pass chip with an icon', () => {
    render(<AlgorithmChangeGate {...base} checks={PASSING} />);
    const list = screen.getByRole('list', { name: 'Checks' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    const row = rowOf('Negation handling · 120 cases');
    expect(row.textContent).toContain('94% (≥ 90%)');
    const chip = row.querySelector('[data-check-status]') as HTMLElement;
    expect(chip.textContent).toBe('Pass');
    expect(chip.dataset['tone']).toBe('good');
    expect(chip.querySelector('[data-slot="icon"] svg')).not.toBe(null);
  });

  it('shows what failed on a failing check, in words', () => {
    render(<AlgorithmChangeGate {...base} checks={FAILING} />);
    const row = rowOf('Negation handling · 120 cases');
    const chip = row.querySelector('[data-check-status]') as HTMLElement;
    expect(chip.textContent).toBe('Fail');
    expect(chip.dataset['tone']).toBe('crit');
    expect(row.textContent).toContain('17 of 120 cases');
    expect(rowOf('Regression vs v4.2 baseline').textContent).toContain(
      'Not run',
    );
  });

  it('keeps Promote locked until every check passes, and says why', () => {
    const onPromote = vi.fn();
    render(
      <AlgorithmChangeGate {...base} checks={FAILING} onPromote={onPromote} />,
    );
    const button = promote();
    expect(button.getAttribute('aria-disabled')).toBe('true');
    const why = document.getElementById(
      button.getAttribute('aria-describedby') ?? '',
    );
    expect(why?.textContent).toBe(
      'Locked until every check passes: 1 failed, 1 not run.',
    );
    fireEvent.click(button);
    expect(screen.queryByRole('dialog')).toBe(null);
    expect(onPromote).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('Gate not passed · 2 of 4');
  });

  it('unlocks when every check passes; promoting asks for a reason and records who, when and why', () => {
    const onPromote = vi.fn();
    render(
      <AlgorithmChangeGate
        {...base}
        checks={PASSING}
        promoteLabel="Promote to canary"
        onPromote={onPromote}
      />,
    );
    expect(document.body.textContent).toContain('Gate passed · 3 of 3');
    const button = promote();
    expect(button.getAttribute('aria-disabled')).toBe(null);
    fireEvent.click(button);
    const dialog = screen.getByRole('dialog', {
      name: 'Promote to canary: AI Scribe v4.2 → v4.3',
    });
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: 'Suite green at 3 of 3; canary at Sunrise for 6 days.' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Promote to canary' }),
    );
    expect(onPromote).toHaveBeenCalledWith(
      'Suite green at 3 of 3; canary at Sunrise for 6 days.',
    );
    const record = document.querySelector('[data-record]') as HTMLElement;
    expect(record.textContent).toContain(
      'Promoted by Dr. G. Prakash · 18 Jul, 04:20 PM',
    );
    expect(record.textContent).toContain('canary at Sunrise');
    expect(screen.queryByRole('button', { name: /^Promote/ })).toBe(null);
  });

  it('shows a running check with the AI progress steps, and stays locked', () => {
    render(
      <AlgorithmChangeGate
        {...base}
        checks={[
          ...PASSING.slice(0, 2),
          {
            id: 'g4',
            name: 'Regression vs v4.2 baseline',
            threshold: 'no drop',
            status: 'running',
          },
        ]}
        progressSteps={[
          'Generating 180 synthetic consultations',
          'Replaying the v4.2 baseline',
          'Scoring v4.3',
        ]}
        progressIndex={1}
      />,
    );
    expect(
      rowOf('Regression vs v4.2 baseline').querySelector('[data-check-status]')
        ?.textContent,
    ).toBe('Running');
    expect(
      screen.getByRole('list', { name: 'Evaluation progress' }),
    ).toBeTruthy();
    expect(promote().getAttribute('aria-disabled')).toBe('true');
    expect(document.body.textContent).toContain('1 running');
  });

  it('offers to run the suite when given a handler', () => {
    const onRun = vi.fn();
    render(<AlgorithmChangeGate {...base} checks={FAILING} onRun={onRun} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Run evaluation suite' }),
    );
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it('takes every fixed word as a prop', () => {
    render(
      <AlgorithmChangeGate
        {...base}
        checks={FAILING}
        labels={{ fail: 'विफल', checks: 'जाँच' }}
      />,
    );
    expect(screen.getByRole('list', { name: 'जाँच' })).toBeTruthy();
    expect(document.body.textContent).toContain('विफल');
  });
});
