import {
  Chip,
  EmptyState,
  Grid,
  Heading,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from '@hos/nova-ui';
import { usePatientRecordQuery, type PatientSnapshot } from '../../data';
import {
  DefinitionList,
  FlagChip,
  FlagGlyph,
  PatientRecordTab,
  Section,
} from '../../ui';
import { BriefSection } from './brief-section';
import { CareGapsSection } from './care-gaps-section';
import { InteropSection } from './interop-section';
import { TrajectoriesSection } from './trajectories-section';
import type { SnapshotWidgetProps } from './types';

function isEmpty(snapshot: PatientSnapshot): boolean {
  return (
    snapshot.patient.allergies.length === 0 &&
    snapshot.problems.length === 0 &&
    snapshot.medications.length === 0 &&
    snapshot.attention.length === 0 &&
    snapshot.trajectories.length === 0 &&
    snapshot.careGaps.length === 0 &&
    snapshot.outsideRecords.length === 0 &&
    snapshot.vitals.readings.length === 0
  );
}

// The one screen before the patient sits down: what is wrong, what she is on, what changed, what is
// overdue, what to watch. Everything here is a recorded fact or a consistency check between records,
// never a prediction; anything an AI wrote is a draft until a person approves it.
export function SnapshotWidget({
  patientId,
  compactMode,
  readonly,
  className,
}: SnapshotWidgetProps) {
  const { query, reload, update } = usePatientRecordQuery(
    (source, id) => source.getSnapshot(id),
    patientId,
  );
  const snapshot = query.status === 'ready' ? query.data : undefined;

  return (
    <PatientRecordTab
      patientId={patientId}
      compactMode={compactMode}
      readonly={readonly}
      className={className}
      title="Clinical Snapshot"
      description="What is wrong, what she is on, what changed and what is overdue, before the consultation."
      query={query}
      patient={snapshot?.patient}
      errorMessage="Could not load the clinical snapshot."
      onRetry={reload}
      empty={
        snapshot && isEmpty(snapshot) ? (
          <EmptyState
            title="Nothing recorded yet"
            description="Problems, medications, vitals and results appear here once they are recorded."
          />
        ) : undefined
      }
    >
      {snapshot ? (
        <Stack gap="s6">
          <BriefSection snapshot={snapshot} readonly={readonly} />

          <Grid columns={2} gap="s6">
            <Section
              title="Needs your attention"
              description="Inconsistencies inside her own record, not predictions"
              attention
              actions={
                <FlagChip
                  flag={{
                    tone: 'crit',
                    label: `${snapshot.attention.length} to review`,
                  }}
                />
              }
              footnote="HOS flags contradictions between records it already holds. It does not diagnose, and it never changes a prescription."
            >
              <Stack as="ul" gap="s6">
                {snapshot.attention.map((item) => (
                  <li key={item.id}>
                    <Stack gap="s1">
                      <Heading level="h4">{item.title}</Heading>
                      <Text size="sm">{item.detail}</Text>
                      <Stack
                        direction="horizontal"
                        align="center"
                        wrap
                        gap="s2"
                      >
                        <Text as="span" size="sm" tone="muted">
                          {`Sources: ${item.sources}`}
                        </Text>
                        {item.referenceAlert ? (
                          <Chip tone="warn">Reference alert · your call</Chip>
                        ) : null}
                      </Stack>
                    </Stack>
                  </li>
                ))}
              </Stack>
            </Section>

            <Section
              title="Active problems & medications"
              description="Current as of today, with how long she has been on each"
            >
              <Stack gap="s4">
                <Table caption="Active problems">
                  <TableHead>
                    <tr>
                      <TableHeaderCell>Problem</TableHeaderCell>
                      <TableHeaderCell>Since</TableHeaderCell>
                      <TableHeaderCell>Control</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {snapshot.problems.map((problem) => (
                      <TableRow key={problem.id}>
                        <TableCell>
                          <Text as="span" weight="semibold">
                            {problem.name}
                          </Text>
                          {problem.note ? (
                            <Text size="sm" tone="muted">
                              {problem.note}
                            </Text>
                          ) : null}
                        </TableCell>
                        <TableCell mono>{problem.since}</TableCell>
                        <TableCell>
                          <FlagChip flag={problem.control} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Table caption="Current medications">
                  <TableHead>
                    <tr>
                      <TableHeaderCell>Medication</TableHeaderCell>
                      <TableHeaderCell>Dose</TableHeaderCell>
                      <TableHeaderCell>On it since</TableHeaderCell>
                      <TableHeaderCell>Refills</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {snapshot.medications.map((medication) => (
                      <TableRow key={medication.id}>
                        <TableCell>
                          <Text as="span" weight="semibold">
                            {medication.name}
                          </Text>
                        </TableCell>
                        <TableCell mono>{medication.dose}</TableCell>
                        <TableCell mono>{medication.since}</TableCell>
                        <TableCell>
                          <FlagChip flag={medication.refills} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Stack>
            </Section>
          </Grid>

          <Grid columns={2} gap="s6">
            <Section
              title="Allergies"
              description="Recorded allergies carry onto every prescription screen"
              attention={snapshot.patient.allergies.length > 0}
            >
              {snapshot.patient.allergies.length === 0 ? (
                <Text tone="muted">No allergies recorded.</Text>
              ) : (
                <Stack as="ul" gap="s3">
                  {snapshot.patient.allergies.map((allergy) => (
                    <li key={allergy.id}>
                      <Stack
                        direction="horizontal"
                        align="center"
                        wrap
                        gap="s3"
                      >
                        <Chip tone="crit" icon={<FlagGlyph tone="crit" />}>
                          Critical allergy
                        </Chip>
                        <Text as="span" weight="semibold">
                          {allergy.substance}
                        </Text>
                        <Text as="span" size="sm" tone="muted">
                          {`Recorded ${allergy.recordedOn}`}
                        </Text>
                      </Stack>
                    </li>
                  ))}
                </Stack>
              )}
            </Section>

            <Section
              title="Latest vitals"
              actions={
                <Text as="span" size="sm" tone="muted">
                  {`Recorded ${snapshot.vitals.recordedOn}`}
                </Text>
              }
            >
              <DefinitionList
                variant="tiles"
                items={snapshot.vitals.readings.map((reading) => ({
                  id: reading.id,
                  term: reading.label,
                  description: (
                    <Stack gap="s1" align="start">
                      <Text as="span" size="lg" weight="semibold">
                        {reading.value}
                      </Text>
                      {reading.flag ? <FlagChip flag={reading.flag} /> : null}
                    </Stack>
                  ),
                }))}
              />
            </Section>
          </Grid>

          <TrajectoriesSection trajectories={snapshot.trajectories} />

          <Grid columns={2} gap="s6">
            <CareGapsSection
              gaps={snapshot.careGaps}
              patientId={snapshot.patient.id}
              readonly={readonly}
              onChange={(gap) =>
                update((data) => ({
                  ...data,
                  careGaps: data.careGaps.map((existing) =>
                    existing.id === gap.id ? gap : existing,
                  ),
                }))
              }
            />

            <Section
              title="Records from other hospitals"
              description="Pulled under her ABHA consent; she can revoke it at any time"
              actions={<Chip tone="ai">ABHA linked</Chip>}
            >
              <Stack as="ul" gap="s4">
                {snapshot.outsideRecords.map((record) => (
                  <li key={record.id}>
                    <Stack gap="s1">
                      <Text>
                        <Text as="span" weight="semibold">
                          {record.facility}
                        </Text>
                        {` — ${record.dateLabel}`}
                      </Text>
                      <Text size="sm" tone="muted">
                        {record.summary}
                      </Text>
                      {record.note ? (
                        <Text
                          size="sm"
                          tone={record.noteTone === 'crit' ? 'crit' : 'good'}
                          weight="medium"
                        >
                          {record.noteTone ? (
                            <FlagGlyph
                              tone={record.noteTone}
                              className="mr-s1 inline size-icon-xs align-text-bottom"
                            />
                          ) : null}
                          {record.note}
                        </Text>
                      ) : null}
                    </Stack>
                  </li>
                ))}
              </Stack>
            </Section>
          </Grid>

          <InteropSection trace={snapshot.interop} />
        </Stack>
      ) : null}
    </PatientRecordTab>
  );
}
