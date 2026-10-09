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
import { AdmissionWidget } from './admission-view';

afterEach(() => cleanup());

const DRAFT = 'Estimate assembled — needs your sign-off';

function value(label: string): string {
  return (screen.getByLabelText(label) as HTMLInputElement).value;
}

async function captureAllConsents() {
  const group = await screen.findByRole('group', { name: 'Consent' });
  for (const toggle of within(group).getAllByRole('switch')) {
    if (toggle.getAttribute('aria-checked') !== 'true') fireEvent.click(toggle);
  }
}

describe('AdmissionWidget', () => {
  it('shows the figures, the one-pass banner and the six steps of the admission', async () => {
    renderTab(<AdmissionWidget />);
    const figures = await screen.findByRole('region', {
      name: 'Admission figures',
    });
    expect(within(figures).getByText('Admissions today')).toBeTruthy();
    expect(within(figures).getByText('8 / 8')).toBeTruthy();
    expect(within(figures).getByText('12')).toBeTruthy();
    expect(screen.getByText('One pass, then it fans out.')).toBeTruthy();

    for (const step of [
      'Patient identity',
      'Why they are being admitted',
      'Who pays',
      'Bed',
      'Attender / next of kin',
      'Consent',
    ]) {
      expect(screen.getByRole('heading', { name: step })).toBeTruthy();
    }
    expect(value('Full name')).toBe('D. Prakash');
    expect(value('ABHA number')).toBe('91-6620-4417-8853');
    expect(value('Working diagnosis')).toBe(
      'Right knee osteoarthritis, grade IV',
    );
    expect(value('Attender name')).toBe('K. Sujatha');
    const eligibility = screen.getByRole('list', {
      name: 'Policy verified — 4 terms that decide what Star Health will pay',
    });
    expect(within(eligibility).getAllByRole('listitem')).toHaveLength(4);
    expect(within(eligibility).getByText('₹4,000/day')).toBeTruthy();
    expect(screen.getAllByRole('switch')).toHaveLength(4);
  });

  it('shows the estimate and the audit of what is reused where', async () => {
    renderTab(<AdmissionWidget />);
    const estimate = await screen.findByRole('list', {
      name: 'Estimate at admission',
    });
    expect(within(estimate).getAllByRole('listitem')).toHaveLength(8);
    expect(within(estimate).getByText('Total estimate')).toBeTruthy();
    expect(within(estimate).getByText('₹1,77,500')).toBeTruthy();
    const reuse = screen.getByRole('table', {
      name: 'Collected once → reused where',
    });
    expect(within(reuse).getAllByRole('row')).toHaveLength(9);
    expect(within(reuse).getByText('Consent signatures')).toBeTruthy();
  });

  it('changes the policy fields and the split when the payer changes', async () => {
    renderTab(<AdmissionWidget />);
    const payer = await screen.findByRole('radiogroup', { name: 'Payer' });
    expect(value('Policy / card number')).toBe('STAR/HYD/2024/778341');
    fireEvent.click(within(payer).getByRole('radio', { name: 'PM-JAY' }));
    expect(value('Policy / card number')).toBe('PMJAY-TS-2019-4471203');
    expect(value('Package / procedure code')).toBe(
      'HBP-2.7.1 · Total knee replacement',
    );
    const split = screen.getByRole('list', { name: 'Who pays what' });
    expect(
      within(split).getByText('PM-JAY package rate — HBP-2.7.1'),
    ).toBeTruthy();
    expect(within(split).getByText('₹1,45,000')).toBeTruthy();
    expect(screen.queryByRole('list', { name: /Policy verified/ })).toBeNull();
  });

  it('warns, with the working, when the bed is above the room-rent sub-limit', async () => {
    renderTab(<AdmissionWidget />);
    const ward = (await screen.findByLabelText(
      'Ward / class',
    )) as HTMLSelectElement;
    expect(screen.queryByText(/above his room-rent sub-limit/)).toBeNull();

    fireEvent.change(ward, { target: { value: 'private' } });
    const warning = screen.getByRole('alert');
    expect(warning.textContent).toContain(
      '₹500 a night above his room-rent sub-limit',
    );
    expect(warning.textContent).toContain('₹1,500 of room excess');
    expect(warning.textContent).toContain('₹16,000 of proportionate reduction');
    expect(warning.textContent).toContain('A ₹5,100 upgrade adds ₹17,500');
    expect(warning.textContent).toContain('88.89% allowed');
    expect(warning.textContent).toContain('your call');

    fireEvent.change(ward, { target: { value: 'general' } });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('offers no ICU bed: the option is disabled and says why', async () => {
    renderTab(<AdmissionWidget />);
    const ward = (await screen.findByLabelText(
      'Ward / class',
    )) as HTMLSelectElement;
    const icu = within(ward).getByRole('option', {
      name: 'ICU — 8/8 occupied, unavailable',
    }) as HTMLOptionElement;
    expect(icu.disabled).toBe(true);
    expect(
      screen.getByText('ICU 8/8 — nothing to allocate there'),
    ).toBeTruthy();
  });

  it('counts consents as they are captured, as words', async () => {
    renderTab(<AdmissionWidget />);
    const group = await screen.findByRole('group', { name: 'Consent' });
    expect(screen.getByText('0 of 4 captured')).toBeTruthy();
    const general = within(group).getByRole('switch', {
      name: 'General consent to treatment',
    });
    expect(general.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(general);
    expect(general.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('1 of 4 captured')).toBeTruthy();
    await captureAllConsents();
    expect(screen.getByText('✓ all 4 captured')).toBeTruthy();
  });

  it('will not admit without every consent, and says how many are missing', async () => {
    const source = stubSource();
    const admit = vi.spyOn(source, 'admit');
    renderTab(<AdmissionWidget />, source);
    const group = await screen.findByRole('group', { name: 'Consent' });
    fireEvent.click(within(group).getAllByRole('switch')[0]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Admit D. Prakash to W-214' }),
    );
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain(
      'Cannot admit yet — 3 consents missing',
    );
    expect(admit).not.toHaveBeenCalled();
  });

  it('admits once every consent is in and names the records it created', async () => {
    const source = stubSource();
    const admit = vi.spyOn(source, 'admit');
    renderTab(<AdmissionWidget />, source);
    await captureAllConsents();
    fireEvent.change(screen.getByRole('combobox', { name: 'Bed' }), {
      target: { value: 'W-207' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Admit D. Prakash to W-207' }),
    );
    await waitFor(() => expect(admit).toHaveBeenCalledTimes(1));
    expect(admit).toHaveBeenCalledWith({
      requestId: 'adm-prakash',
      payer: 'star',
      wardId: 'semi',
      bedId: 'W-207',
      consentIds: ['general', 'procedure', 'estimate', 'dpdp'],
    });
    const records = await screen.findByRole('list', {
      name: 'Records created by this admission',
    });
    expect(within(records).getAllByRole('listitem')).toHaveLength(6);
    expect(within(records).getByText('Encounter IP-2026-0418')).toBeTruthy();
    expect(
      within(records).getByText('Star Health pre-auth packet'),
    ).toBeTruthy();
    expect(
      screen.getByText(/Admitted 10:47 AM — 6 records created/),
    ).toBeTruthy();
    const figures = screen.getByRole('region', { name: 'Admission figures' });
    expect(within(figures).getByText('11')).toBeTruthy();
    expect(
      (
        screen.getByRole('button', {
          name: '✓ Admitted — W-207',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it('keeps the AI estimate a draft until a person approves it', async () => {
    const source = stubSource();
    const approve = vi.spyOn(source, 'approveEstimate');
    renderTab(<AdmissionWidget />, source);
    const draft = await screen.findByRole('group', { name: DRAFT });
    expect(within(draft).getByText('AI draft')).toBeTruthy();
    expect(draft.querySelector('[data-ai-mark]')).not.toBeNull();
    expect(within(draft).getByText('Draft — awaiting approval')).toBeTruthy();
    expect(approve).not.toHaveBeenCalled();

    fireEvent.click(
      within(draft).getByRole('button', {
        name: `Approve estimate & send on WhatsApp ${DRAFT}`,
      }),
    );
    await waitFor(() => expect(approve).toHaveBeenCalledWith('adm-prakash'));
    expect(await screen.findByText('Estimate approved & sent')).toBeTruthy();
    expect(within(draft).getByText(/^Sent · /)).toBeTruthy();
  });

  it('re-prices the estimate from the adjust dialog and leaves it awaiting approval', async () => {
    renderTab(<AdmissionWidget />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Adjust items' }),
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Adjust estimate items',
    });
    fireEvent.change(within(dialog).getByLabelText('Knee implant'), {
      target: { value: 'standard' },
    });
    fireEvent.change(within(dialog).getByLabelText('Physiotherapy sessions'), {
      target: { value: 'four' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save items' }));
    expect(await screen.findByText('Estimate re-priced')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    const estimate = screen.getByRole('list', {
      name: 'Estimate at admission',
    });
    expect(within(estimate).getByText('₹1,69,050')).toBeTruthy();
    expect(
      within(screen.getByRole('group', { name: DRAFT })).getByText(
        'Draft — awaiting approval',
      ),
    ).toBeTruthy();
  });

  it('asks for the patient’s consent instead of pulling from ABHA by itself', async () => {
    const source = stubSource();
    const fetchAbha = vi.spyOn(source, 'fetchAbhaProfile');
    renderTab(<AdmissionWidget />, source);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Re-pull from ABHA' }),
    );
    expect(
      await screen.findByText('Consent requested on the patient’s phone'),
    ).toBeTruthy();
    expect(fetchAbha).not.toHaveBeenCalled();
  });

  it('shows the loading, error and empty states', async () => {
    renderTab(<AdmissionWidget />, stubSource({ getAdmission: pending }));
    expect(screen.getByRole('heading', { name: 'Admission' })).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
    cleanup();

    renderTab(
      <AdmissionWidget />,
      stubSource({ getAdmission: () => Promise.reject(new Error('down')) }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Could not load admissions.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    cleanup();

    const real = createMockReceptionSource();
    renderTab(
      <AdmissionWidget />,
      stubSource({
        getAdmission: async () => ({
          ...(await real.getAdmission()),
          request: null,
        }),
      }),
    );
    expect(
      await screen.findByRole('heading', { name: 'No admission waiting' }),
    ).toBeTruthy();
  });

  it('labels every field and reaches the admit button from the keyboard', async () => {
    renderTab(<AdmissionWidget />);
    await screen.findByRole('group', { name: 'Consent' });
    for (const label of [
      'Full name',
      'Age / Sex',
      'ABHA number',
      'MRN',
      'Mobile',
      'Address',
      'Admitting doctor',
      'Admission type',
      'Working diagnosis',
      'Planned procedure',
      'Expected stay',
      'Policy / card number',
      'Sum insured / package',
      'Package / procedure code',
      'Ward / class',
      'Bed',
      'Tariff class',
      'Attender name',
      'Relationship',
      'Attender mobile',
    ]) {
      // A step's section is also named by its heading ("Bed"), so fields are found as inputs.
      expect(
        screen.getByRole(
          [
            'Admitting doctor',
            'Admission type',
            'Ward / class',
            'Bed',
          ].includes(label)
            ? 'combobox'
            : 'textbox',
          { name: label },
        ),
      ).toBeTruthy();
    }
    const admit = screen.getByRole('button', {
      name: 'Admit D. Prakash to W-214',
    });
    admit.focus();
    expect(document.activeElement).toBe(admit);
  });
});
