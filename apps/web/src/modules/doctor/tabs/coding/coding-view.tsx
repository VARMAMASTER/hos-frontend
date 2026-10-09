import { useId, useState } from 'react';
import {
  AiClassChip,
  AiPanel,
  ApprovalBar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  EmptyState,
  Stack,
  Text,
} from '@hos/nova-ui';
import {
  useDoctorQuery,
  type CodingOverview,
  type DoctorDataSource,
  type IcdProposal,
} from '../../data';
import {
  ActionFeedback,
  DoctorTab,
  MetricStrip,
  TierNote,
  useFeedback,
  type Feedback,
} from '../../ui';
import { AddCodeDialog } from './add-code-dialog';
import { CodeTable } from './code-table';
import type { CodingWidgetProps } from './types';

// The prototype's Coding & Claims (03-doctor.html, data-panel="coding"): GREEN. ICD-10 codes proposed
// from the note, each naming the line it came from. The doctor confirms them one at a time and
// approves the confirmed ones; HOS files nothing on its own, and no code is confirmed for them.
export function CodingWidget({
  patientId,
  compactMode,
  className,
}: CodingWidgetProps) {
  const { query, source, reload } = useDoctorQuery((s) => s.getCoding());
  const feedback = useFeedback();
  const coding = query.status === 'ready' ? query.data : null;

  return (
    <DoctorTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="Coding & Claims"
      description="ICD-10 codes proposed from the note, for you to confirm."
      query={query}
      errorMessage="Could not load the coding proposal."
      onRetry={reload}
    >
      {query.status === 'ready' ? (
        coding ? (
          <CodingDesk
            key={coding.patient.token}
            coding={coding}
            source={source}
            feedback={feedback}
          />
        ) : (
          <EmptyState
            title="No codes to propose yet"
            description="Codes are proposed from a patient's note. Open a patient from My Queue once their note is drafted."
          />
        )
      ) : null}
    </DoctorTab>
  );
}

interface CodingDeskProps {
  coding: CodingOverview;
  source: DoctorDataSource;
  feedback: Feedback;
}

function CodingDesk({ coding, source, feedback }: CodingDeskProps) {
  const [codes, setCodes] = useState<IcdProposal[]>(coding.codes);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [filed, setFiled] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const titleId = useId();

  const allFiled = codes.length > 0 && filed.length === codes.length;

  function toggle(code: string, on: boolean) {
    setConfirmed((current) =>
      on ? [...current, code] : current.filter((item) => item !== code),
    );
  }

  async function approve() {
    if (confirmed.length === 0) return;
    setBusy(true);
    const chosen = codes
      .map((item) => item.code)
      .filter((code) => confirmed.includes(code));
    const ok = await feedback.attempt(() => source.approveCodes(chosen));
    setBusy(false);
    if (!ok) return;
    setFiled((current) => [...current, ...chosen]);
    setConfirmed([]);
    feedback.notify({
      title: `${chosen.length} code${chosen.length === 1 ? '' : 's'} approved`,
      detail:
        'Stored beside your own local text — this is what makes the next claim defensible.',
    });
  }

  async function addCode(code: string, term: string): Promise<boolean> {
    const result: { added?: IcdProposal } = {};
    const ok = await feedback.attempt(async () => {
      result.added = await source.addManualCode({ code, term });
    });
    const { added } = result;
    if (!ok || !added) return false;
    setCodes((current) => [...current, added]);
    // The doctor typed it, so it starts confirmed: it is their call, not a proposal.
    setConfirmed((current) => [...current, added.code]);
    return true;
  }

  return (
    <Stack gap="s6">
      <ActionFeedback {...feedback.props} />
      <AiPanel
        title={`ICD-10 codes proposed from your note — ${coding.patient.name}`}
        titleId={titleId}
        state={allFiled ? 'approved' : 'draft'}
        status={
          <>
            {allFiled ? (
              <Chip tone="good" icon="✓">
                Approved · {coding.doctorName}
              </Chip>
            ) : (
              <Chip tone="ai">
                {filed.length === 0
                  ? 'Draft — awaiting approval'
                  : `${filed.length} of ${codes.length} approved`}
              </Chip>
            )}
            <AiClassChip tier="green" detail="coding" />
          </>
        }
        footer={
          <Stack gap="s3">
            <ApprovalBar
              labelledBy={titleId}
              announce={false}
              busy={busy}
              approveLabel="Approve the confirmed codes"
              approveDisabled={confirmed.length === 0}
              onApprove={() => void approve()}
              approvedBy={allFiled ? coding.doctorName : undefined}
              approvedNote={`Approved by ${coding.doctorName} — logged to the audit trail.`}
              actions={
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAdding(true)}
                  >
                    Add a code
                  </Button>
                  <Text as="span" size="xs" tone="muted">
                    {confirmed.length} of {codes.length} confirmed
                  </Text>
                </>
              }
            />
            <Text size="xs" tone="muted">
              {coding.notCoded}
            </Text>
          </Stack>
        }
      >
        <Stack gap="s4">
          <Text size="sm" tone="muted">
            Each code names the line of the note it came from. You confirm; HOS
            files nothing on its own.
          </Text>
          <CodeTable
            codes={codes}
            confirmed={confirmed}
            filed={filed}
            onToggle={toggle}
          />
          <TierNote text={coding.whyNote} />
        </Stack>
      </AiPanel>

      <Card>
        <CardHeader
          title="How the coding is holding up"
          description="Measured against the codes you actually signed, not against itself"
        />
        <CardBody>
          <MetricStrip label="Coding figures" metrics={coding.metrics} />
        </CardBody>
      </Card>

      <AddCodeDialog
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={addCode}
      />
    </Stack>
  );
}
