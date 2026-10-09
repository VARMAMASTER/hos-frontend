import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { LearnedPreferenceRow } from './learned-preference-row';

afterEach(() => cleanup());

const LEARNED =
  'You always add a renal-function note for older patients on Metformin';

const base = {
  learned: LEARNED,
  why: 'Learned from 6 corrections you made in 30 days.',
  does: 'Every draft for a patient over 55 on Metformin carries your renal line.',
};

const row = () => screen.getByRole('group', { name: LEARNED });
const toggle = () => screen.getByRole('switch', { name: LEARNED });

describe('LearnedPreferenceRow', () => {
  it('shows what was learned, why, and what it now does, with the AI mark', () => {
    render(<LearnedPreferenceRow {...base} />);
    const text = row().textContent ?? '';
    expect(text).toContain('Learned from 6 corrections');
    expect(text).toContain('Now does automatically:');
    expect(text).toContain('carries your renal line');
    expect(text).toContain('ON');
    expect(row().querySelector('[data-ai-mark]')).not.toBeNull();
    expect(
      row().querySelector('[data-ai-mark]')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('has an ON/OFF switch named for the preference; off dims the row and says it is doing nothing', () => {
    const onEnabledChange = vi.fn();
    render(
      <LearnedPreferenceRow {...base} onEnabledChange={onEnabledChange} />,
    );
    expect(toggle().getAttribute('aria-checked')).toBe('true');
    fireEvent.click(toggle());
    expect(onEnabledChange).toHaveBeenCalledWith(false);
    expect(row().dataset['enabled']).toBe('false');
    const text = row().textContent ?? '';
    expect(text).toContain('OFF');
    expect(text).toContain('What it would do:');
    expect(text).toContain('Currently doing nothing.');
  });

  it('can say something else when off', () => {
    render(
      <LearnedPreferenceRow
        {...base}
        defaultEnabled={false}
        whenOff="You switched this off on 04 Jul."
      />,
    );
    expect(row().textContent).toContain('You switched this off on 04 Jul.');
  });

  it('is controllable', () => {
    const onEnabledChange = vi.fn();
    render(
      <LearnedPreferenceRow
        {...base}
        enabled
        onEnabledChange={onEnabledChange}
      />,
    );
    fireEvent.click(toggle());
    expect(onEnabledChange).toHaveBeenCalledWith(false);
    expect(toggle().getAttribute('aria-checked')).toBe('true');
  });

  it('"Correct this" calls back, described by the preference', () => {
    const onCorrect = vi.fn();
    render(<LearnedPreferenceRow {...base} onCorrect={onCorrect} />);
    const button = screen.getByRole('button', { name: 'Correct this' });
    expect(
      document.getElementById(button.getAttribute('aria-describedby') ?? '')
        ?.textContent,
    ).toBe(LEARNED);
    fireEvent.click(button);
    expect(onCorrect).toHaveBeenCalledTimes(1);
  });

  it('opens an inline editor that sends the correction and closes', () => {
    const onSubmitCorrection = vi.fn();
    render(
      <LearnedPreferenceRow
        {...base}
        onSubmitCorrection={onSubmitCorrection}
      />,
    );
    const button = screen.getByRole('button', { name: 'Correct this' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const box = within(row()).getByRole('textbox', {
      name: 'What should it do instead?',
    });
    expect(document.activeElement).toBe(box);
    const save = within(row()).getByRole('button', { name: 'Save correction' });
    expect(save.getAttribute('aria-disabled')).toBe('true');
    fireEvent.change(box, {
      target: { value: '  Only for patients over 65.  ' },
    });
    fireEvent.click(save);
    expect(onSubmitCorrection).toHaveBeenCalledWith(
      'Only for patients over 65.',
    );
    expect(within(row()).queryByRole('textbox')).toBe(null);
  });

  it('Cancel closes the editor without sending', () => {
    const onSubmitCorrection = vi.fn();
    render(
      <LearnedPreferenceRow
        {...base}
        onSubmitCorrection={onSubmitCorrection}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Correct this' }));
    fireEvent.change(within(row()).getByRole('textbox'), {
      target: { value: 'Never mind' },
    });
    fireEvent.click(within(row()).getByRole('button', { name: 'Cancel' }));
    expect(onSubmitCorrection).not.toHaveBeenCalled();
    expect(within(row()).queryByRole('textbox')).toBe(null);
  });

  it('takes every fixed word as a prop, and a lang for its content', () => {
    render(
      <LearnedPreferenceRow
        {...base}
        learned="మీ తెలుగు మాట్లాడే శైలి"
        contentLang="te"
        onCorrect={() => undefined}
        labels={{ on: 'चालू', nowDoes: 'अब अपने आप:', correct: 'सुधारें' }}
      />,
    );
    const group = screen.getByRole('group', {
      name: 'మీ తెలుగు మాట్లాడే శైలి',
    });
    expect(group.textContent).toContain('चालू');
    expect(group.textContent).toContain('अब अपने आप:');
    expect(screen.getByRole('button', { name: 'सुधारें' })).toBeTruthy();
    expect(
      group
        .querySelector('[data-learned]')
        ?.closest('[lang]')
        ?.getAttribute('lang'),
    ).toBe('te');
  });
});
