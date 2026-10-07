import type { ReactNode } from 'react';
import type { AiConfidence } from '../ai-source-line/ai-source-line';

// The review of values an AI read off a paper report (an outside lab printout, a phone photo of
// one). Nothing in it is in the chart until a person ticks what they want and approves it.
// - reading: the AI is still reading the page: its steps and a placeholder table.
// - ready: the review; ticks, edits, Approve and Reject.
// - approved: who approved and when, the table locked to what was filed, and Undo.
// - rejected: the whole extraction discarded, with the reason, and Undo.
// - error: the report could not be read: Retry, or enter the values by hand.
export type ExtractionState =
  | 'reading'
  | 'ready'
  | 'approved'
  | 'rejected'
  | 'error';

export const EXTRACTION_STATES: readonly ExtractionState[] = [
  'reading',
  'ready',
  'approved',
  'rejected',
  'error',
];

// Where a value sits against its reference range. Transcription is not interpretation: these say
// where the number falls against the range printed on the report, nothing more.
export type ExtractedValueStatus =
  | 'normal'
  | 'low'
  | 'high'
  | 'critical-low'
  | 'critical-high';

// The reference range, as the caller supplies it. Either limit may be missing (eGFR "> 90"). The
// critical limits, when given, mark a value past them as critical. text is how the report prints
// the range, when the default ("0.6 – 1.1", "≥ 90", "≤ 200") would not match it.
export interface ExtractedReferenceRange {
  low?: number;
  high?: number;
  criticalLow?: number;
  criticalHigh?: number;
  text?: string;
}

export interface ExtractedValue {
  id: string;
  // The test as named on the report: "Serum creatinine".
  test: string;
  // The value as read, a string, because the page may say "1O4" and the person must see that.
  value: string;
  unit?: string;
  range?: ExtractedReferenceRange;
  // How sure the reader is. Low arrives unticked, with "Low confidence — read it yourself".
  confidence: AiConfidence;
  // Where on the page it was read: "page 2, line 14".
  source: string;
  // The same observation is already in the chart (from an ABHA pull, say): it arrives unticked.
  filed?: boolean;
  // Where the chart's copy came from: "ABHA".
  filedSource?: string;
  // The language of the test name and value (te, hi, en), when it differs from the page's.
  lang?: string;
}

// A value as approved: what the person ticked, with their edit if they made one.
export interface ApprovedExtractedValue {
  id: string;
  test: string;
  value: string;
  unit?: string;
  // What the AI read, kept beside the filed value.
  originalValue: string;
  edited: boolean;
  status: ExtractedValueStatus | null;
}

export interface ExtractionApproval {
  approver: string;
  at: Date;
  values: ApprovedExtractedValue[];
}

export interface ExtractedValuesReviewColumns {
  include: string;
  test: string;
  value: string;
  range: string;
  status: string;
  source: string;
}

// Every fixed word, so a hospital can show the review in Telugu, Hindi or English.
export interface ExtractedValuesReviewLabels {
  badge: string;
  badgeApproved: string;
  paperReport: string;
  lab: string;
  reportDate: string;
  patient: string;
  intro: string;
  introApproved: string;
  caption: string;
  columns: ExtractedValuesReviewColumns;
  reading: string;
  readingLabel: string;
  readingSteps: readonly string[];
  ready: string;
  approved: (who: string, time?: string) => string;
  rejected: string;
  error: string;
  errorFallback: string;
  retry: string;
  enterManually: string;
  include: (test: string) => string;
  valueLabel: (test: string) => string;
  filed: (source?: string) => string;
  edited: string;
  aiRead: (value: string) => string;
  status: Readonly<Record<ExtractedValueStatus, string>>;
  notCompared: string;
  sourceLabel: string;
  viewInReport: string;
  filedYes: string;
  filedNo: string;
  approve: (count: number, total: number) => string;
  selectedCount: (count: number, total: number) => string;
  noneSelected: string;
  emptyValue: (test: string) => string;
  valueRequired: string;
  mismatchTitle: string;
  mismatchBody: (
    reportPatient?: ReactNode,
    chartPatient?: ReactNode,
  ) => ReactNode;
  mismatchConfirm: (chartPatient?: ReactNode) => ReactNode;
  confirmPatientFirst: string;
  approvedNote: (who: string, count: number) => ReactNode;
  withdrawn: string;
  rejectedNote: (who: string, reason: string) => ReactNode;
  discarded: string;
  reject: string;
  undo: string;
  rejectReason: string;
  confirmReject: string;
  cancel: string;
  reasonRequired: string;
  actions: string;
  justNow: string;
  you: string;
}

const plural = (count: number, one: string, many: string) =>
  count === 1 ? one : many;

export const EXTRACTED_VALUES_REVIEW_LABELS: Readonly<ExtractedValuesReviewLabels> =
  {
    badge: 'AI draft',
    badgeApproved: 'AI-assisted',
    paperReport: 'From a paper report',
    lab: 'Lab',
    reportDate: 'Report date',
    patient: 'Patient',
    intro:
      'Nothing below is in the chart yet. Correct any value, untick what you don’t want, then approve. Only what you tick is filed, under your name.',
    introApproved:
      'The values marked Filed are in the chart. The rest were not filed.',
    caption: 'Values read from the report',
    columns: {
      include: 'Include',
      test: 'Test',
      value: 'Value',
      range: 'Reference range',
      status: 'Status',
      source: 'Source',
    },
    reading: 'Reading the report…',
    readingLabel: 'Reading the report',
    readingSteps: [
      'Straightening and sharpening the page',
      'Reading the values off the page',
      'Matching test names',
      'Comparing with results already in the chart',
    ],
    ready: 'Draft — awaiting approval',
    approved: (who, time) =>
      time ? `Approved · ${who} · ${time}` : `Approved · ${who}`,
    rejected: 'Rejected',
    error: 'Could not read the report',
    errorFallback:
      'The values on this report could not be read. Try again, or enter them yourself.',
    retry: 'Retry',
    enterManually: 'Enter manually',
    include: (test) => `Include ${test}`,
    valueLabel: (test) => `${test} value`,
    filed: (source) =>
      source ? `Already in the chart · ${source}` : 'Already in the chart',
    edited: 'Edited by you',
    aiRead: (value) => `AI read: ${value}`,
    status: {
      normal: 'Within range',
      low: 'Below range',
      high: 'Above range',
      'critical-low': 'Below range · critical',
      'critical-high': 'Above range · critical',
    },
    notCompared: 'Not compared',
    sourceLabel: 'Read from',
    viewInReport: 'View in report',
    filedYes: 'Filed',
    filedNo: 'Not filed',
    approve: (count, total) =>
      `Approve ${count} of ${total} ${plural(total, 'value', 'values')}`,
    selectedCount: (count, total) =>
      `${count} of ${total} ${plural(total, 'value', 'values')} selected`,
    noneSelected: 'Tick at least one value to approve.',
    emptyValue: (test) => `Enter a value for ${test}, or untick it.`,
    valueRequired: 'Enter a value, or untick it.',
    mismatchTitle: 'This report names a different patient',
    mismatchBody: (reportPatient, chartPatient) => (
      <>
        The report says <b className="font-bold">{reportPatient ?? '—'}</b>;
        this chart is <b className="font-bold">{chartPatient ?? '—'}</b>. Check
        that it belongs to this patient before anything is filed.
      </>
    ),
    mismatchConfirm: (chartPatient) => (
      <>
        I have checked: this report belongs to {chartPatient ?? 'this patient'}
      </>
    ),
    confirmPatientFirst: 'Confirm the patient before approving.',
    approvedNote: (who, count) => (
      <>
        Approved by <b className="font-bold">{who}</b> — {count}{' '}
        {plural(count, 'value', 'values')} filed to the chart, logged to the
        audit trail. Anything left unticked was not filed.
      </>
    ),
    withdrawn: 'Approval withdrawn. Nothing from this report is in the chart.',
    rejectedNote: (who, reason) => (
      <>
        Rejected by <b className="font-bold">{who}</b> — {reason}
      </>
    ),
    discarded:
      'Extraction discarded. Nothing from this report was written to the chart.',
    reject: 'Reject',
    undo: 'Undo',
    rejectReason: 'Why are you rejecting this extraction?',
    confirmReject: 'Reject extraction',
    cancel: 'Cancel',
    reasonRequired: 'Give a reason to reject this extraction.',
    actions: 'Review extracted values',
    justNow: 'just now',
    you: 'You',
  };

// A plain decimal, with Indian or Western thousands separators ("1,80,000"). Anything else ("1O4",
// "<5", "Positive") is not a number, and is not compared: the review never guesses.
function parseValue(value: string): number | null {
  const text = value.trim().replace(/,/g, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) return null;
  return Number(text);
}

// Where a value falls against the caller's reference range, or null when it cannot be compared (no
// range, no limits, or a value that is not a plain number). The limits themselves are in range.
export function extractedValueStatus(
  value: string,
  range: ExtractedReferenceRange | undefined,
): ExtractedValueStatus | null {
  if (!range) return null;
  const { low, high, criticalLow, criticalHigh } = range;
  if ([low, high, criticalLow, criticalHigh].every((l) => l === undefined)) {
    return null;
  }
  const n = parseValue(value);
  if (n === null) return null;
  if (criticalLow !== undefined && n < criticalLow) return 'critical-low';
  if (criticalHigh !== undefined && n > criticalHigh) return 'critical-high';
  if (low !== undefined && n < low) return 'low';
  if (high !== undefined && n > high) return 'high';
  return 'normal';
}

// Whether a value arrives ticked: not when the reader was unsure, and not when the chart already has
// it, so neither is filed by a single press of Approve.
function arrivesTicked(value: ExtractedValue): boolean {
  return value.confidence !== 'low' && !value.filed;
}

// The ids that arrive ticked, for a caller that controls the selection.
export function initialExtractedSelection(
  values: readonly ExtractedValue[],
): string[] {
  return values.filter(arrivesTicked).map((value) => value.id);
}

export function rangeText(range: ExtractedReferenceRange | undefined): string {
  if (!range) return '—';
  if (range.text !== undefined) return range.text;
  const { low, high } = range;
  if (low !== undefined && high !== undefined) return `${low} – ${high}`;
  if (low !== undefined) return `≥ ${low}`;
  if (high !== undefined) return `≤ ${high}`;
  return '—';
}
