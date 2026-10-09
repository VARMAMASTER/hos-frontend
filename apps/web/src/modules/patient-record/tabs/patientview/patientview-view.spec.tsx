/// <reference lib="dom" />
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockPatientRecordSource } from '../../data/mock';
import { pending, renderTab, stubSource } from '../../testing/render';
import { PatientviewWidget } from './patientview-view';

afterEach(() => cleanup());

async function ready() {
  return screen.findByRole('region', { name: 'What she controls' });
}

describe('PatientviewWidget', () => {
  it('says plainly that this is a preview and she cannot see the staff screen', async () => {
    renderTab(<PatientviewWidget />);
    await ready();
    const banner = screen.getByText('This is a preview, not a shared screen.');
    expect(banner).toBeTruthy();
    expect(
      screen.getByText(
        /Lakshmi Devi cannot see the workspace you are in. She signs in to her own app with her phone and OTP/,
      ),
    ).toBeTruthy();
  });

  it('lists the seven categories with what she sees and what is shared outside', async () => {
    renderTab(<PatientviewWidget />);
    const controls = await ready();
    const table = within(controls).getByRole('table', {
      name: 'What the patient can see, by category',
    });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Category', 'Visible to her', 'Shared outside']);
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(7);
    expect(within(rows[0]).getByText('Prescriptions')).toBeTruthy();
    expect(
      within(rows[0]).getByText('every Rx, in Telugu or English'),
    ).toBeTruthy();
    expect(within(rows[0]).getByText('Yes')).toBeTruthy();
    expect(within(rows[0]).getByText('ABHA · on request')).toBeTruthy();
    expect(within(rows[2]).getByText('Bills & receipts')).toBeTruthy();
    expect(within(rows[2]).getByText('No')).toBeTruthy();
  });

  it('marks the categories that never reach her, in words and a shape', async () => {
    renderTab(<PatientviewWidget />);
    const controls = await ready();
    const table = within(controls).getByRole('table', {
      name: 'What the patient can see, by category',
    });
    const rows = within(table).getAllByRole('row').slice(1);
    const excluded = rows.slice(4);
    expect(
      excluded.map((row) => within(row).getAllByRole('cell')[0].textContent),
    ).toEqual([
      'Doctor’s private notesdifferentials, clinical reasoning',
      'Unvalidated resultsstill on the analyser',
      'Internal AI draftsbefore a human approves',
    ]);
    for (const row of excluded) {
      const cells = within(row).getAllByRole('cell');
      for (const cell of cells.slice(1)) {
        expect(cell.querySelector('[data-slot="icon"] svg')).not.toBeNull();
      }
    }
    expect(within(excluded[0]).getByText('Never')).toBeTruthy();
    expect(within(excluded[1]).getByText('Not yet')).toBeTruthy();
    expect(
      within(controls).getByText(
        /structurally excluded, not merely hidden behind a flag/,
      ),
    ).toBeTruthy();
  });

  it('previews her app in her language: next visit, report, medicines and bills', async () => {
    renderTab(<PatientviewWidget />);
    await ready();
    const app = screen.getByRole('region', { name: 'Her app, right now' });
    expect(within(app).getByText('/patient')).toBeTruthy();
    expect(within(app).getByText('Namaste, Lakshmi')).toBeTruthy();
    expect(
      within(app).getByText('Sri Venkateshwara Hospital · ABHA linked'),
    ).toBeTruthy();
    const rows = within(app).getAllByRole('listitem');
    expect(
      rows
        .slice(0, 4)
        .map((row) => within(row).getByRole('heading').textContent),
    ).toEqual([
      'Your next visit',
      'Your sugar report — 18 Jul',
      'Your medicines (3)',
      'Bills',
    ]);
    expect(
      within(rows[0]).getByText('01 Aug 2026, 10:30 AM · Dr. K. Ramesh'),
    ).toBeTruthy();
    expect(
      within(rows[0]).getByText(
        'Please come fasting — a blood test is planned.',
      ),
    ).toBeTruthy();
    expect(
      within(rows[1]).getByText(
        'HbA1c 8.4%. Your doctor’s target for you is below 7%.',
      ),
    ).toBeTruthy();
    expect(
      within(rows[2]).getByText('Metformin · Telmisartan · Pregabalin'),
    ).toBeTruthy();
    expect(
      within(rows[3]).getByText('₹1,240 paid on 18 Jul · receipt available'),
    ).toBeTruthy();
  });

  it('says what her app does not show, instead of leaving it out silently', async () => {
    renderTab(<PatientviewWidget />);
    await ready();
    const app = screen.getByRole('region', { name: 'Her app, right now' });
    expect(
      within(app).getByText(
        /Doctor’s clinical notes, AI drafts and unvalidated results are not shown here/,
      ),
    ).toBeTruthy();
    expect(
      within(app).getByText(
        /She can revoke ABHA sharing, request a correction, or download everything/,
      ),
    ).toBeTruthy();
  });

  it('shows the loading state with the header in place', () => {
    renderTab(<PatientviewWidget />, stubSource({ getPatientView: pending }));
    expect(screen.getByRole('heading', { name: 'Patient View' })).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
    expect(
      screen.queryByRole('region', { name: 'What she controls' }),
    ).toBeNull();
  });

  it('shows the error state with fixed words, and loads again on Try again', async () => {
    const real = createMockPatientRecordSource();
    const getPatientView = vi
      .fn()
      .mockRejectedValueOnce(new Error('Ramesh: 500'))
      .mockImplementation((id?: string) => real.getPatientView(id));
    renderTab(<PatientviewWidget />, stubSource({ getPatientView }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load the patient view.');
    expect(alert.textContent).not.toContain('Ramesh');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await ready()).toBeTruthy();
    expect(getPatientView).toHaveBeenCalledTimes(2);
  });

  it('shows the empty state when there is nothing to preview', async () => {
    renderTab(
      <PatientviewWidget />,
      stubSource({
        getPatientView: async (id) => {
          const full = await createMockPatientRecordSource().getPatientView(id);
          return {
            ...full,
            categories: [],
            app: { ...full.app, rows: [], withheld: [] },
          };
        },
      }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Nothing to preview yet' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('region', { name: 'Her app, right now' }),
    ).toBeNull();
  });

  it('names its sections and has no control that could change what she sees', async () => {
    renderTab(<PatientviewWidget />);
    await ready();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Patient View' }),
    ).toBeTruthy();
    for (const name of ['What she controls', 'Her app, right now']) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeTruthy();
    }
    // Her consent is hers to change, in her own app: nothing here edits it.
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('switch')).toHaveLength(0);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });
});
