import { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ChoiceCard,
  ChoiceCardGroup,
  Chip,
  EmptyState,
  Stack,
  Text,
} from '@hos/nova-ui';
import { useDoctorAction, useDoctorQuery, type QueueEntry } from '../../data';
import {
  ActionFeedback,
  DoctorKpis,
  DoctorTab,
  type ActionNotice,
} from '../../ui';
import { QueueCharts } from './queue-charts';
import { ComplaintChip, QueueStatusChip } from './status-chips';
import type { QueueWidgetProps } from './types';

// The prototype's My Queue (03-doctor.html, data-panel="queue"): today's roster with the one thing a
// doctor comes here to do, Start consultation, then the session's figures and pace.
export function QueueWidget({
  patientId,
  compactMode,
  className,
}: QueueWidgetProps) {
  const { query, source, reload, update } = useDoctorQuery((s) => s.getQueue());
  const action = useDoctorAction();
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);

  const queue = query.status === 'ready' ? query.data : null;
  const selected =
    queue?.entries.find((entry) => entry.token === chosen) ??
    queue?.entries.find((entry) => entry.status === 'in-room') ??
    queue?.entries[0];

  async function start(entry: QueueEntry) {
    setNotice(null);
    const next = await action.run(() => source.startConsultation(entry.token));
    if (!next) return;
    update(() => next);
    setNotice({
      title: `Consultation opened for ${entry.name}`,
      detail:
        'Open the Consultation tab to see the briefing and start the scribe.',
    });
  }

  return (
    <DoctorTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="My Queue"
      description={
        queue
          ? `${queue.session.dateLabel} · ${queue.session.department} · ${queue.session.room} · ${queue.session.sessionLabel}`
          : 'Today’s patients and how the session is going.'
      }
      badge={
        queue && queue.session.runningBehindMinutes > 0 ? (
          <Chip tone="warn" icon="◷">
            Running {queue.session.runningBehindMinutes} min behind
          </Chip>
        ) : undefined
      }
      query={query}
      errorMessage="Could not load your queue."
      onRetry={reload}
    >
      {queue ? (
        queue.entries.length === 0 ? (
          <EmptyState
            title="No one is on your list"
            description="Patients appear here as reception registers or books them for this session."
          />
        ) : (
          <Stack gap="s6">
            <ActionFeedback
              notice={notice}
              error={action.error}
              onDismissNotice={() => setNotice(null)}
              onDismissError={action.clearError}
            />
            <Card>
              <CardHeader
                title="Today's queue"
                description="Token, patient, status & complaint for this session"
                actions={
                  <>
                    <Chip>
                      next {queue.listed.next} of {queue.listed.total}
                    </Chip>
                    {selected ? (
                      <Button
                        onClick={() => {
                          if (selected.status !== 'done') void start(selected);
                        }}
                        loading={action.busy}
                        aria-disabled={selected.status === 'done' || undefined}
                      >
                        Start consultation · {selected.name}
                        <Text as="span" aria-hidden="true">
                          →
                        </Text>
                      </Button>
                    ) : null}
                  </>
                }
              />
              <CardBody>
                <ChoiceCardGroup
                  legend="Choose the patient to open"
                  name="queue-patient"
                  columns={2}
                  value={selected?.token}
                  onValueChange={setChosen}
                >
                  {queue.entries.map((entry) => (
                    <ChoiceCard
                      key={entry.token}
                      value={entry.token}
                      title={
                        <>
                          <Text as="span" font="mono" weight="bold">
                            {entry.token}
                          </Text>{' '}
                          {entry.name}
                        </>
                      }
                      badge={<QueueStatusChip status={entry.status} />}
                      description={
                        <>
                          {entry.ageSex}{' '}
                          <ComplaintChip
                            complaint={entry.complaint}
                            urgency={entry.urgency}
                          />
                        </>
                      }
                    />
                  ))}
                </ChoiceCardGroup>
              </CardBody>
            </Card>
            <DoctorKpis label="Session figures" kpis={queue.kpis} />
            <QueueCharts queue={queue} />
          </Stack>
        )
      ) : null}
    </DoctorTab>
  );
}
