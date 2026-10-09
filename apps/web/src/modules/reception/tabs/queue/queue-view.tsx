import { useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Grid,
  LiveDot,
  Stack,
  Tag,
  Text,
} from '@hos/nova-ui';
import {
  useReceptionAction,
  useReceptionQuery,
  type QueueSnapshot,
  type QueueToken,
} from '../../data';
import {
  ActionFeedback,
  ReceptionKpis,
  ReceptionTab,
  type ActionNotice,
} from '../../ui';
import { TokenStateChip } from './token-state';
import type { QueueWidgetProps } from './types';

// The prototype's Live Queue (02-reception.html, data-panel="queue"): the figures, the token now
// serving with "Call next", and the waiting tokens. Seen tokens are listed too, so all four token
// states (waiting, called, in consultation, done) are on the board.
export function QueueWidget({
  patientId,
  compactMode,
  className,
}: QueueWidgetProps) {
  const { query, source, reload, update } = useReceptionQuery((s) =>
    s.getQueue(),
  );
  const action = useReceptionAction();
  const [notice, setNotice] = useState<ActionNotice | null>(null);

  async function callNext() {
    setNotice(null);
    const next = await action.run(() => source.callNext());
    if (!next) return;
    update(() => next);
    const called = next.tokens.find((token) => token.state === 'called');
    if (called) {
      setNotice({
        title: `Now serving ${called.token} · ${called.patientName}`,
      });
    }
  }

  return (
    <ReceptionTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="Live Queue"
      // The scaffold's wording, kept until app.spec.tsx stops asserting it (AGENTS-BOARD Requests).
      description="Curated workflow for Live Queue."
      query={query}
      errorMessage="Could not load the live queue."
      onRetry={reload}
    >
      {query.status === 'ready' ? (
        <QueueBoard
          queue={query.data}
          busy={action.busy}
          onCallNext={callNext}
          feedback={
            <ActionFeedback
              notice={notice}
              error={action.error}
              onDismissNotice={() => setNotice(null)}
              onDismissError={action.clearError}
            />
          }
        />
      ) : null}
    </ReceptionTab>
  );
}

interface QueueBoardProps {
  queue: QueueSnapshot;
  busy: boolean;
  onCallNext: () => void;
  feedback: ReactNode;
}

function QueueBoard({ queue, busy, onCallNext, feedback }: QueueBoardProps) {
  if (queue.tokens.length === 0) {
    return (
      <EmptyState
        title="No one is in the queue"
        description="Tokens appear here as patients are registered or booked."
      />
    );
  }
  const waiting = queue.tokens.filter((token) => token.state === 'waiting');
  const seen = queue.tokens.filter((token) => token.state === 'done');
  const serving =
    queue.tokens.find((token) => token.state === 'called') ??
    queue.tokens.find((token) => token.state === 'in-consultation');

  return (
    <Stack gap="s6">
      {feedback}
      {queue.kpis.length > 0 ? (
        <ReceptionKpis label="Queue figures" kpis={queue.kpis} />
      ) : null}

      <Card role="region" aria-label="Now serving">
        <CardHeader
          title="Now serving"
          description="Token board · updates live"
          actions={
            <>
              <LiveDot label="Live" />
              <Button
                size="sm"
                onClick={onCallNext}
                loading={busy}
                aria-disabled={waiting.length === 0 || undefined}
              >
                Call next
                <Text as="span" aria-hidden="true">
                  →
                </Text>
              </Button>
            </>
          }
        />
        <CardBody>
          {serving ? (
            <NowServing token={serving} />
          ) : (
            <Text tone="muted">Nobody has been called yet.</Text>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Waiting"
          description={`${waiting.length} patient${waiting.length === 1 ? '' : 's'} in queue`}
        />
        <CardBody>
          {waiting.length > 0 ? (
            <Grid columns={6} gap="s3" role="list" aria-label="Waiting tokens">
              {waiting.map((token) => (
                <WaitingTile key={token.token} token={token} />
              ))}
            </Grid>
          ) : (
            <Text tone="muted">The hall is clear — no one is waiting.</Text>
          )}
        </CardBody>
      </Card>

      {seen.length > 0 ? (
        <Card>
          <CardHeader
            title="Seen today"
            description="Tokens the doctors have finished"
            headingLevel={3}
          />
          <CardBody>
            <Stack
              as="ul"
              direction="horizontal"
              wrap
              gap="s3"
              aria-label="Seen today"
            >
              {seen.map((token) => (
                <li
                  key={token.token}
                  className="rounded-card border border-border px-s3 py-s2"
                >
                  <Stack direction="horizontal" align="center" gap="s2">
                    <Text as="span" font="mono" weight="semibold">
                      {token.token}
                    </Text>
                    <Text as="span" size="sm">
                      {token.patientName}
                    </Text>
                    <TokenStateChip state={token.state} />
                  </Stack>
                </li>
              ))}
            </Stack>
          </CardBody>
        </Card>
      ) : null}
    </Stack>
  );
}

function NowServing({ token }: { token: QueueToken }) {
  const meta = [
    token.ageSex,
    token.reason,
    token.doctorName,
    token.department,
    token.room,
    token.state === 'called' && token.at ? `called ${token.at}` : undefined,
  ].filter(Boolean);
  return (
    <Stack direction="horizontal" align="center" gap="s4" wrap>
      <Box border radius="card" paddingX="s4" paddingY="s2">
        <Stack gap="none" align="center">
          <Text as="span" font="display" size="lg" weight="bold">
            {token.token}
          </Text>
          <Text as="span" size="xs" tone="muted" weight="semibold">
            NOW
          </Text>
        </Stack>
      </Box>
      <Stack gap="s1" className="min-w-0 flex-1">
        <Text weight="semibold">{token.patientName}</Text>
        <Text size="sm" tone="muted">
          {meta.join(' · ')}
        </Text>
      </Stack>
      <TokenStateChip state={token.state} />
    </Stack>
  );
}

function WaitingTile({ token }: { token: QueueToken }) {
  return (
    <Box role="listitem" border radius="card" padding="s3">
      <Stack gap="s2" align="start">
        <Text font="mono" weight="bold">
          {token.token}
        </Text>
        <TokenStateChip
          state={token.state}
          waitingMinutes={token.waitingMinutes}
        />
        <Text weight="semibold">{token.patientName}</Text>
        <Tag variant="outline">{token.department}</Tag>
      </Stack>
    </Box>
  );
}
