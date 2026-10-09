import {
  Banner,
  Box,
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
import { usePatientRecordQuery } from '../../data';
import { FlagChip, PatientRecordTab, Section } from '../../ui';
import type { PatientviewWidgetProps } from './types';

// The patient's own view, previewed. This workspace is staff-only: she signs in to a separate app
// with her phone and an OTP, and can never reach a staff screen. Staff still need to know what she
// can see, before saying something on the phone, so the answer lives here: the categories and
// whether each reaches her or leaves the hospital, and a faithful preview of her app. It is a
// preview, not a shared screen, and nothing on it edits her consent.
export function PatientviewWidget({
  patientId,
  compactMode,
  readonly,
  className,
}: PatientviewWidgetProps) {
  const { query, reload } = usePatientRecordQuery(
    (source, id) => source.getPatientView(id),
    patientId,
  );
  const view = query.status === 'ready' ? query.data : undefined;
  const firstName = view?.patient.name ?? 'The patient';

  return (
    <PatientRecordTab
      patientId={patientId}
      compactMode={compactMode}
      readonly={readonly}
      className={className}
      title="Patient View"
      description="What the patient can see in her own app, and what she controls."
      query={query}
      patient={view?.patient}
      errorMessage="Could not load the patient view."
      onRetry={reload}
      empty={
        view && view.categories.length === 0 && view.app.rows.length === 0 ? (
          <EmptyState
            title="Nothing to preview yet"
            description="Once she has records and consents, her app’s view appears here."
          />
        ) : undefined
      }
    >
      {view ? (
        <Stack gap="s6">
          <Banner tone="info" title="This is a preview, not a shared screen.">
            {`${firstName} cannot see the workspace you are in. She signs in to her own app with her phone and OTP, and sees only what is below.`}
          </Banner>

          <Grid columns={2} gap="s6">
            <Section
              title="What she controls"
              description="Her consent, per category. She can change these herself from her app"
              actions={
                <Chip tone="good" icon="✓">
                  DPDP
                </Chip>
              }
              footnote="The three No rows are the important ones. A patient portal that leaks a differential diagnosis or an unapproved AI draft causes real harm, so those categories are structurally excluded, not merely hidden behind a flag."
            >
              <Table caption="What the patient can see, by category">
                <TableHead>
                  <tr>
                    <TableHeaderCell>Category</TableHeaderCell>
                    <TableHeaderCell>Visible to her</TableHeaderCell>
                    <TableHeaderCell>Shared outside</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {view.categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <Text as="span" weight="semibold">
                          {category.label}
                        </Text>
                        {category.hint ? (
                          <Text size="sm" tone="muted">
                            {category.hint}
                          </Text>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <FlagChip flag={category.visibleToPatient} />
                      </TableCell>
                      <TableCell>
                        <FlagChip flag={category.sharedOutside} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Section>

            <Section
              title="Her app, right now"
              description="Same data, patient language"
              actions={<Chip tone="neutral">/patient</Chip>}
            >
              <Box
                surface="elevated"
                border
                radius="hero"
                className="mx-auto w-full max-w-sm overflow-hidden"
              >
                <Box className="bg-primary p-s5 text-on-primary">
                  <Heading level="h4" className="text-on-primary">
                    {view.app.greeting}
                  </Heading>
                  <Text size="sm" className="text-on-primary">
                    {view.app.subline}
                  </Text>
                </Box>
                <Stack as="ul" gap="s3" className="p-s4">
                  {view.app.rows.map((row) => (
                    <li key={row.id}>
                      <Box surface="inset" radius="card" padding="s3">
                        <Heading level="h5">{row.title}</Heading>
                        <Text size="sm">{row.body}</Text>
                        {row.note ? (
                          <Text size="sm" tone="muted">
                            {row.note}
                          </Text>
                        ) : null}
                      </Box>
                    </li>
                  ))}
                  {view.app.withheld.map((line) => (
                    <li key={line}>
                      <Box
                        border
                        radius="card"
                        padding="s3"
                        className="border-dashed"
                      >
                        <Text size="sm" tone="muted">
                          {line}
                        </Text>
                      </Box>
                    </li>
                  ))}
                </Stack>
              </Box>
            </Section>
          </Grid>
        </Stack>
      ) : null}
    </PatientRecordTab>
  );
}
