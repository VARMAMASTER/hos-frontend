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
import { AiPanel } from '../ai-panel/ai-panel';
import { ApprovalBar } from '../approval-bar/approval-bar';
import { Button } from '../button/button';
import { Chip, type ChipTone } from '../chip/chip';
import { TextField } from '../text-field/text-field';

// The lifecycle of an AI draft. Nothing a machine wrote is final until a person approves it.
// - generating: still being written ("Working…"); Approve is unavailable.
// - pending: a draft awaiting approval. undone is pending again after an approval was withdrawn.
// - approved: who approved it and when, logged, with Undo.
// - rejected: with the reason the person gave.
// - blocked: it cannot be approved yet, and says why ("No plan dictated yet").
// - for-signature: only the named signatory may sign it.
// - witness: a first signature is in; a second person completes it.
// - gated: above someone's authority ("Needs pharmacist sign-off"); only the authority approves.
export type AiDraftStatus =
  | 'generating'
  | 'pending'
  | 'approved'
  | 'undone'
  | 'rejected'
  | 'blocked'
  | 'for-signature'
  | 'witness'
  | 'gated';

export const AI_DRAFT_STATUSES: readonly AiDraftStatus[] = [
  'generating',
  'pending',
  'approved',
  'undone',
  'rejected',
  'blocked',
  'for-signature',
  'witness',
  'gated',
];

export interface AiDraftApproval {
  // Who the approval is recorded against: the signatory when there is one, else the approver.
  approver: string;
  at: Date;
}

// Every fixed word, so a hospital can show the block in Telugu, Hindi or English.
export interface AiDraftBlockLabels {
  badge: string;
  badgeApproved: string;
  generating: string;
  pending: string;
  forSignature: (signatory?: string) => string;
  witness: string;
  gated: string;
  blocked: string;
  rejected: string;
  approved: (verb: string, who: string, time?: string) => string;
  approvedNote: (verb: string, who: string) => ReactNode;
  rejectedNote: (who: string, reason: string) => ReactNode;
  justNow: string;
  withdrawn: string;
  signatoryOnly: (signatory?: string) => string;
  witnessNote: (first: string) => string;
  witnessSelf: string;
  gateWaiting: (signatory?: string) => string;
  edit: string;
  reject: string;
  undo: string;
  rejectReason: string;
  confirmReject: string;
  cancel: string;
  reasonRequired: string;
  progress: string;
  actions: string;
  you: string;
}

export const AI_DRAFT_BLOCK_LABELS: Readonly<AiDraftBlockLabels> = {
  badge: 'AI draft',
  badgeApproved: 'AI-assisted',
  generating: 'Working…',
  pending: 'Draft — awaiting approval',
  forSignature: (signatory) =>
    signatory ? `For ${signatory}'s signature` : 'Awaiting signature',
  witness: 'Awaiting a second signature',
  gated: 'Needs sign-off',
  blocked: 'Blocked',
  rejected: 'Rejected',
  approved: (verb, who, time) =>
    time ? `${verb} · ${who} · ${time}` : `${verb} · ${who}`,
  approvedNote: (verb, who) => (
    <>
      {verb} by <b className="font-bold">{who}</b> — logged to the audit trail.
    </>
  ),
  rejectedNote: (who, reason) => (
    <>
      Rejected by <b className="font-bold">{who}</b> — {reason}
    </>
  ),
  justNow: 'just now',
  withdrawn:
    'Approval withdrawn. The draft is pending again; nothing was sent.',
  signatoryOnly: (signatory) =>
    signatory
      ? `Only ${signatory} can sign this.`
      : 'Only the named signatory can sign this.',
  witnessNote: (first) =>
    `Signed by ${first}. A second signature completes it.`,
  witnessSelf: 'You signed first. A second person must witness it.',
  gateWaiting: (signatory) =>
    signatory
      ? `Waiting for ${signatory}. Nothing is applied until then.`
      : 'Waiting for someone with the authority. Nothing is applied until then.',
  edit: 'Edit',
  reject: 'Reject',
  undo: 'Undo',
  rejectReason: 'Why are you rejecting this draft?',
  confirmReject: 'Reject draft',
  cancel: 'Cancel',
  reasonRequired: 'Give a reason to reject this draft.',
  progress: 'Drafting progress',
  actions: 'Review AI output',
  you: 'You',
};

// The English past tense of the usual verbs. A caller using another verb (or language) passes
// approvedVerb.
const PAST_TENSE: Readonly<Record<string, string>> = {
  Approve: 'Approved',
  Sign: 'Signed',
  'Sign off': 'Signed off',
  Countersign: 'Countersigned',
  Send: 'Sent',
  Witness: 'Witnessed',
  Authorise: 'Authorised',
  Authorize: 'Authorized',
  Publish: 'Published',
  Validate: 'Validated',
};

const DEFAULT_VERBS: Partial<Record<AiDraftStatus, string>> = {
  'for-signature': 'Sign',
  witness: 'Witness',
  gated: 'Authorise',
};

export interface AiDraftBlockProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  title: ReactNode;
  // The draft itself.
  children: ReactNode;
  status?: AiDraftStatus;
  defaultStatus?: AiDraftStatus;
  onStatusChange?: (status: AiDraftStatus) => void;
  onApprove?: (approval: AiDraftApproval) => void;
  // The reason the person typed, trimmed; a rejection always has one.
  onReject?: (reason: string) => void;
  onUndo?: () => void;
  // Edit appears only with a handler.
  onEdit?: () => void;
  // The person at the screen.
  approverName?: string;
  // The person the approval is recorded against, when that is not the person at the screen: the
  // consultant whose discharge summary a nurse is preparing, the witness of a wastage entry, the
  // owner above a counter's authority.
  signatory?: string;
  // Whether the person at the screen may approve. By default: anyone may approve a pending draft;
  // only the signatory signs for-signature and gated drafts; the first signatory cannot witness.
  canApprove?: boolean;
  // The approve button's word: "Approve" (or "Sign", "Witness", "Authorise" by status).
  verb?: string;
  // Its past tense on the record, for a verb outside the usual few: "Countersigned".
  approvedVerb?: string;
  // A stored approval: who and when. A Date is shown through formatTime.
  approvedBy?: string;
  approvedAt?: string | Date;
  // Time formatting is the caller's. Without it, an approval made here reads "just now" and a
  // stored Date is the locale's short time.
  formatTime?: (at: Date) => string;
  // A stored rejection.
  rejectionReason?: string;
  rejectedBy?: string;
  // Why a blocked draft cannot be approved yet.
  blockedReason?: ReactNode;
  // The gate's chip ("Needs pharmacist sign-off") and its explanation.
  gateLabel?: string;
  gateReason?: ReactNode;
  // Witness: who signed first.
  firstSignature?: string;
  // Generating: how far along, 0 to 100. Leave it out when unknown.
  progress?: number;
  // Below the body: an AiSourceLine, a WhyTrail.
  source?: ReactNode;
  // More header chips, after the status: an AiClassChip ("Tier: green · drafted from the record").
  badges?: ReactNode;
  // More controls for the actions row ("Dictate the plan", "Open the theatre record").
  actions?: ReactNode;
  // A decision is being submitted.
  busy?: boolean;
  undoable?: boolean;
  rejectable?: boolean;
  headingLevel?: 2 | 3 | 4;
  spark?: ReactNode;
  // The language of the draft (te, hi, en), set on the content only.
  contentLang?: string;
  labels?: Partial<AiDraftBlockLabels>;
}

interface ApprovalRecord {
  by: string;
  at: Date;
  verb: string;
}

interface RejectionRecord {
  by: string;
  reason: string;
}

// Where focus goes after a decision: the control that undoes it, or the one that makes it again.
type FocusTarget = 'approve' | 'reject' | 'undo' | 'reason';

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
  gate: (
    <svg {...svg}>
      <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
    </svg>
  ),
  blocked: (
    <svg {...svg}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M5 15 15 5" />
    </svg>
  ),
} as const;

function pastTense(verb: string): string {
  return PAST_TENSE[verb] ?? 'Approved';
}

function shortTime(at: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(at);
}

function canApproveByDefault(
  status: AiDraftStatus,
  approverName: string | undefined,
  signatory: string | undefined,
  firstSignature: string | undefined,
): boolean {
  if (status === 'for-signature' || status === 'gated') {
    return signatory !== undefined && approverName === signatory;
  }
  if (status === 'witness') {
    return !(firstSignature !== undefined && approverName === firstSignature);
  }
  return true;
}

// The prototype's AI draft (hos.css .ai-block, hos-sim.js resolveApproval): an AiPanel whose
// header carries the lifecycle chip and whose footer is an ApprovalBar. Approving resolves the draft
// in place: the chip becomes "✓ Approved · <who> · <when>", the block settles green, and the actions
// become the audit record with Undo, because a human in the loop must be able to take it back.
export function AiDraftBlock({
  title,
  children,
  status: statusProp,
  defaultStatus = 'pending',
  onStatusChange,
  onApprove,
  onReject,
  onUndo,
  onEdit,
  approverName,
  signatory,
  canApprove: canApproveProp,
  verb: verbProp,
  approvedVerb,
  approvedBy,
  approvedAt,
  formatTime,
  rejectionReason,
  rejectedBy,
  blockedReason,
  gateLabel,
  gateReason,
  firstSignature,
  progress,
  source,
  badges,
  actions,
  busy = false,
  undoable = true,
  rejectable = true,
  headingLevel = 3,
  spark,
  contentLang,
  labels: labelsProp,
  ...rest
}: AiDraftBlockProps) {
  const words: AiDraftBlockLabels = { ...AI_DRAFT_BLOCK_LABELS, ...labelsProp };
  const ids = useId();
  const titleId = `${ids}-title`;
  const [status, setStatus] = useControllableState({
    value: statusProp,
    defaultValue: defaultStatus,
    onChange: onStatusChange,
  });
  const [record, setRecord] = useState<ApprovalRecord | null>(null);
  const [rejection, setRejection] = useState<RejectionRecord | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonMissing, setReasonMissing] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLInputElement>(null);
  const focusNext = useRef<FocusTarget | null>(null);

  // After a decision, focus follows it: to Undo once approved or rejected, back to Approve after
  // Undo, into the reason field when rejecting. In a controlled block the target may only appear
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

  const approved = status === 'approved';
  const verb = verbProp ?? DEFAULT_VERBS[status] ?? 'Approve';
  const canApprove =
    canApproveProp ??
    canApproveByDefault(status, approverName, signatory, firstSignature);
  const approver = signatory ?? approverName ?? words.you;
  const approvable =
    canApprove &&
    !rejecting &&
    (status === 'pending' ||
      status === 'undone' ||
      status === 'for-signature' ||
      status === 'witness' ||
      status === 'gated');
  const showBar = approved || approvable || status === 'generating';

  function approve() {
    if (!approvable) return;
    const at = new Date();
    const past = approvedVerb ?? pastTense(verb);
    setRecord({ by: approver, at, verb: past });
    focusNext.current = 'undo';
    setStatus('approved');
    onApprove?.({ approver, at });
  }

  function undo() {
    const from = status;
    setRecord(null);
    setRejection(null);
    focusNext.current = 'approve';
    setStatus(from === 'rejected' ? 'pending' : 'undone');
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
    focusNext.current = 'undo';
    setStatus('rejected');
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
  const who = approvedBy || record?.by || approver;
  const pastVerb = record?.verb ?? approvedVerb ?? pastTense(verb);
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
  const rejectionWho = rejectedBy ?? rejection?.by ?? approverName ?? words.you;
  const rejectionText = rejectionReason ?? rejection?.reason ?? '';

  const chips: Record<
    AiDraftStatus,
    { tone: ChipTone; icon: ReactNode; text: string }
  > = {
    generating: { tone: 'ai', icon: icons.working, text: words.generating },
    pending: { tone: 'ai', icon: icons.waiting, text: words.pending },
    undone: { tone: 'ai', icon: icons.waiting, text: words.pending },
    'for-signature': {
      tone: 'ai',
      icon: icons.waiting,
      text: words.forSignature(signatory),
    },
    witness: { tone: 'ai', icon: icons.waiting, text: words.witness },
    gated: { tone: 'warn', icon: icons.gate, text: gateLabel ?? words.gated },
    blocked: { tone: 'warn', icon: icons.blocked, text: words.blocked },
    rejected: { tone: 'crit', icon: '✕', text: words.rejected },
    approved: {
      tone: 'good',
      icon: '✓',
      text: words.approved(pastVerb, who, time),
    },
  };
  const chip = chips[status];

  // A line above the actions that says what is going on when the buttons alone cannot.
  let notice: ReactNode = null;
  if (status === 'undone') notice = words.withdrawn;
  else if (status === 'blocked') notice = blockedReason;
  else if (status === 'gated') {
    notice = (
      <>
        {gateReason}
        {gateReason && !canApprove ? ' ' : null}
        {canApprove ? null : words.gateWaiting(signatory)}
      </>
    );
  } else if (status === 'for-signature' && !canApprove) {
    notice = words.signatoryOnly(signatory);
  } else if (status === 'witness') {
    notice = (
      <>
        {firstSignature ? words.witnessNote(firstSignature) : null}
        {firstSignature && !canApprove ? ' ' : null}
        {canApprove ? null : words.witnessSelf}
      </>
    );
  }

  const progressValue =
    progress === undefined ? undefined : Math.min(100, Math.max(0, progress));

  return (
    <AiPanel
      title={title}
      titleId={titleId}
      headingLevel={headingLevel}
      state={approved ? 'approved' : 'draft'}
      badgeLabel={approved ? words.badgeApproved : words.badge}
      spark={spark}
      data-status={status}
      aria-busy={status === 'generating' || busy || undefined}
      status={
        // The one live region of the block: always mounted, its words change with the status, so
        // every change is announced politely. Badges sit after it, outside it.
        <>
          <Chip role="status" tone={chip.tone} icon={chip.icon}>
            {chip.text}
          </Chip>
          {badges}
        </>
      }
      footer={
        <div ref={footerRef} className="flex flex-col gap-s3">
          {notice ? <p className="text-body-sm text-ink-2">{notice}</p> : null}
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
          ) : null}
          {showBar ? (
            <ApprovalBar
              aria-label={words.actions}
              labelledBy={titleId}
              announce={false}
              busy={busy}
              approveLabel={verb}
              editLabel={words.edit}
              rejectLabel={words.reject}
              undoLabel={words.undo}
              approveDisabled={status === 'generating'}
              onApprove={approve}
              onEdit={onEdit}
              onReject={
                rejectable && status !== 'generating'
                  ? startRejecting
                  : undefined
              }
              approvedBy={approved ? who : undefined}
              approvedNote={words.approvedNote(pastVerb, who)}
              onUndo={undoable ? undo : undefined}
              actions={actions}
            />
          ) : status === 'rejected' ? (
            <div className="flex flex-wrap items-center gap-s3">
              <p className="text-body-sm text-crit-deep">
                {words.rejectedNote(rejectionWho, rejectionText)}
              </p>
              {undoable ? (
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
              ) : null}
              {actions}
            </div>
          ) : !rejecting && actions ? (
            <div className="flex flex-wrap items-center gap-s3">{actions}</div>
          ) : null}
        </div>
      }
      {...rest}
    >
      <div lang={contentLang}>{children}</div>
      {status === 'generating' && progressValue !== undefined ? (
        <div
          role="progressbar"
          aria-label={words.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressValue}
          className="mt-s4 h-s1 w-full overflow-hidden rounded-full bg-ai-soft"
        >
          <div
            className="h-full rounded-full bg-ai motion-safe:transition-[width] motion-safe:duration-base motion-safe:ease-standard"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      ) : null}
      {source ? <div className="mt-s4">{source}</div> : null}
    </AiPanel>
  );
}
