import { useCallback, useMemo, useState } from 'react';
import type { ActionFeedbackProps, ActionNotice } from './action-feedback';

export interface Feedback {
  // Props for <ActionFeedback>: what last went through, and what went wrong.
  props: ActionFeedbackProps;
  notify: (notice: ActionNotice) => void;
  fail: (message: string) => void;
  clear: () => void;
  // Runs a call against the source. A failure is shown on screen (the source's words name the
  // problem, never the patient) and kept nowhere else; resolves whether it went through.
  attempt: (task: () => Promise<unknown>) => Promise<boolean>;
}

// The outcome of the doctor's actions on a tab, in place (the prototype's toasts). Nothing is
// logged: a failure is a sentence on screen.
export function useFeedback(): Feedback {
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notify = useCallback((next: ActionNotice) => {
    setError(null);
    setNotice(next);
  }, []);
  const fail = useCallback((message: string) => {
    setNotice(null);
    setError(message);
  }, []);
  const clear = useCallback(() => {
    setNotice(null);
    setError(null);
  }, []);
  const attempt = useCallback(
    async (task: () => Promise<unknown>) => {
      try {
        await task();
        setError(null);
        return true;
      } catch (failure: unknown) {
        fail(
          failure instanceof Error
            ? failure.message
            : 'That did not go through.',
        );
        return false;
      }
    },
    [fail],
  );

  const props = useMemo<ActionFeedbackProps>(
    () => ({
      notice,
      error,
      onDismissNotice: () => setNotice(null),
      onDismissError: () => setError(null),
    }),
    [notice, error],
  );

  return useMemo(
    () => ({ props, notify, fail, clear, attempt }),
    [props, notify, fail, clear, attempt],
  );
}
