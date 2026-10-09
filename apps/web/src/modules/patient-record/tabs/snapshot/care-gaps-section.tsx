import { useState } from 'react';
import {
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  VisuallyHidden,
} from '@hos/nova-ui';
import {
  usePatientRecord,
  usePatientRecordAction,
  type CareGap,
} from '../../data';
import { ActionFeedback, FlagChip, Section, type ActionNotice } from '../../ui';

export interface CareGapsSectionProps {
  gaps: CareGap[];
  patientId: string;
  // A read-only chart lists the gaps without the buttons that act on them.
  readonly?: boolean;
  onChange: (gap: CareGap) => void;
}

// Care gaps for a T2DM + CKD patient, from her own guideline schedule (the prototype's "Overdue &
// due soon"). Each action is a real, confirmed change at the source; the row then says what was done.
export function CareGapsSection({
  gaps,
  patientId,
  readonly = false,
  onChange,
}: CareGapsSectionProps) {
  const source = usePatientRecord();
  const action = usePatientRecordAction();
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const open = gaps.filter(
    (gap) => gap.status.tone === 'crit' || gap.status.tone === 'warn',
  ).length;

  async function act(gap: CareGap) {
    setNotice(null);
    const updated = await action.run(() =>
      source.actOnCareGap(gap.id, patientId),
    );
    if (!updated) return;
    onChange(updated);
    setNotice({ title: updated.done ?? 'Done', detail: updated.item });
  }

  return (
    <Stack gap="s4">
      <ActionFeedback
        notice={notice}
        error={action.error}
        onDismissNotice={() => setNotice(null)}
        onDismissError={action.clearError}
      />
      <Section
        title="Overdue & due soon"
        description="Care gaps for a T2DM + CKD patient, from her own guideline schedule"
        actions={<Chip tone="warn">{`${open} open`}</Chip>}
      >
        <Table caption="Care gaps">
          <TableHead>
            <tr>
              <TableHeaderCell>Item</TableHeaderCell>
              <TableHeaderCell>Last done</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>
                <VisuallyHidden>Action</VisuallyHidden>
              </TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {gaps.map((gap) => (
              <TableRow key={gap.id}>
                <TableCell>{gap.item}</TableCell>
                <TableCell mono>{gap.lastDone}</TableCell>
                <TableCell>
                  <FlagChip flag={gap.status} />
                </TableCell>
                <TableCell align="right">
                  {gap.done ? (
                    <Text as="span" size="sm" tone="muted">
                      {gap.done}
                    </Text>
                  ) : gap.action && !readonly ? (
                    <Button
                      size="sm"
                      variant={
                        gap.action.kind === 'chase' ? 'ghost' : 'primary'
                      }
                      disabled={action.busy}
                      aria-label={`${gap.action.label} ${gap.item}`}
                      onClick={() => void act(gap)}
                    >
                      {gap.action.label}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
    </Stack>
  );
}
