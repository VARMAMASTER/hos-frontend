import {
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useControllableState } from '../../primitives/use-controllable-state';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { AiPanel } from '../ai-panel/ai-panel';
import {
  AiProgressSteps,
  type AiProgressStep,
} from '../ai-progress-steps/ai-progress-steps';
import { ApprovalBar } from '../approval-bar/approval-bar';
import { Banner } from '../banner/banner';
import { Button } from '../button/button';
import { Checkbox } from '../checkbox/checkbox';
import { Chip, type ChipTone } from '../chip/chip';
import { SkeletonBar } from '../../primitives/skeleton-bar';
import { Table, TableBody, TableHead, TableHeaderCell } from '../table/table';
import { TextField } from '../text-field/text-field';
import { ExtractedRow, icons } from './extracted-row';
import {
  EXTRACTED_VALUES_REVIEW_LABELS,
  extractedValueStatus,
  initialExtractedSelection,
  type ApprovedExtractedValue,
  type ExtractedValue,
  type ExtractedValuesReviewLabels,
  type ExtractionApproval,
  type ExtractionState,
} from './extracted-values-review-model';

// The model (types, labels, the status of a value) is extracted-values-review-model.ts and one row
// is extracted-row.tsx; both are part of this component's public surface through this file.
export * from './extracted-values-review-model';

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
