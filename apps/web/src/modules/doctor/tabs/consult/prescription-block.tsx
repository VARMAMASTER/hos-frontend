import { useState } from 'react';
import {
  AiClassChip,
  AiDraftBlock,
  Banner,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  TextField,
  VisuallyHidden,
} from '@hos/nova-ui';
import type { DoctorDataSource, PrescriptionDraft, RxLine } from '../../data';
import { Prose, useDraftDecision, type Feedback } from '../../ui';

interface PrescriptionBlockProps {
  prescription: PrescriptionDraft;
  doctorName: string;
  source: DoctorDataSource;
  feedback: Feedback;
}

const NEEDS_DURATION = 'Enter a duration for every line.';

// The prototype's prescription (.rx-card): a carry-forward of her existing lines, never a proposal.
// The doses are the ones already on her record. It is a draft the doctor approves before anything
// is sent, and the doctor can edit the durations; the allergy file is re-checked after an edit.
export function PrescriptionBlock({
  prescription,
  doctorName,
  source,
  feedback,
}: PrescriptionBlockProps) {
  const [lines, setLines] = useState<RxLine[]>(prescription.lines);
  const [editing, setEditing] = useState(false);
  const [draftDurations, setDraftDurations] = useState<Record<string, string>>(
    {},
  );
  const [invalid, setInvalid] = useState(false);
  const [recheck, setRecheck] = useState<string | null>(null);

  const decision = useDraftDecision(feedback, {
    approve: () =>
      source.approvePrescription(
        lines.map(({ id, duration }) => ({ id, duration })),
      ),
  });

  function startEditing() {
    setDraftDurations(
      Object.fromEntries(lines.map((line) => [line.id, line.duration])),
    );
    setInvalid(false);
    setEditing(true);
  }

  async function save() {
    if (lines.some((line) => (draftDurations[line.id] ?? '').trim() === '')) {
      setInvalid(true);
      return;
    }
    const next = lines.map((line) => ({
      ...line,
      duration: (draftDurations[line.id] ?? '').trim(),
    }));
    let text = '';
    const ok = await feedback.attempt(async () => {
      text = await source.checkPrescription(
        next.map(({ id, duration }) => ({ id, duration })),
      );
    });
    if (!ok) return;
    setLines(next);
    setRecheck(text);
    setEditing(false);
  }

  return (
    <AiDraftBlock
      {...decision}
      title="Prescription — carried forward from her current list"
      approverName={doctorName}
      verb="Approve & send to WhatsApp"
      approvedVerb="Sent to WhatsApp"
      rejectable={false}
      onEdit={editing ? undefined : startEditing}
      labels={{ edit: 'Edit prescription' }}
      badges={<AiClassChip tier="green" detail="repeat, not proposal" />}
      source={
        <Text size="xs" tone="muted">
          {prescription.costNote}
        </Text>
      }
    >
      <Stack gap="s4">
        <Text size="sm" tone="muted">
          Her existing lines, repeated verbatim with today&apos;s dates. Edit
          any of them before sending.
        </Text>
        <Table caption="Prescription lines carried forward" density="compact">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Drug</TableHeaderCell>
              <TableHeaderCell>Dosage — తెలుగు / English</TableHeaderCell>
              <TableHeaderCell>On it since</TableHeaderCell>
              <TableHeaderCell>Duration</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>
                  <Text as="span" weight="semibold">
                    {line.drug}
                  </Text>
                  {line.dispensedAs ? (
                    <Text size="xs" tone="muted">
                      {line.dispensedAs}
                    </Text>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Text as="span" lang="te">
                    {line.dosageLocal}
                  </Text>
                  <Text size="xs" tone="muted" lang="en">
                    {line.dosageEn}
                  </Text>
                </TableCell>
                <TableCell mono>{line.since}</TableCell>
                <TableCell>
                  {editing ? (
                    <TextField
                      label={
                        <VisuallyHidden>{`Duration of ${line.drug}`}</VisuallyHidden>
                      }
                      value={draftDurations[line.id] ?? ''}
                      error={
                        invalid && (draftDurations[line.id] ?? '').trim() === ''
                          ? NEEDS_DURATION
                          : undefined
                      }
                      onChange={(event) =>
                        setDraftDurations((current) => ({
                          ...current,
                          [line.id]: event.target.value,
                        }))
                      }
                    />
                  ) : (
                    <Text as="span" font="mono">
                      {line.duration}
                    </Text>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {editing ? (
          <Stack direction="horizontal" gap="s3" wrap>
            <Button size="sm" onClick={() => void save()}>
              Save changes
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </Stack>
        ) : null}
        <Banner tone="warn" title="Allergies on file before you send">
          <Prose text={prescription.allergyNote} />
        </Banner>
        {recheck ? (
          <Banner tone="ai" title="Checked again after your edit">
            <Prose text={recheck} />
          </Banner>
        ) : null}
      </Stack>
    </AiDraftBlock>
  );
}
