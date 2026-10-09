/// <reference lib="dom" />
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockDoctorSource } from '../../data/mock';
import { pending, renderTab, stubSource } from '../../testing/render';
import { ConsultWidget } from './consult-view';

afterEach(() => cleanup());

async function briefing() {
  return screen.findByRole('group', {
    name: /Before you walk in — Lakshmi Devi/,
  });
}

async function runCheck() {
  fireEvent.click(await screen.findByRole('button', { name: /Run the check/ }));
  return screen.findByRole('group', {
    name: /1 · Her values beside published reference numbers/,
  });
}

// Records, stops and waits for the scribe's draft.
async function draftTheNote() {
  fireEvent.click(
    await screen.findByRole('button', { name: 'Start recording' }),
  );
  fireEvent.click(await screen.findByRole('button', { name: /Stop & draft/ }));
  return screen.findByRole('group', { name: /AI SOAP draft/ });
}

describe('ConsultWidget: the briefing', () => {
  it('shows the briefing as an AI draft summary, with the allergy as words and an icon', async () => {
    renderTab(<ConsultWidget />);
    const block = await briefing();
    expect(within(block).getByText('AI briefing')).toBeTruthy();
    // The briefing is assembled step by step, then shown.
    expect(
      await within(block).findByText(/Compiled from 6 prior visits/),
    ).toBeTruthy();
    expect(within(block).getByText(/T2DM since 2022/)).toBeTruthy();
    const allergy = within(block).getByText('Allergic: Penicillin');
    expect(allergy.querySelector('[data-slot="icon"]')).not.toBeNull();
    expect(within(block).getByText(/HbA1c overdue/)).toBeTruthy();
    // The briefing files nothing, and says so.
    expect(within(block).getByText(/Not filed to the chart/)).toBeTruthy();
  });

  it('names the patient and the room in the header', async () => {
    renderTab(<ConsultWidget />);
    await briefing();
    expect(screen.getByRole('heading', { name: 'Consultation' })).toBeTruthy();
    expect(
      screen.getByText(/T-12 · Room 3 · in room since 10:41 AM/),
    ).toBeTruthy();
  });
});

describe('ConsultWidget: the reference and consistency check', () => {
  it('waits to be asked, marks itself AMBER, then shows three blocks of facts', async () => {
    renderTab(<ConsultWidget />);
    await briefing();
    expect(
      screen.queryByRole('group', { name: /Her values beside published/ }),
    ).toBeNull();
    expect(screen.getByText(/Tier: amber · reference/)).toBeTruthy();
    await runCheck();
    for (const title of [
      /1 · Her values beside published reference numbers/,
      /2 · Her values beside her own earlier values/,
      /3 · Contradictions between records we already hold/,
    ]) {
      const block = screen.getByRole('group', { name: title });
      // Every block is an AI draft a person accepts or dismisses: the ✦ mark and the words.
      expect(within(block).getByText('AI draft')).toBeTruthy();
      expect(within(block).getByText('Draft — awaiting approval')).toBeTruthy();
    }
    const third = screen.getByRole('group', { name: /3 · Contradictions/ });
    expect(within(third).getByText('3 unresolved')).toBeTruthy();
    expect(
      within(third).getByText(
        /Allergy recorded here, drug prescribed elsewhere/,
      ),
    ).toBeTruthy();
  });

  it('attaches a block to the note only when the doctor accepts it', async () => {
    const source = stubSource();
    const attach = vi.spyOn(source, 'attachCheckBlock');
    renderTab(<ConsultWidget />, source);
    const first = await runCheck();
    expect(attach).not.toHaveBeenCalled();
    fireEvent.click(
      within(first).getByRole('button', { name: /Attach this table to today/ }),
    );
    await waitFor(() => expect(attach).toHaveBeenCalledWith('values'));
    await waitFor(() =>
      expect(
        within(first).getByText(/Attached · Dr\. K\. Ramesh/),
      ).toBeTruthy(),
    );
  });

  it('dismisses a block with a reason, and asks for the reason', async () => {
    const source = stubSource();
    const dismiss = vi.spyOn(source, 'dismissCheckBlock');
    renderTab(<ConsultWidget />, source);
    await runCheck();
    const second = screen.getByRole('group', {
      name: /2 · Her values beside her own/,
    });
    fireEvent.click(within(second).getByRole('button', { name: /Reject/ }));
    fireEvent.click(
      within(second).getByRole('button', { name: /Reject draft/ }),
    );
    expect(dismiss).not.toHaveBeenCalled();
    expect(
      within(second).getByText('Give a reason to reject this draft.'),
    ).toBeTruthy();
    fireEvent.change(within(second).getByLabelText(/Why are you rejecting/), {
      target: { value: 'Already reviewed' },
    });
    fireEvent.click(
      within(second).getByRole('button', { name: /Reject draft/ }),
    );
    await waitFor(() =>
      expect(dismiss).toHaveBeenCalledWith('trajectory', 'Already reviewed'),
    );
    await waitFor(() =>
      expect(within(second).getByText('Rejected')).toBeTruthy(),
    );
  });

  it('opens the "why" behind a block, with its sources', async () => {
    renderTab(<ConsultWidget />);
    const first = await runCheck();
    fireEvent.click(within(first).getByRole('button', { name: 'Why this?' }));
    expect(within(first).getByRole('region')).toBeTruthy();
    expect(
      within(first).getByText(/published adult reference numbers/),
    ).toBeTruthy();
  });
});

describe('ConsultWidget: the scribe and the note', () => {
  it('starts recording only when asked, and shows the consent and privacy words', async () => {
    renderTab(<ConsultWidget />);
    const scribe = await screen.findByRole('group', { name: 'AI Scribe' });
    expect(within(scribe).getByText('Not recording')).toBeTruthy();
    expect(within(scribe).getByText(/not stored/)).toBeTruthy();
    fireEvent.click(
      within(scribe).getByRole('button', { name: 'Start recording' }),
    );
    expect(await within(scribe).findByText('Recording')).toBeTruthy();
    expect(
      within(scribe).getByRole('button', { name: /Stop & draft/ }),
    ).toBeTruthy();
  });

  it('drafts S, O and A in Telugu and English, and leaves the plan empty and blocking', async () => {
    renderTab(<ConsultWidget />);
    const note = await draftTheNote();
    expect(
      within(note).getByText('Blocked — no plan dictated yet'),
    ).toBeTruthy();
    expect(within(note).getByText('AI draft')).toBeTruthy();
    expect(
      within(note).getByText(/Patient reports fatigue and increased thirst/),
    ).toBeTruthy();
    expect(within(note).getByText('yours to dictate')).toBeTruthy();
    // Blocked: there is nothing to approve yet, and the way forward is the doctor's own words.
    expect(within(note).queryByRole('button', { name: /Approve/ })).toBeNull();
    expect(
      within(note).getByRole('button', { name: /Dictate the plan/ }),
    ).toBeTruthy();
    const plan = within(note).getByLabelText('P — Plan') as HTMLTextAreaElement;
    expect(plan.value).toBe('');
  });

  it('signs the note only after the doctor has written the plan', async () => {
    const source = stubSource();
    const sign = vi.spyOn(source, 'signNote');
    renderTab(<ConsultWidget />, source);
    const note = await draftTheNote();
    fireEvent.change(within(note).getByLabelText('P — Plan'), {
      target: { value: 'Review in two weeks with a repeat KFT.' },
    });
    const approve = await within(note).findByRole('button', {
      name: /Approve & sign the note/,
    });
    fireEvent.click(approve);
    await waitFor(() => expect(sign).toHaveBeenCalledTimes(1));
    expect(sign.mock.calls[0][0].plan).toBe(
      'Review in two weeks with a repeat KFT.',
    );
    await waitFor(() =>
      expect(within(note).getByText(/Signed · Dr\. K\. Ramesh/)).toBeTruthy(),
    );
  });

  it('keeps the note a draft when the source refuses to sign it', async () => {
    const source = stubSource({
      signNote: async () => {
        throw new Error(
          'The note cannot be signed until you have dictated the plan.',
        );
      },
    });
    renderTab(<ConsultWidget />, source);
    const note = await draftTheNote();
    fireEvent.change(within(note).getByLabelText('P — Plan'), {
      target: { value: 'Review in two weeks.' },
    });
    fireEvent.click(
      await within(note).findByRole('button', {
        name: /Approve & sign the note/,
      }),
    );
    await waitFor(() =>
      expect(
        screen
          .getAllByRole('alert')
          .some((alert) => /cannot be signed/.test(alert.textContent ?? '')),
      ).toBe(true),
    );
    expect(within(note).getByText('Draft — awaiting approval')).toBeTruthy();
  });
});

describe('ConsultWidget: the prescription carried forward', () => {
  it('lists her three existing lines as GREEN, a repeat and not a proposal', async () => {
    renderTab(<ConsultWidget />);
    await draftTheNote();
    const rx = await screen.findByRole('group', {
      name: /Prescription — carried forward from her current list/,
    });
    expect(
      within(rx).getByText(/Tier: green · repeat, not proposal/),
    ).toBeTruthy();
    const table = within(rx).getByRole('table');
    expect(within(table).getByText('Tab. Metformin 1000mg')).toBeTruthy();
    expect(within(table).getByText('Tab. Telmisartan 40mg')).toBeTruthy();
    expect(within(table).getByText('Cap. Pregabalin 75mg')).toBeTruthy();
    expect(within(table).getAllByText('30 days')).toHaveLength(3);
    // The allergy is words and an icon, in an alert.
    const alert = within(rx).getByRole('alert');
    expect(alert.textContent).toMatch(/Penicillin and Sulfa allergies on file/);
  });

  it('sends the prescription only when the doctor approves it', async () => {
    const source = stubSource();
    const send = vi.spyOn(source, 'approvePrescription');
    renderTab(<ConsultWidget />, source);
    await draftTheNote();
    const rx = await screen.findByRole('group', {
      name: /Prescription — carried forward/,
    });
    expect(send).not.toHaveBeenCalled();
    fireEvent.click(
      within(rx).getByRole('button', { name: /Approve & send to WhatsApp/ }),
    );
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        within(rx).getByText(/Sent to WhatsApp · Dr\. K\. Ramesh/),
      ).toBeTruthy(),
    );
  });

  it('edits the durations, asks for every one, and re-checks the allergies on save', async () => {
    renderTab(<ConsultWidget />);
    await draftTheNote();
    const rx = await screen.findByRole('group', {
      name: /Prescription — carried forward/,
    });
    fireEvent.click(within(rx).getByRole('button', { name: /Edit/ }));
    const metformin = within(rx).getByLabelText(
      'Duration of Tab. Metformin 1000mg',
    );
    fireEvent.change(metformin, { target: { value: '' } });
    fireEvent.click(within(rx).getByRole('button', { name: 'Save changes' }));
    expect(
      await within(rx).findByText('Enter a duration for every line.'),
    ).toBeTruthy();
    fireEvent.change(metformin, { target: { value: '14 days' } });
    fireEvent.click(within(rx).getByRole('button', { name: 'Save changes' }));
    expect(await within(rx).findByText(/Re-checked after edit/)).toBeTruthy();
    expect(within(rx).getByText('14 days')).toBeTruthy();
  });
});

describe('ConsultWidget: states and access', () => {
  it('shows the loading state with the header in place', () => {
    renderTab(<ConsultWidget />, stubSource({ getConsultation: pending }));
    expect(screen.getByRole('heading', { name: 'Consultation' })).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
  });

  it('shows the error state, with fixed words, and loads again on Try again', async () => {
    const real = createMockDoctorSource();
    const getConsultation = vi
      .fn()
      .mockRejectedValueOnce(new Error('Lakshmi Devi chart store is down'))
      .mockImplementation(() => real.getConsultation());
    renderTab(<ConsultWidget />, stubSource({ getConsultation }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load the consultation.');
    expect(alert.textContent).not.toContain('chart store');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await briefing()).toBeTruthy();
  });

  it('says so when no chart is open for the patient in the room', async () => {
    renderTab(
      <ConsultWidget />,
      stubSource({ getConsultation: async () => null }),
    );
    expect(
      await screen.findByRole('heading', {
        name: 'No consultation chart is open',
      }),
    ).toBeTruthy();
  });

  it('is reachable from the keyboard, with every control named', async () => {
    renderTab(<ConsultWidget />);
    await briefing();
    const run = await screen.findByRole('button', { name: /Run the check/ });
    run.focus();
    expect(document.activeElement).toBe(run);
    const note = await draftTheNote();
    for (const field of within(note).getAllByRole('textbox')) {
      expect(field.getAttribute('aria-labelledby') ?? field.id).toBeTruthy();
    }
    expect(within(note).getByLabelText('S — Subjective')).toBeTruthy();
    expect(within(note).getByLabelText('O — Objective')).toBeTruthy();
    expect(within(note).getByLabelText('A — Assessment')).toBeTruthy();
  });
});
