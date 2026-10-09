/// <reference lib="dom" />
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockReceptionSource } from '../../data/mock';
import { pending, renderTab, stubSource } from '../../testing/render';
import { ReferralsWidget } from './referrals-view';

afterEach(() => cleanup());

const DRAFT = 'AI-drafted acceptance reply';

function referralsTable() {
  return screen.getByRole('table', { name: 'Incoming referrals' });
}

describe('ReferralsWidget', () => {
  it('lists the incoming referrals with their state as words', async () => {
    renderTab(<ReferralsWidget />);
    expect(
      await screen.findByText('5 this week · 2 pending action'),
    ).toBeTruthy();
    const table = referralsTable();
    // The header row and five referrals.
    expect(within(table).getAllByRole('row')).toHaveLength(6);
    expect(within(table).getByText('Apollo Diagnostics')).toBeTruthy();
    expect(
      within(table).getByText('Care Hospitals, Ortho — Banjara Hills'),
    ).toBeTruthy();
    expect(
      within(table).getByText('Post-op knee review, X-ray attached'),
    ).toBeTruthy();
    expect(within(table).getAllByText('Pending')).toHaveLength(2);
    expect(within(table).getAllByText('Accepted')).toHaveLength(3);
    expect(
      within(table).getAllByRole('button', { name: /^Accept referral/ }),
    ).toHaveLength(2);
    expect(
      within(table).getAllByRole('button', { name: 'Scheduled' }),
    ).toHaveLength(3);
  });

  it('accepts a pending referral and updates the count', async () => {
    const source = stubSource();
    const accept = vi.spyOn(source, 'acceptReferral');
    renderTab(<ReferralsWidget />, source);
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Accept referral from Apollo Diagnostics for B. Srinu',
      }),
    );
    await waitFor(() => expect(accept).toHaveBeenCalledWith('ref-apollo'));
    expect(
      await screen.findByText('Referral accepted — B. Srinu'),
    ).toBeTruthy();
    expect(screen.getByText('5 this week · 1 pending action')).toBeTruthy();
    expect(within(referralsTable()).getAllByText('Pending')).toHaveLength(1);
    expect(
      within(referralsTable()).getAllByRole('button', { name: 'Scheduled' }),
    ).toHaveLength(4);
  });

  it('shows a failed accept as an alert and leaves the referral pending', async () => {
    renderTab(
      <ReferralsWidget />,
      stubSource({
        acceptReferral: () =>
          Promise.reject(new Error('That referral was not found.')),
      }),
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Accept referral from Apollo Diagnostics for B. Srinu',
      }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'That referral was not found.',
    );
    expect(within(referralsTable()).getAllByText('Pending')).toHaveLength(2);
  });

  it('keeps the AI reply a draft, marked with the AI mark and in words, until a person approves it', async () => {
    const source = stubSource();
    const send = vi.spyOn(source, 'sendReferralReply');
    renderTab(<ReferralsWidget />, source);
    const draft = await screen.findByRole('group', { name: DRAFT });
    expect(within(draft).getByText('AI draft')).toBeTruthy();
    expect(draft.querySelector('[data-ai-mark]')).not.toBeNull();
    expect(within(draft).getByText('Draft — awaiting approval')).toBeTruthy();
    expect(
      within(draft).getByText('Apollo Diagnostics, Kukatpally'),
    ).toBeTruthy();
    expect(
      within(draft).getByText(/B\. Srinu scheduled with Dr\. P\. Anil Kumar/),
    ).toBeTruthy();
    expect(send).not.toHaveBeenCalled();

    fireEvent.click(
      within(draft).getByRole('button', { name: /^Approve & send/ }),
    );
    await waitFor(() =>
      expect(send).toHaveBeenCalledWith(
        'reply-apollo',
        expect.stringContaining('Referral received'),
      ),
    );
    expect(await screen.findByText('Reply approved & sent')).toBeTruthy();
    expect(within(draft).getByText(/^Approved & sent · /)).toBeTruthy();
  });

  it('sends the edited reply when a person edits it first', async () => {
    const source = stubSource();
    const send = vi.spyOn(source, 'sendReferralReply');
    renderTab(<ReferralsWidget />, source);
    const draft = await screen.findByRole('group', { name: DRAFT });
    fireEvent.click(within(draft).getByRole('button', { name: /^Edit/ }));
    const dialog = screen.getByRole('dialog', { name: 'Edit draft reply' });
    fireEvent.change(within(dialog).getByLabelText('Message to send'), {
      target: { value: 'Received, thank you. We will call the patient today.' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Save & send' }),
    );
    await waitFor(() =>
      expect(send).toHaveBeenCalledWith(
        'reply-apollo',
        'Received, thank you. We will call the patient today.',
      ),
    );
  });

  it('puts the draft back to pending when the send fails', async () => {
    renderTab(
      <ReferralsWidget />,
      stubSource({
        sendReferralReply: () =>
          Promise.reject(new Error('The reply is empty.')),
      }),
    );
    const draft = await screen.findByRole('group', { name: DRAFT });
    fireEvent.click(
      within(draft).getByRole('button', { name: /^Approve & send/ }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'The reply is empty.',
    );
    await waitFor(() =>
      expect(within(draft).getByText('Draft — awaiting approval')).toBeTruthy(),
    );
  });

  it('shows the loading, error and empty states', async () => {
    renderTab(<ReferralsWidget />, stubSource({ getReferrals: pending }));
    expect(screen.getByRole('heading', { name: 'Referrals' })).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
    cleanup();

    renderTab(
      <ReferralsWidget />,
      stubSource({ getReferrals: () => Promise.reject(new Error('down')) }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Could not load referrals.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    cleanup();

    renderTab(
      <ReferralsWidget />,
      stubSource({
        getReferrals: async () => ({
          ...(await createMockReceptionSource().getReferrals()),
          referrals: [],
          replyDraft: null,
        }),
      }),
    );
    expect(
      await screen.findByRole('heading', { name: 'No incoming referrals' }),
    ).toBeTruthy();
  });

  it('names every action and reaches the first one from the keyboard', async () => {
    renderTab(<ReferralsWidget />);
    const accept = await screen.findByRole('button', {
      name: 'Accept referral from Apollo Diagnostics for B. Srinu',
    });
    accept.focus();
    expect(document.activeElement).toBe(accept);
    for (const header of [
      'Referring doctor / clinic',
      'Patient',
      'Reason',
      'Date',
      'Status',
    ]) {
      expect(
        within(referralsTable()).getByRole('columnheader', { name: header }),
      ).toBeTruthy();
    }
  });
});
