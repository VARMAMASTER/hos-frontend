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
import { DocumentsWidget } from './documents-view';

afterEach(() => cleanup());

async function ready() {
  return screen.findByRole('region', { name: 'Uploaded files' });
}

// Starts the outside-report reading, and waits for the draft values.
async function readReport() {
  fireEvent.click(
    screen.getByRole('button', {
      name: /Drop a report photo or PDF here, or browse to upload/,
    }),
  );
  return screen.findByRole('group', {
    name: /^Read from yashoda-kft_14mar2026\.jpg/,
  });
}

describe('DocumentsWidget: uploaded files', () => {
  it('lists the four files on record with who uploaded them and when', async () => {
    renderTab(<DocumentsWidget />);
    const files = await ready();
    expect(within(files).getByText('4 files on record')).toBeTruthy();
    const items = within(files).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(
      within(items[0]).getByText('discharge-summary_LD_12jan2026.pdf'),
    ).toBeTruthy();
    expect(
      within(items[0]).getByText(
        '248 KB · uploaded 12 Jan 2026 · Dr. K. Ramesh',
      ),
    ).toBeTruthy();
    expect(within(items[0]).getByText('Discharge')).toBeTruthy();
    expect(within(items[0]).getByText('PDF')).toBeTruthy();
    expect(
      within(files).getByText(/Insurance and ID scans are staff-only/),
    ).toBeTruthy();
  });

  it('says in words which files stay with staff', async () => {
    renderTab(<DocumentsWidget />);
    const files = await ready();
    const items = within(files).getAllByRole('listitem');
    const staff = items.filter((item) =>
      within(item).queryByText('Staff only'),
    );
    expect(staff).toHaveLength(1);
    expect(
      within(staff[0]).getByText('insurance-card_LD_14mar2022.jpg'),
    ).toBeTruthy();
    expect(
      within(staff[0])
        .getByText('Staff only')
        .querySelector('[data-slot="icon"] svg'),
    ).not.toBeNull();
  });

  it('opens a file’s preview in a dialog and closes it again', async () => {
    renderTab(<DocumentsWidget />);
    const files = await ready();
    const view = within(files).getByRole('button', {
      name: 'View hba1c-report_22mar2026.pdf',
    });
    fireEvent.click(view);
    const dialog = screen.getByRole('dialog', {
      name: 'hba1c-report_22mar2026.pdf',
    });
    expect(
      within(dialog).getByText('HbA1c report · 1 page · 96 KB'),
    ).toBeTruthy();
    expect(
      within(dialog).getByText('Result 7.9% (High · ref < 6.5%)'),
    ).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('says so when no file is on record', async () => {
    renderTab(
      <DocumentsWidget />,
      stubSource({
        getDocuments: async (id) => ({
          ...(await createMockPatientRecordSource().getDocuments(id)),
          files: [],
        }),
      }),
    );
    expect(
      await screen.findByRole('heading', { name: 'No documents on file' }),
    ).toBeTruthy();
    expect(screen.getByText('0 files on record')).toBeTruthy();
  });
});

describe('DocumentsWidget: reading an outside paper report', () => {
  it('states what it does: transcription, never interpretation, nothing filed by itself', async () => {
    renderTab(<DocumentsWidget />);
    await ready();
    const section = screen.getByRole('region', {
      name: 'Reports that arrive on paper',
    });
    expect(
      within(section).getByText('Transcription · not interpretation'),
    ).toBeTruthy();
    expect(
      within(section).getByText(
        /values are proposed, never filed automatically/,
      ),
    ).toBeTruthy();
    expect(screen.queryByRole('group', { name: /^Read from/ })).toBeNull();
  });

  it('shows the reading as it happens, then proposes six values as a draft', async () => {
    renderTab(<DocumentsWidget />);
    await ready();
    const review = await readReport();
    expect(within(review).getByText('AI draft')).toBeTruthy();
    expect(within(review).getByText('Draft — awaiting approval')).toBeTruthy();
    expect(
      within(review).getByText(/Nothing below is in the chart yet/),
    ).toBeTruthy();
    expect(
      screen.getByRole('group', {
        name: 'Read from yashoda-kft_14mar2026.jpg — 6 values found',
      }),
    ).toBeTruthy();
    const rows = within(review).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(6);
    expect(
      within(review).getByText('Yashoda Hospital, Secunderabad'),
    ).toBeTruthy();
    expect(within(review).getByText('14 Mar 2026')).toBeTruthy();
  });

  it('proposes low-confidence and already-filed values unticked, and says why', async () => {
    renderTab(<DocumentsWidget />);
    await ready();
    const review = await readReport();
    const tick = (test: string) =>
      within(review).getByRole('checkbox', {
        name: `Include ${test}`,
      }) as HTMLInputElement;
    expect(tick('Serum creatinine').checked).toBe(true);
    expect(tick('Blood urea').checked).toBe(true);
    expect(tick('Serum potassium').checked).toBe(true);
    // The blurred one: the reader says so, in words, and it arrives unticked.
    expect(tick('Serum sodium').checked).toBe(false);
    expect(
      within(review).getByText('Low confidence — read it yourself'),
    ).toBeTruthy();
    // The ABHA pull already delivered these two: no second entry.
    expect(tick('eGFR (CKD-EPI)').checked).toBe(false);
    expect(tick('Haemoglobin').checked).toBe(false);
    expect(
      within(review).getAllByText('Already in the chart · ABHA'),
    ).toHaveLength(2);
  });

  it('says where each value falls against the printed range, never what it means', async () => {
    renderTab(<DocumentsWidget />);
    await ready();
    const review = await readReport();
    const row = (test: string) =>
      within(review)
        .getByRole('checkbox', { name: `Include ${test}` })
        .closest('tr') as HTMLElement;
    expect(
      within(row('Serum creatinine')).getByText('Outside reference range'),
    ).toBeTruthy();
    expect(
      within(row('Blood urea')).getByText('Outside reference range'),
    ).toBeTruthy();
    expect(
      within(row('Serum potassium')).getByText('Within range'),
    ).toBeTruthy();
    expect(within(row('Serum sodium')).getByText('Within range')).toBeTruthy();
    // Every status is a word and a shape.
    const chip = within(row('Serum creatinine')).getByText(
      'Outside reference range',
    );
    expect(chip.querySelector('[data-slot="icon"] svg')).not.toBeNull();
    for (const word of [
      /CKD stage/,
      /kidney (disease|failure)/i,
      /diagnos/i,
      /abnormal/i,
    ]) {
      expect(within(review).queryByText(word)).toBeNull();
    }
  });

  it('files exactly what is ticked, with the person’s corrections, under their name', async () => {
    const { source } = renderTab(<DocumentsWidget />);
    const file = vi.spyOn(source, 'fileExtractedValues');
    await ready();
    const review = await readReport();
    fireEvent.change(
      within(review).getByRole('textbox', { name: 'Serum creatinine value' }),
      { target: { value: '1.5' } },
    );
    expect(within(review).getByText('Edited by you')).toBeTruthy();
    expect(within(review).getByText('AI read: 1.4')).toBeTruthy();
    expect(file).not.toHaveBeenCalled();
    fireEvent.click(
      within(review).getByRole('button', { name: /^Approve 3 of 6 values/ }),
    );
    expect(
      await within(review).findByText(/Approved · Dr\. K\. Ramesh/),
    ).toBeTruthy();
    await waitFor(() => expect(file).toHaveBeenCalledTimes(1));
    expect(file).toHaveBeenCalledWith({
      readingId: 'reading-yashoda-kft',
      approver: 'Dr. K. Ramesh',
      values: [
        { id: 'creatinine', value: '1.5' },
        { id: 'urea', value: '42' },
        { id: 'potassium', value: '4.6' },
      ],
    });
  });

  it('adds the photo to the files once filed, and says what was and was not filed', async () => {
    renderTab(<DocumentsWidget />);
    const files = await ready();
    const review = await readReport();
    fireEvent.click(
      within(review).getByRole('button', { name: /^Approve 3 of 6 values/ }),
    );
    const notice = await screen.findByText(
      /Filed 3 values as observations dated 14 Mar 2026/,
    );
    expect(notice.textContent).toContain('Serum creatinine 1.4 mg/dL');
    expect(notice.textContent).toContain(
      'Not filed: Serum sodium, eGFR (CKD-EPI), Haemoglobin',
    );
    await waitFor(() =>
      expect(within(files).getByText('5 files on record')).toBeTruthy(),
    );
    const items = within(files).getAllByRole('listitem');
    expect(
      within(items[0]).getByText('yashoda-kft_14mar2026.jpg'),
    ).toBeTruthy();
    expect(within(items[0]).getByText('Outside report')).toBeTruthy();
  });

  it('counts what is ticked: unticking changes what Approve says it will file', async () => {
    renderTab(<DocumentsWidget />);
    await ready();
    const review = await readReport();
    fireEvent.click(
      within(review).getByRole('checkbox', {
        name: 'Include Serum creatinine',
      }),
    );
    expect(
      within(review).getByRole('button', { name: /^Approve 2 of 6 values/ }),
    ).toBeTruthy();
  });

  it('keeps the report a draft, with the reason, when filing did not go through', async () => {
    renderTab(
      <DocumentsWidget />,
      stubSource({
        fileExtractedValues: async () => {
          throw new Error('The chart could not be updated.');
        },
      }),
    );
    const files = await ready();
    const review = await readReport();
    fireEvent.click(
      within(review).getByRole('button', { name: /^Approve 3 of 6 values/ }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'The chart could not be updated.',
    );
    await waitFor(() =>
      expect(
        within(review).getByText('Draft — awaiting approval'),
      ).toBeTruthy(),
    );
    expect(within(files).getByText('4 files on record')).toBeTruthy();
  });

  it('takes the filing back on Undo: the photo leaves the record', async () => {
    const { source } = renderTab(<DocumentsWidget />);
    const withdraw = vi.spyOn(source, 'withdrawFiling');
    const files = await ready();
    const review = await readReport();
    fireEvent.click(
      within(review).getByRole('button', { name: /^Approve 3 of 6 values/ }),
    );
    await waitFor(() =>
      expect(within(files).getByText('5 files on record')).toBeTruthy(),
    );
    fireEvent.click(within(review).getByRole('button', { name: /^Undo/ }));
    await waitFor(() =>
      expect(withdraw).toHaveBeenCalledWith('reading-yashoda-kft'),
    );
    await waitFor(() =>
      expect(within(files).getByText('4 files on record')).toBeTruthy(),
    );
    expect(within(review).getByText('Draft — awaiting approval')).toBeTruthy();
  });

  it('discards with a reason, writing nothing to the chart', async () => {
    const { source } = renderTab(<DocumentsWidget />);
    const file = vi.spyOn(source, 'fileExtractedValues');
    const files = await ready();
    const review = await readReport();
    fireEvent.click(within(review).getByRole('button', { name: /^Reject/ }));
    fireEvent.change(
      within(review).getByRole('textbox', { name: /Why are you rejecting/ }),
      { target: { value: 'Photo of the wrong report' } },
    );
    fireEvent.click(
      within(review).getByRole('button', { name: /^Reject extraction/ }),
    );
    expect(
      await within(review).findByText(
        /Extraction discarded. Nothing from this report was written/,
      ),
    ).toBeTruthy();
    expect(file).not.toHaveBeenCalled();
    expect(within(files).getByText('4 files on record')).toBeTruthy();
  });

  it('keeps the report as a document only, charting no value', async () => {
    const { source } = renderTab(<DocumentsWidget />);
    const keep = vi.spyOn(source, 'keepReportAsDocument');
    const file = vi.spyOn(source, 'fileExtractedValues');
    const files = await ready();
    const review = await readReport();
    fireEvent.click(
      within(review).getByRole('button', { name: /^Keep as document only/ }),
    );
    await waitFor(() =>
      expect(keep).toHaveBeenCalledWith('reading-yashoda-kft'),
    );
    expect(file).not.toHaveBeenCalled();
    expect(await screen.findByText('Kept as a document only')).toBeTruthy();
    await waitFor(() =>
      expect(within(files).getByText('5 files on record')).toBeTruthy(),
    );
    expect(screen.queryByRole('group', { name: /^Read from/ })).toBeNull();
  });

  it('holds approval until the person confirms a report that names a different patient', async () => {
    renderTab(
      <DocumentsWidget />,
      stubSource({
        readOutsideReport: async (id) => ({
          ...(await createMockPatientRecordSource().readOutsideReport(id)),
          patientOnReport: 'Padma Rao',
        }),
      }),
    );
    await ready();
    const review = await readReport();
    expect(
      within(review).getByText('This report names a different patient'),
    ).toBeTruthy();
    const approve = within(review).getByRole('button', {
      name: /^Approve 3 of 6 values/,
    });
    expect(
      approve.hasAttribute('disabled') ||
        approve.getAttribute('aria-disabled') === 'true',
    ).toBe(true);
    fireEvent.click(
      within(review).getByRole('checkbox', {
        name: /I have checked: this report belongs to Lakshmi Devi/,
      }),
    );
    await waitFor(() =>
      expect(
        within(review)
          .getByRole('button', { name: /^Approve 3 of 6 values/ })
          .hasAttribute('disabled'),
      ).toBe(false),
    );
  });

  it('says so when the report could not be read, and reads it again on Retry', async () => {
    const real = createMockPatientRecordSource();
    const readOutsideReport = vi
      .fn()
      .mockRejectedValueOnce(new Error('ocr down'))
      .mockImplementation((id?: string) => real.readOutsideReport(id));
    renderTab(<DocumentsWidget />, stubSource({ readOutsideReport }));
    await ready();
    fireEvent.click(
      screen.getByRole('button', {
        name: /Drop a report photo or PDF here, or browse to upload/,
      }),
    );
    expect(await screen.findByText('Could not read the report')).toBeTruthy();
    // The reader’s own error is never shown.
    expect(screen.queryByText(/ocr down/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Retry/ }));
    expect(
      await screen.findByRole('group', {
        name: /^Read from yashoda-kft_14mar2026\.jpg/,
      }),
    ).toBeTruthy();
    expect(readOutsideReport).toHaveBeenCalledTimes(2);
  });

  it('shows the reading state while the report is being read', async () => {
    renderTab(<DocumentsWidget />, stubSource({ readOutsideReport: pending }));
    await ready();
    fireEvent.click(
      screen.getByRole('button', {
        name: /Drop a report photo or PDF here, or browse to upload/,
      }),
    );
    const review = await screen.findByRole('group', {
      name: /Reading the report/,
    });
    expect(within(review).getByText('Reading the report…')).toBeTruthy();
    expect(review.getAttribute('aria-busy')).toBe('true');
  });
});

describe('DocumentsWidget: states and access', () => {
  it('shows the loading state with the header in place', () => {
    renderTab(<DocumentsWidget />, stubSource({ getDocuments: pending }));
    expect(screen.getByRole('heading', { name: 'Documents' })).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
    expect(screen.queryByRole('region', { name: 'Uploaded files' })).toBeNull();
  });

  it('shows the error state with fixed words, and loads again on Try again', async () => {
    const real = createMockPatientRecordSource();
    const getDocuments = vi
      .fn()
      .mockRejectedValueOnce(new Error('Ramesh: storage unavailable'))
      .mockImplementation((id?: string) => real.getDocuments(id));
    renderTab(<DocumentsWidget />, stubSource({ getDocuments }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load the documents.');
    expect(alert.textContent).not.toContain('Ramesh');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await ready()).toBeTruthy();
    expect(getDocuments).toHaveBeenCalledTimes(2);
  });

  it('offers no upload in a read-only chart, but still lists and previews the files', async () => {
    renderTab(<DocumentsWidget readonly />);
    const files = await ready();
    expect(
      screen.queryByRole('button', { name: /Drop a report photo or PDF here/ }),
    ).toBeNull();
    expect(
      within(files).queryByRole('button', { name: 'Upload a report' }),
    ).toBeNull();
    expect(
      within(files).getByRole('button', { name: 'View ecg-opd_12jun2026.pdf' }),
    ).toBeTruthy();
  });

  it('can be driven from the keyboard, with every control named', async () => {
    renderTab(<DocumentsWidget />);
    await ready();
    const upload = screen.getByRole('button', {
      name: /Drop a report photo or PDF here, or browse to upload/,
    });
    upload.focus();
    expect(document.activeElement).toBe(upload);
    for (const button of screen.getAllByRole('button')) {
      expect(
        (button.textContent ?? '').trim() || button.getAttribute('aria-label'),
      ).toBeTruthy();
      expect(button.getAttribute('tabindex')).not.toBe('-1');
    }
    expect(
      screen.getByRole('heading', { level: 2, name: 'Documents' }),
    ).toBeTruthy();
  });
});
