import { useId } from 'react';
import { Chip, Stack, Switch, Text } from '@hos/nova-ui';
import type { ConsentRecord } from '../../data';
import { usePatientRecord, usePatientRecordAction } from '../../data';
import { ActionFeedback, FlagChip, Section } from '../../ui';

export interface ConsentSectionProps {
  consents: ConsentRecord[];
  readonly?: boolean;
  onChange: (consent: ConsentRecord) => void;
}

function Status({ enabled }: { enabled: boolean }) {
  return (
    <FlagChip
      flag={{
        tone: enabled ? 'good' : 'neutral',
        label: enabled ? 'On' : 'Off',
      }}
    />
  );
}

// The consents on record (the prototype's "Consent & privacy"): what she agreed to, when and where.
// The WhatsApp opt-in can be switched here; sharing her records through ABHA is hers alone to
// withdraw, so it has no switch. On and off are words and a shape, never colour alone.
export function ConsentSection({
  consents,
  readonly = false,
  onChange,
}: ConsentSectionProps) {
  const source = usePatientRecord();
  const action = usePatientRecordAction();
  const ids = useId();

  async function set(consent: ConsentRecord, enabled: boolean) {
    const updated = await action.run(() =>
      source.setConsent(consent.id, enabled),
    );
    if (updated) onChange(updated);
  }

  return (
    <Section
      title="Consent & privacy"
      actions={<Chip tone="neutral">Consent on record</Chip>}
    >
      <Stack gap="s5">
        <ActionFeedback
          notice={null}
          error={action.error}
          onDismissError={action.clearError}
        />
        <Stack as="ul" gap="s5">
          {consents.map((consent) => (
            <li key={consent.id}>
              <Stack
                direction="horizontal"
                align="start"
                justify="between"
                gap="s4"
              >
                <Stack gap="s1" className="min-w-0 flex-1">
                  {consent.changeable ? (
                    <Switch
                      label={consent.title}
                      checked={consent.enabled}
                      disabled={readonly || action.busy}
                      aria-describedby={`${ids}-${consent.id}`}
                      onCheckedChange={(next) => void set(consent, next)}
                    />
                  ) : (
                    <Text as="span" weight="semibold">
                      {consent.title}
                    </Text>
                  )}
                  <Text id={`${ids}-${consent.id}`} size="sm" tone="muted">
                    {consent.detail}
                  </Text>
                  {consent.changeable ? null : (
                    <Text size="sm" tone="muted">
                      Only the patient can withdraw it, in her ABHA app.
                    </Text>
                  )}
                </Stack>
                <Status enabled={consent.enabled} />
              </Stack>
            </li>
          ))}
        </Stack>
      </Stack>
    </Section>
  );
}
