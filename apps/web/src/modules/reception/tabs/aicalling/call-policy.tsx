import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Dialog,
  Stack,
  Text,
} from '@hos/nova-ui';
import type { AiCallingOverview } from '../../data';

const MARKS: Record<
  AiCallingOverview['limits'][number]['mark'],
  { word: string; glyph: string }
> = {
  '✕': { word: 'Never', glyph: '✕' },
  '→': { word: 'Hands over', glyph: '→' },
  '✓': { word: 'Always', glyph: '✓' },
};

// "Where this agent stops": the boundary is the product, not the small print. Each line has a mark
// and the word for it, so the rule is never carried by a symbol alone.
export function LimitsCard({
  limits,
}: {
  limits: AiCallingOverview['limits'];
}) {
  return (
    <Card>
      <CardHeader
        title="Where this agent stops"
        description="The boundary is the product, not the small print"
        actions={
          <Chip tone="crit" icon="✕">
            RED tier · not licensed, not built
          </Chip>
        }
      />
      <CardBody>
        <Stack as="ul" gap="s3" aria-label="Where this agent stops">
          {limits.map((limit) => (
            <li key={limit.text}>
              <Stack direction="horizontal" align="start" gap="s3">
                <Text
                  as="span"
                  role="img"
                  aria-label={MARKS[limit.mark].word}
                  weight="bold"
                >
                  {limit.mark}
                </Text>
                <Text size="sm">{limit.text}</Text>
              </Stack>
            </li>
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
}

export interface ConsentCardProps {
  consent: AiCallingOverview['consent'];
  busy: boolean;
  // A person confirms the do-not-call request: permanent across voice and WhatsApp.
  onConfirm: () => void;
}

// Consent, DND and the calling window. A do-not-call request is a consent withdrawal, so making it
// permanent is a person's decision; HOS has already stopped calling.
export function ConsentCard({ consent, busy, onConfirm }: ConsentCardProps) {
  const [why, setWhy] = useState(false);
  const request = consent.request;
  const rows: [string, string][] = [
    ['Calling window', consent.window],
    ['Opt-out offered in every first call', consent.optOut],
    ['On the do-not-call register', String(consent.doNotCallCount)],
    ['Max attempts per patient per week', String(consent.maxAttempts)],
  ];
  return (
    <Box as="section" aria-label="Consent, DND and the calling window">
      <Card>
        <CardHeader
          title="Consent, DND and the calling window"
          description="TRAI is a real constraint and being called at 9 PM is a real grievance"
          actions={
            <Chip tone="good" icon="✓">
              DLT registered
            </Chip>
          }
        />
        <CardBody>
          <Stack gap="s4">
            <Stack as="ul" gap="s3" aria-label="Calling rules">
              {rows.map(([label, value]) => (
                <li key={label}>
                  <Stack direction="horizontal" justify="between" gap="s4">
                    <Text as="span" size="sm" tone="muted">
                      {label}
                    </Text>
                    <Text as="span" size="sm" weight="semibold">
                      {value}
                    </Text>
                  </Stack>
                </li>
              ))}
            </Stack>
            {request ? (
              <Stack gap="s3">
                <Stack direction="horizontal" align="center" gap="s3" wrap>
                  {request.confirmed ? (
                    <Chip tone="good" icon="✓">
                      Confirmed — never contact again
                    </Chip>
                  ) : (
                    <Chip tone="warn" icon="!">
                      Needs your confirmation
                    </Chip>
                  )}
                  <Text as="span" size="sm" className="min-w-0 flex-1">
                    <Text as="span" size="sm" weight="semibold">
                      {request.patientName}
                    </Text>
                    {` ${request.detail}`}
                  </Text>
                </Stack>
                <Stack direction="horizontal" gap="s3" wrap>
                  <Button
                    size="sm"
                    loading={busy}
                    disabled={request.confirmed}
                    onClick={onConfirm}
                  >
                    Confirm — never contact again
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setWhy(true)}
                  >
                    Why me?
                  </Button>
                </Stack>
              </Stack>
            ) : null}
          </Stack>
        </CardBody>
      </Card>
      <Dialog
        open={why}
        onClose={() => setWhy(false)}
        title="Why this needs a human"
        footer={<Button onClick={() => setWhy(false)}>Understood</Button>}
      >
        <Stack gap="s3">
          <Text>
            A do-not-call request is a consent withdrawal under the DPDP Act
            2023, and it is permanent. HOS acts on it immediately — the patient
            is already blocked — but the permanent register entry is a human
            decision, because an AI that can silently remove a patient from all
            contact can also do it by mistake.
          </Text>
          <Text>
            Confirming writes the withdrawal to the audit log with your name
            against it, and applies it to voice, WhatsApp and SMS together. A
            patient who says 'stop' once should not have to say it three times.
          </Text>
        </Stack>
      </Dialog>
    </Box>
  );
}
