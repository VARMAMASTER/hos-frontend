import {
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Button } from '../button/button';

export interface ApprovalBarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  onApprove: () => void;
  // Edit and Reject appear only when there is a handler for them.
  onEdit?: () => void;
  onReject?: () => void;
  // A decision is being submitted: every control is aria-disabled (so it keeps focus) and the group
  // is aria-busy.
  busy?: boolean;
  // Who approved. Replaces the controls with a record of the approval that a clinician can see.
  approvedBy?: string;
  // The words on the buttons, so they can be translated, or say what the approval is ("Sign",
  // "Send", "Witness").
  approveLabel?: string;
  editLabel?: string;
  rejectLabel?: string;
  undoLabel?: string;
  // The id of the element naming what is being approved (a panel's title). Each button is then
  // named "Approve <title>", so a page of several drafts never has five buttons all called Approve.
  labelledBy?: string;
  // Approve alone is unavailable (the draft is still being written): aria-disabled, still focusable.
  approveDisabled?: boolean;
  // With approvedBy, an Undo button sits beside the record and takes the focus when the controls go:
  // a human in the loop who cannot take an approval back is not really in the loop.
  onUndo?: () => void;
  // The record shown once approved, in place of "Approved by <name>".
  approvedNote?: ReactNode;
  // Whether the record is a live region. Turn it off when something else already announces the
  // decision (AiDraftBlock's status chip), so a screen reader does not hear it twice.
  announce?: boolean;
  // More controls for the row, after the standard ones ("Open the theatre record").
  actions?: ReactNode;
}

export function ApprovalBar({
  onApprove,
  onEdit,
  onReject,
  busy = false,
  approvedBy,
  approveLabel = 'Approve',
  editLabel = 'Edit',
  rejectLabel = 'Reject',
  undoLabel = 'Undo',
  labelledBy,
  approveDisabled = false,
  onUndo,
  approvedNote,
  announce = true,
  actions,
  onFocus,
  onBlur,
  ...rest
}: ApprovalBarProps) {
  const ids = useId();
  const statusRef = useRef<HTMLDivElement>(null);
  const approveRef = useRef<HTMLButtonElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  // Whether keyboard focus is in the bar. Focus leaving for another control clears it; focus lost
  // to nothing (the focused button unmounting) does not, which is exactly the case to repair.
  const focusInside = useRef(false);
  const approved = Boolean(approvedBy);

  // Approving is the core clinician action and is often done many times in a row. When the
  // controls are replaced by the record, focus moves to Undo (or to the record), so the next Tab
  // carries on from here instead of from the top of the page; after Undo it returns to Approve.
  useEffect(() => {
    if (!focusInside.current) return;
    const active = document.activeElement;
    if (active !== null && active !== document.body) return;
    if (approved) {
      (undoRef.current ?? statusRef.current)?.focus();
    } else {
      approveRef.current?.focus();
    }
  }, [approved]);

  // "Approve" then the thing it approves, read as one name.
  const named = (key: string) =>
    labelledBy
      ? {
          id: `${ids}-${key}`,
          'aria-labelledby': `${ids}-${key} ${labelledBy}`,
        }
      : {};

  return (
    <div
      role="group"
      aria-label="Review AI output"
      aria-busy={busy}
      {...rest}
      onFocus={(event) => {
        focusInside.current = true;
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          focusInside.current = false;
        }
        onBlur?.(event);
      }}
    >
      {approved ? null : (
        <div className="flex flex-wrap items-center gap-s3">
          <Button
            ref={approveRef}
            variant="ai"
            size="sm"
            data-action="approve"
            aria-disabled={busy || approveDisabled || undefined}
            onClick={() => onApprove()}
            {...named('approve')}
          >
            {approveLabel}
          </Button>
          {onEdit ? (
            <Button
              variant="ghost"
              size="sm"
              data-action="edit"
              aria-disabled={busy || undefined}
              onClick={() => onEdit()}
              {...named('edit')}
            >
              {editLabel}
            </Button>
          ) : null}
          {onReject ? (
            <Button
              variant="danger"
              size="sm"
              data-action="reject"
              aria-disabled={busy || undefined}
              onClick={() => onReject()}
              {...named('reject')}
            >
              {rejectLabel}
            </Button>
          ) : null}
          {actions}
        </div>
      )}
      <div className={cx(approved && 'flex flex-wrap items-center gap-s3')}>
        {/* Always mounted, so a screen reader announces the approval when it appears; a live region
            that arrives together with its text is often missed. Focusable from script only, so focus
            has somewhere to land when the controls go. */}
        <div
          ref={statusRef}
          role={announce ? 'status' : undefined}
          tabIndex={approved ? -1 : undefined}
          className={cx(
            'w-fit rounded-control text-body-sm text-good-deep',
            focusRing,
          )}
        >
          {approved
            ? (approvedNote ?? (
                <>
                  <span aria-hidden="true">✓ </span>
                  Approved by {approvedBy}
                </>
              ))
            : null}
        </div>
        {approved && onUndo ? (
          <Button
            ref={undoRef}
            variant="ghost"
            size="sm"
            data-action="undo"
            onClick={() => onUndo()}
            {...named('undo')}
          >
            {undoLabel}
          </Button>
        ) : null}
        {approved ? actions : null}
      </div>
    </div>
  );
}
