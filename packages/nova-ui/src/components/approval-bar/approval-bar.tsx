import type { HTMLAttributes } from 'react';
import { Button } from '../button/button';

export interface ApprovalBarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  onApprove: () => void;
  // Edit and Reject appear only when there is a handler for them.
  onEdit?: () => void;
  onReject?: () => void;
  // A decision is being submitted: every control is disabled and the group is aria-busy.
  busy?: boolean;
  // Who approved. Replaces the controls with a record of the approval that a clinician can see.
  approvedBy?: string;
}

export function ApprovalBar({
  onApprove,
  onEdit,
  onReject,
  busy = false,
  approvedBy,
  ...rest
}: ApprovalBarProps) {
  return (
    <div role="group" aria-label="Review AI output" aria-busy={busy} {...rest}>
      {approvedBy ? null : (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ai" disabled={busy} onClick={() => onApprove()}>
            Approve
          </Button>
          {onEdit ? (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => onEdit()}
            >
              Edit
            </Button>
          ) : null}
          {onReject ? (
            <Button variant="ghost" disabled={busy} onClick={() => onReject()}>
              Reject
            </Button>
          ) : null}
        </div>
      )}
      {/* Always mounted, so a screen reader announces the approval when it appears; a live region
          that arrives together with its text is often missed. */}
      <div role="status" className="text-sm font-medium text-good-deep">
        {approvedBy ? (
          <>
            <span aria-hidden="true">✓ </span>
            Approved by {approvedBy}
          </>
        ) : null}
      </div>
    </div>
  );
}
