import { useEffect, useId, useState, type ReactNode } from 'react';
import { Button } from '../button/button';
import { Dialog } from '../dialog/dialog';
import { Textarea } from '../textarea/textarea';

export interface ReasonDialogLabels {
  reason: string;
  cancel: string;
  // Before the reason is long enough, and after.
  remaining: (min: number, left: number) => string;
  ready: (length: number) => string;
  // Who reads the reason, and that it is permanent.
  auditNote: string;
}

export const REASON_DIALOG_LABELS: Readonly<ReasonDialogLabels> = {
  reason: 'Why are you doing this?',
  cancel: 'Cancel',
  remaining: (min, left) => `Minimum ${min} characters — ${left} to go.`,
  ready: (length) => `Reason given — ${length} characters.`,
  auditNote:
    'Your name, the time and this reason are recorded with the change, and cannot be edited afterwards.',
};

export interface ReasonDialogProps {
  open: boolean;
  onCancel: () => void;
  // The reason, trimmed. The dialog keeps nothing once it closes.
  onConfirm: (reason: string) => void;
  title: ReactNode;
  // What the action does, in a sentence.
  description?: ReactNode;
  // Its consequences: one line, or a list of them.
  impact?: ReactNode | readonly ReactNode[];
  confirmLabel: string;
  // A destructive action (the kill switch) is an alertdialog with the danger button; a restoring or
  // promoting one is a plain dialog with the primary button.
  danger?: boolean;
  minLength?: number;
  placeholder?: string;
  labels?: Partial<ReasonDialogLabels>;
  // Styles the dialog's panel, as Dialog's className does.
  className?: string;
  // The language the reason is written in, if known.
  lang?: string;
}

// The prototype's requireReason (12-superadmin.html): nothing powerful happens without a written
// reason. The impact first, then a required reason with a running count against the minimum, and
// the note that it is recorded. The confirm button stays aria-disabled (focusable, announced as
// unavailable) until the reason is long enough. It never takes the focus first: Cancel does.
export function ReasonDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  impact,
  confirmLabel,
  danger = true,
  minLength = 15,
  placeholder,
  labels,
  lang,
  className,
}: ReasonDialogProps) {
  const words = { ...REASON_DIALOG_LABELS, ...labels };
  const [reason, setReason] = useState('');
  const countId = useId();
  // Each opening starts blank: a reason written for one change is never carried to the next.
  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const trimmed = reason.trim();
  const ready = trimmed.length >= minLength;
  const lines = Array.isArray(impact)
    ? (impact as readonly ReactNode[])
    : impact
      ? [impact as ReactNode]
      : [];

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      className={className}
      title={title}
      description={description}
      role={danger ? 'alertdialog' : 'dialog'}
      footer={
        <>
          <Button variant="ghost" autoFocus onClick={onCancel}>
            {words.cancel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            aria-disabled={ready ? undefined : true}
            aria-describedby={countId}
            onClick={() => onConfirm(trimmed)}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {lines.length > 0 ? (
        // The prototype's .rc-impact: panel-2, the line edge, 12.5px at a loose 1.7.
        <ul
          data-impact=""
          className="mb-s6 flex flex-col gap-s1 rounded-control border border-border bg-surface-2 p-s4 text-body-sm leading-relaxed text-ink"
        >
          {lines.map((line, index) => (
            <li key={index} className="flex gap-s3">
              <span aria-hidden="true">·</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <Textarea
        label={words.reason}
        required
        lang={lang}
        placeholder={placeholder}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        aria-describedby={countId}
      />
      <p id={countId} className="mt-s1 text-label text-ink-2">
        {ready
          ? words.ready(trimmed.length)
          : words.remaining(minLength, minLength - trimmed.length)}
      </p>
      <p className="mt-s1 text-label text-ink-2">{words.auditNote}</p>
    </Dialog>
  );
}
