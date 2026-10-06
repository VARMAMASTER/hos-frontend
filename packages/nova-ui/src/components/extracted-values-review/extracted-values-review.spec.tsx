import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  ExtractedValuesReview,
  extractedValueStatus,
  initialExtractedSelection,
  type ExtractedValue,
  type ExtractedValuesReviewProps,
} from './extracted-values-review';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const TITLE = 'Kidney function test';

// Fictional: a paper KFT from an outside lab, read by AI.
const VALUES: ExtractedValue[] = [
  {
    id: 'creat',
    test: 'Serum creatinine',
    value: '1.4',
    unit: 'mg/dL',
    range: { low: 0.6, high: 1.1 },
    confidence: 'high',
    source: 'page 1, line 4',
  },
  {
    id: 'sodium',
    test: 'Serum sodium',
    value: '138',
    unit: 'mmol/L',
    range: { low: 135, high: 145 },
    confidence: 'low',
    source: 'page 1, line 6',
  },
  {
    id: 'potassium',
    test: 'Serum potassium',
    value: '6.9',
    unit: 'mmol/L',
    range: { low: 3.5, high: 5.1, criticalHigh: 6 },
    confidence: 'high',
    source: 'page 1, line 7',
  },
  {
    id: 'egfr',
    test: 'eGFR',
    value: '44',
    unit: 'mL/min/1.73m²',
    range: { low: 90, text: '> 90' },
    confidence: 'high',
    source: 'page 1, line 9',
    filed: true,
    filedSource: 'ABHA',
  },
  {
    id: 'calcium',
    test: 'Serum calcium',
    value: '9.4',
    unit: 'mg/dL',
    range: { low: 8.5, high: 10.5 },
    confidence: 'medium',
    source: 'page 2, line 14',
  },
];

function Review(props: Partial<ExtractedValuesReviewProps>) {
  return (
    <ExtractedValuesReview
      title={TITLE}
      lab="Sunrise Diagnostics, Secunderabad"
      reportDate="14 Mar 2026"
      patient="Lakshmi Devi, 58F"
      approverName="Dr. K. Ramesh"
      values={VALUES}
      {...props}
    />
  );
}

function panel() {
  return screen.getByRole('group', { name: TITLE });
}

function button(name: string | RegExp) {
  return screen.getByRole('button', { name }) as HTMLButtonElement;
}

function box(test: string) {
  return screen.getByRole('checkbox', {
    name: `Include ${test}`,
  }) as HTMLInputElement;
}

function field(test: string) {
  return screen.getByRole('textbox', {
    name: `${test} value`,
  }) as HTMLInputElement;
}

function row(test: string) {
  return screen.getByRole('rowheader', { name: new RegExp(test) })
    .parentElement as HTMLTableRowElement;
}

// What a screen reader reads: the text, minus anything hidden from assistive technology.
function assistiveText(node: Node): string {
  if (node instanceof Text) return node.data;
  if (node instanceof Element && node.getAttribute('aria-hidden') === 'true') {
    return '';
  }
  return Array.from(node.childNodes).map(assistiveText).join('');
}
const said = (node: Node) => assistiveText(node).replace(/\s+/g, ' ').trim();

function lifecycle() {
  const chip = panel().querySelector('[data-slot="lifecycle"]');
  expect(chip).not.toBeNull();
  return chip as HTMLElement;
}

describe('extractedValueStatus: out of range, from the caller’s reference range', () => {
  it('reads normal, low, high and critical from the range', () => {
    const range = { low: 3.5, high: 5.1, criticalLow: 2.5, criticalHigh: 6 };
    expect(extractedValueStatus('4.6', range)).toBe('normal');
    expect(extractedValueStatus('3.1', range)).toBe('low');
    expect(extractedValueStatus('5.4', range)).toBe('high');
    expect(extractedValueStatus('6.9', range)).toBe('critical-high');
    expect(extractedValueStatus('2.1', range)).toBe('critical-low');
  });

  it('treats the range limits as within range', () => {
    expect(extractedValueStatus('3.5', { low: 3.5, high: 5.1 })).toBe('normal');
    expect(extractedValueStatus('5.1', { low: 3.5, high: 5.1 })).toBe('normal');
  });

  it('copes with a one-sided range and with thousands separators', () => {
    expect(extractedValueStatus('44', { low: 90 })).toBe('low');
    expect(extractedValueStatus('120', { low: 90 })).toBe('normal');
    expect(
      extractedValueStatus('1,80,000', { low: 150000, high: 410000 }),
    ).toBe('normal');
  });

  it('does not guess: no range, an empty or a non-numeric value is not compared', () => {
    expect(extractedValueStatus('4.6', undefined)).toBeNull();
    expect(extractedValueStatus('', { low: 1, high: 2 })).toBeNull();
    expect(extractedValueStatus('1O4', { low: 98, high: 107 })).toBeNull();
    expect(extractedValueStatus('Positive', { low: 1, high: 2 })).toBeNull();
    expect(extractedValueStatus('4.6', { text: 'see report' })).toBeNull();
  });
});

describe('initialExtractedSelection', () => {
  it('ticks every value except low-confidence and already-filed ones', () => {
    expect(initialExtractedSelection(VALUES)).toEqual([
      'creat',
      'potassium',
      'calcium',
    ]);
  });
});

describe('ExtractedValuesReview: the header', () => {
  it('is the AI block: a group named by the report title, with the spark and the AI label in words', () => {
    render(<Review />);
    const group = panel();
    expect(group.classList.contains('nova-ai-block')).toBe(true);
    expect(group.querySelector('.nova-ai-spark')?.textContent).toBe('✦');
    expect(screen.getByRole('heading', { level: 3, name: TITLE })).toBeTruthy();
    expect(within(group).getByText('AI draft')).toBeTruthy();
  });

  it('names the source: lab, report date, patient and "From a paper report"', () => {
    render(<Review />);
    const group = panel();
    expect(within(group).getByText('From a paper report')).toBeTruthy();
    expect(
      within(group).getByText('Sunrise Diagnostics, Secunderabad'),
    ).toBeTruthy();
    expect(within(group).getByText('14 Mar 2026')).toBeTruthy();
    expect(within(group).getByText('Lakshmi Devi, 58F')).toBeTruthy();
    expect(within(group).getByText('Lab')).toBeTruthy();
    expect(within(group).getByText('Report date')).toBeTruthy();
    expect(within(group).getByText('Patient')).toBeTruthy();
  });

  it('says in words that nothing is in the chart yet', () => {
    render(<Review />);
    expect(screen.getByText(/Nothing below is in the chart yet/)).toBeTruthy();
    expect(said(lifecycle())).toBe('Draft — awaiting approval');
  });
});

describe('ExtractedValuesReview: the table', () => {
  it('is a real table with column headers, a row header per test and a caption', () => {
    render(<Review />);
    const table = screen.getByRole('table', {
      name: 'Values read from the report',
    });
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((th) => th.textContent);
    expect(headers).toEqual([
      'Include',
      'Test',
      'Value',
      'Reference range',
      'Status',
      'Source',
    ]);
    for (const th of within(table).getAllByRole('columnheader')) {
      expect(th.getAttribute('scope')).toBe('col');
    }
    const rowHeaders = within(table).getAllByRole('rowheader');
    expect(rowHeaders).toHaveLength(VALUES.length);
    for (const th of rowHeaders) expect(th.getAttribute('scope')).toBe('row');
  });

  it('keeps the include column pinned while the table scrolls sideways', () => {
    render(<Review />);
    expect(box('Serum creatinine').closest('td')?.className).toMatch(/sticky/);
    expect(
      screen.getByRole('columnheader', { name: 'Include' }).className,
    ).toMatch(/sticky/);
    // The scroll area is a named, focusable region, so the keyboard can scroll it.
    const region = screen.getByRole('region', {
      name: 'Values read from the report',
    });
    expect(region.tabIndex).toBe(0);
  });

  it('shows the value in an input labelled by its test, with the unit and the reference range', () => {
    render(<Review />);
    expect(field('Serum creatinine').value).toBe('1.4');
    const creat = row('Serum creatinine');
    expect(within(creat).getByText('mg/dL')).toBeTruthy();
    expect(within(creat).getByText('0.6 – 1.1')).toBeTruthy();
    // The unit is part of the input's description.
    const describedBy =
      field('Serum creatinine').getAttribute('aria-describedby');
    const ids = (describedBy ?? '').split(' ');
    expect(
      ids.some((id) => document.getElementById(id)?.textContent === 'mg/dL'),
    ).toBe(true);
  });

  it('prints a range the caller spelt out as given', () => {
    render(<Review />);
    expect(within(row('eGFR')).getByText('> 90')).toBeTruthy();
  });

  it('shows the status as a word and an icon, never colour alone', () => {
    render(<Review />);
    const creat = within(row('Serum creatinine')).getByText('High');
    expect(creat.closest('[data-tone]')?.querySelector('svg')).not.toBeNull();
    expect(within(row('Serum sodium')).getByText('Normal')).toBeTruthy();
    expect(within(row('eGFR')).getByText('Low')).toBeTruthy();
    const crit = within(row('Serum potassium')).getByText('Critical high');
    expect(crit.closest('[data-tone]')?.getAttribute('data-tone')).toBe('crit');
  });

  it('gives each row its source line and its confidence', () => {
    render(<Review />);
    expect(
      within(row('Serum creatinine')).getByText('page 1, line 4'),
    ).toBeTruthy();
    expect(within(row('Serum creatinine')).getByText(/Read from/)).toBeTruthy();
    expect(
      within(row('Serum creatinine')).getByText('Confidence high'),
    ).toBeTruthy();
    expect(
      within(row('Serum calcium')).getByText('Confidence medium'),
    ).toBeTruthy();
  });

  it('marks a low-confidence row "Low confidence — read it yourself" and leaves it unticked', () => {
    render(<Review />);
    expect(
      within(row('Serum sodium')).getByText(
        'Low confidence — read it yourself',
      ),
    ).toBeTruthy();
    expect(box('Serum sodium').checked).toBe(false);
    expect(box('Serum creatinine').checked).toBe(true);
  });

  it('leaves an already-filed row unticked, with an "Already in the chart" chip', () => {
    render(<Review />);
    expect(
      within(row('eGFR')).getByText('Already in the chart · ABHA'),
    ).toBeTruthy();
    expect(box('eGFR').checked).toBe(false);
  });

  it('offers "View in report" per row only with a handler, named by the test', () => {
    const onViewSource = vi.fn();
    render(<Review onViewSource={onViewSource} />);
    fireEvent.click(button('View in report Serum sodium'));
    expect(onViewSource).toHaveBeenCalledWith(VALUES[1]);
    cleanup();
    render(<Review />);
    expect(screen.queryByRole('button', { name: /View in report/ })).toBeNull();
  });

  it('puts the caller language on the test names and values, not on the fixed words', () => {
    render(
      <Review
        values={[{ ...VALUES[0], test: 'సీరం క్రియాటినిన్', lang: 'te' }]}
      />,
    );
    expect(screen.getByText('సీరం క్రియాటినిన్').getAttribute('lang')).toBe(
      'te',
    );
    expect(panel().getAttribute('lang')).toBeNull();
  });
});

describe('ExtractedValuesReview: editing a value', () => {
  it('marks the row "Edited by you" and keeps what the AI read visible', () => {
    render(<Review />);
    fireEvent.change(field('Serum potassium'), { target: { value: '4.9' } });
    const potassium = row('Serum potassium');
    expect(within(potassium).getByText('Edited by you')).toBeTruthy();
    expect(within(potassium).getByText('AI read: 6.9')).toBeTruthy();
    expect(field('Serum potassium').value).toBe('4.9');
  });

  it('recomputes the status from the edited value', () => {
    render(<Review />);
    fireEvent.change(field('Serum potassium'), { target: { value: '4.9' } });
    expect(within(row('Serum potassium')).getByText('Normal')).toBeTruthy();
    expect(
      within(row('Serum potassium')).queryByText('Critical high'),
    ).toBeNull();
  });

  it('is no longer edited once the value is typed back to what was read', () => {
    render(<Review />);
    fireEvent.change(field('Serum potassium'), { target: { value: '4.9' } });
    fireEvent.change(field('Serum potassium'), { target: { value: '6.9' } });
    expect(
      within(row('Serum potassium')).queryByText('Edited by you'),
    ).toBeNull();
  });

  it('reports edits, and can be controlled', () => {
    const onEditsChange = vi.fn();
    render(
      <Review edits={{ potassium: '5.0' }} onEditsChange={onEditsChange} />,
    );
    expect(field('Serum potassium').value).toBe('5.0');
    expect(
      within(row('Serum potassium')).getByText('AI read: 6.9'),
    ).toBeTruthy();
    fireEvent.change(field('Serum potassium'), { target: { value: '5.1' } });
    expect(onEditsChange).toHaveBeenCalledWith({ potassium: '5.1' });
    // Controlled: the caller has not committed it.
    expect(field('Serum potassium').value).toBe('5.0');
  });
});

describe('ExtractedValuesReview: ticking and the approve count', () => {
  it('counts the ticked values on the approve button', () => {
    render(<Review />);
    expect(button(/^Approve 3 of 5 values/)).toBeTruthy();
    fireEvent.click(box('Serum sodium'));
    expect(button(/^Approve 4 of 5 values/)).toBeTruthy();
    fireEvent.click(box('Serum creatinine'));
    expect(button(/^Approve 3 of 5 values/)).toBeTruthy();
  });

  it('names the approve button by the report as well', () => {
    render(<Review />);
    expect(button(`Approve 3 of 5 values ${TITLE}`)).toBeTruthy();
  });

  it('announces the count politely when a row is ticked or unticked, not on arrival', () => {
    render(<Review />);
    const region = panel().querySelector('[data-slot="selection-status"]');
    expect(region?.getAttribute('role')).toBe('status');
    expect(region?.textContent).toBe('');
    fireEvent.click(box('Serum sodium'));
    expect(region?.textContent).toBe('4 of 5 values selected');
  });

  it('is disabled at none, and says why; a press then files nothing', () => {
    const onApprove = vi.fn();
    render(<Review onApprove={onApprove} defaultSelected={[]} />);
    const approve = button(/^Approve 0 of 5 values/);
    expect(approve.getAttribute('aria-disabled')).toBe('true');
    expect(
      screen.getByText('Tick at least one value to approve.'),
    ).toBeTruthy();
    fireEvent.click(approve);
    expect(onApprove).not.toHaveBeenCalled();
    expect(said(lifecycle())).toBe('Draft — awaiting approval');
  });

  it('will not file a ticked value left empty', () => {
    const onApprove = vi.fn();
    render(<Review onApprove={onApprove} />);
    fireEvent.change(field('Serum creatinine'), { target: { value: ' ' } });
    expect(field('Serum creatinine').getAttribute('aria-invalid')).toBe('true');
    expect(
      screen.getByText('Enter a value for Serum creatinine, or untick it.'),
    ).toBeTruthy();
    fireEvent.click(button(/^Approve 3 of 5/));
    expect(onApprove).not.toHaveBeenCalled();
    fireEvent.click(box('Serum creatinine'));
    expect(field('Serum creatinine').getAttribute('aria-invalid')).toBeNull();
    fireEvent.click(button(/^Approve 2 of 5/));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('reports the selection, and can be controlled', () => {
    const onSelectedChange = vi.fn();
    render(<Review selected={['creat']} onSelectedChange={onSelectedChange} />);
    expect(box('Serum creatinine').checked).toBe(true);
    expect(box('Serum potassium').checked).toBe(false);
    fireEvent.click(box('Serum potassium'));
    expect(onSelectedChange).toHaveBeenCalledWith(['creat', 'potassium']);
    expect(box('Serum potassium').checked).toBe(false);
  });

  it('applies the arrival rule to values that arrive after the first render', () => {
    const { rerender } = render(<Review state="reading" values={[]} />);
    rerender(<Review state="ready" values={VALUES} />);
    expect(box('Serum creatinine').checked).toBe(true);
    expect(box('Serum sodium').checked).toBe(false);
    expect(box('eGFR').checked).toBe(false);
  });
});

describe('ExtractedValuesReview: approving', () => {
  it('files exactly the ticked values, with the edits, and says who approved and when', () => {
    const onApprove = vi.fn();
    render(<Review onApprove={onApprove} />);
    fireEvent.change(field('Serum potassium'), { target: { value: '5.0' } });
    fireEvent.click(box('Serum sodium'));
    fireEvent.click(button(/^Approve 4 of 5/));
    expect(onApprove).toHaveBeenCalledTimes(1);
    const approval = onApprove.mock.calls[0]?.[0];
    expect(approval.approver).toBe('Dr. K. Ramesh');
    expect(approval.at).toBeInstanceOf(Date);
    expect(
      approval.values.map((v: { id: string; value: string }) => [
        v.id,
        v.value,
      ]),
    ).toEqual([
      ['creat', '1.4'],
      ['sodium', '138'],
      ['potassium', '5.0'],
      ['calcium', '9.4'],
    ]);
    const potassium = approval.values.find(
      (v: { id: string }) => v.id === 'potassium',
    );
    expect(potassium).toMatchObject({
      edited: true,
      originalValue: '6.9',
      unit: 'mmol/L',
      status: 'normal',
    });
    expect(said(lifecycle())).toBe('Approved · Dr. K. Ramesh · just now');
    expect(panel().dataset['state']).toBe('approved');
    expect(screen.getByText(/4 values filed to the chart/)).toBeTruthy();
  });

  it('locks the table once approved: no inputs, and each row says whether it was filed', () => {
    render(<Review defaultState="approved" approvedBy="Dr. K. Ramesh" />);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(within(row('Serum creatinine')).getByText('Filed')).toBeTruthy();
    expect(within(row('Serum sodium')).getByText('Not filed')).toBeTruthy();
    expect(within(row('Serum creatinine')).getByText('1.4')).toBeTruthy();
  });

  it('shows a stored approval with its time', () => {
    render(
      <Review
        state="approved"
        approvedBy="Dr. K. Ramesh"
        approvedAt="10:52 AM"
      />,
    );
    expect(said(lifecycle())).toBe('Approved · Dr. K. Ramesh · 10:52 AM');
  });

  it('offers Undo, which takes the focus, and Undo returns to the review with nothing filed', () => {
    const onUndo = vi.fn();
    render(<Review onUndo={onUndo} />);
    const approve = button(/^Approve 3 of 5/);
    approve.focus();
    fireEvent.click(approve);
    const undo = button(/^Undo/);
    expect(document.activeElement).toBe(undo);
    fireEvent.click(undo);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(said(lifecycle())).toBe('Draft — awaiting approval');
    expect(
      screen.getByText(
        'Approval withdrawn. Nothing from this report is in the chart.',
      ),
    ).toBeTruthy();
    expect(document.activeElement).toBe(button(/^Approve 3 of 5/));
    // The ticks and edits survive the round trip.
    expect(box('Serum creatinine').checked).toBe(true);
  });

  it('puts Approve first and focuses nothing on its own: Reject is never the default focus', () => {
    render(<Review />);
    expect(document.activeElement).toBe(document.body);
    const actions = screen.getByRole('group', {
      name: 'Review extracted values',
    });
    const names = within(actions)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names[0]).toMatch(/^Approve/);
    expect(names).toContain('Reject');
  });

  it('shows the actions as busy while the approval is submitted', () => {
    render(<Review busy />);
    expect(
      screen
        .getByRole('group', { name: 'Review extracted values' })
        .getAttribute('aria-busy'),
    ).toBe('true');
  });
});

describe('ExtractedValuesReview: rejecting', () => {
  it('asks for a reason first, focusing the field, and will not reject without one', () => {
    const onReject = vi.fn();
    render(<Review onReject={onReject} />);
    fireEvent.click(button(/^Reject/));
    const reason = screen.getByRole('textbox', {
      name: 'Why are you rejecting this extraction?',
    });
    expect(document.activeElement).toBe(reason);
    fireEvent.click(button(/^Reject extraction/));
    expect(onReject).not.toHaveBeenCalled();
    expect(
      screen.getByText('Give a reason to reject this extraction.'),
    ).toBeTruthy();
  });

  it('discards the whole extraction with the reason, hides the table and offers Undo', () => {
    const onReject = vi.fn();
    render(<Review onReject={onReject} />);
    fireEvent.click(button(/^Reject/));
    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'Why are you rejecting this extraction?',
      }),
      { target: { value: '  Wrong patient’s report  ' } },
    );
    fireEvent.click(button(/^Reject extraction/));
    expect(onReject).toHaveBeenCalledWith('Wrong patient’s report');
    expect(said(lifecycle())).toBe('Rejected');
    expect(screen.queryByRole('table')).toBeNull();
    expect(
      screen.getByText(
        'Extraction discarded. Nothing from this report was written to the chart.',
      ),
    ).toBeTruthy();
    expect(screen.getByText(/Wrong patient’s report/)).toBeTruthy();
    expect(document.activeElement).toBe(button(/^Undo/));
    fireEvent.click(button(/^Undo/));
    expect(said(lifecycle())).toBe('Draft — awaiting approval');
    expect(screen.getByRole('table')).toBeTruthy();
  });

  it('Escape cancels the reason form and returns focus to Reject', () => {
    render(<Review />);
    fireEvent.click(button(/^Reject/));
    fireEvent.keyDown(
      screen.getByRole('textbox', {
        name: 'Why are you rejecting this extraction?',
      }),
      { key: 'Escape' },
    );
    expect(
      screen.queryByRole('textbox', {
        name: 'Why are you rejecting this extraction?',
      }),
    ).toBeNull();
    expect(document.activeElement).toBe(button(/^Reject/));
  });

  it('shows a stored rejection', () => {
    render(
      <Review
        state="rejected"
        rejectedBy="Dr. K. Ramesh"
        rejectionReason="Report is from 2019."
      />,
    );
    expect(screen.getByText(/Report is from 2019\./)).toBeTruthy();
    expect(screen.getByText('Dr. K. Ramesh')).toBeTruthy();
  });
});

describe('ExtractedValuesReview: patient mismatch', () => {
  it('shows the mismatch banner and holds approval until the clinician confirms', () => {
    const onApprove = vi.fn();
    render(
      <Review
        onApprove={onApprove}
        patientMismatch
        patient="Laxmi D., 61F"
        chartPatient="Lakshmi Devi, 58F"
      />,
    );
    const banner = screen.getByRole('alert');
    expect(
      within(banner).getByText('This report names a different patient'),
    ).toBeTruthy();
    expect(within(banner).getByText(/Laxmi D\., 61F/)).toBeTruthy();
    const approve = button(/^Approve 3 of 5/);
    expect(approve.getAttribute('aria-disabled')).toBe('true');
    expect(
      screen.getByText('Confirm the patient before approving.'),
    ).toBeTruthy();
    fireEvent.click(approve);
    expect(onApprove).not.toHaveBeenCalled();

    const confirm = screen.getByRole('checkbox', {
      name: 'I have checked: this report belongs to Lakshmi Devi, 58F',
    });
    fireEvent.click(confirm);
    expect(button(/^Approve 3 of 5/).getAttribute('aria-disabled')).toBeNull();
    fireEvent.click(button(/^Approve 3 of 5/));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('reports the confirmation', () => {
    const onMismatchConfirmedChange = vi.fn();
    render(
      <Review
        patientMismatch
        chartPatient="Lakshmi Devi, 58F"
        mismatchConfirmed={false}
        onMismatchConfirmedChange={onMismatchConfirmedChange}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /I have checked/ }));
    expect(onMismatchConfirmedChange).toHaveBeenCalledWith(true);
  });

  it('has no banner when the patient matches', () => {
    render(<Review />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('ExtractedValuesReview: reading', () => {
  it('shows the reading steps and a placeholder table, busy, with nothing to approve', () => {
    render(
      <Review
        state="reading"
        values={[]}
        readingSteps={['Reading the page', 'Matching test names']}
        readingStep={1}
      />,
    );
    expect(panel().getAttribute('aria-busy')).toBe('true');
    expect(said(lifecycle())).toBe('Reading the report…');
    const steps = screen.getByRole('list', { name: 'Reading the report' });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(2);
    expect(document.querySelectorAll('[data-skeleton]').length).toBeGreaterThan(
      0,
    );
    const skeleton = document.querySelector('[data-slot="skeleton"]');
    expect(skeleton?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('button', { name: /^Approve/ })).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });
});

describe('ExtractedValuesReview: error', () => {
  it('says the report could not be read, with Retry and Enter manually', () => {
    const onRetry = vi.fn();
    const onEnterManually = vi.fn();
    render(
      <Review
        state="error"
        values={[]}
        errorMessage="The photo is too blurred to read."
        onRetry={onRetry}
        onEnterManually={onEnterManually}
      />,
    );
    expect(said(lifecycle())).toBe('Could not read the report');
    expect(screen.getByText('The photo is too blurred to read.')).toBeTruthy();
    fireEvent.click(button(/^Retry/));
    expect(onRetry).toHaveBeenCalledTimes(1);
    fireEvent.click(button(/^Enter manually/));
    expect(onEnterManually).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /^Approve/ })).toBeNull();
  });
});

describe('ExtractedValuesReview: lifecycle', () => {
  it('reports state changes, and can be controlled', () => {
    const onStateChange = vi.fn();
    render(<Review state="ready" onStateChange={onStateChange} />);
    fireEvent.click(button(/^Approve 3 of 5/));
    expect(onStateChange).toHaveBeenCalledWith('approved');
    expect(said(lifecycle())).toBe('Draft — awaiting approval');
  });

  it('has exactly one lifecycle live region, mounted in every state', () => {
    for (const state of [
      'reading',
      'ready',
      'approved',
      'rejected',
      'error',
    ] as const) {
      render(<Review state={state} approvedBy="Dr. K. Ramesh" />);
      expect(lifecycle().getAttribute('role')).toBe('status');
      cleanup();
    }
  });

  it('takes every fixed word as a label', () => {
    render(
      <Review
        labels={{
          paperReport: 'కాగితపు నివేదిక',
          approve: (n, total) => `ఆమోదించు ${n}/${total}`,
          columns: {
            include: 'చేర్చు',
            test: 'పరీక్ష',
            value: 'విలువ',
            range: 'పరిధి',
            status: 'స్థితి',
            source: 'మూలం',
          },
        }}
      />,
    );
    expect(screen.getByText('కాగితపు నివేదిక')).toBeTruthy();
    expect(button(/^ఆమోదించు 3\/5/)).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'పరీక్ష' })).toBeTruthy();
  });
});

describe('ExtractedValuesReview: health data', () => {
  it('never logs or stores patient content through the whole flow', () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (name) => vi.spyOn(console, name),
    );
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(
      <Review
        patient="Ramesh"
        values={VALUES.map((v) => ({ ...v, test: `${v.test} Ramesh` }))}
      />,
    );
    fireEvent.change(field('Serum potassium Ramesh'), {
      target: { value: 'Ramesh' },
    });
    fireEvent.click(box('Serum sodium Ramesh'));
    fireEvent.click(box('Serum potassium Ramesh'));
    fireEvent.click(button(/^Approve/));
    fireEvent.click(button(/^Undo/));
    fireEvent.click(button(/^Reject/));
    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'Why are you rejecting this extraction?',
      }),
      { target: { value: 'Ramesh' } },
    );
    fireEvent.click(button(/^Reject extraction/));
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
