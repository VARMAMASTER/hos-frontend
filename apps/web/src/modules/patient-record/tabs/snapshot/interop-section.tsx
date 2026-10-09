import { useId, useState } from 'react';
import { Box, Button, Stack, Text } from '@hos/nova-ui';
import type { InteropTrace } from '../../data';
import { Section } from '../../ui';

export interface InteropSectionProps {
  trace: InteropTrace;
}

// The ABDM interoperability trace behind every "via ABHA" tag: the protocol sequence for one real
// event on this chart, so the outside value is never a black box. The payload is labelled
// illustrative and is shown only on request.
export function InteropSection({ trace }: InteropSectionProps) {
  const [open, setOpen] = useState(false);
  const payloadId = useId();
  return (
    <Section
      title={trace.title}
      description="The ABDM interoperability trace behind every “via ABHA” tag on this chart"
      actions={
        <Text as="span" size="sm" tone="muted">
          FHIR R4 · ABDM M2
        </Text>
      }
    >
      <Stack gap="s5">
        <Text size="sm" tone="muted">
          {trace.intro}
        </Text>
        <Stack as="ol" gap="s4">
          {trace.steps.map((step, index) => (
            <li key={step.id}>
              <Stack direction="horizontal" align="start" gap="s4">
                <Box
                  surface="inset"
                  radius="full"
                  className="flex size-s8 shrink-0 items-center justify-center text-label font-semibold text-ink-2"
                  aria-hidden="true"
                >
                  {index + 1}
                </Box>
                <Text className="min-w-0">
                  <Text as="span" weight="semibold">
                    {step.title}
                  </Text>{' '}
                  {step.body}
                </Text>
              </Stack>
            </li>
          ))}
        </Stack>
        <Stack gap="s3" className="border-t border-border pt-s4">
          <Box>
            <Button
              size="sm"
              variant="ghost"
              aria-expanded={open}
              aria-controls={payloadId}
              onClick={() => setOpen(!open)}
            >
              View the FHIR payload (illustrative)
            </Button>
          </Box>
          {open ? (
            <Stack id={payloadId} gap="s3">
              <Text size="sm" tone="muted">
                {trace.payloadNote}
              </Text>
              <Box
                role="region"
                aria-label="FHIR payload (illustrative)"
                tabIndex={0}
                surface="inset"
                border
                radius="control"
                padding="s4"
                className="overflow-x-auto"
              >
                <Text
                  as="code"
                  variant="meta"
                  className="block whitespace-pre text-label"
                >
                  {trace.payload}
                </Text>
              </Box>
            </Stack>
          ) : null}
        </Stack>
      </Stack>
    </Section>
  );
}
