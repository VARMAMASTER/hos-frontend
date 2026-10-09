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
import { FamilyWidget } from './family-view';

afterEach(() => cleanup());

async function ready() {
  return screen.findByRole('region', { name: 'Linked family accounts' });
}

function fill(label: RegExp | string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('FamilyWidget: linked family accounts', () => {
  it('shows the linked son, how to reach him and what he can see', async () => {
    renderTab(<FamilyWidget />);
    const accounts = await ready();
    expect(within(accounts).getByText('1 linked')).toBeTruthy();
    const items = within(accounts).getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(within(items[0]).getByText('Venkatesh Naidu')).toBeTruthy();
    expect(within(items[0]).getByText('Linked account')).toBeTruthy();
    expect(
      within(items[0]).getByText(
        /Son · \+91 90140 55231 · ABHA 91-2298-1147-6603/,
      ),
    ).toBeTruthy();
    expect(
      within(items[0]).getByText(
        /Can view OPD visit summaries, lab reports, bills & receipts and prescriptions via the HOS patient app — access granted 14 Mar 2022/,
      ),
    ).toBeTruthy();
  });

  it('lists what he may see in a dialog, each in words', async () => {
    renderTab(<FamilyWidget />);
    await ready();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Access details for Venkatesh Naidu',
      }),
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Venkatesh Naidu — linked access',
    });
    const rows = within(dialog).getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual([
      'OPD visit summaries — allowed',
      'Lab reports — allowed',
      'Bills & receipts — allowed',
      'Prescriptions — allowed',
    ]);
    expect(within(dialog).getByText(/Access granted 14 Mar 2022/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('invites a family member: nothing is shared until they confirm consent', async () => {
    const { source } = renderTab(<FamilyWidget />);
    const invite = vi.spyOn(source, 'requestFamilyLink');
    const accounts = await ready();
    fireEvent.click(
      within(accounts).getByRole('button', { name: 'Link a family member' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Link family member' });
    expect(
      within(dialog).getByText(
        /invite to confirm consent before access is granted/,
      ),
    ).toBeTruthy();
    fill('Name', 'Padma Naidu');
    fill('Relationship', 'Daughter-in-law');
    fill('Phone number', '+91 90000 11122');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Send invite' }),
    );
    await waitFor(() =>
      expect(invite).toHaveBeenCalledWith(
        {
          name: 'Padma Naidu',
          relation: 'Daughter-in-law',
          phone: '+91 90000 11122',
        },
        'pt-lakshmi-devi',
      ),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await within(accounts).findByText('Padma Naidu')).toBeTruthy();
    expect(
      within(accounts).getByText('Invitation sent · awaiting acceptance'),
    ).toBeTruthy();
    expect(within(accounts).getByText('2 linked')).toBeTruthy();
    // No access is granted until she confirms.
    const items = within(accounts).getAllByRole('listitem');
    expect(
      within(items[1]).getByText(/Cannot view anything until they confirm/),
    ).toBeTruthy();
    expect(screen.getByText('Invitation sent to Padma Naidu')).toBeTruthy();
  });

  it('asks for the missing fields, each error tied to its field', async () => {
    const { source } = renderTab(<FamilyWidget />);
    const invite = vi.spyOn(source, 'requestFamilyLink');
    await ready();
    fireEvent.click(
      screen.getByRole('button', { name: 'Link a family member' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Link family member' });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Send invite' }),
    );
    const name = within(dialog).getByRole('textbox', { name: /^Name/ });
    const phone = within(dialog).getByRole('textbox', {
      name: /^Phone number/,
    });
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(phone.getAttribute('aria-invalid')).toBe('true');
    expect(within(dialog).getByText('Enter their name.')).toBeTruthy();
    expect(within(dialog).getByText('Enter a phone number.')).toBeTruthy();
    expect(invite).not.toHaveBeenCalled();
    // A phone number that is not a phone number is not sent.
    fireEvent.change(name, { target: { value: 'Padma Naidu' } });
    fireEvent.change(phone, { target: { value: '12ab' } });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Send invite' }),
    );
    expect(
      within(dialog).getByText('Enter a phone number with at least 10 digits.'),
    ).toBeTruthy();
    expect(invite).not.toHaveBeenCalled();
  });

  it('says so, and keeps the dialog open, when the invite could not be sent', async () => {
    renderTab(
      <FamilyWidget />,
      stubSource({
        requestFamilyLink: async () => {
          throw new Error('The invite could not be sent.');
        },
      }),
    );
    await ready();
    fireEvent.click(
      screen.getByRole('button', { name: 'Link a family member' }),
    );
    fill('Name', 'Padma Naidu');
    fill('Phone number', '+91 90000 11122');
    fireEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'The invite could not be sent.',
    );
    expect(
      screen.getByRole('dialog', { name: 'Link family member' }),
    ).toBeTruthy();
  });

  it('says so when nobody is linked', async () => {
    renderTab(
      <FamilyWidget />,
      stubSource({
        getFamily: async (id) => ({
          ...(await createMockPatientRecordSource().getFamily(id)),
          links: [],
        }),
      }),
    );
    const accounts = await ready();
    expect(
      within(accounts).getByText('No family accounts linked yet.'),
    ).toBeTruthy();
    expect(within(accounts).getByText('0 linked')).toBeTruthy();
  });
});

describe('FamilyWidget: consent and privacy', () => {
  it('shows each consent with when and where it was given', async () => {
    renderTab(<FamilyWidget />);
    await ready();
    const consent = screen.getByRole('region', { name: 'Consent & privacy' });
    expect(
      within(consent).getByText(
        'Reminders & reports to +91 98491 22310 · consented 14 Mar 2022 at reception (Swapna)',
      ),
    ).toBeTruthy();
    expect(
      within(consent).getByText(
        'Linked to ABHA 91-4327-8810-4455 · scope: OPD + lab reports',
      ),
    ).toBeTruthy();
    expect(within(consent).getByText('ABHA record sharing')).toBeTruthy();
    // Active consent is a word and a tick, not a colour.
    expect(within(consent).getAllByText('On')).toHaveLength(2);
  });

  it('turns the WhatsApp opt-in off and on, recorded at the source', async () => {
    const { source } = renderTab(<FamilyWidget />);
    const setConsent = vi.spyOn(source, 'setConsent');
    await ready();
    const toggle = screen.getByRole('switch', { name: 'WhatsApp opt-in' });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(toggle);
    await waitFor(() =>
      expect(setConsent).toHaveBeenCalledWith('whatsapp', false),
    );
    await waitFor(() =>
      expect(toggle.getAttribute('aria-checked')).toBe('false'),
    );
    expect(screen.getByText('Off')).toBeTruthy();
    fireEvent.click(toggle);
    await waitFor(() =>
      expect(setConsent).toHaveBeenCalledWith('whatsapp', true),
    );
    await waitFor(() =>
      expect(toggle.getAttribute('aria-checked')).toBe('true'),
    );
  });

  it('leaves ABHA sharing to the patient: it has no switch here, and says who changes it', async () => {
    renderTab(<FamilyWidget />);
    await ready();
    expect(
      screen.queryByRole('switch', { name: 'ABHA record sharing' }),
    ).toBeNull();
    expect(screen.getAllByRole('switch')).toHaveLength(1);
    expect(
      screen.getByText(/Only the patient can withdraw it, in her ABHA app/),
    ).toBeTruthy();
  });

  it('keeps the switch where it was, and says why, when a change did not go through', async () => {
    renderTab(
      <FamilyWidget />,
      stubSource({
        setConsent: async () => {
          throw new Error('The consent could not be recorded.');
        },
      }),
    );
    await ready();
    const toggle = screen.getByRole('switch', { name: 'WhatsApp opt-in' });
    fireEvent.click(toggle);
    expect((await screen.findByRole('alert')).textContent).toContain(
      'The consent could not be recorded.',
    );
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });
});

describe('FamilyWidget: DPDP data request', () => {
  it('says there is nothing pending, until she asks', async () => {
    renderTab(<FamilyWidget />);
    await ready();
    const dpdp = screen.getByRole('region', { name: 'DPDP data request' });
    expect(
      within(dpdp).getByText(
        /No pending requests on file. Last export: none requested yet/,
      ),
    ).toBeTruthy();
    expect(within(dpdp).getByText('Patient rights')).toBeTruthy();
  });

  it('logs an export request with its reference and due date, and clears the note', async () => {
    const { source } = renderTab(<FamilyWidget />);
    const request = vi.spyOn(source, 'requestDpdp');
    await ready();
    const dpdp = screen.getByRole('region', { name: 'DPDP data request' });
    fireEvent.change(
      within(dpdp).getByRole('textbox', { name: 'Note (optional)' }),
      {
        target: { value: 'Please include the lab images' },
      },
    );
    fireEvent.click(
      within(dpdp).getByRole('button', { name: 'Request my data export' }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        'export',
        'Please include the lab images',
        'pt-lakshmi-devi',
      ),
    );
    const log = await within(dpdp).findByText(
      /Data export requested 18 Jul 2026/,
    );
    expect(log.textContent).toContain('ref DPDP-2026-0447');
    expect(log.textContent).toContain('status: In progress');
    expect(log.textContent).toContain('due 25 Jul 2026');
    expect(within(dpdp).queryByText(/No pending requests on file/)).toBeNull();
    expect(
      (
        within(dpdp).getByRole('textbox', {
          name: 'Note (optional)',
        }) as HTMLTextAreaElement
      ).value,
    ).toBe('');
    expect(
      screen.getByText('Request logged — fulfilled within 7 days'),
    ).toBeTruthy();
  });

  it('logs a correction request too, listing both', async () => {
    renderTab(<FamilyWidget />);
    await ready();
    const dpdp = screen.getByRole('region', { name: 'DPDP data request' });
    fireEvent.click(
      within(dpdp).getByRole('button', { name: 'Request my data export' }),
    );
    await within(dpdp).findByText(/Data export requested/);
    fireEvent.change(
      within(dpdp).getByRole('textbox', { name: 'Note (optional)' }),
      {
        target: {
          value: 'Please correct date of birth on file to 22 Aug 1967',
        },
      },
    );
    fireEvent.click(
      within(dpdp).getByRole('button', { name: 'Request correction' }),
    );
    const correction = await within(dpdp).findByText(
      /Correction request logged 18 Jul 2026/,
    );
    expect(correction.textContent).toContain('DPDP-2026-0448');
    expect(within(dpdp).getAllByRole('listitem')).toHaveLength(2);
    expect(
      within(dpdp).getByText(
        'Please correct date of birth on file to 22 Aug 1967',
      ),
    ).toBeTruthy();
  });

  it('says so when a request could not be logged, and logs nothing', async () => {
    renderTab(
      <FamilyWidget />,
      stubSource({
        requestDpdp: async () => {
          throw new Error('The request could not be logged.');
        },
      }),
    );
    await ready();
    fireEvent.click(
      screen.getByRole('button', { name: 'Request my data export' }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'The request could not be logged.',
    );
    expect(screen.getByText(/No pending requests on file/)).toBeTruthy();
  });
});

describe('FamilyWidget: states and access', () => {
  it('shows the loading state with the header in place', () => {
    renderTab(<FamilyWidget />, stubSource({ getFamily: pending }));
    expect(
      screen.getByRole('heading', { name: 'Family & Consent' }),
    ).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
    expect(
      screen.queryByRole('region', { name: 'Linked family accounts' }),
    ).toBeNull();
  });

  it('shows the error state with fixed words, and loads again on Try again', async () => {
    const real = createMockPatientRecordSource();
    const getFamily = vi
      .fn()
      .mockRejectedValueOnce(new Error('Ramesh: row lock timeout'))
      .mockImplementation((id?: string) => real.getFamily(id));
    renderTab(<FamilyWidget />, stubSource({ getFamily }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load family and consent.');
    expect(alert.textContent).not.toContain('Ramesh');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await ready()).toBeTruthy();
    expect(getFamily).toHaveBeenCalledTimes(2);
  });

  it('is read-only when the chart is: consents shown, nothing changes', async () => {
    renderTab(<FamilyWidget readonly />);
    await ready();
    const toggle = screen.getByRole('switch', { name: 'WhatsApp opt-in' });
    expect(toggle.hasAttribute('disabled')).toBe(true);
    expect(
      screen.queryByRole('button', { name: 'Link a family member' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Request my data export' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Request correction' }),
    ).toBeNull();
    expect(
      screen.getByRole('button', {
        name: 'Access details for Venkatesh Naidu',
      }),
    ).toBeTruthy();
  });

  it('can be driven from the keyboard, with every control named', async () => {
    renderTab(<FamilyWidget />);
    await ready();
    const link = screen.getByRole('button', { name: 'Link a family member' });
    link.focus();
    expect(document.activeElement).toBe(link);
    for (const button of screen.getAllByRole('button')) {
      expect(
        (button.textContent ?? '').trim() || button.getAttribute('aria-label'),
      ).toBeTruthy();
      expect(button.getAttribute('tabindex')).not.toBe('-1');
    }
    expect(
      screen.getByRole('heading', { level: 2, name: 'Family & Consent' }),
    ).toBeTruthy();
    for (const name of [
      'Linked family accounts',
      'Consent & privacy',
      'DPDP data request',
    ]) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeTruthy();
    }
  });
});
