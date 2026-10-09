import {
  Avatar,
  Card,
  CardBody,
  Chip,
  Heading,
  Stack,
  Text,
} from '@hos/nova-ui';
import type { PatientHeader } from '../data';

export interface PatientBannerProps {
  patient: PatientHeader;
}

const ALERT_ICON = (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    aria-hidden="true"
  >
    <path d="M10 3l7.5 13h-15z" />
    <path d="M10 8.5v3.5M10 14.25h.01" />
  </svg>
);

// The persistent patient header (the prototype's .glass-hero): who this chart is, and the allergies,
// which are on every tab. An allergy is a critical fact, so it is a word and a warning shape, never
// colour alone.
export function PatientBanner({ patient }: PatientBannerProps) {
  return (
    <Card variant="glass" role="region" aria-label="Patient">
      <CardBody>
        <Stack direction="horizontal" align="center" wrap gap="s6">
          <Avatar name={patient.name} size="lg" />
          <Stack gap="s2" className="min-w-0 flex-1">
            <Stack direction="horizontal" align="center" wrap gap="s3">
              <Heading level="h1" size="title">
                {patient.name}
              </Heading>
              <Text as="span" tone="muted" weight="medium">
                {`${patient.age}${patient.sex.charAt(0)}`}
              </Text>
              <Chip tone="ai">{`ABHA ${patient.abha}`}</Chip>
              <Chip
                tone="neutral"
                title="This is the clinician’s view. The patient sees a separate, consent-filtered app."
              >
                Staff view
              </Chip>
            </Stack>
            <Stack
              direction="horizontal"
              align="center"
              wrap
              gap="s2"
              role="group"
              aria-label="Allergies"
            >
              <Text as="span" variant="label" tone="muted">
                Allergy
              </Text>
              {patient.allergies.length === 0 ? (
                <Text as="span" tone="muted" size="sm">
                  None recorded
                </Text>
              ) : (
                patient.allergies.map((allergy) => (
                  <Chip key={allergy.id} tone="crit" icon={ALERT_ICON}>
                    {allergy.substance}
                  </Chip>
                ))
              )}
            </Stack>
          </Stack>
          <Text as="span" size="sm" tone="muted">
            {`MRN ${patient.mrn}`}
          </Text>
        </Stack>
      </CardBody>
    </Card>
  );
}
