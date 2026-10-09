import { useState } from 'react';
import {
  AiClassChip,
  AiDraftBlock,
  AiSourceLine,
  Button,
  Card,
  CardBody,
  SafeMarkdown,
  Stack,
  Text,
  type AiDraftStatus,
} from '@hos/nova-ui';
import {
  usePatientRecord,
  usePatientRecordAction,
  type BriefDraft,
  type PatientSnapshot,
} from '../../data';
import { ActionFeedback } from '../../ui';

export interface BriefSectionProps {
  snapshot: PatientSnapshot;
  // A read-only chart can read a briefing but never approve one.
  readonly?: boolean;
}

// The pre-consult briefing (the prototype's "What changed since her last visit"). Nothing is written
// until the clinician asks; what comes back is a draft, marked as AI in words and with its sources,
// and it is final only when a person approves it.
export function BriefSection({
  snapshot,
  readonly = false,
}: BriefSectionProps) {
  const source = usePatientRecord();
  const action = usePatientRecordAction();
  const [brief, setBrief] = useState<BriefDraft | null>(null);
  const [status, setStatus] = useState<AiDraftStatus>('pending');
  const [writing, setWriting] = useState(false);
  const approver = snapshot.patient.clinician;

  async function draft() {
    setWriting(true);
    setBrief(null);
    setStatus('generating');
    const written = await action.run(() =>
      source.generateBrief(snapshot.patient.id),
    );
    setWriting(false);
    if (written) {
      setBrief(written);
      setStatus('pending');
    }
  }

  async function approve() {
    if (!brief) return;
    const approved = await action.run(() =>
      source.approveBrief(brief.id, approver),
    );
    // A failed approval leaves the draft a draft.
    if (!approved) setStatus('undone');
  }

  return (
    <Stack gap="s4">
      <ActionFeedback
        notice={null}
        error={action.error}
        onDismissError={action.clearError}
      />
      {brief || writing ? (
        <AiDraftBlock
          title={brief?.title ?? `What changed since ${snapshot.lastVisit}`}
          status={status}
          onStatusChange={setStatus}
          approverName={approver}
          canApprove={!readonly}
          onApprove={() => void approve()}
          onUndo={() => {
            if (brief) void action.run(() => source.withdrawApproval(brief.id));
          }}
          badges={
            <AiClassChip tier="green" detail="summary of recorded events" />
          }
          source={
            brief ? <AiSourceLine>{brief.sources}</AiSourceLine> : undefined
          }
          actions={
            <Button
              variant="ai"
              size="sm"
              loading={writing}
              loadingText={`Reading ${snapshot.eventCount} events…`}
              onClick={() => void draft()}
            >
              Brief me again
            </Button>
          }
        >
          {brief ? (
            <SafeMarkdown text={brief.paragraphs.join('\n\n')} />
          ) : (
            <Text tone="muted">{`Reading ${snapshot.eventCount} events…`}</Text>
          )}
        </AiDraftBlock>
      ) : (
        <Card role="region" aria-label="Pre-consult briefing">
          <CardBody>
            <Stack
              direction="horizontal"
              align="center"
              justify="between"
              wrap
              gap="s4"
            >
              <Text tone="muted" className="min-w-0 flex-1">
                {`HOS can read ${snapshot.eventCount} events across four years and draft what changed since ${snapshot.lastVisit}. It is a draft until you approve it.`}
              </Text>
              <Button variant="ai" size="sm" onClick={() => void draft()}>
                Brief me on this patient
              </Button>
            </Stack>
          </CardBody>
        </Card>
      )}
    </Stack>
  );
}
