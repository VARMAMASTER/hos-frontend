import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import {
  ExtractedValuesReview,
  type ExtractedValue,
} from './extracted-values-review';

// A fictional outside lab report: a paper KFT and electrolytes, photographed by the patient's son.
// Nine values: two read with low confidence (sodium, haemoglobin), one already in the chart (eGFR,
// from an ABHA pull), one critical (potassium 6.9), and one the AI misread (urea "4.2" for 42), which
// the stories correct through defaultEdits.
export const KFT_REPORT_VALUES: readonly ExtractedValue[] = [
  {
    id: 'creatinine',
    test: 'Serum creatinine',
    value: '1.4',
    unit: 'mg/dL',
    range: { low: 0.6, high: 1.1 },
    confidence: 'high',
    source: 'page 1, line 4',
  },
  {
    id: 'urea',
    test: 'Blood urea',
    value: '4.2',
    unit: 'mg/dL',
    range: { low: 15, high: 40 },
    confidence: 'medium',
    source: 'page 1, line 5',
  },
  {
    id: 'sodium',
    test: 'Serum sodium',
    value: '138',
    unit: 'mmol/L',
    range: { low: 135, high: 145, criticalLow: 120, criticalHigh: 160 },
    confidence: 'low',
    source: 'page 1, line 6 · blurred',
  },
  {
    id: 'potassium',
    test: 'Serum potassium',
    value: '6.9',
    unit: 'mmol/L',
    range: { low: 3.5, high: 5.1, criticalLow: 2.5, criticalHigh: 6 },
    confidence: 'high',
    source: 'page 1, line 7',
  },
  {
    id: 'chloride',
    test: 'Serum chloride',
    value: '101',
    unit: 'mmol/L',
    range: { low: 98, high: 107 },
    confidence: 'high',
    source: 'page 1, line 8',
  },
  {
    id: 'egfr',
    test: 'eGFR (CKD-EPI)',
    value: '44',
    unit: 'mL/min/1.73m²',
    range: { low: 90, text: '> 90' },
    confidence: 'high',
    source: 'page 1, line 9',
    filed: true,
    filedSource: 'ABHA',
  },
  {
    id: 'uric-acid',
    test: 'Serum uric acid',
    value: '5.1',
    unit: 'mg/dL',
    range: { low: 2.6, high: 6 },
    confidence: 'medium',
    source: 'page 2, line 3',
  },
  {
    id: 'haemoglobin',
    test: 'Haemoglobin',
    value: '11.2',
    unit: 'g/dL',
    range: { low: 12, high: 15, criticalLow: 7 },
    confidence: 'low',
    source: 'page 2, line 14 · smudged',
  },
  {
    id: 'calcium',
    test: 'Serum calcium',
    value: '9.4',
    unit: 'mg/dL',
    range: { low: 8.5, high: 10.5 },
    confidence: 'high',
    source: 'page 2, line 15',
  },
];

// The urea the AI misread, as the clinician corrected it.
export const KFT_REPORT_EDITS: Readonly<Record<string, string>> = {
  urea: '42',
};

const meta = {
  title: 'AI/ExtractedValuesReview',
  component: ExtractedValuesReview,
  excludeStories: ['KFT_REPORT_VALUES', 'KFT_REPORT_EDITS'],
  args: {
    title: 'Kidney function test',
    lab: 'Sunrise Diagnostics, Secunderabad',
    reportDate: '14 Mar 2026',
    patient: 'Lakshmi Devi, 58F',
    approverName: 'Dr. K. Ramesh',
    values: KFT_REPORT_VALUES,
    defaultEdits: KFT_REPORT_EDITS,
    onViewSource: () => undefined,
  },
} satisfies Meta<typeof ExtractedValuesReview>;

export default meta;
type Story = StoryObj<typeof meta>;

// The review: six of nine arrive ticked. Tick, untick, correct a value, then Approve; or Reject,
// which asks for a reason first.
export const Ready: Story = {};

export const Reading: Story = {
  args: { state: 'reading', values: [], readingStep: 2 },
};

export const Approved: Story = {
  args: {
    defaultState: 'approved',
    approvedBy: 'Dr. K. Ramesh',
    approvedAt: '10:52 AM',
  },
};

export const Rejected: Story = {
  args: {
    defaultState: 'rejected',
    rejectedBy: 'Dr. K. Ramesh',
    rejectionReason: 'This is her 2019 report; we already have newer values.',
  },
};

export const CouldNotRead: Story = {
  name: 'Error',
  args: {
    state: 'error',
    values: [],
    errorMessage:
      'The photo is too blurred to read. Retake it in good light, flat on a table.',
    onRetry: () => undefined,
    onEnterManually: () => undefined,
  },
};

export const PatientMismatch: Story = {
  args: {
    patient: 'Laxmi D., 61F',
    chartPatient: 'Lakshmi Devi, 58F',
    patientMismatch: true,
  },
};

export const WithExtraAction: Story = {
  args: {
    actions: (
      <Button variant="ghost" size="sm">
        Keep as a document only
      </Button>
    ),
  },
};

export const Dark: Story = { globals: { scheme: 'dark' } };
