import { useEffect, useRef, type HTMLAttributes } from 'react';
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
}

export function ApprovalBar({
  onApprove,
  onEdit,
  onReject,
  busy = false,
  approvedBy,
  onFocus,
  onBlur,
  ...rest
}: ApprovalBarProps) {
  const statusRef = useRef<HTMLDivElement>(null);
  // Whether keyboard focus is in the bar. Focus leaving for another control clears it; focus lost
  // to nothing (the focused button unmounting) does not, which is exactly the case to repair.
  const focusInside = useRef(false);

  // Approving is the core clinician action and is often done many times in a row. When the
  // controls are replaced by the record, focus moves to the record, so the next Tab carries on from
  // here instead of from the top of the page.
  useEffect(() => {
    if (!approvedBy || !focusInside.current) return;
    const active = document.activeElement;
    if (active === null || active === document.body) {
      statusRef.current?.focus();
    }
  }, [approvedBy]);

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
      {approvedBy ? null : (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ai"
            aria-disabled={busy || undefined}
            onClick={() => onApprove()}
          >
            Approve
          </Button>
          {onEdit ? (
            <Button
              variant="secondary"
              aria-disabled={busy || undefined}
              onClick={() => onEdit()}
            >
              Edit
            </Button>
          ) : null}
          {onReject ? (
            <Button
              variant="ghost"
              aria-disabled={busy || undefined}
              onClick={() => onReject()}
            >
              Reject
            </Button>
          ) : null}
        </div>
      )}
      {/* Always mounted, so a screen reader announces the approval when it appears; a live region
          that arrives together with its text is often missed. Focusable from script only, so focus
          has somewhere to land when the controls go. */}
      <div
        ref={statusRef}
        role="status"
        tabIndex={approvedBy ? -1 : undefined}
        className={cx(
          'w-fit rounded-sm text-sm font-semibold text-good-deep',
          focusRing,
        )}
      >
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
