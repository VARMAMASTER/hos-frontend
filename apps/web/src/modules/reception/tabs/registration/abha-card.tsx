import { useId, useRef, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Chip,
  Stack,
  Text,
  TextField,
} from '@hos/nova-ui';
import type { AbhaProfile } from '../../data';

export interface AbhaCardProps {
  consent: boolean;
  onConsentChange: (consent: boolean) => void;
  profile: AbhaProfile | null;
  busy: boolean;
  // Fetches with consent; the card has already checked both the number and the opt-in.
  onFetch: (abha: string) => void;
}

// ABHA / ABDM linking (the prototype's #abhaBlock). Consent first: the opt-in is unticked until the
// patient agrees, and without it nothing is fetched. It is not an AI feature, so it carries no AI mark.
export function AbhaCard({
  consent,
  onConsentChange,
  profile,
  busy,
  onFetch,
}: AbhaCardProps) {
  const [abha, setAbha] = useState('');
  const [abhaError, setAbhaError] = useState<string>();
  const [consentError, setConsentError] = useState(false);
  const abhaRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const consentErrorId = useId();

  function requestFetch() {
    const missingAbha = !abha.trim();
    setAbhaError(missingAbha ? 'Enter the ABHA number or address.' : undefined);
    setConsentError(!consent);
    if (!consent) {
      consentRef.current?.focus();
      return;
    }
    if (missingAbha) {
      abhaRef.current?.focus();
      return;
    }
    onFetch(abha.trim());
  }

  return (
    <Card>
      <CardHeader
        title="ABHA — link once, never type demographics again"
        actions={
          profile ? (
            <Chip tone="good" icon="✓">
              ABHA linked · consent on file
            </Chip>
          ) : (
            <Chip tone="info">ABDM · M2 certified</Chip>
          )
        }
      />
      <CardBody>
        <Stack gap="s4">
          <Text size="sm">
            Scan the patient's ABHA QR (or enter the 14-digit ABHA number). With
            their consent HOS pulls verified demographics and prior records from
            any ABDM-linked facility — no retyping, and no repeat tests the
            patient already paid for elsewhere.
          </Text>
          <Stack direction="horizontal" align="end" gap="s3" wrap>
            <TextField
              ref={abhaRef}
              label="ABHA number / address"
              placeholder="12-3456-7890-1234 or name@abdm"
              autoComplete="off"
              value={abha}
              error={abhaError}
              onChange={(event) => setAbha(event.target.value)}
              className="min-w-0 flex-1"
            />
            <Button onClick={requestFetch} loading={busy}>
              Fetch with consent
            </Button>
          </Stack>
          <Stack gap="s1">
            <Checkbox
              ref={consentRef}
              label="The patient agrees to share their ABHA records with this hospital"
              checked={consent}
              aria-invalid={consentError || undefined}
              aria-describedby={consentError ? consentErrorId : undefined}
              onChange={(event) => {
                onConsentChange(event.target.checked);
                if (event.target.checked) setConsentError(false);
              }}
            />
            <Stack aria-live="polite" gap="none">
              {consentError ? (
                <Text
                  id={consentErrorId}
                  size="sm"
                  tone="crit"
                  weight="semibold"
                >
                  Tick this only once the patient has agreed. Without consent
                  nothing is fetched.
                </Text>
              ) : null}
            </Stack>
            <Text size="sm" tone="muted">
              No consent, no data. HOS requests consent on the patient's
              registered phone and the request expires in 5 minutes.
            </Text>
          </Stack>
          {profile ? <AbhaRecords profile={profile} /> : null}
          <Text size="xs" tone="muted">
            ABDM HIP/HIU consent flow · FHIR R4 · consent artefact retained in
            the audit log (ADR #6)
          </Text>
        </Stack>
      </CardBody>
    </Card>
  );
}

function AbhaRecords({ profile }: { profile: AbhaProfile }) {
  const title = `Records found at ${profile.records.length} other facilities`;
  return (
    <Card variant="data">
      <CardHeader
        title={title}
        headingLevel={3}
        description={`Pulled under consent ${profile.abha} · valid 30 days, revocable by the patient at any time`}
      />
      <CardBody>
        <Stack gap="s3">
          <Stack as="ul" gap="s2" aria-label={title}>
            {profile.records.map((record) => (
              <li key={`${record.date}-${record.facility}`}>
                <Text size="sm">
                  <Text as="span" font="mono" weight="semibold">
                    {record.date}
                  </Text>
                  {` · ${record.facility} — ${record.detail}`}
                </Text>
              </li>
            ))}
          </Stack>
          <Text size="sm" tone="muted">
            Results open in the patient record for the doctor to read. HOS does
            not decide what to repeat. Nothing was written to those facilities;
            HOS read under consent and wrote the consent artefact to your audit
            log.
          </Text>
        </Stack>
      </CardBody>
    </Card>
  );
}
