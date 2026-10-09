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
import { CodingWidget } from './coding-view';

afterEach(() => cleanup());

async function proposal() {
  return screen.findByRole('group', {
    name: /ICD-10 codes proposed from your note — Lakshmi Devi/,
  });
}

function row(code: string) {
  return within(
    screen.getByRole('table', { name: 'ICD-10 codes proposed from your note' }),
  )
    .getByText(code)
    .closest('tr') as HTMLElement;
}

function approveButton(box: HTMLElement) {
  return within(box).getByRole('button', {
    name: /Approve the confirmed codes/,
  });
}

describe('CodingWidget: the proposal', () => {
  it('shows six proposed codes, each with the line of the note it came from', async () => {
    renderTab(<CodingWidget />);
    const box = await proposal();
    const table = within(box).getByRole('table', {
      name: 'ICD-10 codes proposed from your note',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(7);
    expect(
      within(row('E11.40')).getByText(
        'T2DM with diabetic neuropathy, unspecified',
      ),
    ).toBeTruthy();
    expect(
      within(row('E11.40')).getByText(/A: "diabetic neuropathy, symptomatic"/),
    ).toBeTruthy();
    expect(within(row('N18.30')).getByText(/outside/)).toBeTruthy();
  });

  it('marks the proposal as an AI draft in words, GREEN, awaiting approval', async () => {
    renderTab(<CodingWidget />);
    const box = await proposal();
    expect(within(box).getByText('AI draft')).toBeTruthy();
    expect(within(box).getByText('Draft — awaiting approval')).toBeTruthy();
    expect(within(box).getByText('Tier: green · coding')).toBeTruthy();
  });

  it('says how sure it is in words and a mark: High, Needs you, Low', async () => {
    renderTab(<CodingWidget />);
    await proposal();
    for (const [code, word] of [
      ['E11.40', 'High'],
      ['N18.30', 'Needs you'],
      ['D64.9', 'Low'],
    ] as const) {
      const chip = within(row(code)).getByText(word);
      expect(chip.querySelector('[data-slot="icon"]')).not.toBeNull();
    }
    // The low-confidence code says why it will not pick a cause.
    expect(
      within(row('D64.9')).getByText(/HOS will not pick one/),
    ).toBeTruthy();
  });

  it('confirms nothing for the doctor: every code starts unconfirmed', async () => {
    renderTab(<CodingWidget />);
    const box = await proposal();
    const confirms = within(box).getAllByRole('button', { name: /^Confirm / });
    expect(confirms).toHaveLength(6);
    for (const button of confirms) {
      expect(button.getAttribute('aria-pressed')).toBe('false');
    }
    expect(approveButton(box).getAttribute('aria-disabled')).toBe('true');
  });
});

describe('CodingWidget: approving', () => {
  it('approves only the codes the doctor confirmed', async () => {
    const source = stubSource();
    const approve = vi.spyOn(source, 'approveCodes');
    renderTab(<CodingWidget />, source);
    const box = await proposal();
    fireEvent.click(
      within(row('E11.40')).getByRole('button', { name: 'Confirm E11.40' }),
    );
    fireEvent.click(
      within(row('I10')).getByRole('button', { name: 'Confirm I10' }),
    );
    expect(within(box).getByText('2 of 6 confirmed')).toBeTruthy();
    expect(approveButton(box).getAttribute('aria-disabled')).toBeNull();
    fireEvent.click(approveButton(box));
    await waitFor(() =>
      expect(approve).toHaveBeenCalledWith(['E11.40', 'I10']),
    );
    await waitFor(() =>
      expect(within(box).getByText('2 of 6 approved')).toBeTruthy(),
    );
    expect(within(row('E11.40')).getByText('Filed')).toBeTruthy();
    // The rest are still drafts, still the doctor's to confirm.
    expect(
      within(row('N18.30')).getByRole('button', { name: 'Confirm N18.30' }),
    ).toBeTruthy();
  });

  it('can take back a confirmation before approving', async () => {
    renderTab(<CodingWidget />);
    const box = await proposal();
    const confirm = within(row('Z79.84')).getByRole('button', {
      name: 'Confirm Z79.84',
    });
    fireEvent.click(confirm);
    expect(confirm.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(confirm);
    expect(confirm.getAttribute('aria-pressed')).toBe('false');
    expect(approveButton(box).getAttribute('aria-disabled')).toBe('true');
  });

  it('settles the whole proposal as approved once every code is filed', async () => {
    renderTab(<CodingWidget />);
    const box = await proposal();
    for (const button of within(box).getAllByRole('button', {
      name: /^Confirm /,
    })) {
      fireEvent.click(button);
    }
    fireEvent.click(approveButton(box));
    await waitFor(() =>
      expect(within(box).getByText(/Approved · Dr\. K\. Ramesh/)).toBeTruthy(),
    );
  });

  it('shows the reason and keeps the codes as drafts when the source refuses', async () => {
    renderTab(
      <CodingWidget />,
      stubSource({
        approveCodes: async () => {
          throw new Error('Confirm at least one code first.');
        },
      }),
    );
    const box = await proposal();
    fireEvent.click(
      within(row('I10')).getByRole('button', { name: 'Confirm I10' }),
    );
    fireEvent.click(approveButton(box));
    expect(
      await screen.findByText('Confirm at least one code first.'),
    ).toBeTruthy();
    expect(within(box).getByText('Draft — awaiting approval')).toBeTruthy();
  });
});

describe('CodingWidget: adding a code by hand', () => {
  it('asks for a valid code and a term, then adds it as the doctor’s own and confirmed', async () => {
    const source = stubSource();
    const add = vi.spyOn(source, 'addManualCode');
    renderTab(<CodingWidget />, source);
    await proposal();
    fireEvent.click(screen.getByRole('button', { name: 'Add a code' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Add a code by hand',
    });
    fireEvent.change(within(dialog).getByLabelText('ICD-10 code'), {
      target: { value: 'banana' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Add the code' }),
    );
    expect(
      within(dialog).getByText('Enter an ICD-10 code like E11.65.'),
    ).toBeTruthy();
    expect(
      within(dialog).getByText('Enter the term for the code.'),
    ).toBeTruthy();
    expect(add).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText('ICD-10 code'), {
      target: { value: 'E78.5' },
    });
    fireEvent.change(within(dialog).getByLabelText('Term'), {
      target: { value: 'Hyperlipidaemia, unspecified' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Add the code' }),
    );
    await waitFor(() =>
      expect(add).toHaveBeenCalledWith({
        code: 'E78.5',
        term: 'Hyperlipidaemia, unspecified',
      }),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(within(row('E78.5')).getByText('Yours')).toBeTruthy();
    expect(
      within(row('E78.5'))
        .getByRole('button', { name: 'Confirm E78.5' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });
});

describe('CodingWidget: how the coding is holding up', () => {
  it('measures it against the codes signed, and names the one thing that matters more than time', async () => {
    renderTab(<CodingWidget />);
    await proposal();
    const strip = screen.getByRole('list', { name: 'Coding figures' });
    expect(within(strip).getByText('3 min 20 s')).toBeTruthy();
    expect(within(strip).getByText('6 of 240')).toBeTruthy();
    expect(within(strip).getByText(/You caught all six/)).toBeTruthy();
    expect(
      screen.getByText(/Not coded: her 12-day Telmisartan gap/),
    ).toBeTruthy();
  });
});

describe('CodingWidget: states and access', () => {
  it('shows the loading state with the header in place', () => {
    renderTab(<CodingWidget />, stubSource({ getCoding: pending }));
    expect(
      screen.getByRole('heading', { name: 'Coding & Claims' }),
    ).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
  });

  it('shows the error state with fixed words, and loads again on Try again', async () => {
    const real = createMockDoctorSource();
    const getCoding = vi
      .fn()
      .mockRejectedValueOnce(new Error('Lakshmi Devi coding queue down'))
      .mockImplementation(() => real.getCoding());
    renderTab(<CodingWidget />, stubSource({ getCoding }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load the coding proposal.');
    expect(alert.textContent).not.toContain('coding queue');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await proposal()).toBeTruthy();
  });

  it('says so when no note has been coded or no chart is open', async () => {
    renderTab(<CodingWidget />, stubSource({ getCoding: async () => null }));
    expect(
      await screen.findByRole('heading', { name: 'No codes to propose yet' }),
    ).toBeTruthy();
  });

  it('is reachable from the keyboard, with every control named', async () => {
    renderTab(<CodingWidget />);
    const box = await proposal();
    const confirm = within(box).getByRole('button', { name: 'Confirm E11.65' });
    confirm.focus();
    expect(document.activeElement).toBe(confirm);
    for (const button of within(box).getAllByRole('button')) {
      expect(
        (button.getAttribute('aria-label') ?? button.textContent ?? '').length,
      ).toBeGreaterThan(0);
    }
  });
});
