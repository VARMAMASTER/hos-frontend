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
import { ReferralsWidget } from './referrals-view';

afterEach(() => cleanup());

async function picker() {
  return screen.findByRole('group', { name: 'Specialty' });
}

async function draft(label = 'Nephrology') {
  fireEvent.click(within(await picker()).getByRole('button', { name: label }));
  fireEvent.click(screen.getByRole('button', { name: /Draft the letter/ }));
  return screen.findByRole('group', { name: /Referral letter — / });
}

describe('ReferralsWidget: picking who it is going to', () => {
  it('starts with no recipient chosen and nothing drafted', async () => {
    renderTab(<ReferralsWidget />);
    const specialties = within(await picker()).getAllByRole('button');
    expect(specialties.map((chip) => chip.textContent)).toEqual([
      'Nephrology',
      'Ophthalmology',
      'Endocrinology',
      'Dietetics',
    ]);
    for (const chip of specialties) {
      expect(chip.getAttribute('aria-pressed')).toBe('false');
    }
    expect(
      screen.getByText(/No recipient chosen yet — nothing has been drafted/),
    ).toBeTruthy();
    expect(screen.getByText('Tier: green · drafting')).toBeTruthy();
  });

  it('asks for a recipient first when none is chosen', async () => {
    const source = stubSource();
    const spy = vi.spyOn(source, 'draftReferralLetter');
    renderTab(<ReferralsWidget />, source);
    await picker();
    fireEvent.click(screen.getByRole('button', { name: /Draft the letter/ }));
    expect(
      await screen.findByText('Pick who this is going to first'),
    ).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });

  it('chooses one recipient at a time, and says who and why', async () => {
    renderTab(<ReferralsWidget />);
    const group = await picker();
    fireEvent.click(within(group).getByRole('button', { name: 'Nephrology' }));
    expect(
      within(group)
        .getByRole('button', { name: 'Nephrology' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      screen.getByText(/Dr\. B\. Sridevi, MD DM \(Nephrology\)/),
    ).toBeTruthy();
    fireEvent.click(
      within(group).getByRole('button', { name: 'Ophthalmology' }),
    );
    expect(
      within(group)
        .getByRole('button', { name: 'Nephrology' })
        .getAttribute('aria-pressed'),
    ).toBe('false');
    expect(
      screen.getByText(
        /an earlier referral to this address on 27 Jun has had no reply/i,
      ),
    ).toBeTruthy();
  });
});

describe('ReferralsWidget: the letter', () => {
  it('drafts a letter for the recipient as a draft awaiting sign-off, marked as AI and GREEN', async () => {
    renderTab(<ReferralsWidget />);
    const letter = await draft();
    expect(within(letter).getByText('AI draft')).toBeTruthy();
    expect(within(letter).getByText('Draft — awaiting approval')).toBeTruthy();
    expect(
      within(letter).getByText(/Tier: green · drafted from the record/),
    ).toBeTruthy();
    expect(within(letter).getByText(/Dear Dr\. Sridevi/)).toBeTruthy();
    expect(
      within(letter).getByText(/eGFR of 44 mL\/min\/1\.73m²/),
    ).toBeTruthy();
    expect(within(letter).getByText(/Unsigned draft/)).toBeTruthy();
    expect(
      within(letter).getByText(
        /Every clinical statement is a value already in her record/,
      ),
    ).toBeTruthy();
  });

  it('assembles six attachments, five ticked and the open lipid order not', async () => {
    renderTab(<ReferralsWidget />);
    const letter = await draft();
    const boxes = within(letter).getAllByRole('checkbox');
    expect(boxes).toHaveLength(6);
    expect(
      boxes.filter((box) => (box as HTMLInputElement).checked),
    ).toHaveLength(5);
    expect(
      (
        within(letter).getByRole('checkbox', {
          name: /Open lipid-profile order/,
        }) as HTMLInputElement
      ).checked,
    ).toBe(false);
    expect(within(letter).getAllByText('via ABHA')).toHaveLength(2);
  });

  it('signs and sends only what the doctor ticked, and only on sign-off', async () => {
    const source = stubSource();
    const sign = vi.spyOn(source, 'signReferral');
    renderTab(<ReferralsWidget />, source);
    const letter = await draft();
    expect(sign).not.toHaveBeenCalled();
    fireEvent.click(
      within(letter).getByRole('checkbox', {
        name: /Open lipid-profile order/,
      }),
    );
    fireEvent.click(
      within(letter).getByRole('button', { name: /Sign off & send/ }),
    );
    await waitFor(() => expect(sign).toHaveBeenCalledTimes(1));
    expect(sign.mock.calls[0][0]).toBe('neph');
    expect(sign.mock.calls[0][1]).toHaveLength(6);
    await waitFor(() =>
      expect(
        within(letter).getByText(/Signed & sent · Dr\. K\. Ramesh/),
      ).toBeTruthy(),
    );
  });

  it('lets the doctor edit the ask in their own words before signing', async () => {
    const source = stubSource();
    const sign = vi.spyOn(source, 'signReferral');
    renderTab(<ReferralsWidget />, source);
    const letter = await draft();
    fireEvent.click(
      within(letter).getByRole('button', { name: /Edit the letter/ }),
    );
    const ask = within(letter).getByLabelText(
      'What you are asking',
    ) as HTMLTextAreaElement;
    fireEvent.change(ask, { target: { value: 'Please see her this month.' } });
    fireEvent.click(
      within(letter).getByRole('button', { name: 'Save the edit' }),
    );
    expect(within(letter).getByText('Please see her this month.')).toBeTruthy();
    fireEvent.click(
      within(letter).getByRole('button', { name: /Sign off & send/ }),
    );
    await waitFor(() => expect(sign).toHaveBeenCalled());
    expect(sign.mock.calls[0][2]).toBe('Please see her this month.');
  });

  it('drafts her Telugu copy as a second draft, sent only when the doctor approves it', async () => {
    const source = stubSource();
    const send = vi.spyOn(source, 'approveTeluguCopy');
    renderTab(<ReferralsWidget />, source);
    const letter = await draft();
    fireEvent.click(
      within(letter).getByRole('button', {
        name: /Also draft her Telugu copy/,
      }),
    );
    const copy = await screen.findByRole('group', {
      name: /Telugu summary for the patient/,
    });
    expect(within(copy).getByText('AI draft')).toBeTruthy();
    expect(send).not.toHaveBeenCalled();
    fireEvent.click(
      within(copy).getByRole('button', { name: /Approve & send to her/ }),
    );
    await waitFor(() => expect(send).toHaveBeenCalledWith('neph'));
  });

  it('drops a letter already drafted when another recipient is chosen', async () => {
    renderTab(<ReferralsWidget />);
    await draft();
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Specialty' })).getByRole(
        'button',
        { name: 'Dietetics' },
      ),
    );
    expect(
      screen.queryByRole('group', { name: /Referral letter — / }),
    ).toBeNull();
  });
});

describe('ReferralsWidget: referrals out', () => {
  it('lists the last 30 days with the two that have no reply, as words and a mark', async () => {
    renderTab(<ReferralsWidget />);
    const table = await screen.findByRole('table', {
      name: 'Referrals out — last 30 days',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    const none = within(table).getByText('None · 21 days');
    expect(none.querySelector('[data-slot="icon"]')).not.toBeNull();
    expect(within(table).getAllByText('Received')).toHaveLength(2);
    expect(screen.getByText('2 with no reply')).toBeTruthy();
    expect(within(table).getByText('Ophthalmology · Sankara Eye')).toBeTruthy();
  });
});

describe('ReferralsWidget: states and access', () => {
  it('shows the loading state with the header in place', () => {
    renderTab(<ReferralsWidget />, stubSource({ getReferrals: pending }));
    expect(screen.getByRole('heading', { name: 'Referrals Out' })).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
  });

  it('shows the error state with fixed words, and loads again on Try again', async () => {
    const real = createMockDoctorSource();
    const getReferrals = vi
      .fn()
      .mockRejectedValueOnce(new Error('G. Ramulu referral log down'))
      .mockImplementation(() => real.getReferrals());
    renderTab(<ReferralsWidget />, stubSource({ getReferrals }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load your referrals.');
    expect(alert.textContent).not.toContain('referral log');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await picker()).toBeTruthy();
  });

  it('shows the empty state when you have sent no referrals and no chart is open', async () => {
    const referrals = await createMockDoctorSource().getReferrals();
    renderTab(
      <ReferralsWidget />,
      stubSource({
        getReferrals: async () => ({ ...referrals, patient: null, out: [] }),
      }),
    );
    expect(
      await screen.findByRole('heading', {
        name: 'No referrals sent in the last 30 days',
      }),
    ).toBeTruthy();
  });

  it('is reachable from the keyboard, with every control named', async () => {
    renderTab(<ReferralsWidget />);
    const chip = within(await picker()).getByRole('button', {
      name: 'Nephrology',
    });
    chip.focus();
    expect(document.activeElement).toBe(chip);
    const letter = await draft();
    for (const box of within(letter).getAllByRole('checkbox')) {
      expect(box.closest('div')?.querySelector('label')).not.toBeNull();
    }
  });
});
