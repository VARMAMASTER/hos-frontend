import {
  AiProgressSteps,
  Banner,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from '@hos/nova-ui';
import type {
  AdmissionRequest,
  AdmissionResult,
  PayerOption,
} from '../../data';

export interface AdmitCardProps {
  patientName: string;
  bedId: string;
  payer: PayerOption;
  // The hint under the title: what is still missing, or that all is ready.
  hint: string;
  busy: boolean;
  result: AdmissionResult | null;
  onAdmit: () => void;
}

// The prototype's "Admit": one click writes the records every other workspace needs. The fan-out is
// on screen, named, because "enter once" is the whole value claim.
export function AdmitCard({
  patientName,
  bedId,
  payer,
  hint,
  busy,
  result,
  onAdmit,
}: AdmitCardProps) {
  const steps = [
    `Writing FHIR Encounter — inpatient, ${patientName}…`,
    `Allocating bed ${bedId} and locking it on the bed board…`,
    'Opening the IPD bill and posting the advance receipt…',
    `Assembling the ${payer.claim}…`,
    `Queueing the nursing admission assessment on ${bedId}…`,
    'Ordering the pre-op panel and requesting the OT slot…',
  ];
  return (
    <Card>
      <CardHeader
        title="Admit"
        description={hint}
        actions={
          <Button onClick={onAdmit} loading={busy} disabled={result !== null}>
            {result
              ? `✓ Admitted — ${bedId}`
              : `Admit ${patientName} to ${bedId}`}
          </Button>
        }
      />
      <CardBody>
        <Stack gap="s4">
          {busy ? (
            <AiProgressSteps
              label="Writing the records"
              steps={steps}
              currentIndex={0}
            />
          ) : null}
          {result ? <FanOut result={result} steps={steps} /> : null}
          {!busy && !result ? (
            <Text size="sm" tone="muted">
              Nothing has been created yet. One click writes the IPD encounter,
              the bill, the payer packet, the nursing assessment, the pre-op lab
              order and the OT request — and the ward nurse's chart is filled in
              before the patient reaches the lift.
            </Text>
          ) : null}
        </Stack>
      </CardBody>
    </Card>
  );
}

function FanOut({
  result,
  steps,
}: {
  result: AdmissionResult;
  steps: string[];
}) {
  return (
    <Stack gap="s4">
      <AiProgressSteps
        label="Writing the records"
        steps={steps}
        currentIndex={steps.length}
        summary="All 6 records written"
      />
      <Banner tone="good" title="✓ Admitted">
        {result.summary}
      </Banner>
      <Grid
        role="list"
        columns={3}
        gap="s3"
        aria-label="Records created by this admission"
      >
        {result.records.map((record) => (
          <Box key={record.workspace} role="listitem">
            <Stack gap="s1">
              <Text as="span" size="xs" tone="muted" weight="semibold">
                {record.workspace}
              </Text>
              <Text as="span" weight="semibold">
                {record.record}
              </Text>
              <Text as="span" size="sm" tone="muted">
                {record.detail}
              </Text>
            </Stack>
          </Box>
        ))}
      </Grid>
    </Stack>
  );
}

// The audit of the value claim: every fact, where it came from, and where it is reused.
export function ReuseTable({ reuse }: { reuse: AdmissionRequest['reuse'] }) {
  return (
    <Card>
      <CardHeader
        title="Collected once → reused where"
        description="The audit of the value claim. If a fact appears twice in this column, we have not solved the problem."
      />
      <CardBody>
        <Table caption="Collected once → reused where">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Fact</TableHeaderCell>
              <TableHeaderCell>Where it came from</TableHeaderCell>
              <TableHeaderCell>Reused in — without retyping</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reuse.map((row) => (
              <TableRow key={row.fact}>
                <TableCell>
                  <Text as="span" weight="semibold">
                    {row.fact}
                  </Text>
                </TableCell>
                <TableCell>{row.source}</TableCell>
                <TableCell>
                  <Text as="span" size="sm" tone="muted">
                    {row.reusedIn}
                  </Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
