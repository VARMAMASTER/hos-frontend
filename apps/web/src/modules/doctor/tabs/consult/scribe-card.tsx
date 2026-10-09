import { useEffect, useState } from 'react';
import {
  AiMark,
  AmbientScribeRecorder,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Stack,
  Text,
  type ScribeRecorderStatus,
  type ScribeStep,
} from '@hos/nova-ui';
import type { ConsultationOverview, DoctorDataSource } from '../../data';
import { useAiRun, type Feedback } from '../../ui';
import { ConsultNote } from './consult-note';
import { PrescriptionBlock } from './prescription-block';

interface ScribeSectionProps {
  consult: ConsultationOverview;
  source: DoctorDataSource;
  feedback: Feedback;
}

// The prototype's "Live consultation" card and what the scribe writes after it (03-doctor.html,
// #stopScribe, #scribeDraft). The recording here is simulated: no microphone is used and no audio
// leaves the page. Stop & draft hands the sample consultation to the source, which returns S, O and
// A, and the prescription carried forward: never a plan.
export function ScribeSection({
  consult,
  source,
  feedback,
}: ScribeSectionProps) {
  const { scribe, patient, room, inRoomSince, doctorName } = consult;
  const [status, setStatus] = useState<ScribeRecorderStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [heard, setHeard] = useState(0);
  const run = useAiRun(() => source.draftConsultNote(), scribe.steps.length);

  // While it records, the clock runs and the sample consultation scrolls by.
  useEffect(() => {
    if (status !== 'recording') return;
    const clock = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    const talk = setInterval(
      () => setHeard((index) => (index + 1) % scribe.interim.length),
      1500,
    );
    return () => {
      clearInterval(clock);
      clearInterval(talk);
    };
  }, [status, scribe.interim.length]);

  // The draft is ready when the steps are finished and the source has answered.
  const { fail } = feedback;
  useEffect(() => {
    if (run.phase === 'done') setStatus('done');
    if (run.phase === 'error') {
      setStatus('stopped');
      fail(run.error ?? 'The scribe could not draft the note.');
    }
  }, [run.phase, run.error, fail]);

  const steps: ScribeStep[] = scribe.steps.map((label, index) => ({
    label,
    state:
      index < run.stepIndex
        ? 'done'
        : index === run.stepIndex
          ? 'active'
          : 'pending',
  }));

  return (
    <Stack gap="s6">
      <Card>
        <CardHeader
          title={`Live consultation — ${patient.name}`}
          description={`Token ${patient.token} · ${room} · in room since ${inRoomSince}`}
        />
        <CardBody>
          <AmbientScribeRecorder
            status={status}
            onStatusChange={setStatus}
            onStart={() => setStatus('recording')}
            onStop={() => {
              setStatus('processing');
              run.start();
            }}
            elapsedSeconds={elapsed}
            interim={scribe.interim[heard]}
            language={scribe.languageLabel}
            consent={scribe.consent}
            steps={steps}
          />
          {status === 'stopped' && run.phase === 'error' ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setStatus('processing');
                run.start();
              }}
            >
              Draft again
            </Button>
          ) : null}
        </CardBody>
      </Card>

      {run.result ? (
        <>
          <ConsultNote
            draft={run.result}
            doctorName={doctorName}
            source={source}
            feedback={feedback}
          />
          <PrescriptionBlock
            prescription={run.result.prescription}
            doctorName={doctorName}
            source={source}
            feedback={feedback}
          />
        </>
      ) : (
        <Box border radius="card" padding="s4" surface="inset">
          <Stack direction="horizontal" align="center" gap="s3">
            <Text as="span" aria-hidden="true" tone="muted">
              <AiMark />
            </Text>
            <Text size="sm" tone="muted">
              Record the consultation, then choose Stop &amp; draft — the AI
              Scribe transcribes the Telugu + English consultation and writes S,
              O and A for you to review. It does not write the plan.
            </Text>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
