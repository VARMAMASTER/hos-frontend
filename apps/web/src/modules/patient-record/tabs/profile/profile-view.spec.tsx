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
import { ProfileWidget } from './profile-view';

afterEach(() => cleanup());

// The definition that goes with a term in a region.
function definitionOf(region: HTMLElement, term: string): string {
  const dt = within(region).getByText(term, { selector: 'dt' });
  return dt.nextElementSibling?.textContent ?? '';
}

describe('ProfileWidget', () => {
  it('shows the demographics, with the MRN', async () => {
    renderTab(<ProfileWidget />);
    const demographics = await screen.findByRole('region', {
      name: 'Demographics',
    });
    expect(within(demographics).getByText(/SVH-2022-08114/)).toBeTruthy();
    expect(definitionOf(demographics, 'Date of birth')).toBe(
      '22 Aug 1967 (58y)',
    );
    expect(definitionOf(demographics, 'Sex')).toBe('Female');
    expect(definitionOf(demographics, 'Phone')).toBe('+91 98491 22310');
    expect(definitionOf(demographics, 'Blood group')).toBe('B+');
    expect(definitionOf(demographics, 'Address')).toContain('Kukatpally');
    expect(definitionOf(demographics, 'Emergency contact')).toBe(
      'Venkatesh Naidu (son) · +91 90140 55231',
    );
    expect(definitionOf(demographics, 'Registered on')).toBe('14 Mar 2022');
    expect(definitionOf(demographics, 'Registered by')).toBe(
      'Swapna, Reception',
    );
  });

  it('lists the four conditions and where the outside one came from', async () => {
    renderTab(<ProfileWidget />);
    const conditions = await screen.findByRole('region', {
      name: 'Conditions',
    });
    expect(within(conditions).getByText('4 recorded')).toBeTruthy();
    const items = within(conditions).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(within(items[0]).getByText('Type 2 Diabetes Mellitus')).toBeTruthy();
    expect(within(items[0]).getByText(/Onset Mar 2022/)).toBeTruthy();
    expect(
      within(items[0]).getByText(/Active — HbA1c 8.4% on 18 Jul 2026/),
    ).toBeTruthy();
    const ckd = items[3];
    expect(
      within(ckd).getByText('Chronic kidney disease, stage 3a'),
    ).toBeTruthy();
    // The provenance is on the row, in words, because it is exactly what a doctor will verify.
    expect(
      within(ckd).getByText(/Entered from an outside record/),
    ).toBeTruthy();
    expect(
      within(ckd).getByText(/Yashoda Hospital, Secunderabad/),
    ).toBeTruthy();
    expect(
      within(items[0]).queryByText(/Entered from an outside record/),
    ).toBeNull();
  });

  it('shows the vitals baseline and when it was last recorded', async () => {
    renderTab(<ProfileWidget />);
    const vitals = await screen.findByRole('region', {
      name: 'Vitals baseline',
    });
    expect(within(vitals).getByText('Last recorded 18 Jul 2026')).toBeTruthy();
    expect(definitionOf(vitals, 'Height')).toBe('152 cm');
    expect(definitionOf(vitals, 'BMI')).toBe('29.4');
    expect(definitionOf(vitals, 'BP baseline')).toBe('130/82');
    expect(definitionOf(vitals, 'SpO₂')).toBe('97%');
    expect(within(vitals).getAllByRole('term')).toHaveLength(6);
    expect(within(vitals).getByText(/BMI category:/).textContent).toContain(
      'Overweight',
    );
  });

  it('carries the allergies in the patient header, as words with a warning shape', async () => {
    renderTab(<ProfileWidget />);
    const allergies = await screen.findByRole('group', { name: 'Allergies' });
    for (const name of ['Penicillin', 'Sulfa drugs']) {
      const chip = within(allergies).getByText(name);
      expect(chip.querySelector('[data-slot="icon"] svg')).not.toBeNull();
    }
    expect(
      screen.getByRole('heading', { level: 1, name: 'Lakshmi Devi' }),
    ).toBeTruthy();
  });

  it('shows the loading state with the header in place', () => {
    renderTab(<ProfileWidget />, stubSource({ getProfile: pending }));
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeTruthy();
    const loading = screen.getByRole('status');
    expect(loading.getAttribute('aria-busy')).toBe('true');
    expect(screen.queryByRole('region', { name: 'Demographics' })).toBeNull();
  });

  it('shows the error state with fixed words, and loads again on Try again', async () => {
    const real = createMockPatientRecordSource();
    const getProfile = vi
      .fn()
      .mockRejectedValueOnce(new Error('Ramesh could not be loaded from db-7'))
      .mockImplementation((id?: string) => real.getProfile(id));
    renderTab(<ProfileWidget />, stubSource({ getProfile }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load the profile.');
    // The source's own error text is never shown.
    expect(alert.textContent).not.toContain('Ramesh');
    expect(alert.textContent).not.toContain('db-7');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('region', { name: 'Demographics' }),
    ).toBeTruthy();
    expect(getProfile).toHaveBeenCalledTimes(2);
  });

  it('says so when no condition is recorded, and keeps the rest', async () => {
    renderTab(
      <ProfileWidget />,
      stubSource({
        getProfile: async (id) => ({
          ...(await createMockPatientRecordSource().getProfile(id)),
          conditions: [],
        }),
      }),
    );
    const conditions = await screen.findByRole('region', {
      name: 'Conditions',
    });
    expect(
      within(conditions).getByRole('heading', {
        name: 'No conditions recorded',
      }),
    ).toBeTruthy();
    expect(within(conditions).queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByRole('region', { name: 'Demographics' })).toBeTruthy();
  });

  it('passes the patient id on to the source', async () => {
    const real = createMockPatientRecordSource();
    const getProfile = vi.fn((id?: string) => real.getProfile(id));
    renderTab(
      <ProfileWidget patientId="pt-lakshmi-devi" />,
      stubSource({ getProfile }),
    );
    await screen.findByRole('region', { name: 'Demographics' });
    await waitFor(() =>
      expect(getProfile).toHaveBeenCalledWith('pt-lakshmi-devi'),
    );
  });

  it('names its sections, so a screen reader can move between them', async () => {
    renderTab(<ProfileWidget />);
    await screen.findByRole('region', { name: 'Demographics' });
    expect(
      screen.getByRole('heading', { level: 2, name: 'Profile' }),
    ).toBeTruthy();
    for (const name of ['Demographics', 'Conditions', 'Vitals baseline']) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeTruthy();
      expect(screen.getByRole('region', { name })).toBeTruthy();
    }
  });
});
