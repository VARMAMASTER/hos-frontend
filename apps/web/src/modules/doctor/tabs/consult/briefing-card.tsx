import { useEffect } from 'react';
import { AiPanel, AiSourceLine, Chip, Stack, Text } from '@hos/nova-ui';
import type { ConsultationOverview } from '../../data';
import { AiRunSteps, AllergyChip, useAiRun } from '../../ui';

// The prototype's "Before you walk in" (03-doctor.html, #briefBlock): the patient's snapshot,
// assembled from the record. It is a draft summary for the doctor to read: nothing in it is filed.
export function BriefingCard({ consult }: { consult: ConsultationOverview }) {
  const { briefing, patient } = consult;
  const run = useAiRun(() => Promise.resolve(true), briefing.steps.length);
  const { start } = run;
  useEffect(() => start(), [start]);

  return (
    <AiPanel
      title={`Before you walk in — ${patient.name}`}
      badgeLabel="AI briefing"
      status={<Chip tone="ai">Draft summary · Not filed to the chart</Chip>}
    >
      <AiRunSteps steps={briefing.steps} run={run} label="Briefing progress" />
      {run.phase === 'done' ? (
        <Stack gap="s3">
          <Stack direction="horizontal" align="center" wrap gap="s3">
            {briefing.facts.map((fact) => (
              <Text as="span" key={fact} size="sm">
                {fact}
              </Text>
            ))}
            {briefing.allergies.map((allergen) => (
              <AllergyChip key={allergen} allergen={allergen} />
            ))}
            {briefing.warnings.map((warning) => (
              <Chip key={warning} tone="warn" icon="◔">
                {warning}
              </Chip>
            ))}
          </Stack>
          <AiSourceLine>{briefing.source}</AiSourceLine>
        </Stack>
      ) : null}
    </AiPanel>
  );
}
