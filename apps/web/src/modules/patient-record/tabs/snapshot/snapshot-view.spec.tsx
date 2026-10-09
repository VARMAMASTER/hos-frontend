/// <reference lib="dom" />
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPatientRecordSource } from '../../data/mock';
import {
  pending,
  renderTab,
  stubResizeObserver,
  stubSource,
} from '../../testing/render';
import { SnapshotWidget } from './snapshot-view';

beforeEach(() => stubResizeObserver());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function ready() {
  return screen.findByRole('region', { name: 'Needs your attention' });
}

describe('SnapshotWidget', () => {
  it('shows what needs attention, each finding with its sources', async () => {
    renderTab(<SnapshotWidget />);
    const attention = await ready();
    const items = within(attention).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(
      within(items[0]).getByRole('heading', {
        name: 'Metformin dose vs renal function.',
      }),
    ).toBeTruthy();
    expect(within(items[0]).getByText(/eGFR fell to 44/)).toBeTruthy();
    expect(
      within(items[0]).getByText(/Sources: Rx 21 Jun · KFT 14 Mar/),
    ).toBeTruthy();
    // A label limit is a reference alert, left to the clinician.
    expect(
      within(items[0]).getByText('Reference alert · your call'),
    ).toBeTruthy();
    expect(
      within(items[1]).queryByText('Reference alert · your call'),
    ).toBeNull();
    expect(
      within(attention).getByText(
        /It does not diagnose, and it never changes a prescription/,
      ),
    ).toBeTruthy();
  });

  it('lists the active problems and medications as tables with named columns', async () => {
    renderTab(<SnapshotWidget />);
    const section = await screen.findByRole('region', {
      name: 'Active problems & medications',
    });
    const problems = within(section).getByRole('table', {
      name: 'Active problems',
    });
    expect(
      within(problems)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Problem', 'Since', 'Control']);
    expect(within(problems).getByText('Type 2 diabetes')).toBeTruthy();
    expect(
      within(problems).getByText('HbA1c 8.4% — above target'),
    ).toBeTruthy();
    expect(
      within(problems).getByText('newly relevant — see alert'),
    ).toBeTruthy();

    const meds = within(section).getByRole('table', {
      name: 'Current medications',
    });
    expect(within(meds).getByText('Metformin')).toBeTruthy();
    expect(within(meds).getByText('1000mg BD')).toBeTruthy();
    expect(within(meds).getByText('12-day gap in May')).toBeTruthy();
  });

  it('shows the allergies as words with a warning shape, never colour alone', async () => {
    renderTab(<SnapshotWidget />);
    await ready();
    const allergies = screen.getByRole('region', { name: 'Allergies' });
    const items = within(allergies).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Penicillin')).toBeTruthy();
    expect(within(items[0]).getByText(/Recorded 14 Mar 2022/)).toBeTruthy();
    expect(within(items[0]).getByText('Critical allergy')).toBeTruthy();
    expect(items[0].querySelector('[data-slot="icon"] svg')).not.toBeNull();
    expect(within(items[1]).getByText('Sulfa drugs')).toBeTruthy();
  });

  it('shows the latest vitals with the date, and flags a reading in words', async () => {
    renderTab(<SnapshotWidget />);
    await ready();
    const vitals = screen.getByRole('region', { name: 'Latest vitals' });
    expect(within(vitals).getByText('Recorded 18 Jul 2026')).toBeTruthy();
    const term = within(vitals).getByText('Blood pressure', { selector: 'dt' });
    expect(term.nextElementSibling?.textContent).toContain('146/90');
    const flag = within(vitals).getByText('Above target');
    expect(flag.querySelector('[data-slot="icon"] svg')).not.toBeNull();
  });

  it('draws the five result trajectories, the direction in words', async () => {
    renderTab(<SnapshotWidget />);
    await ready();
    const section = screen.getByRole('region', { name: 'Result trajectories' });
    const cards = within(section).getAllByRole('listitem');
    expect(cards).toHaveLength(5);
    expect(within(cards[0]).getAllByText('HbA1c').length).toBeGreaterThan(0);
    expect(within(cards[0]).getByText('8.4%')).toBeTruthy();
    expect(
      within(cards[0]).getByText('Rising: 7.1 → 8.4 over 4 yrs'),
    ).toBeTruthy();
    expect(within(cards[0]).getByText('target <7%')).toBeTruthy();
    // Each line has a text equivalent.
    expect(
      within(cards[0]).getByRole('figure', {
        name: 'HbA1c rising from 7.1 to 8.4 percent over four years',
      }),
    ).toBeTruthy();
    expect(
      within(cards[1]).getByText('drives the Metformin alert'),
    ).toBeTruthy();
  });

  it('lists the care gaps, and orders one: the button is replaced by what was done', async () => {
    const { source } = renderTab(<SnapshotWidget />);
    const gaps = await screen.findByRole('region', {
      name: 'Overdue & due soon',
    });
    expect(within(gaps).getByText('4 open')).toBeTruthy();
    const order = within(gaps).getByRole('button', {
      name: 'Order Diabetic retinal screening',
    });
    fireEvent.click(order);
    expect(
      await within(gaps).findByText(/Ordered — WhatsApp booking link sent/),
    ).toBeTruthy();
    expect(
      within(gaps).queryByRole('button', {
        name: 'Order Diabetic retinal screening',
      }),
    ).toBeNull();
    // The confirmation is shown beside the table too, and the source holds the change.
    expect(
      await screen.findAllByText(/Ordered — WhatsApp booking link sent/),
    ).toHaveLength(2);
    const snapshot = await source.getSnapshot();
    expect(snapshot.careGaps.find((g) => g.id === 'gap-retinal')?.done).toMatch(
      /Ordered/,
    );
    // Nothing is due on the current HbA1c: it has no button.
    const hba1c = within(gaps).getByRole('row', { name: /^HbA1c/ });
    expect(within(hba1c).queryByRole('button')).toBeNull();
    expect(within(hba1c).getByText('Current')).toBeTruthy();
  });

  it('says what went wrong when an order fails, and leaves the gap open', async () => {
    const real = createMockPatientRecordSource();
    renderTab(
      <SnapshotWidget />,
      stubSource({
        actOnCareGap: async () => {
          throw new Error('The order could not be placed.');
        },
      }),
    );
    const gaps = await screen.findByRole('region', {
      name: 'Overdue & due soon',
    });
    fireEvent.click(
      within(gaps).getByRole('button', { name: 'Chase Lipid profile' }),
    );
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('The order could not be placed.');
    expect(
      within(gaps).getByRole('button', { name: 'Chase Lipid profile' }),
    ).toBeTruthy();
    expect(real).toBeTruthy();
  });

  it('lists the records from other hospitals, with the allergy conflict in words', async () => {
    renderTab(<SnapshotWidget />);
    await ready();
    const outside = screen.getByRole('region', {
      name: 'Records from other hospitals',
    });
    const items = within(outside).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(
      within(items[0]).getByText('Yashoda Hospital, Secunderabad'),
    ).toBeTruthy();
    expect(
      within(items[0]).getByText('Already available; no need to repeat.'),
    ).toBeTruthy();
    const conflict = within(items[1]).getByText(
      /Conflicts with her Penicillin allergy/,
    );
    expect(conflict).toBeTruthy();
    expect(within(outside).getByText('ABHA linked')).toBeTruthy();
  });

  it('explains how the outside result arrived, and shows the illustrative payload on request', async () => {
    renderTab(<SnapshotWidget />);
    await ready();
    const trace = screen.getByRole('region', {
      name: 'How the Yashoda result actually got here',
    });
    const steps = within(trace).getAllByRole('listitem');
    expect(steps).toHaveLength(5);
    expect(within(steps[0]).getByText('Health ID resolved.')).toBeTruthy();
    const toggle = within(trace).getByRole('button', {
      name: 'View the FHIR payload (illustrative)',
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(within(trace).queryByText(/"resourceType": "Bundle"/)).toBeNull();
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(within(trace).getByText(/"resourceType": "Bundle"/)).toBeTruthy();
    expect(
      within(trace).getByText(/not a literal captured network payload/),
    ).toBeTruthy();
    fireEvent.click(toggle);
    expect(within(trace).queryByText(/"resourceType": "Bundle"/)).toBeNull();
  });
});

describe('SnapshotWidget: the AI briefing', () => {
  it('writes nothing until asked, then shows a draft marked as AI with its sources', async () => {
    renderTab(<SnapshotWidget />);
    await ready();
    expect(
      screen.queryByRole('group', { name: /What changed since/ }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Brief me on this patient' }),
    );
    const draft = await screen.findByRole('group', {
      name: 'What changed since 21 Jun 2026',
    });
    // Marked as AI in words, and as a draft awaiting a person.
    expect(within(draft).getByText('AI draft')).toBeTruthy();
    expect(within(draft).getByText('Draft — awaiting approval')).toBeTruthy();
    expect(within(draft).getByText(/rose 8\.1 → 8\.4%/)).toBeTruthy();
    expect(within(draft).getByText(/Assembled from 39 events/)).toBeTruthy();
    expect(within(draft).getByText(/^Source:/)).toBeTruthy();
    // The button offers another pass, not a second draft.
    expect(screen.getByRole('button', { name: 'Brief me again' })).toBeTruthy();
  });

  it('shows the draft as working while it is being written', async () => {
    renderTab(<SnapshotWidget />, stubSource({ generateBrief: pending }));
    await ready();
    fireEvent.click(
      screen.getByRole('button', { name: 'Brief me on this patient' }),
    );
    const draft = await screen.findByRole('group', {
      name: /What changed since/,
    });
    expect(within(draft).getByText('Working…')).toBeTruthy();
    expect(
      within(draft)
        .getByRole('button', { name: /^Approve/ })
        .hasAttribute('disabled') ||
        within(draft)
          .getByRole('button', { name: /^Approve/ })
          .getAttribute('aria-disabled') === 'true',
    ).toBe(true);
  });

  it('is final only when a person approves it, under their name', async () => {
    const { source } = renderTab(<SnapshotWidget />);
    const approveBrief = vi.spyOn(source, 'approveBrief');
    await ready();
    fireEvent.click(
      screen.getByRole('button', { name: 'Brief me on this patient' }),
    );
    const draft = await screen.findByRole('group', {
      name: /What changed since/,
    });
    expect(approveBrief).not.toHaveBeenCalled();
    fireEvent.click(within(draft).getByRole('button', { name: /^Approve/ }));
    expect(
      await within(draft).findByText(/Approved · Dr\. K\. Ramesh/),
    ).toBeTruthy();
    await waitFor(() =>
      expect(approveBrief).toHaveBeenCalledWith('brief-1', 'Dr. K. Ramesh'),
    );
    expect(within(draft).getByRole('button', { name: /^Undo/ })).toBeTruthy();
  });

  it('returns the draft to pending, with the reason, when approval did not go through', async () => {
    renderTab(
      <SnapshotWidget />,
      stubSource({
        approveBrief: async () => {
          throw new Error('The approval could not be saved.');
        },
      }),
    );
    await ready();
    fireEvent.click(
      screen.getByRole('button', { name: 'Brief me on this patient' }),
    );
    const draft = await screen.findByRole('group', {
      name: /What changed since/,
    });
    fireEvent.click(within(draft).getByRole('button', { name: /^Approve/ }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'The approval could not be saved.',
    );
    await waitFor(() =>
      expect(within(draft).getByText('Draft — awaiting approval')).toBeTruthy(),
    );
  });

  it('says so when the draft could not be written', async () => {
    renderTab(
      <SnapshotWidget />,
      stubSource({
        generateBrief: async () => {
          throw new Error('The briefing could not be drafted.');
        },
      }),
    );
    await ready();
    fireEvent.click(
      screen.getByRole('button', { name: 'Brief me on this patient' }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'The briefing could not be drafted.',
    );
    expect(
      screen.queryByRole('group', { name: /What changed since/ }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Brief me on this patient' }),
    ).toBeTruthy();
  });
});

describe('SnapshotWidget: states and access', () => {
  it('shows the loading state with the header in place', () => {
    renderTab(<SnapshotWidget />, stubSource({ getSnapshot: pending }));
    expect(
      screen.getByRole('heading', { name: 'Clinical Snapshot' }),
    ).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
    expect(
      screen.queryByRole('region', { name: 'Needs your attention' }),
    ).toBeNull();
  });

  it('shows the error state with fixed words, and loads again on Try again', async () => {
    const real = createMockPatientRecordSource();
    const getSnapshot = vi
      .fn()
      .mockRejectedValueOnce(new Error('Ramesh: connection refused'))
      .mockImplementation((id?: string) => real.getSnapshot(id));
    renderTab(<SnapshotWidget />, stubSource({ getSnapshot }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(
      'Could not load the clinical snapshot.',
    );
    expect(alert.textContent).not.toContain('Ramesh');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await ready()).toBeTruthy();
    expect(getSnapshot).toHaveBeenCalledTimes(2);
  });

  it('shows the empty state when nothing is recorded yet', async () => {
    renderTab(
      <SnapshotWidget />,
      stubSource({
        getSnapshot: async (id) => {
          const full = await createMockPatientRecordSource().getSnapshot(id);
          return {
            ...full,
            patient: { ...full.patient, allergies: [] },
            problems: [],
            medications: [],
            attention: [],
            trajectories: [],
            careGaps: [],
            outsideRecords: [],
            vitals: { ...full.vitals, readings: [] },
          };
        },
      }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Nothing recorded yet' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('region', { name: 'Needs your attention' }),
    ).toBeNull();
  });

  it('hides the order buttons in a read-only chart, and still shows the gaps', async () => {
    renderTab(<SnapshotWidget readonly />);
    const gaps = await screen.findByRole('region', {
      name: 'Overdue & due soon',
    });
    expect(within(gaps).queryByRole('button')).toBeNull();
    expect(within(gaps).getByText('Diabetic retinal screening')).toBeTruthy();
  });

  it('can be driven from the keyboard, with every control named', async () => {
    renderTab(<SnapshotWidget />);
    await ready();
    const brief = screen.getByRole('button', {
      name: 'Brief me on this patient',
    });
    brief.focus();
    expect(document.activeElement).toBe(brief);
    for (const button of screen.getAllByRole('button')) {
      expect(
        (button.textContent ?? '').trim() || button.getAttribute('aria-label'),
      ).toBeTruthy();
      expect(button.getAttribute('tabindex')).not.toBe('-1');
    }
    expect(
      screen.getByRole('heading', { level: 2, name: 'Clinical Snapshot' }),
    ).toBeTruthy();
  });
});
