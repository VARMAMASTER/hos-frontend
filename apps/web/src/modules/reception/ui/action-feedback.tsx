import { Banner } from '@hos/nova-ui';

export interface ActionNotice {
  title: string;
  detail?: string;
}

export interface ActionFeedbackProps {
  // The last thing that went through ("Appointment booked — token T-27").
  notice: ActionNotice | null;
  // What went wrong with the last action, if it did.
  error: string | null;
  onDismissNotice?: () => void;
  onDismissError?: () => void;
}

// The outcome of a front-desk action, in place on the tab (the prototype's toasts). A confirmation is
// a polite status; a failure is an alert. Both stay until dismissed or replaced.
export function ActionFeedback({
  notice,
  error,
  onDismissNotice,
  onDismissError,
}: ActionFeedbackProps) {
  return (
    <>
      {error ? (
        <Banner
          tone="crit"
          title="That did not go through"
          onDismiss={onDismissError}
          dismissLabel="Dismiss the error"
        >
          {error}
        </Banner>
      ) : null}
      {notice ? (
        <Banner
          tone="good"
          title={notice.title}
          onDismiss={onDismissNotice}
          dismissLabel="Dismiss the confirmation"
        >
          {notice.detail}
        </Banner>
      ) : null}
    </>
  );
}
