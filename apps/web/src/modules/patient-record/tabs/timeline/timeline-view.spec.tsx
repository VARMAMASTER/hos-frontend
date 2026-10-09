/// <reference lib="dom" />
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockPatientRecordSource } from '../../data/mock';
import { pending, renderTab, stubSource } from '../../testing/render';
import { TimelineWidget } from './timeline-view';

afterEach(() => cleanup());

async function ready() {
  return screen.findByRole('region', { name: 'Four years in one record' });
}

function eventList(year: number) {
  return screen.getByRole('list', { name: `${year} events` });
}

describe('TimelineWidget: the record', () => {
  it('counts what the record holds, and how much of it came from other hospitals', async () => {
    renderTab(<TimelineWidget />);
    const summary = await ready();
    expect(
      within(summary).getByText(
        '39 events · 6 departments · 3 other hospitals — assembled automatically, none of it re-typed',
      ),
    ).toBeTruthy();
    expect(
      within(summary).getByText('3 events from other hospitals'),
    ).toBeTruthy();
    expect(within(summary).getByText('2022 → 2026')).toBeTruthy();
  });

  it('draws one button per year, naming its count and what came from outside', async () => {
    renderTab(<TimelineWidget />);
    const summary = await ready();
    const strip = within(summary).getByRole('group', {
      name: 'Events per year — select a year to open it',
    });
    const buttons = within(strip).getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
      '2022 — 5 events',
      '2023 — 4 events',
      '2024 — 4 events',
      '2025 — 10 events, 1 from another hospital',
      '2026 — 16 events, 2 from other hospitals',
    ]);
    // The open year says so, in the state of its button.
    expect(buttons[4].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('opens with this year’s sixteen events, newest first', async () => {
    renderTab(<TimelineWidget />);
    await ready();
    const items = within(eventList(2026)).getAllByRole('listitem');
    expect(items).toHaveLength(16);
    expect(
      within(items[0]).getByText(
        'Neuropathy workup started — feet numb ×3 weeks',
      ),
    ).toBeTruthy();
    expect(within(items[0]).getByText('OPD visit')).toBeTruthy();
    expect(within(items[0]).getByText('18 Jul 2026 · 09:42 AM')).toBeTruthy();
    expect(
      within(items[0]).getByText(/General Medicine · Room 3 · Dr\. K\. Ramesh/),
    ).toBeTruthy();
    // A prescription written in Telugu is marked as such.
    const telugu = within(items[0]).getByText(/రోజుకు రెండు సార్లు/);
    expect(telugu.getAttribute('lang')).toBe('te');
  });

  it('marks an outside record with its facility, in words and a mark, never colour alone', async () => {
    renderTab(<TimelineWidget />);
    await ready();
    const items = within(eventList(2026)).getAllByRole('listitem');
    const kft = items.find((item) =>
      within(item).queryByText('Kidney function test — eGFR 44'),
    ) as HTMLElement;
    const facility = within(kft).getByText(
      'Yashoda Hospital, Secunderabad · via ABHA',
    );
    expect(facility.querySelector('[data-slot="icon"]')).not.toBeNull();
    expect(within(kft).getByText('not ordered by this hospital')).toBeTruthy();
    expect(within(kft).getByText(/Pulled under her ABHA consent/)).toBeTruthy();
    // The flag is the report’s own comparison, never a diagnosis.
    expect(within(kft).getByText('Outside reference range')).toBeTruthy();
    expect(within(kft).queryByText(/CKD/)).toBeNull();
  });

  it('flags the Amoxicillin prescription as an allergy conflict, in words with a shape', async () => {
    renderTab(<TimelineWidget />);
    await ready();
    const items = within(eventList(2026)).getAllByRole('listitem');
    const apollo = items.find((item) =>
      within(item).queryByText('Fever & sore throat — Rx Amoxicillin 500mg'),
    ) as HTMLElement;
    const flag = within(apollo).getByText('Allergy conflict');
    expect(flag.querySelector('[data-slot="icon"] svg')).not.toBeNull();
    expect(
      within(apollo).getByText('Apollo Clinic, Kukatpally · via ABHA'),
    ).toBeTruthy();
  });

  it('keeps earlier years closed, each with an honest count and a preview', async () => {
    renderTab(<TimelineWidget />);
    await ready();
    const row = screen.getByRole('region', { name: '2025' });
    expect(
      within(row).getByRole('heading', { level: 3, name: '2025' }),
    ).toBeTruthy();
    expect(
      within(row).getByText('10 events · 1 from another hospital'),
    ).toBeTruthy();
    expect(
      within(row).getByText('HbA1c 7.2% → 7.8% over the year'),
    ).toBeTruthy();
    expect(screen.queryByRole('list', { name: '2025 events' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Expand 2025' })).toBeTruthy();
  });

  it('opens a closed year on demand and then calls it Open', async () => {
    const { source } = renderTab(<TimelineWidget />);
    const getYear = vi.spyOn(source, 'getTimelineYear');
    await ready();
    fireEvent.click(screen.getByRole('button', { name: 'Expand 2025' }));
    const list = await screen.findByRole('list', { name: '2025 events' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(10);
    expect(getYear).toHaveBeenCalledWith(2025, undefined);
    expect(screen.queryByRole('button', { name: 'Expand 2025' })).toBeNull();
    expect(
      within(screen.getByRole('region', { name: '2025' })).getByText('Open'),
    ).toBeTruthy();
    expect(
      within(list).getByText('Seasonal influenza vaccine given'),
    ).toBeTruthy();
  });

  it('opens a year from the strip too, and marks it open', async () => {
    renderTab(<TimelineWidget />);
    const summary = await ready();
    const button = within(summary).getByRole('button', {
      name: '2022 — 5 events',
    });
    fireEvent.click(button);
    expect(
      await screen.findByRole('list', { name: '2022 events' }),
    ).toBeTruthy();
    await waitFor(() =>
      expect(button.getAttribute('aria-pressed')).toBe('true'),
    );
  });

  it('says so, and keeps the year closed, when a year could not be loaded', async () => {
    renderTab(
      <TimelineWidget />,
      stubSource({
        getTimelineYear: async () => {
          throw new Error('That year could not be loaded.');
        },
      }),
    );
    await ready();
    fireEvent.click(screen.getByRole('button', { name: 'Expand 2024' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'That year could not be loaded.',
    );
    expect(screen.getByRole('button', { name: 'Expand 2024' })).toBeTruthy();
  });
});

describe('TimelineWidget: filters', () => {
  it('filters by department, with counts for the whole record, and says what is pressed', async () => {
    renderTab(<TimelineWidget />);
    const summary = await ready();
    const departments = within(summary).getByRole('group', {
      name: 'Filter timeline by department',
    });
    const names = within(departments)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names).toEqual([
      'All 39',
      'Visits 16',
      'Labs 11',
      'Pharmacy 6',
      'Admissions 1',
      'Documents 3',
      'Billing 2',
    ]);
    const labs = within(departments).getByRole('button', { name: /^Labs/ });
    expect(labs.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(labs);
    expect(labs.getAttribute('aria-pressed')).toBe('true');
    expect(
      within(departments)
        .getByRole('button', { name: /^All/ })
        .getAttribute('aria-pressed'),
    ).toBe('false');
    const items = within(eventList(2026)).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    for (const item of items) {
      expect(within(item).getByText(/^Lab (result|ordered)$/)).toBeTruthy();
    }
    fireEvent.click(within(departments).getByRole('button', { name: /^All/ }));
    expect(within(eventList(2026)).getAllByRole('listitem')).toHaveLength(16);
  });

  it('filters by source: only what came from other hospitals', async () => {
    renderTab(<TimelineWidget />);
    const summary = await ready();
    const sources = within(summary).getByRole('group', {
      name: 'Filter timeline by source',
    });
    fireEvent.click(
      within(sources).getByRole('button', { name: /^Other hospitals · ABHA/ }),
    );
    const items = within(eventList(2026)).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(within(item).getByText(/· via ABHA$/)).toBeTruthy();
    }
    fireEvent.click(
      within(sources).getByRole('button', { name: /^This hospital/ }),
    );
    expect(within(eventList(2026)).getAllByRole('listitem')).toHaveLength(14);
  });

  it('says when an open year has nothing under the filters', async () => {
    renderTab(<TimelineWidget />);
    const summary = await ready();
    fireEvent.click(
      within(summary).getByRole('button', { name: /^Admissions/ }),
    );
    fireEvent.click(
      within(summary).getByRole('button', { name: /^Other hospitals · ABHA/ }),
    );
    expect(
      screen.getByText('No events in 2026 match these filters.'),
    ).toBeTruthy();
    expect(screen.queryByRole('list', { name: '2026 events' })).toBeNull();
  });
});

describe('TimelineWidget: patient memory', () => {
  it('writes no summary until asked, then drafts one marked as AI, with its sources', async () => {
    renderTab(<TimelineWidget />);
    await ready();
    const memory = screen.getByRole('region', { name: 'Patient memory' });
    expect(
      within(memory).queryByRole('group', { name: 'Four years in one glance' }),
    ).toBeNull();
    fireEvent.click(
      within(memory).getByRole('button', { name: 'Summarize 4 years' }),
    );
    const draft = await within(memory).findByRole('group', {
      name: 'Four years in one glance',
    });
    expect(within(draft).getByText('AI draft')).toBeTruthy();
    expect(within(draft).getByText('Draft — awaiting approval')).toBeTruthy();
    expect(within(draft).getAllByRole('listitem')).toHaveLength(6);
    expect(
      within(draft).getByText(/12-day Telmisartan gap in May 2026/),
    ).toBeTruthy();
    expect(within(draft).getByText(/Compiled from 39 events/)).toBeTruthy();
  });

  it('is approved to the chart only by a person, under their name', async () => {
    const { source } = renderTab(<TimelineWidget />);
    const approve = vi.spyOn(source, 'approveMemoryDraft');
    await ready();
    fireEvent.click(screen.getByRole('button', { name: 'Summarize 4 years' }));
    const draft = await screen.findByRole('group', {
      name: 'Four years in one glance',
    });
    expect(approve).not.toHaveBeenCalled();
    fireEvent.click(
      within(draft).getByRole('button', { name: /^Approve to chart/ }),
    );
    expect(
      await within(draft).findByText(/Approved to chart · Dr\. K\. Ramesh/),
    ).toBeTruthy();
    await waitFor(() =>
      expect(approve).toHaveBeenCalledWith('memory-1', 'Dr. K. Ramesh'),
    );
  });

  it('offers questions to ask, and answers from the record with the source cited', async () => {
    renderTab(<TimelineWidget />);
    await ready();
    const memory = screen.getByRole('region', { name: 'Patient memory' });
    const suggestions = within(memory).getByRole('group', {
      name: 'Suggested questions',
    });
    expect(within(suggestions).getAllByRole('button')).toHaveLength(6);
    fireEvent.click(
      within(suggestions).getByRole('button', { name: 'HbA1c history?' }),
    );
    const log = within(memory).getByRole('log', {
      name: 'Conversation with HOS AI',
    });
    expect(
      await within(log).findByText(/Eight HbA1c results on file/),
    ).toBeTruthy();
    expect(within(log).getByText('HbA1c history?')).toBeTruthy();
    // The answer says whose words they are, and where they came from.
    expect(within(log).getByText('HOS AI answered:')).toBeTruthy();
    expect(within(log).getByText(/Lab results · HbA1c ×8/)).toBeTruthy();
    expect(within(log).getByText('Confidence high')).toBeTruthy();
  });

  it('follows up: a suggested next question is itself answered from the record', async () => {
    renderTab(<TimelineWidget />);
    await ready();
    const log = screen.getByRole('log', { name: 'Conversation with HOS AI' });
    fireEvent.click(screen.getByRole('button', { name: 'Allergies?' }));
    expect(await within(log).findByText(/Two critical allergies/)).toBeTruthy();
    fireEvent.click(
      await within(log).findByRole('button', { name: 'Any admissions?' }),
    );
    expect(await within(log).findByText(/One admission/)).toBeTruthy();
  });

  it('takes a typed question, and admits when the record does not say', async () => {
    renderTab(<TimelineWidget />);
    await ready();
    const input = screen.getByRole('textbox', {
      name: 'Ask HOS AI a question',
    });
    expect(input.getAttribute('placeholder')).toBe(
      'Ask about Lakshmi Devi… e.g. last creatinine?',
    );
    fireEvent.change(input, { target: { value: 'will she need dialysis?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
    const log = screen.getByRole('log', { name: 'Conversation with HOS AI' });
    expect(
      await within(log).findByText(/can’t find that in them/),
    ).toBeTruthy();
    // A shaky answer says so in words, with a warning shape.
    expect(
      within(log).getByText('Low confidence — read it yourself'),
    ).toBeTruthy();
    expect((input as HTMLTextAreaElement).value).toBe('');
  });

  it('says when an answer could not be got, and retries', async () => {
    const real = createMockPatientRecordSource();
    const askMemory = vi
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockImplementation((q: string, id?: string) => real.askMemory(q, id));
    renderTab(<TimelineWidget />, stubSource({ askMemory }));
    await ready();
    fireEvent.click(screen.getByRole('button', { name: 'BP trend?' }));
    expect(
      await screen.findByText('HOS AI could not answer that.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(/Recorded since hypertension/)).toBeTruthy();
    expect(askMemory).toHaveBeenCalledTimes(2);
  });

  it('says so when the summary could not be drafted', async () => {
    renderTab(
      <TimelineWidget />,
      stubSource({
        summarizeHistory: async () => {
          throw new Error('The summary could not be drafted.');
        },
      }),
    );
    await ready();
    fireEvent.click(screen.getByRole('button', { name: 'Summarize 4 years' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'The summary could not be drafted.',
    );
    expect(
      screen.queryByRole('group', { name: 'Four years in one glance' }),
    ).toBeNull();
  });
});

describe('TimelineWidget: states and access', () => {
  it('shows the loading state with the header in place', () => {
    renderTab(<TimelineWidget />, stubSource({ getTimeline: pending }));
    expect(screen.getByRole('heading', { name: 'Timeline' })).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
    expect(
      screen.queryByRole('region', { name: 'Four years in one record' }),
    ).toBeNull();
  });

  it('shows the error state with fixed words, and loads again on Try again', async () => {
    const real = createMockPatientRecordSource();
    const getTimeline = vi
      .fn()
      .mockRejectedValueOnce(new Error('Ramesh: 503 from db-3'))
      .mockImplementation((id?: string) => real.getTimeline(id));
    renderTab(<TimelineWidget />, stubSource({ getTimeline }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load the timeline.');
    expect(alert.textContent).not.toContain('Ramesh');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await ready()).toBeTruthy();
    expect(getTimeline).toHaveBeenCalledTimes(2);
  });

  it('shows the empty state when no event has been recorded', async () => {
    renderTab(
      <TimelineWidget />,
      stubSource({
        getTimeline: async (id) => ({
          ...(await createMockPatientRecordSource().getTimeline(id)),
          years: [],
          totals: {
            events: 0,
            departments: 0,
            facilities: 0,
            external: 0,
            internal: 0,
          },
        }),
      }),
    );
    expect(
      await screen.findByRole('heading', { name: 'No events recorded yet' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('region', { name: 'Four years in one record' }),
    ).toBeNull();
  });

  it('names every control and can be reached from the keyboard', async () => {
    renderTab(<TimelineWidget />);
    await ready();
    for (const button of screen.getAllByRole('button')) {
      expect(
        (button.textContent ?? '').trim() || button.getAttribute('aria-label'),
      ).toBeTruthy();
      expect(button.getAttribute('tabindex')).not.toBe('-1');
    }
    const expand = screen.getByRole('button', { name: 'Expand 2023' });
    expand.focus();
    expect(document.activeElement).toBe(expand);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Timeline' }),
    ).toBeTruthy();
  });

  it('keeps the patient memory when the chart is read-only, but never approves for anyone', async () => {
    renderTab(<TimelineWidget readonly />);
    await ready();
    fireEvent.click(screen.getByRole('button', { name: 'Summarize 4 years' }));
    const draft = await screen.findByRole('group', {
      name: 'Four years in one glance',
    });
    expect(
      within(draft).queryByRole('button', { name: /^Approve to chart/ }),
    ).toBeNull();
    expect(
      within(draft).getByText(/Only .* can sign|Draft — awaiting approval/),
    ).toBeTruthy();
  });
});
