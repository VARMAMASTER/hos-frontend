import { useState } from 'react';
import {
  AiDraftReply,
  type AiDraftReplyProps,
  type AiDraftStatus,
} from '@hos/nova-ui';

export interface ReceptionDraftReplyProps
  extends Pick<
    AiDraftReplyProps,
    'title' | 'channel' | 'recipient' | 'consent' | 'source' | 'contentLang'
  > {
  // The AI's drafted message.
  message: string;
  // Sends the approved text (as drafted or as edited). Resolves false when the source refused, so
  // the draft goes back to pending and nothing is shown as sent.
  onSend: (message: string) => Promise<boolean>;
}

// An AI-drafted outbound message the front desk approves before it goes (a referral reply, a
// WhatsApp reply, a call follow-up). The component never sends: only a person's Approve & send, or
// Save & send after an edit, reaches onSend.
export function ReceptionDraftReply({
  message,
  onSend,
  ...rest
}: ReceptionDraftReplyProps) {
  const [status, setStatus] = useState<AiDraftStatus>('pending');
  return (
    <AiDraftReply
      {...rest}
      defaultMessage={message}
      status={status}
      onStatusChange={setStatus}
      onSend={(text) => {
        void onSend(text).then((ok) => {
          if (!ok) setStatus('pending');
        });
      }}
    />
  );
}
