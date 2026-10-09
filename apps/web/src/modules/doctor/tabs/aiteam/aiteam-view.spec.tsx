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
import { AiteamWidget } from './aiteam-view';

afterEach(() => cleanup());

async function sahayaka() {
  return screen.findByRole('region', { name: 'Sahayaka' });
}

function sandarbha() {
  return screen.getByRole('region', { name: 'Sandarbha' });
}

function preference(name: RegExp) {
  return screen.getByRole('group', { name });
}

describe('AiteamWidget: the two agents', () => {
  it('says what each agent is for and that neither diagnoses nor prescribes', async () => {
    renderTab(<AiteamWidget />);
    await sahayaka();
    expect(
      screen.getByText(/Two agents work for you, and they do different jobs/),
    ).toBeTruthy();
    expect(
      screen.getByText(/Neither one diagnoses, and neither one prescribes/),
    ).toBeTruthy();
    expect(
      within(await sahayaka()).getByText('Tier: green · drafts & formats'),
    ).toBeTruthy();
    expect(
      within(sandarbha()).getByText('Tier: amber · reference'),
    ).toBeTruthy();
  });
});

describe('AiteamWidget: Sahayaka, what it has learned about you', () => {
  it('shows the four figures and the six learned preferences, with the two that are off', async () => {
    renderTab(<AiteamWidget />);
    const card = await sahayaka();
    const figures = within(card).getByRole('list', {
      name: 'Sahayaka figures',
    });
    expect(
      within(figures).getByText('Preferences learned in 30 days'),
    ).toBeTruthy();
    expect(within(figures).getAllByRole('listitem')).toHaveLength(4);
    const rows = within(card).getAllByRole('group', {
      name: /^(You |Your |Shortening|Adding)/,
    });
    expect(rows).toHaveLength(6);
    const off = within(card).getAllByText('OFF');
    expect(off).toHaveLength(2);
    expect(within(card).getAllByText('Currently doing nothing.')).toHaveLength(
      2,
    );
    expect(
      within(card).getByText(/You switched this off on 04 Jul/),
    ).toBeTruthy();
  });

  it('switches a preference off and says it stays off, and the figures follow', async () => {
    const source = stubSource();
    const set = vi.spyOn(source, 'setPreference');
    renderTab(<AiteamWidget />, source);
    const card = await sahayaka();
    const row = preference(
      /Your Telugu counselling register is spoken, not formal/,
    );
    fireEvent.click(within(row).getByRole('switch'));
    await waitFor(() => expect(set).toHaveBeenCalledWith('telugu', false));
    expect(
      await screen.findByText('Switched off, and it stays off'),
    ).toBeTruthy();
    await waitFor(() => expect(within(row).getByText('OFF')).toBeTruthy());
    const figures = within(card).getByRole('list', {
      name: 'Sahayaka figures',
    });
    // Running 6 and the 6 corrections it stopped needing; 3 switched off.
    expect(within(figures).getAllByText('6')).toHaveLength(2);
    expect(within(figures).getByText('3')).toBeTruthy();
  });

  it('keeps a preference on if the source refuses, and says so', async () => {
    renderTab(
      <AiteamWidget />,
      stubSource({
        setPreference: async () => {
          throw new Error('That preference is locked.');
        },
      }),
    );
    await sahayaka();
    const row = preference(
      /Your Telugu counselling register is spoken, not formal/,
    );
    fireEvent.click(within(row).getByRole('switch'));
    expect(await screen.findByText('That preference is locked.')).toBeTruthy();
    expect(within(row).getByRole('switch').getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('records a correction in the doctor’s own words', async () => {
    const source = stubSource();
    const correct = vi.spyOn(source, 'correctPreference');
    renderTab(<AiteamWidget />, source);
    await sahayaka();
    const row = preference(/You always add a renal-function note/);
    fireEvent.click(within(row).getByRole('button', { name: 'Correct this' }));
    fireEvent.change(within(row).getByLabelText('What should it do instead?'), {
      target: { value: 'Name the hospital the eGFR came from' },
    });
    fireEvent.click(
      within(row).getByRole('button', { name: 'Save correction' }),
    );
    await waitFor(() =>
      expect(correct).toHaveBeenCalledWith(
        'renal',
        'Name the hospital the eGFR came from',
      ),
    );
    expect(await screen.findByText('Correction recorded')).toBeTruthy();
  });

  it('forgets everything only after the doctor confirms', async () => {
    const source = stubSource();
    const forget = vi.spyOn(source, 'forgetAllPreferences');
    renderTab(<AiteamWidget />, source);
    const card = await sahayaka();
    fireEvent.click(
      within(card).getByRole('button', {
        name: /Forget everything it has learned about me/,
      }),
    );
    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByText(/Your notes and transcripts are untouched/),
    ).toBeTruthy();
    expect(forget).not.toHaveBeenCalled();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Forget everything' }),
    );
    await waitFor(() => expect(forget).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('All 9 preferences forgotten')).toBeTruthy();
    await waitFor(() =>
      expect(within(card).getAllByText('OFF')).toHaveLength(6),
    );
  });

  it('states what it will never learn to do, and reports a step over the line', async () => {
    const source = stubSource();
    const report = vi.spyOn(source, 'reportOverstep');
    renderTab(<AiteamWidget />, source);
    const card = await sahayaka();
    expect(within(card).getByText(/It will not choose a drug/)).toBeTruthy();
    fireEvent.click(
      within(card).getByRole('button', {
        name: /Report it stepping over the line/,
      }),
    );
    await waitFor(() => expect(report).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Reported for review')).toBeTruthy();
  });

  it('shows an empty state when nothing has been learned yet', async () => {
    const team = await createMockDoctorSource().getAiTeam();
    renderTab(
      <AiteamWidget />,
      stubSource({
        getAiTeam: async () => ({
          ...team,
          sahayaka: { ...team.sahayaka, preferences: [], hiddenRunning: 0 },
        }),
      }),
    );
    expect(
      await screen.findByRole('heading', {
        name: 'Nothing learned about you yet',
      }),
    ).toBeTruthy();
  });
});

describe('AiteamWidget: Sandarbha, the specialty reference', () => {
  it('shows what this specialty orders here, as a count and not a statement of what should be', async () => {
    renderTab(<AiteamWidget />);
    await sahayaka();
    const table = within(sandarbha()).getByRole('table', {
      name: 'What this specialty orders here',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(6);
    const least = within(table).getByText('least ordered');
    expect(least.querySelector('[data-slot="icon"]')).not.toBeNull();
    expect(
      within(sandarbha()).getByText(
        /This is a count of what was ordered, not a statement about what should be/,
      ),
    ).toBeTruthy();
  });

  it('keeps a surveillance count and a named patient apart, and says so', async () => {
    renderTab(<AiteamWidget />);
    await sahayaka();
    expect(
      within(sandarbha()).getByText(
        /Sandarbha is not putting them together for you/,
      ),
    ).toBeTruthy();
  });

  it('opens the bulletin in a dialog', async () => {
    renderTab(<AiteamWidget />);
    await sahayaka();
    fireEvent.click(
      within(sandarbha()).getByRole('button', { name: 'Open the bulletin' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: /Telangana IDSP weekly bulletin/,
    });
    expect(within(dialog).getByText(/Dengue —/)).toBeTruthy();
    expect(within(dialog).getByText(/will not turn it into one/)).toBeTruthy();
  });

  it('drafts the TB recall as a draft the doctor approves before anything is sent', async () => {
    const source = stubSource();
    const approve = vi.spyOn(source, 'approveTbRecall');
    renderTab(<AiteamWidget />, source);
    await sahayaka();
    fireEvent.click(
      within(sandarbha()).getByRole('button', {
        name: 'List the four TB patients',
      }),
    );
    const draft = await screen.findByRole('group', {
      name: /WhatsApp recall — 4 TB patients/,
    });
    expect(within(draft).getByText('AI draft')).toBeTruthy();
    expect(approve).not.toHaveBeenCalled();
    fireEvent.click(
      within(draft).getByRole('button', { name: /Approve & send the recall/ }),
    );
    await waitFor(() => expect(approve).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(within(draft).getByText(/Sent · Dr\. K\. Ramesh/)).toBeTruthy(),
    );
  });

  it('shows the Telugu phrases with an English line, and adds them to the phrasebook on request', async () => {
    const source = stubSource();
    const add = vi.spyOn(source, 'addToPhrasebook');
    renderTab(<AiteamWidget />, source);
    await sahayaka();
    const box = sandarbha();
    expect(
      within(box).getByText('A three-month average, not today’s sugar'),
    ).toBeTruthy();
    expect(
      within(box).getByText(/Your three-month sugar average is 8\.4/),
    ).toBeTruthy();
    fireEvent.click(
      within(box).getByRole('button', { name: 'Add these to my phrasebook' }),
    );
    await waitFor(() => expect(add).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText('4 phrases added to your phrasebook'),
    ).toBeTruthy();
  });

  it('loads a documentation template, structure only', async () => {
    const source = stubSource();
    const use = vi.spyOn(source, 'loadSpecialtyTemplate');
    renderTab(<AiteamWidget />, source);
    await sahayaka();
    fireEvent.click(
      within(sandarbha()).getByRole('button', {
        name: /Use — T2DM with reduced eGFR — review note/,
      }),
    );
    await waitFor(() => expect(use).toHaveBeenCalledWith('t2dm-egfr'));
    expect(
      await screen.findByText(/Template loaded — T2DM with reduced eGFR/),
    ).toBeTruthy();
  });

  it('answers a reference question, and refuses a diagnosis with the blocked RED tier', async () => {
    renderTab(<AiteamWidget />);
    await sahayaka();
    const box = sandarbha();
    fireEvent.change(
      within(box).getByLabelText('Ask Sandarbha a reference question'),
      {
        target: { value: 'Does Lakshmi Devi have kidney disease?' },
      },
    );
    fireEvent.click(within(box).getByRole('button', { name: 'Ask' }));
    expect(
      await within(box).findByText(
        /What I will not do is put those together into a finding about her/,
      ),
    ).toBeTruthy();
    const red = await within(box).findByText('Tier: red · not answered');
    expect(red.closest('[aria-disabled="true"]')).not.toBeNull();
  });
});

describe('AiteamWidget: states and access', () => {
  it('shows the loading state with the header in place', () => {
    renderTab(<AiteamWidget />, stubSource({ getAiTeam: pending }));
    expect(screen.getByRole('heading', { name: 'My AI Team' })).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
  });

  it('shows the error state with fixed words, and loads again on Try again', async () => {
    const real = createMockDoctorSource();
    const getAiTeam = vi
      .fn()
      .mockRejectedValueOnce(new Error('preference store down'))
      .mockImplementation(() => real.getAiTeam());
    renderTab(<AiteamWidget />, stubSource({ getAiTeam }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load your AI team.');
    expect(alert.textContent).not.toContain('preference store');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await sahayaka()).toBeTruthy();
  });

  it('is reachable from the keyboard, and every switch and field is named', async () => {
    renderTab(<AiteamWidget />);
    const card = await sahayaka();
    for (const toggle of within(card).getAllByRole('switch')) {
      expect(
        (toggle.parentElement?.querySelector('label')?.textContent ?? '')
          .length,
      ).toBeGreaterThan(0);
    }
    const first = within(card).getAllByRole('switch')[0];
    first.focus();
    expect(document.activeElement).toBe(first);
    expect(
      within(sandarbha()).getByLabelText('Ask Sandarbha a reference question'),
    ).toBeTruthy();
  });
});
