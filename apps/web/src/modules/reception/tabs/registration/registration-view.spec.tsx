/// <reference lib="dom" />
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pending, renderTab, stubSource } from '../../testing/render';
import { RegistrationWidget } from './registration-view';

afterEach(() => cleanup());

function form() {
  return screen.getByRole('form', { name: 'Quick register' });
}

function describedText(element: HTMLElement): string {
  return (element.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
}

describe('RegistrationWidget', () => {
  it('shows the ABHA link, the quick-register form and today’s registrations', async () => {
    renderTab(<RegistrationWidget />);
    expect(
      await screen.findByRole('heading', {
        name: 'ABHA — link once, never type demographics again',
      }),
    ).toBeTruthy();
    const quick = form();
    expect(within(quick).getByLabelText('Phone number')).toBeTruthy();
    expect(within(quick).getByLabelText('Full name')).toBeTruthy();
    expect(within(quick).getByLabelText('Age / Sex')).toBeTruthy();
    expect(within(quick).getByLabelText('Department')).toBeTruthy();
    const recent = screen.getByRole('list', { name: 'Recently registered' });
    const items = within(recent).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(within(items[0]).getByText('Y. Padmavathi')).toBeTruthy();
    expect(
      within(items[0]).getByText('52F · Orthopedics · 09:12 AM'),
    ).toBeTruthy();
    expect(within(items[0]).getByText('T-18')).toBeTruthy();
  });

  it('validates the form with accessible errors and focuses the first one', async () => {
    renderTab(<RegistrationWidget />);
    await screen.findByRole('form', { name: 'Quick register' });
    fireEvent.click(
      within(form()).getByRole('button', { name: 'Register — 30 sec' }),
    );
    const phone = within(form()).getByLabelText('Phone number');
    const name = within(form()).getByLabelText('Full name');
    const age = within(form()).getByLabelText('Age / Sex');
    for (const field of [phone, name, age]) {
      expect(field.getAttribute('aria-invalid')).toBe('true');
    }
    expect(describedText(phone)).toContain('Enter a 10-digit mobile number');
    expect(describedText(age)).toContain('like 44 / M');
    expect(document.activeElement).toBe(phone);
  });

  it('registers a patient and puts them at the top of today’s list', async () => {
    const source = stubSource();
    const register = vi.spyOn(source, 'registerPatient');
    renderTab(<RegistrationWidget />, source);
    await screen.findByRole('form', { name: 'Quick register' });
    fireEvent.change(within(form()).getByLabelText('Phone number'), {
      target: { value: '+91 90000 11111' },
    });
    fireEvent.change(within(form()).getByLabelText('Full name'), {
      target: { value: 'Ramesh' },
    });
    fireEvent.change(within(form()).getByLabelText('Age / Sex'), {
      target: { value: '44 / M' },
    });
    fireEvent.click(
      within(form()).getByRole('button', { name: 'Register — 30 sec' }),
    );
    expect(
      await screen.findByText('Patient registered — token T-27'),
    ).toBeTruthy();
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ramesh',
        abhaConsent: false,
        abhaNumber: '',
      }),
    );
    const recent = screen.getByRole('list', { name: 'Recently registered' });
    const items = within(recent).getAllByRole('listitem');
    expect(items).toHaveLength(6);
    expect(within(items[0]).getByText('Ramesh')).toBeTruthy();
    expect(
      (within(form()).getByLabelText('Full name') as HTMLInputElement).value,
    ).toBe('');
  });

  it('fetches ABHA records only after an explicit opt-in', async () => {
    const source = stubSource();
    const fetchAbha = vi.spyOn(source, 'fetchAbhaProfile');
    const register = vi.spyOn(source, 'registerPatient');
    renderTab(<RegistrationWidget />, source);
    const consent = (await screen.findByRole('checkbox', {
      name: 'The patient agrees to share their ABHA records with this hospital',
    })) as HTMLInputElement;
    expect(consent.checked).toBe(false);

    fireEvent.change(screen.getByLabelText('ABHA number / address'), {
      target: { value: '91-7412-8890-3345' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Fetch with consent' }));
    expect(consent.getAttribute('aria-invalid')).toBe('true');
    expect(describedText(consent)).toContain(
      'Tick this only once the patient has agreed',
    );
    expect(document.activeElement).toBe(consent);
    expect(fetchAbha).not.toHaveBeenCalled();

    fireEvent.click(consent);
    fireEvent.click(screen.getByRole('button', { name: 'Fetch with consent' }));
    await waitFor(() =>
      expect(
        (within(form()).getByLabelText('Full name') as HTMLInputElement).value,
      ).toBe('N. Suvarna Kumari'),
    );
    expect(fetchAbha).toHaveBeenCalledWith('91-7412-8890-3345', true);
    const records = screen.getByRole('list', {
      name: 'Records found at 3 other facilities',
    });
    expect(within(records).getAllByRole('listitem')).toHaveLength(3);

    fireEvent.click(
      within(form()).getByRole('button', { name: 'Register — 30 sec' }),
    );
    await waitFor(() =>
      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'N. Suvarna Kumari',
          abhaConsent: true,
          abhaNumber: '91-7412-8890-3345',
        }),
      ),
    );
  });

  it('checks the master patient index as the phone number is typed', async () => {
    renderTab(<RegistrationWidget />);
    await screen.findByRole('form', { name: 'Quick register' });
    fireEvent.change(within(form()).getByLabelText('Phone number'), {
      target: { value: '+91 98765 43210' },
    });
    const lookup = screen.getByRole('status', { name: 'Phone lookup' });
    await waitFor(() =>
      expect(lookup.textContent).toContain('Venkatesh Naidu'),
    );
    expect(lookup.textContent).toContain('ABHA 91-1234-5678-9012');
  });

  it('shows the loading, error and empty states', async () => {
    renderTab(<RegistrationWidget />, stubSource({ getRegistration: pending }));
    expect(screen.getByRole('heading', { name: 'Registration' })).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
    cleanup();

    renderTab(
      <RegistrationWidget />,
      stubSource({
        getRegistration: () => Promise.reject(new Error('down')),
      }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Could not load registration.',
    );
    cleanup();

    renderTab(
      <RegistrationWidget />,
      stubSource({
        getRegistration: async () => ({
          departments: ['General Medicine'],
          recent: [],
        }),
      }),
    );
    expect(
      await screen.findByRole('heading', {
        name: 'No one registered yet today',
      }),
    ).toBeTruthy();
    expect(form()).toBeTruthy();
  });

  it('keeps the form reachable from the keyboard', async () => {
    renderTab(<RegistrationWidget />);
    await screen.findByRole('form', { name: 'Quick register' });
    const phone = within(form()).getByLabelText('Phone number');
    phone.focus();
    expect(document.activeElement).toBe(phone);
    const submit = within(form()).getByRole('button', {
      name: 'Register — 30 sec',
    });
    expect(submit.getAttribute('type')).toBe('submit');
  });
});
