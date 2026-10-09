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
import { HistoryWidget } from './history-view';

beforeEach(() => stubChartLayout());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function memory() {
  return screen.findByRole('log', {
    name: 'Conversation with AI Health Memory',
  });
}

function ask(question: string) {
  fireEvent.change(screen.getByLabelText('Ask about this patient'), {
    target: { value: question },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
}

describe('HistoryWidget', () => {
  it('shows the memory as AI, with its hint and the questions it can answer', async () => {
    renderTab(<HistoryWidget />);
    await memory();
    expect(
      screen.getByRole('heading', { name: /AI Health Memory — Lakshmi Devi/ }),
    ).toBeTruthy();
    const chip = screen.getByText('AI memory').closest('[data-tone="ai"]');
    expect(chip?.querySelector('[data-ai-mark]')).not.toBeNull();
    expect(
      screen.getByText(/4 years of Lakshmi Devi’s record indexed/),
    ).toBeTruthy();
    const suggestions = screen.getByRole('group', {
      name: 'Suggested questions',
    });
    expect(within(suggestions).getAllByRole('button')).toHaveLength(5);
    expect(
      within(suggestions).getByRole('button', {
        name: 'What is her kidney function?',
      }),
    ).toBeTruthy();
  });

  it('shows her blood pressure across visits as a chart with a data table', async () => {
    renderTab(<HistoryWidget />);
    await memory();
    const chart = screen.getByRole('figure', {
      name: /Blood pressure across visits/,
    });
    expect(chart).toBeTruthy();
    // The data table beside the plot flags a reading outside the reference range in words.
    expect(within(chart).getAllByText('148 (high)').length).toBeGreaterThan(0);
  });

  it('answers a chosen question from her record, and names the source visit', async () => {
    const source = stubSource();
    const askHistory = vi.spyOn(source, 'askHistory');
    renderTab(<HistoryWidget />, source);
    await memory();
    fireEvent.click(
      screen.getByRole('button', { name: 'What is her kidney function?' }),
    );
    await waitFor(() =>
      expect(askHistory).toHaveBeenCalledWith('What is her kidney function?'),
    );
    const answer = await screen.findByText(/eGFR 44 mL\/min\/1\.73m²/);
    expect(answer).toBeTruthy();
    expect(screen.getByText(/KFT Yashoda 14 Mar 2026/)).toBeTruthy();
    // It reports facts and says it is not advising.
    expect(
      screen.getByText(/I am not telling you what to do about them/),
    ).toBeTruthy();
  });

  it('marks every answer as AI, in words as well as the AI mark', async () => {
    renderTab(<HistoryWidget />);
    await memory();
    ask('Any admissions?');
    // The answer streams in word by word; wait until it has settled.
    const turn = await waitFor(() => {
      const settled = document.querySelector(
        '[data-chat-turn="answer"][data-status="done"]',
      );
      if (!settled) throw new Error('The answer is still arriving.');
      return settled as HTMLElement;
    });
    expect(within(turn).getByText(/One admission/)).toBeTruthy();
    expect(
      within(turn).getAllByText('AI Health Memory').length,
    ).toBeGreaterThan(0);
    expect(within(turn).getByText(/Source:/)).toBeTruthy();
    expect(turn.querySelector('[data-ai-mark]')).not.toBeNull();
  });

  it('offers follow-up questions, and answers one when it is chosen', async () => {
    renderTab(<HistoryWidget />);
    await memory();
    ask('When was her last HbA1c?');
    await screen.findByText(/8\.4% today/);
    const followups = await screen.findByRole('group', {
      name: 'Suggested follow-up questions',
    });
    fireEvent.click(
      within(followups).getByRole('button', {
        name: 'What is her kidney function?',
      }),
    );
    expect(await screen.findByText(/eGFR 44 mL\/min\/1\.73m²/)).toBeTruthy();
  });

  it('says what it can answer when the question is not in her record', async () => {
    renderTab(<HistoryWidget />);
    await memory();
    ask('What is the capital of Telangana?');
    expect(
      await screen.findByText(/4 years of Lakshmi Devi’s record/),
    ).toBeTruthy();
  });

  it('keeps an unsent question out of the thread and refuses an empty one', async () => {
    const source = stubSource();
    const askHistory = vi.spyOn(source, 'askHistory');
    renderTab(<HistoryWidget />, source);
    await memory();
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
    expect(askHistory).not.toHaveBeenCalled();
  });

  it('shows a failed answer with Retry, and never the source’s own words', async () => {
    const real = createMockDoctorSource();
    const askHistory = vi
      .fn()
      .mockRejectedValueOnce(new Error('Lakshmi Devi index offline'))
      .mockImplementation((question: string) => real.askHistory(question));
    renderTab(<HistoryWidget />, stubSource({ askHistory }));
    await memory();
    ask('Any admissions?');
    expect(
      await screen.findByText('AI Health Memory could not answer that.'),
    ).toBeTruthy();
    expect(document.body.textContent).not.toContain('index offline');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(/One admission/)).toBeTruthy();
  });

  it('shows the loading state with the header in place', () => {
    renderTab(<HistoryWidget />, stubSource({ getHistory: pending }));
    expect(
      screen.getByRole('heading', { name: 'Patient History' }),
    ).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
  });

  it('shows the error state with fixed words, and loads again on Try again', async () => {
    const real = createMockDoctorSource();
    const getHistory = vi
      .fn()
      .mockRejectedValueOnce(new Error('history store down'))
      .mockImplementation(() => real.getHistory());
    renderTab(<HistoryWidget />, stubSource({ getHistory }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load the patient history.');
    expect(alert.textContent).not.toContain('history store');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await memory()).toBeTruthy();
  });

  it('says so when no chart is open', async () => {
    renderTab(<HistoryWidget />, stubSource({ getHistory: async () => null }));
    expect(
      await screen.findByRole('heading', {
        name: 'No patient history is open',
      }),
    ).toBeTruthy();
  });

  it('is reachable from the keyboard, and the composer and log are named', async () => {
    renderTab(<HistoryWidget />);
    const log = await memory();
    log.focus();
    expect(document.activeElement).toBe(log);
    const field = screen.getByLabelText('Ask about this patient');
    field.focus();
    expect(document.activeElement).toBe(field);
    expect(screen.getByRole('button', { name: 'Ask' })).toBeTruthy();
  });
});
