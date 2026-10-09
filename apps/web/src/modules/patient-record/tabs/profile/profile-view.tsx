import {
  Box,
  Chip,
  EmptyState,
  Grid,
  Heading,
  Stack,
  Text,
} from '@hos/nova-ui';
import { usePatientRecordQuery } from '../../data';
import {
  DefinitionList,
  PatientRecordTab,
  Section,
  type DefinitionItem,
} from '../../ui';
import type { ProfileWidgetProps } from './types';

export function ProfileWidget({
  patientId,
  compactMode,
  readonly,
  className,
}: ProfileWidgetProps) {
  const { query, reload } = usePatientRecordQuery(
    (source, id) => source.getProfile(id),
    patientId,
  );
  const profile = query.status === 'ready' ? query.data : undefined;

  const demographics: DefinitionItem[] = profile
    ? [
        {
          id: 'dob',
          term: 'Date of birth',
          description: profile.demographics.dateOfBirth,
        },
        { id: 'sex', term: 'Sex', description: profile.demographics.sex },
        { id: 'phone', term: 'Phone', description: profile.demographics.phone },
        {
          id: 'blood',
          term: 'Blood group',
          description: profile.demographics.bloodGroup,
        },
        {
          id: 'address',
          term: 'Address',
          description: profile.demographics.address,
          wide: true,
        },
        {
          id: 'emergency',
          term: 'Emergency contact',
          description: `${profile.demographics.emergencyContact.name} (${profile.demographics.emergencyContact.relation}) · ${profile.demographics.emergencyContact.phone}`,
          wide: true,
        },
        {
          id: 'registered-on',
          term: 'Registered on',
          description: profile.demographics.registeredOn,
        },
        {
          id: 'registered-by',
          term: 'Registered by',
          description: profile.demographics.registeredBy,
        },
      ]
    : [];

  return (
    <PatientRecordTab
      patientId={patientId}
      compactMode={compactMode}
      readonly={readonly}
      className={className}
      title="Profile"
      description="Demographics, recorded conditions and the vitals baseline."
      query={query}
      patient={profile?.patient}
      errorMessage="Could not load the profile."
      onRetry={reload}
    >
      {profile ? (
        <Grid columns={3} gap="s6">
          <Stack gap="s6" className="min-w-0 md:col-span-2">
            <Section
              title="Demographics"
              actions={
                <Text as="span" size="sm" tone="muted">
                  {`MRN ${profile.patient.mrn}`}
                </Text>
              }
            >
              <DefinitionList items={demographics} />
            </Section>

            <Section
              title="Conditions"
              actions={
                <Text as="span" size="sm" tone="muted">
                  {`${profile.conditions.length} recorded`}
                </Text>
              }
            >
              {profile.conditions.length === 0 ? (
                <EmptyState
                  title="No conditions recorded"
                  description="Conditions appear here once a clinician records them."
                />
              ) : (
                <Stack as="ul" gap="s4">
                  {profile.conditions.map((condition) => (
                    <li key={condition.id}>
                      <Stack gap="s1">
                        <Stack
                          direction="horizontal"
                          align="center"
                          wrap
                          gap="s3"
                        >
                          <Heading level="h4">{condition.name}</Heading>
                          {condition.provenance ? (
                            <Chip tone="info">Outside record</Chip>
                          ) : null}
                        </Stack>
                        <Text size="sm" tone="muted">
                          {`Onset ${condition.onset}${condition.detail ? ` · ${condition.detail}` : ''} · status: `}
                          <Text as="span" size="sm" weight="semibold">
                            {condition.status}
                          </Text>
                        </Text>
                        {condition.provenance ? (
                          <Text size="sm" tone="muted">
                            {`Entered from an outside record: ${condition.provenance}. Worth verifying.`}
                          </Text>
                        ) : null}
                      </Stack>
                    </li>
                  ))}
                </Stack>
              )}
            </Section>
          </Stack>

          <Section
            title="Vitals baseline"
            actions={
              <Text as="span" size="sm" tone="muted">
                {`Last recorded ${profile.vitals.recordedOn}`}
              </Text>
            }
          >
            <Stack gap="s4">
              <DefinitionList
                variant="tiles"
                items={profile.vitals.readings.map((reading) => ({
                  id: reading.id,
                  term: reading.label,
                  description: reading.value,
                }))}
              />
              <Box>
                <Text size="sm" tone="muted">
                  {'BMI category: '}
                  <Text as="span" size="sm" weight="semibold">
                    {profile.bmiCategory}
                  </Text>
                  {' · the visit-by-visit trend is on the Timeline tab.'}
                </Text>
              </Box>
            </Stack>
          </Section>
        </Grid>
      ) : null}
    </PatientRecordTab>
  );
}
