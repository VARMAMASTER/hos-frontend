import { useState } from 'react';
import {
  AiDraftReply,
  AiSourceLine,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  EmptyState,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  type AiDraftStatus,
} from '@hos/nova-ui';
import {
  useReceptionAction,
  useReceptionQuery,
  type Referral,
  type ReferralReplyDraft,
  type ReferralsOverview,
  type ReceptionDataSource,
} from '../../data';
import { ActionFeedback, ReceptionTab, type ActionNotice } from '../../ui';
import type { ReferralsWidgetProps } from './types';

// The prototype's Referrals (02-reception.html, data-panel="referrals"): the referrals that came in,
// accepted by the front desk, and the AI-drafted acceptance reply a person approves before it goes.
export function ReferralsWidget({
  patientId,
  compactMode,
  className,
}: ReferralsWidgetProps) {
  const { query, source, reload, update } = useReceptionQuery((s) =>
    s.getReferrals(),
  );
  return (
    <ReceptionTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="Referrals"
      description="Referrals from other doctors and clinics, and the reply that goes back to them."
      query={query}
      errorMessage="Could not load referrals."
      onRetry={reload}
    >
      {query.status === 'ready' ? (
        <ReferralsDesk
          overview={query.data}
          source={source}
          onChange={update}
        />
      ) : null}
    </ReceptionTab>
  );
}

interface ReferralsDeskProps {
  overview: ReferralsOverview;
  source: ReceptionDataSource;
  onChange: (
    change: (overview: ReferralsOverview) => ReferralsOverview,
  ) => void;
}

function summaryOf(referrals: Referral[]): string {
  const open = referrals.filter((item) => item.status === 'pending').length;
  return `${referrals.length} this week · ${open} pending action`;
}

function ReferralsDesk({ overview, source, onChange }: ReferralsDeskProps) {
  const action = useReceptionAction();
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  // The draft as it was loaded: an approved reply stays on screen, settled, after the source has
  // closed it.
  const [draft] = useState(overview.replyDraft);

  if (overview.referrals.length === 0) {
    return (
      <EmptyState
        title="No incoming referrals"
        description="Referrals from other doctors and clinics appear here as they arrive."
      />
    );
  }

  async function accept(referral: Referral) {
    setNotice(null);
    setAcceptingId(referral.id);
    const accepted = await action.run(() => source.acceptReferral(referral.id));
    setAcceptingId(null);
    if (!accepted) return;
    onChange((current) => ({
      ...current,
      referrals: current.referrals.map((item) =>
        item.id === accepted.id ? accepted : item,
      ),
    }));
    setNotice({
      title: `Referral accepted — ${accepted.patientName}`,
      detail: `${accepted.source} · the patient is scheduled`,
    });
  }

  async function sendReply(
    reply: ReferralReplyDraft,
    message: string,
  ): Promise<boolean> {
    setNotice(null);
    const sent = await action.run(async () => {
      await source.sendReferralReply(reply.id, message);
      return true;
    });
    if (!sent) return false;
    setNotice({
      title: 'Reply approved & sent',
      detail: 'Delivered via WhatsApp',
    });
    return true;
  }

  return (
    <Stack gap="s6">
      <ActionFeedback
        notice={notice}
        error={action.error}
        onDismissNotice={() => setNotice(null)}
        onDismissError={action.clearError}
      />
      <Card>
        <CardHeader
          title="Incoming referrals"
          actions={
            <Text as="span" size="xs" tone="muted">
              {summaryOf(overview.referrals)}
            </Text>
          }
        />
        <CardBody>
          <Table caption="Incoming referrals">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Referring doctor / clinic</TableHeaderCell>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>Reason</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {overview.referrals.map((referral) => (
                <ReferralRow
                  key={referral.id}
                  referral={referral}
                  busy={acceptingId === referral.id}
                  onAccept={() => void accept(referral)}
                />
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
      {draft ? (
        <ReplyDraft
          draft={draft}
          onSend={(message) => sendReply(draft, message)}
        />
      ) : null}
    </Stack>
  );
}

function ReferralRow({
  referral,
  busy,
  onAccept,
}: {
  referral: Referral;
  busy: boolean;
  onAccept: () => void;
}) {
  const pending = referral.status === 'pending';
  return (
    <TableRow>
      <TableCell>
        <Stack gap="none">
          <Text as="span" weight="semibold">
            {referral.source}
          </Text>
          <Text as="span" size="xs" tone="muted">
            {referral.sourceDetail}
          </Text>
        </Stack>
      </TableCell>
      <TableCell>
        <Text as="span">{referral.patientName}</Text>
        <Text as="span" size="xs" tone="muted">
          {` · ${referral.ageSex}`}
        </Text>
      </TableCell>
      <TableCell>{referral.reason}</TableCell>
      <TableCell>
        <Text as="span" font="mono" size="sm">
          {referral.date}
        </Text>
      </TableCell>
      <TableCell>
        {pending ? (
          <Chip tone="warn" icon="◷">
            Pending
          </Chip>
        ) : (
          <Chip tone="good" icon="✓">
            Accepted
          </Chip>
        )}
      </TableCell>
      <TableCell>
        {pending ? (
          <Button
            size="sm"
            loading={busy}
            aria-label={`Accept referral from ${referral.source} for ${referral.patientName}`}
            onClick={onAccept}
          >
            Accept
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled>
            Scheduled
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

interface ReplyDraftProps {
  draft: ReferralReplyDraft;
  // Sends it. Resolves false when the source refused, so the draft goes back to pending.
  onSend: (message: string) => Promise<boolean>;
}

// The AI-drafted acceptance reply. Nothing goes to the referring clinic until a person approves it,
// as drafted or as edited.
function ReplyDraft({ draft, onSend }: ReplyDraftProps) {
  const [status, setStatus] = useState<AiDraftStatus>('pending');
  return (
    <AiDraftReply
      title="AI-drafted acceptance reply"
      channel="whatsapp"
      recipient={draft.recipient}
      defaultMessage={draft.message}
      status={status}
      onStatusChange={setStatus}
      consent="Ready to send via WhatsApp or email to the referring clinic."
      source={
        <AiSourceLine label="Read from">
          The referral · the doctor's schedule · nothing is sent until you
          approve
        </AiSourceLine>
      }
      onSend={(message) => {
        void onSend(message).then((ok) => {
          if (!ok) setStatus('pending');
        });
      }}
    />
  );
}
