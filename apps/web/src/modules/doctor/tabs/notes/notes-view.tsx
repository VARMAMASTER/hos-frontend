import { useCallback, useRef, useState } from 'react';
import {
  AiMark,
  AiClassChip,
  Box,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Stack,
  Text,
} from '@hos/nova-ui';
import { useDoctorQuery, type NoteDraft, type NotesOverview } from '../../data';
import {
  ActionFeedback,
  AiRunSteps,
  DoctorTab,
  MetricStrip,
  TierNote,
  useAiRun,
  useFeedback,
} from '../../ui';
import { NoteDraftView } from './note-draft';
import { NotesQueue } from './notes-queue';
import type { NotesWidgetProps } from './types';

const OPEN_STEPS = [
  'Loading the recorded encounter…',
  'Pulling the charted vitals…',
  'Comparing today’s values against the patient’s own record…',
  'Laying the note out in the order you dictated it…',
];

// The prototype's Progress Notes (03-doctor.html, data-panel="notes"): GREEN throughout. What the
// scribe has drafted today, measured honestly, and the notes waiting for the doctor's signature.
export function NotesWidget({
  patientId,
  compactMode,
  className,
}: NotesWidgetProps) {
  const { query, source, reload, update } = useDoctorQuery((s) => s.getNotes());
  const feedback = useFeedback();
  const [openId, setOpenId] = useState<string | null>(null);
  const wanted = useRef('');
  const run = useAiRun<NoteDraft>(
    () => source.openNote(wanted.current),
    OPEN_STEPS.length,
  );

  const overview: NotesOverview | null =
    query.status === 'ready' ? query.data : null;

  function open(noteId: string) {
    wanted.current = noteId;
    setOpenId(noteId);
    run.start();
  }

  const settled = useCallback(
    (noteId: string, state: 'filed' | 'rejected') =>
      update((data) => ({
        ...data,
        rows: data.rows.map((row) =>
          row.id === noteId ? { ...row, state } : row,
        ),
      })),
    [update],
  );

  return (
    <DoctorTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="Progress Notes"
      description="Notes the scribe drafted from your consultations, for your signature."
      query={query}
      errorMessage="Could not load your progress notes."
      onRetry={reload}
    >
      {overview ? (
        overview.rows.length === 0 ? (
          <EmptyState
            title="Nothing is waiting for your signature"
            description="Notes appear here after the scribe drafts them from a consultation."
          />
        ) : (
          <Stack gap="s6">
            <ActionFeedback {...feedback.props} />
            <Card>
              <CardHeader
                title="Notes drafted today"
                description={`${overview.drafted.withDraft} of your ${overview.drafted.completed} completed consultations have a draft · ${
                  overview.rows.filter(
                    (row) => row.state === 'ready' || row.state === 'blocked',
                  ).length
                } still need your signature`}
                actions={
                  <AiClassChip tier="green" detail="transcribe & format" />
                }
              />
              <CardBody>
                <MetricStrip label="Note figures" metrics={overview.metrics} />
                <TierNote text={overview.honestNote} />
              </CardBody>
            </Card>

            <NotesQueue rows={overview.rows} openId={openId} onOpen={open} />

            <AiRunSteps
              steps={OPEN_STEPS}
              run={run}
              label="Assembling the note"
            />
            {run.phase === 'error' ? (
              <Text tone="crit">
                {run.error ?? 'The note could not be opened.'}
              </Text>
            ) : null}
            {run.result ? (
              <NoteDraftView
                key={run.result.noteId}
                draft={run.result}
                doctorName={overview.doctorName}
                source={source}
                feedback={feedback}
                onSettled={settled}
              />
            ) : openId === null ? (
              <Box border radius="card" padding="s4" surface="inset">
                <Text size="sm" tone="muted">
                  <AiMark size="xs" className="mr-s1 align-text-bottom" />
                  Choose Open the note on a patient above — the drafted SOAP
                  note appears here for you to read and sign. It is drafted from
                  the recorded encounter and from values already in the chart;
                  nothing in it is generated from anywhere else.
                </Text>
              </Box>
            ) : null}
          </Stack>
        )
      ) : null}
    </DoctorTab>
  );
}
