import {
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { useControllableState } from '../../primitives/use-controllable-state';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { AiPanel } from '../ai-panel/ai-panel';
import {
  AiProgressSteps,
  type AiProgressStep,
} from '../ai-progress-steps/ai-progress-steps';
import {
  AiSourceLine,
  type AiConfidence,
} from '../ai-source-line/ai-source-line';
import { ApprovalBar } from '../approval-bar/approval-bar';
import { Banner } from '../banner/banner';
import { Button } from '../button/button';
import { Checkbox } from '../checkbox/checkbox';
import { CheckboxBox } from '../checkbox/checkbox-box';
import { Chip, type ChipTone } from '../chip/chip';
import { SkeletonBar } from '../data-table/data-table-parts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../table/table';
import { TextField } from '../text-field/text-field';

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

function rangeText(range: ExtractedReferenceRange | undefined): string {
  if (!range) return '—';
  if (range.text !== undefined) return range.text;
  const { low, high } = range;
  if (low !== undefined && high !== undefined) return `${low} – ${high}`;
  if (low !== undefined) return `≥ ${low}`;
  if (high !== undefined) return `≤ ${high}`;
  return '—';
}

const svg = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

// A different shape per status, so the status survives greyscale and colour blindness: a tick, an
// arrow down, an arrow up, and a double arrow for a critical value.
const statusIcons: Record<ExtractedValueStatus, ReactNode> = {
  normal: (
    <svg {...svg}>
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  ),
  low: (
    <svg {...svg}>
      <path d="M10 4v12M5 11l5 5 5-5" />
    </svg>
  ),
  high: (
    <svg {...svg}>
      <path d="M10 16V4M5 9l5-5 5 5" />
    </svg>
  ),
  'critical-low': (
    <svg {...svg}>
      <path d="M5 4l5 5 5-5M5 11l5 5 5-5" />
    </svg>
  ),
  'critical-high': (
    <svg {...svg}>
      <path d="M5 16l5-5 5 5M5 9l5-5 5 5" />
    </svg>
  ),
};

const statusTones: Record<ExtractedValueStatus, ChipTone> = {
  normal: 'good',
  low: 'warn',
  high: 'warn',
  'critical-low': 'crit',
  'critical-high': 'crit',
};

const icons = {
  // Spins only when motion is welcome; a still ring otherwise, with the words doing the work.
  working: (
    <svg {...svg} className="motion-safe:animate-spin">
      <circle cx="10" cy="10" r="7" opacity="0.35" />
      <path d="M17 10a7 7 0 0 0-7-7" />
    </svg>
  ),
  waiting: (
    <svg {...svg}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6v4.25l2.75 1.75" />
    </svg>
  ),
  failed: (
    <svg {...svg}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6v4.5M10 13.5h.01" />
    </svg>
  ),
  paper: (
    <svg {...svg}>
      <path d="M5.5 2.75h6l3.5 3.5v11h-9.5z" />
      <path d="M11.5 2.75v3.5H15M8 10.5h5M8 13.5h5" />
    </svg>
  ),
  edited: (
    <svg {...svg}>
      <path d="M13.5 3.5l3 3-9 9H4.5v-3z" />
    </svg>
  ),
  filed: (
    <svg {...svg}>
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  ),
  notFiled: (
    <svg {...svg}>
      <path d="M5.5 10h9" />
    </svg>
  ),
} as const;

export interface ExtractedValuesReviewProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  // The report's title: "Kidney function test".
  title: ReactNode;
  // The source, as printed on the report.
  lab?: ReactNode;
  reportDate?: ReactNode;
  // The patient the report names.
  patient?: ReactNode;
  values: readonly ExtractedValue[];
  state?: ExtractionState;
  defaultState?: ExtractionState;
  onStateChange?: (state: ExtractionState) => void;
  // The ticked ids. Uncontrolled, every value arrives ticked unless it is low-confidence or already
  // filed (initialExtractedSelection), including values that arrive after the first render.
  selected?: readonly string[];
  defaultSelected?: readonly string[];
  onSelectedChange?: (ids: string[]) => void;
  // The person's corrections, by id.
  edits?: Readonly<Record<string, string>>;
  defaultEdits?: Readonly<Record<string, string>>;
  onEditsChange?: (edits: Record<string, string>) => void;
  // The report names someone other than this chart's patient. Approval waits until the person
  // confirms they have checked.
  patientMismatch?: boolean;
  // The chart's patient, to set beside the name on the report.
  chartPatient?: ReactNode;
  mismatchConfirmed?: boolean;
  defaultMismatchConfirmed?: boolean;
  onMismatchConfirmedChange?: (confirmed: boolean) => void;
  onApprove?: (approval: ExtractionApproval) => void;
  // The reason the person typed, trimmed; a rejection always has one.
  onReject?: (reason: string) => void;
  onUndo?: () => void;
  onRetry?: () => void;
  onEnterManually?: () => void;
  // Shows "View in report" on each row, to open the page at the line it was read from.
  onViewSource?: (value: ExtractedValue) => void;
  // The person at the screen.
  approverName?: string;
  // A stored approval: who and when. A Date is shown through formatTime.
  approvedBy?: string;
  approvedAt?: string | Date;
  formatTime?: (at: Date) => string;
  // A stored rejection.
  rejectedBy?: string;
  rejectionReason?: string;
  // Reading: the steps, and the running one.
  readingSteps?: ReadonlyArray<string | AiProgressStep>;
  readingStep?: number;
  // Error: why the report could not be read.
  errorMessage?: ReactNode;
  // The approval is being submitted.
  busy?: boolean;
  // More controls for the actions row ("Keep as a document only").
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  // The language of the report's content (te, hi, en), set on the content only.
  contentLang?: string;
  labels?: Partial<ExtractedValuesReviewLabels>;
}

interface ApprovalRecord {
  by: string;
  at: Date;
  count: number;
}

interface RejectionRecord {
  by: string;
  reason: string;
}

// Where focus goes after a decision: the control that undoes it, or the one that makes it again.
type FocusTarget = 'approve' | 'reject' | 'undo' | 'reason';

function shortTime(at: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(at);
}

// The prototype's paper-report review (04-patient-record.html, "Reports that arrive on paper"): an
// AI block whose body is the table of values read off the page, one row each, with a tick, the
// editable value and its unit, the reference range, where the value falls, and the line it was read
// from with the reader's confidence. Approving files exactly what is ticked, edits included, under
// the approver's name; it can be undone. A different patient's name on the report holds approval
// until the person confirms they have checked.
export function ExtractedValuesReview({
  title,
  lab,
  reportDate,
  patient,
  values,
  state: stateProp,
  defaultState = 'ready',
  onStateChange,
  selected: selectedProp,
  defaultSelected,
  onSelectedChange,
  edits: editsProp,
  defaultEdits,
  onEditsChange,
  patientMismatch = false,
  chartPatient,
  mismatchConfirmed: mismatchConfirmedProp,
  defaultMismatchConfirmed = false,
  onMismatchConfirmedChange,
  onApprove,
  onReject,
  onUndo,
  onRetry,
  onEnterManually,
  onViewSource,
  approverName,
  approvedBy,
  approvedAt,
  formatTime,
  rejectedBy,
  rejectionReason,
  readingSteps,
  readingStep,
  errorMessage,
  busy = false,
  actions,
  headingLevel = 3,
  contentLang,
  labels: labelsProp,
  ...rest
}: ExtractedValuesReviewProps) {
  const words: ExtractedValuesReviewLabels = {
    ...EXTRACTED_VALUES_REVIEW_LABELS,
    ...labelsProp,
  };
  const ids = useId();
  const titleId = `${ids}-title`;

  const [state, setState] = useControllableState({
    value: stateProp,
    defaultValue: defaultState,
    onChange: onStateChange,
  });
  // null until the person first changes a tick: the arrival rule then applies to every value,
  // including those that arrive after the first render (reading, then ready).
  const [chosen, setChosen] = useControllableState<readonly string[] | null>({
    value: selectedProp,
    defaultValue: defaultSelected ?? null,
    onChange: onSelectedChange
      ? (next) => onSelectedChange(next ? [...next] : [])
      : undefined,
  });
  const [edits, setEdits] = useControllableState<
    Readonly<Record<string, string>>
  >({
    value: editsProp,
    defaultValue: defaultEdits ?? {},
    onChange: onEditsChange ? (next) => onEditsChange({ ...next }) : undefined,
  });
  const [confirmed, setConfirmed] = useControllableState({
    value: mismatchConfirmedProp,
    defaultValue: defaultMismatchConfirmed,
    onChange: onMismatchConfirmedChange,
  });

  const [record, setRecord] = useState<ApprovalRecord | null>(null);
  const [rejection, setRejection] = useState<RejectionRecord | null>(null);
  const [withdrawn, setWithdrawn] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonMissing, setReasonMissing] = useState(false);
  // The polite count, set only when the person changes a tick, so arriving is not announced.
  const [announcement, setAnnouncement] = useState('');
  const footerRef = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLInputElement>(null);
  const focusNext = useRef<FocusTarget | null>(null);

  // After a decision, focus follows it: to Undo once approved or rejected, back to Approve after
  // Undo, into the reason field when rejecting. In a controlled review the target may only appear
  // when the caller commits the change, so this waits for it; it never pulls focus from elsewhere.
  useEffect(() => {
    const target = focusNext.current;
    const footer = footerRef.current;
    if (!target || !footer) return;
    const active = document.activeElement;
    if (active && active !== document.body && !footer.contains(active)) {
      focusNext.current = null;
      return;
    }
    const element = footer.querySelector<HTMLElement>(
      `[data-action="${target}"]`,
    );
    if (element) {
      element.focus();
      focusNext.current = null;
    }
  });

  const tickedIds = new Set(chosen ?? initialExtractedSelection(values));
  const current = (value: ExtractedValue) => edits[value.id] ?? value.value;
  const isEdited = (value: ExtractedValue) =>
    edits[value.id] !== undefined &&
    edits[value.id]?.trim() !== value.value.trim();
  const ticked = values.filter((value) => tickedIds.has(value.id));
  const total = values.length;
  const empty = ticked.filter((value) => current(value).trim() === '');

  const approved = state === 'approved';
  const locked = approved;
  const mismatchHolds = patientMismatch && !confirmed;
  let holdReason: string | null = null;
  if (mismatchHolds) holdReason = words.confirmPatientFirst;
  else if (ticked.length === 0) holdReason = words.noneSelected;
  else if (empty[0]) holdReason = words.emptyValue(empty[0].test);
  const canApprove = state === 'ready' && !rejecting && holdReason === null;

  function setTicked(value: ExtractedValue, on: boolean) {
    const next = values
      .filter((v) => (v.id === value.id ? on : tickedIds.has(v.id)))
      .map((v) => v.id);
    setChosen(next);
    setAnnouncement(words.selectedCount(next.length, total));
  }

  function setValue(value: ExtractedValue, text: string) {
    setEdits({ ...edits, [value.id]: text });
  }

  function approve() {
    if (!canApprove || busy) return;
    const at = new Date();
    const approver = approverName ?? words.you;
    const filed: ApprovedExtractedValue[] = ticked.map((value) => {
      const text = current(value).trim();
      return {
        id: value.id,
        test: value.test,
        value: text,
        unit: value.unit,
        originalValue: value.value,
        edited: isEdited(value),
        status: extractedValueStatus(text, value.range),
      };
    });
    setRecord({ by: approver, at, count: filed.length });
    setWithdrawn(false);
    focusNext.current = 'undo';
    setState('approved');
    onApprove?.({ approver, at, values: filed });
  }

  function undo() {
    setRecord(null);
    setRejection(null);
    setWithdrawn(state === 'approved');
    focusNext.current = 'approve';
    setState('ready');
    onUndo?.();
  }

  function startRejecting() {
    setReason('');
    setReasonMissing(false);
    setRejecting(true);
    focusNext.current = 'reason';
  }

  function cancelRejecting() {
    setRejecting(false);
    setReasonMissing(false);
    focusNext.current = 'reject';
  }

  function confirmRejecting() {
    const text = reason.trim();
    if (!text) {
      setReasonMissing(true);
      reasonRef.current?.focus();
      return;
    }
    setRejection({ by: approverName ?? words.you, reason: text });
    setRejecting(false);
    setWithdrawn(false);
    focusNext.current = 'undo';
    setState('rejected');
    onReject?.(text);
  }

  function onReasonKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirmRejecting();
    } else if (event.key === 'Escape') {
      // Only the reason form closes; an enclosing dialog stays open.
      event.preventDefault();
      event.stopPropagation();
      cancelRejecting();
    }
  }

  // The approval as recorded: a stored one from the caller, else the one made here.
  const who = approvedBy || record?.by || approverName || words.you;
  const time =
    typeof approvedAt === 'string'
      ? approvedAt
      : approvedAt instanceof Date
        ? (formatTime ?? shortTime)(approvedAt)
        : record
          ? formatTime
            ? formatTime(record.at)
            : words.justNow
          : undefined;
  const filedCount = record?.count ?? ticked.length;
  const rejectionWho = rejectedBy ?? rejection?.by ?? approverName ?? words.you;
  const rejectionText = rejectionReason ?? rejection?.reason ?? '';

  const chips: Record<
    ExtractionState,
    { tone: ChipTone; icon: ReactNode; text: string }
  > = {
    reading: { tone: 'ai', icon: icons.working, text: words.reading },
    ready: { tone: 'ai', icon: icons.waiting, text: words.ready },
    approved: { tone: 'good', icon: '✓', text: words.approved(who, time) },
    rejected: { tone: 'crit', icon: '✕', text: words.rejected },
    error: { tone: 'crit', icon: icons.failed, text: words.error },
  };
  const chip = chips[state];

  const meta: Array<[string, ReactNode]> = [];
  if (lab !== undefined) meta.push([words.lab, lab]);
  if (reportDate !== undefined) meta.push([words.reportDate, reportDate]);
  if (patient !== undefined) meta.push([words.patient, patient]);

  let body: ReactNode;
  if (state === 'reading') {
    body = (
      <div className="flex flex-col gap-s5">
        <AiProgressSteps
          steps={readingSteps ?? words.readingSteps}
          currentIndex={readingStep ?? 0}
          label={words.readingLabel}
          showLabel={false}
          lang={contentLang}
        />
        <div
          data-slot="skeleton"
          aria-hidden="true"
          className="flex flex-col gap-s5 rounded-card border border-border bg-surface p-card"
        >
          {[0, 1, 2, 3].map((line) => (
            <div key={line} className="grid grid-cols-6 items-center gap-s6">
              {[0, 1, 2, 3, 4, 5].map((cell) => (
                <SkeletonBar key={cell} index={line + cell} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  } else if (state === 'error') {
    body = (
      <p className="text-control text-ink-2">
        {errorMessage ?? words.errorFallback}
      </p>
    );
  } else if (state === 'rejected') {
    body = <p className="text-control text-ink-2">{words.discarded}</p>;
  } else {
    body = (
      <div className="flex flex-col gap-s5">
        <p className="text-label text-ink-2">
          {approved ? words.introApproved : words.intro}
        </p>
        {patientMismatch ? (
          // The confirmation sits under the banner, on the block's own wash, where its edge and
          // label are proven; the banner says what is wrong.
          <div className="flex flex-col">
            <Banner tone="warn" title={words.mismatchTitle}>
              {words.mismatchBody(patient, chartPatient)}
            </Banner>
            {locked ? null : (
              <Checkbox
                label={words.mismatchConfirm(chartPatient)}
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
            )}
          </div>
        ) : null}
        <Table caption={words.caption} density="compact">
          <TableHead>
            <tr>
              <TableHeaderCell stickyStart className="left-0 w-s10">
                {words.columns.include}
              </TableHeaderCell>
              <TableHeaderCell>{words.columns.test}</TableHeaderCell>
              <TableHeaderCell>{words.columns.value}</TableHeaderCell>
              <TableHeaderCell>{words.columns.range}</TableHeaderCell>
              <TableHeaderCell>{words.columns.status}</TableHeaderCell>
              <TableHeaderCell>{words.columns.source}</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {values.map((value, index) => (
              <ExtractedRow
                key={value.id}
                rowId={`${ids}-row-${index}`}
                value={value}
                text={current(value)}
                ticked={tickedIds.has(value.id)}
                edited={isEdited(value)}
                locked={locked}
                onTick={(on) => setTicked(value, on)}
                onText={(text) => setValue(value, text)}
                onViewSource={onViewSource}
                lang={value.lang ?? contentLang}
                words={words}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  let footer: ReactNode = null;
  if (state === 'ready') {
    footer = (
      <>
        {withdrawn ? (
          <p className="text-body-sm text-ink-2">{words.withdrawn}</p>
        ) : null}
        {holdReason && !rejecting ? (
          <p className="text-body-sm text-ink-2">{holdReason}</p>
        ) : null}
        {rejecting ? (
          <div className="flex flex-col gap-s3">
            <TextField
              ref={reasonRef}
              data-action="reason"
              label={words.rejectReason}
              required
              value={reason}
              error={reasonMissing ? words.reasonRequired : undefined}
              onChange={(event) => {
                setReason(event.target.value);
                if (event.target.value.trim()) setReasonMissing(false);
              }}
              onKeyDown={onReasonKeyDown}
              className="max-w-md"
            />
            <div className="flex flex-wrap items-center gap-s3">
              <Button
                id={`${ids}-confirm-reject`}
                variant="danger"
                size="sm"
                data-action="confirm-reject"
                aria-labelledby={`${ids}-confirm-reject ${titleId}`}
                onClick={confirmRejecting}
              >
                {words.confirmReject}
              </Button>
              <Button
                id={`${ids}-cancel-reject`}
                variant="ghost"
                size="sm"
                data-action="cancel-reject"
                aria-labelledby={`${ids}-cancel-reject ${titleId}`}
                onClick={cancelRejecting}
              >
                {words.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <ApprovalBar
            aria-label={words.actions}
            labelledBy={titleId}
            announce={false}
            busy={busy}
            approveLabel={words.approve(ticked.length, total)}
            rejectLabel={words.reject}
            undoLabel={words.undo}
            approveDisabled={!canApprove}
            onApprove={approve}
            onReject={startRejecting}
            actions={actions}
          />
        )}
      </>
    );
  } else if (state === 'approved') {
    footer = (
      <ApprovalBar
        aria-label={words.actions}
        labelledBy={titleId}
        announce={false}
        busy={busy}
        approveLabel={words.approve(ticked.length, total)}
        undoLabel={words.undo}
        onApprove={approve}
        approvedBy={who}
        approvedNote={words.approvedNote(who, filedCount)}
        onUndo={undo}
        actions={actions}
      />
    );
  } else if (state === 'rejected') {
    footer = (
      <div className="flex flex-wrap items-center gap-s3">
        <p className="text-body-sm text-crit-deep">
          {words.rejectedNote(rejectionWho, rejectionText)}
        </p>
        <Button
          id={`${ids}-undo-rejection`}
          variant="ghost"
          size="sm"
          data-action="undo"
          aria-labelledby={`${ids}-undo-rejection ${titleId}`}
          onClick={undo}
        >
          {words.undo}
        </Button>
        {actions}
      </div>
    );
  } else if (state === 'error' && (onRetry || onEnterManually)) {
    footer = (
      <div className="flex flex-wrap items-center gap-s3">
        {onRetry ? (
          <Button
            id={`${ids}-retry`}
            variant="outline"
            size="sm"
            aria-labelledby={`${ids}-retry ${titleId}`}
            onClick={() => onRetry()}
          >
            {words.retry}
          </Button>
        ) : null}
        {onEnterManually ? (
          <Button
            id={`${ids}-manual`}
            variant="ghost"
            size="sm"
            aria-labelledby={`${ids}-manual ${titleId}`}
            onClick={() => onEnterManually()}
          >
            {words.enterManually}
          </Button>
        ) : null}
        {actions}
      </div>
    );
  }

  return (
    <AiPanel
      title={title}
      titleId={titleId}
      headingLevel={headingLevel}
      state={approved ? 'approved' : 'draft'}
      badgeLabel={approved ? words.badgeApproved : words.badge}
      data-extraction={state}
      aria-busy={state === 'reading' || busy || undefined}
      status={
        // The one lifecycle live region: always mounted, its words change with the state, so every
        // change is announced politely. The paper-report chip sits after it, outside it.
        <>
          <Chip
            role="status"
            data-slot="lifecycle"
            tone={chip.tone}
            icon={chip.icon}
          >
            {chip.text}
          </Chip>
          <Chip tone="neutral" icon={icons.paper}>
            {words.paperReport}
          </Chip>
        </>
      }
      footer={
        <div ref={footerRef} className="flex flex-col gap-s3">
          {footer}
        </div>
      }
      {...rest}
    >
      {meta.length > 0 ? (
        <dl className="mb-s5 flex flex-wrap gap-x-s6 gap-y-s1 text-label">
          {meta.map(([term, detail]) => (
            <div key={term} className="flex gap-s2">
              <dt className="text-ink-2">{term}</dt>
              <dd className="font-semibold text-ink" lang={contentLang}>
                {detail}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {body}
      <VisuallyHidden role="status" data-slot="selection-status">
        {announcement}
      </VisuallyHidden>
    </AiPanel>
  );
}

interface ExtractedRowProps {
  rowId: string;
  value: ExtractedValue;
  text: string;
  ticked: boolean;
  edited: boolean;
  locked: boolean;
  onTick: (on: boolean) => void;
  onText: (text: string) => void;
  onViewSource?: (value: ExtractedValue) => void;
  lang?: string;
  words: ExtractedValuesReviewLabels;
}

const sourceButton = cx(
  'inline-flex min-h-(--nova-touch-sm) cursor-pointer items-center rounded-control text-caption font-semibold text-ai-deep underline underline-offset-tight',
  focusRing,
);

// The prototype's .ext-val: a small mono input, 12px at 600, padded 4px by 8px.
const valueInput = cx(
  'nova-field w-(--nova-extracted-value-w) rounded-control px-s3 py-s1 font-mono text-label font-semibold text-ink tabular-nums',
  focusRing,
);

function ExtractedRow({
  rowId,
  value,
  text,
  ticked,
  edited,
  locked,
  onTick,
  onText,
  onViewSource,
  lang,
  words,
}: ExtractedRowProps) {
  const nameId = `${rowId}-name`;
  const unitId = `${rowId}-unit`;
  const readId = `${rowId}-read`;
  const errorId = `${rowId}-error`;
  const viewId = `${rowId}-view`;
  const status = extractedValueStatus(text, value.range);
  const missing = ticked && !locked && text.trim() === '';
  const describedBy = cx(
    value.unit && unitId,
    edited && readId,
    missing && errorId,
  );

  return (
    <TableRow
      data-included={ticked ? 'true' : 'false'}
      data-confidence={value.confidence}
      className="align-top"
    >
      <TableCell stickyStart className="left-0 w-s10">
        {locked ? (
          <span
            className={cx(
              'inline-flex items-center gap-s1 whitespace-nowrap text-label font-semibold [&_svg]:size-icon-xs',
              ticked ? 'text-good-deep' : 'text-ink-2',
            )}
          >
            {ticked ? icons.filed : icons.notFiled}
            {ticked ? words.filedYes : words.filedNo}
          </span>
        ) : (
          // The whole cell is the tick's target, 44px square, so a gloved or hurried press lands.
          <label className="-mx-s3 -my-s2 flex min-h-touch min-w-touch cursor-pointer items-center justify-center">
            <CheckboxBox
              checked={ticked}
              aria-label={words.include(value.test)}
              onChange={(event) => onTick(event.target.checked)}
            />
          </label>
        )}
      </TableCell>
      <TableHeaderCell scope="row" className="align-top">
        <span id={nameId} lang={lang}>
          {value.test}
        </span>
        {value.filed ? (
          <span className="mt-s1 flex">
            <Chip tone="neutral">{words.filed(value.filedSource)}</Chip>
          </span>
        ) : null}
      </TableHeaderCell>
      <TableCell>
        {/* The unit wraps under the value when the table is squeezed, so the table's narrowest
            width is the input's, not the input's and a long unit's. */}
        <div className="flex flex-wrap items-center gap-x-s2 gap-y-s1">
          {locked ? (
            <span
              className="font-mono text-label font-semibold tabular-nums"
              lang={lang}
            >
              {text}
            </span>
          ) : (
            <input
              type="text"
              inputMode="decimal"
              className={valueInput}
              value={text}
              lang={lang}
              aria-label={words.valueLabel(value.test)}
              aria-describedby={describedBy || undefined}
              aria-invalid={missing || undefined}
              data-invalid={missing ? 'true' : undefined}
              onChange={(event) => onText(event.target.value)}
            />
          )}
          {value.unit ? (
            <span id={unitId} className="font-mono text-label text-ink-2">
              {value.unit}
            </span>
          ) : null}
        </div>
        {edited ? (
          <div className="mt-s1 flex flex-wrap items-center gap-s2">
            <Chip tone="info" icon={icons.edited}>
              {words.edited}
            </Chip>
            <span
              id={readId}
              className="font-mono text-meta text-ink-2"
              lang={lang}
            >
              {words.aiRead(value.value)}
            </span>
          </div>
        ) : null}
        {missing ? (
          <p
            id={errorId}
            className="mt-s1 text-caption font-semibold text-crit-deep"
          >
            {words.valueRequired}
          </p>
        ) : null}
      </TableCell>
      <TableCell mono className="whitespace-nowrap text-label">
        {rangeText(value.range)}
      </TableCell>
      <TableCell>
        {status ? (
          <Chip tone={statusTones[status]} icon={statusIcons[status]}>
            {words.status[status]}
          </Chip>
        ) : (
          <span className="text-label text-ink-2">{words.notCompared}</span>
        )}
      </TableCell>
      <TableCell className="min-w-column">
        <AiSourceLine
          label={words.sourceLabel}
          confidence={value.confidence}
          contentLang={lang}
        >
          {value.source}
        </AiSourceLine>
        {onViewSource ? (
          <button
            type="button"
            id={viewId}
            aria-labelledby={`${viewId} ${nameId}`}
            className={sourceButton}
            onClick={() => onViewSource(value)}
          >
            {words.viewInReport}
          </button>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
