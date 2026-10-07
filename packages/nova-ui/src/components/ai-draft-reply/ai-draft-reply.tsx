import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useControllableState } from '../../primitives/use-controllable-state';
import {
  AiDraftBlock,
  AI_DRAFT_BLOCK_LABELS,
  type AiDraftApproval,
  type AiDraftBlockLabels,
  type AiDraftBlockProps,
  type AiDraftStatus,
} from '../ai-draft-block/ai-draft-block';
import { Button } from '../button/button';
import { Chip } from '../chip/chip';
import { Dialog } from '../dialog/dialog';
import { Textarea } from '../textarea/textarea';

// The channel an outbound message goes by.
export type MessageChannel = 'whatsapp' | 'sms' | 'email';

export const MESSAGE_CHANNELS: readonly MessageChannel[] = [
  'whatsapp',
  'sms',
  'email',
];

// Every fixed word, so the draft can be reviewed in Telugu, Hindi or English.
export interface AiDraftReplyLabels {
  title: string;
  channels: Record<MessageChannel, string>;
  to: string;
  approve: string;
  approved: string;
  edit: string;
  editTitle: string;
  field: string;
  note: (channel: string) => string;
  cancel: string;
  saveAndSend: string;
  empty: string;
}

export const AI_DRAFT_REPLY_LABELS: Readonly<AiDraftReplyLabels> = {
  title: 'AI-drafted reply',
  channels: { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email' },
  to: 'To',
  approve: 'Approve & send',
  approved: 'Approved & sent',
  edit: 'Edit',
  editTitle: 'Edit draft reply',
  field: 'Message to send',
  note: (channel) => `Delivered via ${channel} once you approve.`,
  cancel: 'Cancel',
  saveAndSend: 'Save & send',
  empty: 'Write the message before sending it.',
};

export interface AiDraftReplyProps
  extends Omit<
    AiDraftBlockProps,
    | 'children'
    | 'title'
    | 'onEdit'
    | 'verb'
    | 'approvedVerb'
    | 'labels'
    | 'contentLang'
  > {
  title?: ReactNode;
  channel: MessageChannel;
  // Who it goes to ("Mohd. Irfan · +91 98480 2231•").
  recipient: ReactNode;
  // The drafted message. Controlled with message and onMessageChange, or from defaultMessage.
  message?: string;
  defaultMessage?: string;
  onMessageChange?: (message: string) => void;
  // Called with the final text when a person approves it, as drafted or as edited. The component
  // sends nothing itself.
  onSend: (message: string) => void;
  // The consent or cost line ("Patient consented to WhatsApp reminders", "₹0.45 per reply").
  consent?: ReactNode;
  // The message's language (te, hi, en), set on the message only.
  contentLang?: string;
  labels?: Partial<AiDraftReplyLabels>;
  // The words of the draft block underneath (the status chip, the rejection form).
  blockLabels?: Partial<AiDraftBlockLabels>;
}

const glyph = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

// A shape per channel beside its name: a speech bubble, a phone, an envelope.
const channelIcons: Record<MessageChannel, ReactNode> = {
  whatsapp: (
    <svg {...glyph}>
      <path d="M4 16.5l1-3.2A6.5 6.5 0 1 1 7.6 16z" />
    </svg>
  ),
  sms: (
    <svg {...glyph}>
      <rect x="5.5" y="2.5" width="9" height="15" rx="1.75" />
      <path d="M9 14.5h2" />
    </svg>
  ),
  email: (
    <svg {...glyph}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
      <path d="M3 5.5l7 5.5 7-5.5" />
    </svg>
  ),
};

// An AI-drafted outbound message (02-reception's reschedule and referral replies): an AiDraftBlock
// with the channel, the recipient and the message, approved with "Approve & send", edited in a dialog
// and sent with "Save & send", or rejected with a reason. Nothing is sent until a person approves:
// the component only ever calls onSend(text), and only from those two buttons. A sent message
// cannot be taken back, so there is no Undo unless the caller passes undoable (a send it can still
// cancel).
export function AiDraftReply({
  title,
  channel,
  recipient,
  message: messageProp,
  defaultMessage = '',
  onMessageChange,
  onSend,
  consent,
  contentLang,
  labels: labelsProp,
  blockLabels,
  status: statusProp,
  defaultStatus = 'pending',
  onStatusChange,
  onApprove,
  approverName,
  signatory,
  approvedAt,
  formatTime,
  undoable = false,
  badges,
  id,
  ...rest
}: AiDraftReplyProps) {
  const words: AiDraftReplyLabels = { ...AI_DRAFT_REPLY_LABELS, ...labelsProp };
  const fallbackId = useId();
  const blockId = id ?? fallbackId;
  const [message, setMessage] = useControllableState({
    value: messageProp,
    defaultValue: defaultMessage,
    onChange: onMessageChange,
  });
  const [status, setStatus] = useControllableState<AiDraftStatus>({
    value: statusProp,
    defaultValue: defaultStatus,
    onChange: onStatusChange,
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message);
  const [draftEmpty, setDraftEmpty] = useState(false);
  // When the message was sent from the dialog: the block records its own approvals, not this one.
  const [sentAt, setSentAt] = useState<Date | null>(null);
  const focusRecord = useRef(false);
  const channelName = words.channels[channel];

  // After Save & send the dialog closes and the Edit button that opened it is gone with the
  // pending controls, so focus goes to the record of the approval (or Undo), never to <body>.
  useEffect(() => {
    if (!focusRecord.current || editing) return;
    const active = document.activeElement;
    if (active && active !== document.body) {
      focusRecord.current = false;
      return;
    }
    const root = document.getElementById(blockId);
    const target =
      root?.querySelector<HTMLElement>('[data-action="undo"]') ??
      root?.querySelector<HTMLElement>('[role="group"] [tabindex="-1"]');
    if (target) {
      target.focus();
      focusRecord.current = false;
    }
  });

  function changeStatus(next: AiDraftStatus) {
    if (next !== 'approved') setSentAt(null);
    setStatus(next);
  }

  function approve(approval: AiDraftApproval) {
    onSend(message);
    onApprove?.(approval);
  }

  function openEditor() {
    setDraft(message);
    setDraftEmpty(false);
    setEditing(true);
  }

  function saveAndSend() {
    const text = draft.trim();
    if (!text) {
      setDraftEmpty(true);
      return;
    }
    const at = new Date();
    setMessage(text);
    setSentAt(at);
    setEditing(false);
    focusRecord.current = true;
    onSend(text);
    onApprove?.({ approver: signatory ?? approverName ?? 'You', at });
    changeStatus('approved');
  }

  const justNow = blockLabels?.justNow ?? AI_DRAFT_BLOCK_LABELS.justNow;
  const recordedAt =
    sentAt && status === 'approved'
      ? formatTime
        ? formatTime(sentAt)
        : justNow
      : approvedAt;

  return (
    <>
      <AiDraftBlock
        id={blockId}
        title={title ?? words.title}
        status={status}
        onStatusChange={changeStatus}
        onApprove={approve}
        onEdit={openEditor}
        verb={words.approve}
        approvedVerb={words.approved}
        approverName={approverName}
        signatory={signatory}
        approvedAt={recordedAt}
        formatTime={formatTime}
        undoable={undoable}
        labels={{ ...blockLabels, edit: blockLabels?.edit ?? words.edit }}
        badges={
          <>
            <Chip data-slot="channel" icon={channelIcons[channel]}>
              {channelName}
            </Chip>
            {badges}
          </>
        }
        {...rest}
      >
        <div className="flex flex-col gap-s2">
          <p data-slot="recipient" className="text-label text-ink-2">
            {words.to} <b className="font-semibold text-ink">{recipient}</b>
          </p>
          <p
            data-slot="message"
            lang={contentLang}
            className="whitespace-pre-wrap text-control text-ink"
          >
            {message}
          </p>
          {consent !== undefined && consent !== null ? (
            <p data-slot="consent" className="text-caption text-ink-2">
              {consent}
            </p>
          ) : null}
        </div>
      </AiDraftBlock>
      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        title={words.editTitle}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              {words.cancel}
            </Button>
            <Button variant="ai" onClick={saveAndSend}>
              {words.saveAndSend}
            </Button>
          </>
        }
      >
        <Textarea
          label={words.field}
          value={draft}
          rows={5}
          lang={contentLang}
          error={draftEmpty ? words.empty : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            if (event.target.value.trim()) setDraftEmpty(false);
          }}
        />
        <p className="mt-s3 text-label text-ink-2">{words.note(channelName)}</p>
      </Dialog>
    </>
  );
}
