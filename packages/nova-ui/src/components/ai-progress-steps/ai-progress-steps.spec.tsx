import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { AiProgressSteps } from './ai-progress-steps';

afterEach(() => cleanup());

const STEPS = [
  'Reading 12 nursing notes',
  'Reading the report',
  'Checking 8 vitals',
  'Drafting the course in hospital',
];

function list() {
  return screen.getByRole('list', { name: 'HOS AI progress' });
}

function items() {
  return within(list()).getAllByRole('listitem');
}

describe('AiProgressSteps', () => {
  it('is an ordered list named in words, with the AI mark', () => {
    const { container } = render(
      <AiProgressSteps steps={STEPS} currentIndex={1} />,
    );
    expect(list().tagName).toBe('OL');
    expect(items()).toHaveLength(4);
    expect(container.textContent).toContain('✦');
    expect(screen.getByText('HOS AI progress')).toBeTruthy();
  });

  it('marks the steps before currentIndex done, that one running and the rest pending', () => {
    render(<AiProgressSteps steps={STEPS} currentIndex={1} />);
    expect(items().map((item) => item.dataset['status'])).toEqual([
      'done',
      'running',
      'pending',
      'pending',
    ]);
  });

  it('puts aria-current="step" on the running step only', () => {
    render(<AiProgressSteps steps={STEPS} currentIndex={2} />);
    expect(items().map((item) => item.getAttribute('aria-current'))).toEqual([
      null,
      null,
      'step',
      null,
    ]);
  });

  it('never tells the states apart by colour alone: a different icon shape and a spoken word each', () => {
    render(<AiProgressSteps steps={STEPS} currentIndex={1} />);
    const [done, running, pending] = items();
    expect(done?.querySelector('[data-icon]')?.getAttribute('data-icon')).toBe(
      'check',
    );
    expect(
      running?.querySelector('[data-icon]')?.getAttribute('data-icon'),
    ).toBe('spinner');
    expect(
      pending?.querySelector('[data-icon]')?.getAttribute('data-icon'),
    ).toBe('pending');
    expect(done?.textContent).toBe('Done: Reading 12 nursing notes');
    expect(running?.textContent).toBe('In progress: Reading the report');
    expect(pending?.textContent).toBe('Waiting: Checking 8 vitals');
    for (const item of [done, running, pending]) {
      expect(
        item?.querySelector('[data-icon]')?.getAttribute('aria-hidden'),
      ).toBe('true');
    }
  });

  it('spins only when motion is welcome', () => {
    render(<AiProgressSteps steps={STEPS} currentIndex={0} />);
    const spinner = items()[0]?.querySelector('[data-icon="spinner"]');
    expect(spinner?.getAttribute('class')).toContain(
      'motion-safe:animate-spin',
    );
  });

  it('takes a status per step instead of currentIndex', () => {
    render(
      <AiProgressSteps
        steps={[
          { label: 'Reading notes', status: 'done' },
          { label: 'Reading the report', status: 'done' },
          { label: 'Drafting', status: 'running' },
        ]}
      />,
    );
    expect(items().map((item) => item.dataset['status'])).toEqual([
      'done',
      'done',
      'running',
    ]);
  });

  it('keeps a polite live summary of where it is', () => {
    const { rerender } = render(
      <AiProgressSteps steps={STEPS} currentIndex={1} />,
    );
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Step 2 of 4: Reading the report');
    expect(status.className).toContain('sr-only');
    rerender(<AiProgressSteps steps={STEPS} currentIndex={3} />);
    expect(screen.getByRole('status').textContent).toBe(
      'Step 4 of 4: Drafting the course in hospital',
    );
  });

  it('shows and announces the done summary when every step is done', () => {
    render(
      <AiProgressSteps
        steps={STEPS}
        currentIndex={4}
        summary="Done in 1.8 s"
      />,
    );
    expect(items().every((item) => item.dataset['status'] === 'done')).toBe(
      true,
    );
    expect(screen.getByText('Done in 1.8 s', { selector: 'p' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Done in 1.8 s');
  });

  it('announces completion in words even without a summary', () => {
    render(<AiProgressSteps steps={STEPS} currentIndex={4} />);
    expect(screen.getByRole('status').textContent).toBe('All 4 steps done');
  });

  it('takes translated labels, state words and announcements', () => {
    render(
      <AiProgressSteps
        steps={['నివేదిక చదువుతోంది', 'సారాంశం రాస్తోంది']}
        currentIndex={0}
        label="HOS AI పురోగతి"
        statusLabels={{
          done: 'పూర్తయింది',
          running: 'జరుగుతోంది',
          pending: 'వేచి ఉంది',
        }}
        formatProgress={(step, total, label) =>
          `${total} లో ${step}వ దశ: ${label}`
        }
        lang="te"
      />,
    );
    const named = screen.getByRole('list', { name: 'HOS AI పురోగతి' });
    expect(named.getAttribute('lang')).toBe('te');
    expect(within(named).getAllByRole('listitem')[0]?.textContent).toBe(
      'జరుగుతోంది: నివేదిక చదువుతోంది',
    );
    expect(screen.getByRole('status').textContent).toBe(
      '2 లో 1వ దశ: నివేదిక చదువుతోంది',
    );
  });

  it('can hide its visible caption inside an AI block that already says it is AI, keeping the name', () => {
    render(
      <AiProgressSteps steps={STEPS} currentIndex={0} showLabel={false} />,
    );
    expect(screen.getByText('HOS AI progress').closest('.sr-only')).not.toBe(
      null,
    );
    expect(list()).toBeTruthy();
  });

  it('has a compact density (the prototype) and a comfortable one', () => {
    const { rerender } = render(
      <AiProgressSteps steps={STEPS} currentIndex={0} />,
    );
    expect(list().dataset['density']).toBe('compact');
    expect(items()[0]?.className).toContain('text-body-sm');
    rerender(
      <AiProgressSteps steps={STEPS} currentIndex={0} density="comfortable" />,
    );
    expect(list().dataset['density']).toBe('comfortable');
    expect(items()[0]?.className).toContain('text-input');
  });
});
