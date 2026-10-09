import { useId, type ReactNode } from 'react';
import {
  Banner,
  Box,
  Button,
  ButtonGroup,
  ButtonGroupItem,
  Chip,
  Grid,
  Heading,
  Select,
  Stack,
  Switch,
  Text,
  TextField,
} from '@hos/nova-ui';
import type { AdmissionRequest, PayerId } from '../../data';
import { proportionateDeduction } from './proportionate-deduction';

// The six steps of the admission form, in the prototype's order. The fields start from what the
// source already knows (ABHA, the OPD note), so nothing is typed twice.

interface StepProps {
  n: number;
  title: string;
  // Chips and words beside the title.
  aside?: ReactNode;
  children: ReactNode;
}

function Step({ n, title, aside, children }: StepProps) {
  const headingId = useId();
  return (
    <Box as="section" aria-labelledby={headingId} border="bottom" padding="s4">
      <Stack gap="s4">
        <Stack direction="horizontal" align="center" gap="s3" wrap>
          <Box radius="full" surface="inset" padding="s2" aria-hidden="true">
            <Text as="span" font="mono" weight="bold">
              {n}
            </Text>
          </Box>
          <Heading id={headingId} level="h3" size="subhead">
            {title}
          </Heading>
          {aside}
        </Stack>
        {children}
      </Stack>
    </Box>
  );
}

export interface IdentityStepProps {
  patient: AdmissionRequest['patient'];
  onRepull: () => void;
}

export function IdentityStep({ patient, onRepull }: IdentityStepProps) {
  return (
    <Step
      n={1}
      title="Patient identity"
      aside={
        <>
          <Chip tone="good" icon="✓">
            Pulled from ABHA · nothing typed
          </Chip>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRepull}
            className="ml-auto"
          >
            Re-pull from ABHA
          </Button>
        </>
      }
    >
      <Grid columns={3} gap="s4">
        <TextField label="Full name" defaultValue={patient.name} />
        <TextField label="Age / Sex" defaultValue={patient.ageSex} />
        <TextField label="ABHA number" defaultValue={patient.abha} />
        <TextField label="MRN" defaultValue={patient.mrn} />
        <TextField label="Mobile" defaultValue={patient.phone} />
        <TextField label="Address" defaultValue={patient.address} />
      </Grid>
    </Step>
  );
}

export function ReasonStep({ reason }: { reason: AdmissionRequest['reason'] }) {
  return (
    <Step
      n={2}
      title="Why they are being admitted"
      aside={<Chip tone="info">{reason.noteSource}</Chip>}
    >
      <Grid columns={2} gap="s4">
        <Select
          label="Admitting doctor"
          defaultValue={reason.doctors[0]}
          options={reason.doctors.map((doctor) => ({
            value: doctor,
            label: doctor,
          }))}
        />
        <Select
          label="Admission type"
          defaultValue={reason.types[0]}
          options={reason.types.map((type) => ({ value: type, label: type }))}
        />
        <TextField label="Working diagnosis" defaultValue={reason.diagnosis} />
        <TextField label="Planned procedure" defaultValue={reason.procedure} />
        <TextField label="Expected stay" defaultValue={reason.stay} />
      </Grid>
    </Step>
  );
}

export interface PayerStepProps {
  request: AdmissionRequest;
  payer: PayerId;
  onPayerChange: (payer: PayerId) => void;
}

export function PayerStep({ request, payer, onPayerChange }: PayerStepProps) {
  const option = request.payers.find((item) => item.id === payer);
  const eligibilityId = useId();
  return (
    <Step
      n={3}
      title="Who pays"
      aside={
        <Text as="span" size="sm" tone="muted">
          Choosing the payer here is what makes the estimate, the pre-auth
          packet and the claim all agree later.
        </Text>
      }
    >
      <Stack gap="s4">
        <ButtonGroup
          aria-label="Payer"
          size="sm"
          value={payer}
          onValueChange={(value) => onPayerChange(value as PayerId)}
        >
          {request.payers.map((item) => (
            <ButtonGroupItem key={item.id} value={item.id}>
              {item.label}
            </ButtonGroupItem>
          ))}
        </ButtonGroup>
        {/* Keyed by payer so the fields take the chosen payer's values. */}
        <Grid columns={3} gap="s4" key={payer}>
          <TextField
            label="Policy / card number"
            defaultValue={option?.policy ?? ''}
          />
          <TextField
            label="Sum insured / package"
            defaultValue={option?.sum ?? ''}
          />
          <TextField
            label="Package / procedure code"
            defaultValue={option?.code ?? ''}
          />
        </Grid>
        {payer === 'star' ? (
          <Box border radius="card" padding="s4">
            <Stack gap="s3">
              <Stack direction="horizontal" align="center" gap="s3" wrap>
                <Heading id={eligibilityId} level="h4" size="subhead">
                  {request.eligibility.title}
                </Heading>
                <Chip tone="good" icon="✓">
                  Active
                </Chip>
              </Stack>
              <Stack as="ul" gap="s2" aria-labelledby={eligibilityId}>
                {request.eligibility.terms.map((term) => (
                  <li key={term.text}>
                    <Stack
                      direction="horizontal"
                      align="center"
                      justify="between"
                      gap="s3"
                    >
                      <Text size="sm">
                        <Text
                          as="span"
                          role="img"
                          aria-label={term.ok ? 'Met' : 'Check this'}
                          weight="bold"
                          tone={term.ok ? 'good' : 'warn'}
                        >
                          {term.ok ? '✓' : '!'}
                        </Text>
                        {` ${term.text}`}
                      </Text>
                      <Text as="span" size="sm" font="mono" weight="semibold">
                        {term.value}
                      </Text>
                    </Stack>
                  </li>
                ))}
              </Stack>
              <Text size="sm" tone="muted">
                {request.eligibility.footer}
              </Text>
            </Stack>
          </Box>
        ) : null}
      </Stack>
    </Step>
  );
}

export interface BedStepProps {
  request: AdmissionRequest;
  payer: PayerId;
  wardId: string;
  bedId: string;
  onWardChange: (wardId: string) => void;
  onBedChange: (bedId: string) => void;
}

export function BedStep({
  request,
  payer,
  wardId,
  bedId,
  onWardChange,
  onBedChange,
}: BedStepProps) {
  const { bed } = request;
  const ward = bed.wards.find((item) => item.id === wardId);
  // The sub-limit is a term of the Star Health policy, so the warning is only for that payer.
  const warning =
    payer === 'star' && ward
      ? proportionateDeduction(bed, ward.ratePerNight)
      : null;
  return (
    <Step
      n={4}
      title="Bed"
      aside={
        <Chip tone="crit" icon="!">
          ICU 8/8 — nothing to allocate there
        </Chip>
      }
    >
      <Stack gap="s4">
        <Grid columns={3} gap="s4">
          <Select
            label="Ward / class"
            value={wardId}
            onChange={(event) => onWardChange(event.target.value)}
            options={bed.wards.map((item) => ({
              value: item.id,
              label: item.label,
              disabled: !item.available,
            }))}
          />
          <Select
            label="Bed"
            value={bedId}
            onChange={(event) => onBedChange(event.target.value)}
            options={bed.beds.map((item) => ({
              value: item.id,
              label: item.label,
            }))}
          />
          <TextField label="Tariff class" defaultValue={bed.tariff} />
        </Grid>
        {warning ? (
          <Banner
            tone="warn"
            title={warning.title}
            action={<Chip tone="warn">Reference alert · your call</Chip>}
          >
            <Stack gap="s3">
              <Text size="sm">{warning.body}</Text>
              <Stack gap="s1" aria-label="The working">
                {warning.working.map((line) => (
                  <Text key={line} size="sm" font="mono">
                    {line}
                  </Text>
                ))}
              </Stack>
              <Text size="sm">
                The choice is the patient's. HOS states what each bed costs him
                and changes nothing — whether he needs a private room for a
                clinical reason is his doctor's call.
              </Text>
            </Stack>
          </Banner>
        ) : null}
        <Text size="sm" tone="muted">
          {bed.icuNote}
        </Text>
      </Stack>
    </Step>
  );
}

export function AttenderStep({
  attender,
}: {
  attender: AdmissionRequest['attender'];
}) {
  return (
    <Step
      n={5}
      title="Attender / next of kin"
      aside={
        <Text as="span" size="sm" tone="muted">
          Collected once — nursing, billing and the discharge handover all read
          it from here.
        </Text>
      }
    >
      <Grid columns={3} gap="s4">
        <TextField label="Attender name" defaultValue={attender.name} />
        <TextField label="Relationship" defaultValue={attender.relationship} />
        <TextField label="Attender mobile" defaultValue={attender.phone} />
      </Grid>
    </Step>
  );
}

export interface ConsentStepProps {
  consents: AdmissionRequest['consents'];
  captured: ReadonlySet<string>;
  onToggle: (consentId: string, captured: boolean) => void;
}

export function ConsentStep({
  consents,
  captured,
  onToggle,
}: ConsentStepProps) {
  const count = captured.size;
  const all = count === consents.length;
  return (
    <Step
      n={6}
      title="Consent"
      aside={
        <Stack aria-live="polite" gap="none">
          <Chip tone={all ? 'good' : 'warn'}>
            {all
              ? `✓ all ${consents.length} captured`
              : `${count} of ${consents.length} captured`}
          </Chip>
        </Stack>
      }
    >
      <Stack role="group" aria-label="Consent" gap="s4">
        {consents.map((consent) => (
          <Stack key={consent.id} gap="s1">
            <Switch
              label={consent.title}
              checked={captured.has(consent.id)}
              onCheckedChange={(on) => onToggle(consent.id, on)}
            />
            <Text size="sm" tone="muted">
              {consent.detail}
            </Text>
          </Stack>
        ))}
      </Stack>
    </Step>
  );
}
