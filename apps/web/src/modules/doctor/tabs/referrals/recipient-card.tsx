import { useRef, useState } from 'react';
import {
  AiButton,
  AiClassChip,
  Card,
  CardBody,
  CardHeader,
  FilterChip,
  Stack,
  Text,
} from '@hos/nova-ui';
import type {
  DoctorDataSource,
  ReferralLetter,
  ReferralsOverview,
} from '../../data';
import { AiRunSteps, Prose, useAiRun, type Feedback } from '../../ui';
import { ReferralLetterBlock } from './referral-letter';

interface RecipientCardProps {
  overview: ReferralsOverview;
  source: DoctorDataSource;
  feedback: Feedback;
}

// The prototype's "Refer <patient> — who is this going to?": pick the recipient first. No chip ships
// selected: "Draft the letter" with nothing chosen is a real state, not a bug to hide by ticking
// something. The letter and its attachments are assembled for that specialty.
export function RecipientCard({
  overview,
  source,
  feedback,
}: RecipientCardProps) {
  const patient = overview.patient;
  const [chosen, setChosen] = useState<string | null>(null);
  const wanted = useRef('');
  const run = useAiRun<ReferralLetter>(
    () => source.draftReferralLetter(wanted.current),
    overview.steps.length,
  );
  const recipient = overview.recipients.find((item) => item.id === chosen);

  function choose(id: string, on: boolean) {
    // A new recipient invalidates any letter already drafted.
    run.reset();
    setChosen(on ? id : null);
  }

  function draft() {
    if (!chosen) {
      feedback.notify({
        tone: 'info',
        title: 'Pick who this is going to first',
        detail:
          'The attachments differ by specialty — a generic letter is the one nobody replies to.',
      });
      return;
    }
    wanted.current = chosen;
    run.start();
  }

  if (!patient) return null;

  return (
    <>
      <Card>
        <CardHeader
          title={`Refer ${patient.name} — who is this going to?`}
          description="Pick the recipient first. The letter and its attachments are assembled for that specialty, not from a generic template."
          actions={<AiClassChip tier="green" detail="drafting" />}
        />
        <CardBody>
          <Stack gap="s6">
            <Stack direction="horizontal" align="center" wrap gap="s3">
              <Text as="span" size="xs" weight="bold" tone="muted">
                SPECIALTY
              </Text>
              <Stack
                direction="horizontal"
                wrap
                gap="s3"
                role="group"
                aria-label="Specialty"
              >
                {overview.recipients.map((item) => (
                  <FilterChip
                    key={item.id}
                    pressed={chosen === item.id}
                    onPressedChange={(on) => choose(item.id, on)}
                  >
                    {item.specialty}
                  </FilterChip>
                ))}
              </Stack>
            </Stack>
            {recipient ? (
              <Prose text={recipient.note} />
            ) : (
              <Text size="sm" tone="muted">
                No recipient chosen yet — nothing has been drafted.
              </Text>
            )}
            <Stack align="start" gap="s3">
              <AiButton
                state={
                  run.phase === 'running'
                    ? 'thinking'
                    : run.phase === 'done'
                      ? 'done'
                      : 'idle'
                }
                thinkingLabel="Drafting…"
                doneLabel="Drafted below"
                aria-disabled={run.phase === 'done' ? true : undefined}
                onClick={draft}
              >
                Draft the letter
              </AiButton>
              <AiRunSteps
                steps={overview.steps}
                run={run}
                label="Drafting the letter"
              />
              {run.phase === 'error' ? (
                <Text tone="crit">
                  {run.error ?? 'The letter could not be drafted.'}
                </Text>
              ) : null}
            </Stack>
          </Stack>
        </CardBody>
      </Card>
      {run.result ? (
        <ReferralLetterBlock
          key={run.result.id}
          letter={run.result}
          doctorName={overview.doctorName}
          source={source}
          feedback={feedback}
        />
      ) : null}
    </>
  );
}
