import { useState } from 'react';
import {
  AiClassChip,
  AiDraftBlock,
  AiSourceLine,
  Banner,
  Box,
  Button,
  Dialog,
  Grid,
  Select,
  Stack,
  Text,
  WhyTrail,
  type AiDraftStatus,
} from '@hos/nova-ui';
import type { FollowUpDraft, ReminderPlanDraft } from '../../data';

export interface FollowUpDraftBlockProps {
  draft: FollowUpDraft;
  // Books it. Resolves false when the source refused, so the draft goes back to pending.
  onApprove: () => Promise<boolean>;
  busy: boolean;
}

// The follow-up a discharge summary asked for (the prototype's #followUpDraft). Nothing is booked
// and no message is sent until a person approves it.
export function FollowUpDraftBlock({
  draft,
  onApprove,
  busy,
}: FollowUpDraftBlockProps) {
  const [status, setStatus] = useState<AiDraftStatus>('pending');
  const [choosing, setChoosing] = useState(false);
  const cells = [
    { label: 'Asked for in the summary', ...draft.askedFor },
    { label: 'Proposed slot', ...draft.proposed },
    { label: 'Why not 26 Jul', ...draft.whyNot },
  ];
  return (
    <>
      <AiDraftBlock
        title={`Follow-up drafted from a discharge summary — ${draft.patientName}`}
        status={status}
        onStatusChange={setStatus}
        verb="Approve & book"
        approvedVerb="Booked"
        undoable={false}
        busy={busy}
        onApprove={() => {
          void onApprove().then((ok) => {
            if (!ok) setStatus('pending');
          });
        }}
        actions={
          <Button variant="ghost" size="sm" onClick={() => setChoosing(true)}>
            Choose another slot
          </Button>
        }
        source={
          <Stack gap="s3">
            <AiSourceLine label="Read from">{draft.sources}</AiSourceLine>
            <WhyTrail reasons={draft.reasons} sources={draft.sources} />
          </Stack>
        }
      >
        <Stack gap="s4">
          <Text size="sm">{draft.summarySource}</Text>
          <Grid columns={3} gap="s3">
            {cells.map((cell) => (
              <Box key={cell.label} border radius="card" padding="s3">
                <Stack gap="s1">
                  <Text as="span" size="xs" tone="muted" weight="semibold">
                    {cell.label}
                  </Text>
                  <Text as="span" weight="semibold">
                    {cell.title}
                  </Text>
                  <Text as="span" size="sm" tone="muted">
                    {'date' in cell
                      ? `${cell.detail} · ${cell.date}`
                      : cell.detail}
                  </Text>
                </Stack>
              </Box>
            ))}
          </Grid>
          <Banner tone="warn" title="The summary's date falls on a Sunday">
            {draft.caution}
          </Banner>
          <Text size="sm" tone="muted">
            Nothing is booked and no message is sent until you approve.
          </Text>
        </Stack>
      </AiDraftBlock>
      <Dialog
        open={choosing}
        onClose={() => setChoosing(false)}
        title="Pick a different slot"
        footer={<Button onClick={() => setChoosing(false)}>Close</Button>}
      >
        <Text>{draft.otherSessions}</Text>
      </Dialog>
    </>
  );
}

export interface ReminderPlanBlockProps {
  plan: ReminderPlanDraft;
  onApprove: () => Promise<boolean>;
  busy: boolean;
}

const CHANNEL_CHOICES = [
  {
    who: 'M. Sailoo · 78% · Telugu',
    options: [
      'AI voice call + WhatsApp',
      'AI voice call only',
      'WhatsApp only',
      'Swapna calls personally',
    ],
  },
  {
    who: 'Sk. Zubeda · 71% · Hindi',
    options: ['AI voice call', 'WhatsApp only', 'Swapna calls personally'],
  },
  {
    who: 'G. Latha · 44% · Telugu',
    options: ['WhatsApp reminder', 'AI voice call', 'No reminder'],
  },
];

// The reminder plan for tomorrow's flagged appointments (the prototype's #apNoShowBlock). It is a
// GREEN-tier attendance forecast, never clinical, and nothing is dialled until a person approves.
export function ReminderPlanBlock({
  plan,
  onApprove,
  busy,
}: ReminderPlanBlockProps) {
  const [status, setStatus] = useState<AiDraftStatus>('pending');
  const [editing, setEditing] = useState(false);
  const [changed, setChanged] = useState(false);
  return (
    <>
      <AiDraftBlock
        title={plan.title}
        status={status}
        onStatusChange={setStatus}
        verb="Approve & queue 3 reminders"
        approvedVerb="Queued"
        undoable={false}
        busy={busy}
        badges={
          <AiClassChip
            tier="green"
            detail="attendance forecast, not clinical"
          />
        }
        onApprove={() => {
          void onApprove().then((ok) => {
            if (!ok) setStatus('pending');
          });
        }}
        actions={
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Change channel
          </Button>
        }
        source={<AiSourceLine label="Signals">{plan.signals}</AiSourceLine>}
      >
        <Stack gap="s3">
          <Text size="sm">{plan.summary}</Text>
          {changed ? (
            <Text size="sm" tone="muted">
              Channels changed — still a draft until you approve it.
            </Text>
          ) : null}
        </Stack>
      </AiDraftBlock>
      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        title="Change the reminder channel"
        description="Same three patients, different channel. The forecast does not change — only how we reach them."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setChanged(true);
                setEditing(false);
              }}
            >
              Save plan
            </Button>
          </>
        }
      >
        <Stack gap="s4">
          {CHANNEL_CHOICES.map((choice) => (
            <Select
              key={choice.who}
              label={choice.who}
              options={choice.options.map((option) => ({
                value: option,
                label: option,
              }))}
            />
          ))}
        </Stack>
      </Dialog>
    </>
  );
}
