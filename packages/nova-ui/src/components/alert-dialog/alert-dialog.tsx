import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { Button, type ButtonVariant } from '../button/button';
import { Dialog } from '../dialog/dialog';

// cancel backs out and changes nothing; default is the ordinary way forward; destructive removes or
// ends something and is worded as what it does ("Discharge", not "OK").
export type AlertActionRole = 'cancel' | 'default' | 'destructive';

export interface AlertAction {
  label: string;
  role?: AlertActionRole;
  // Runs when the action is chosen, just before the dialog asks to close.
  onSelect?: () => void;
}

export interface AlertDialogProps {
  // Controlled only: an alert is always opened by something that knows it is open.
  open: boolean;
  // Called after an action has run, and for Escape. Escape counts as cancel, so it runs no action.
  onClose: () => void;
  title: ReactNode;
  message?: ReactNode;
  // In the order they are drawn: left to right for two, top to bottom for one or three or more.
  // Put the cancel action first for two, last for three or more, as on the platform.
  actions: AlertAction[];
}

// The action focus starts on: the least destructive one. Cancel beats default, and a destructive
// action is never chosen, so Enter on a freshly opened alert cannot discharge a patient.
function safestAction(actions: AlertAction[]): number {
  const rank = (action: AlertAction) =>
    action.role === 'cancel' ? 0 : action.role === 'destructive' ? 2 : 1;
  let best = -1;
  actions.forEach((action, index) => {
    if (
      rank(action) < 2 &&
      (best === -1 || rank(action) < rank(actions[best]))
    ) {
      best = index;
    }
  });
  return best;
}

// hos-sim.js HOS.confirm: a ghost Cancel beside a primary Confirm. The prototype's ghost button (a
// panel fill with a line border) is Nova's outline; a destructive action takes the danger button.
const roleVariants: Record<AlertActionRole, ButtonVariant> = {
  cancel: 'outline',
  default: 'primary',
  destructive: 'danger',
};

// A confirmation for when the user must choose (Discharge patient?), after the prototype's
// HOS.confirm. It is Nova's Dialog with role="alertdialog", so it is portalled, modal, traps focus,
// closes on Escape and returns focus to what opened it. There is no corner X: an alert is answered by
// one of its actions. Use a Toast for a confirmation that needs no answer.
export function AlertDialog({
  open,
  onClose,
  title,
  message,
  actions,
}: AlertDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      role="alertdialog"
      hideClose
      size="sm"
      title={title}
      description={message}
    >
      <AlertActions actions={actions} onClose={onClose} />
    </Dialog>
  );
}

function AlertActions({
  actions,
  onClose,
}: {
  actions: AlertAction[];
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const safe = safestAction(actions);
  // Runs before the Dialog looks for something to focus (a child's effect precedes its parent's), and
  // Dialog leaves focus alone when something inside already has it. With only destructive actions
  // the dialog itself takes focus, never one of them.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const buttons = root.querySelectorAll('button');
    const target =
      safe === -1
        ? root.closest<HTMLElement>('[role="alertdialog"]')
        : buttons[safe];
    target?.focus();
  }, [safe]);

  const layout = actions.length === 2 ? 'row' : 'stack';
  return (
    <div
      ref={rootRef}
      data-alert-actions=""
      data-layout={layout}
      className={cx(
        // The prototype's footer: the buttons right-aligned, an s3 (8px) gap (.hos-dialog-f). No
        // overflow clip: it would cut off the focus ring of the buttons inside.
        'flex gap-s3',
        layout === 'row' ? 'flex-row flex-wrap justify-end' : 'flex-col',
      )}
    >
      {actions.map((action, index) => {
        const role = action.role ?? 'default';
        return (
          <Button
            key={`${index}-${action.label}`}
            data-role={role}
            variant={roleVariants[role]}
            fullWidth={layout === 'stack'}
            onClick={() => {
              action.onSelect?.();
              onClose();
            }}
          >
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
