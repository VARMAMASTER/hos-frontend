import { useState } from 'react';
import type { AiDraftBlockProps, AiDraftStatus } from '@hos/nova-ui';
import type { Feedback } from './use-feedback';

export interface DraftDecisionHandlers {
  // The person approved: send, file or sign. A throw is the source refusing, and the draft stays a
  // draft with the reason on screen.
  approve: () => Promise<unknown>;
  // The person rejected, with the reason they typed.
  reject?: (reason: string) => Promise<unknown>;
  initial?: AiDraftStatus;
}

type DecisionProps = Pick<
  AiDraftBlockProps,
  'status' | 'onStatusChange' | 'onApprove' | 'onReject' | 'busy' | 'undoable'
>;

// The props that make an AiDraftBlock (or SoapDraftBlock) wait for the source's answer before it
// settles: it reads "approved" only once the source has accepted it. Nothing an AI drafted is final
// until a person approves it, and nothing shows as done that did not happen. These drafts are never
// undoable: a note signed, a letter sent or a prescription sent cannot be taken back from here.
export function useDraftDecision(
  feedback: Feedback,
  { approve, reject, initial = 'pending' }: DraftDecisionHandlers,
): DecisionProps & { status: AiDraftStatus } {
  const [status, setStatus] = useState<AiDraftStatus>(initial);
  const [busy, setBusy] = useState(false);

  return {
    status,
    busy,
    undoable: false,
    // The block asks for a status; a decision is only made once the source answers.
    onStatusChange: (next) => {
      if (next !== 'approved' && next !== 'rejected') setStatus(next);
    },
    onApprove: () => {
      setBusy(true);
      void feedback.attempt(approve).then((ok) => {
        setBusy(false);
        setStatus(ok ? 'approved' : 'pending');
      });
    },
    onReject: reject
      ? (reason) => {
          setBusy(true);
          void feedback
            .attempt(() => reject(reason))
            .then((ok) => {
              setBusy(false);
              setStatus(ok ? 'rejected' : 'pending');
            });
        }
      : undefined,
  };
}
