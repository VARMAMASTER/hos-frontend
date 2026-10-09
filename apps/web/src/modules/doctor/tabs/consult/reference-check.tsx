import {
  AiMark,
  AiButton,
  AiClassChip,
  AiDraftBlock,
  AiSourceLine,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Stack,
  Text,
  WhyTrail,
} from '@hos/nova-ui';
import type {
  CheckBlock,
  ConsultationOverview,
  DoctorDataSource,
} from '../../data';
import {
  AiRunSteps,
  Prose,
  TierNote,
  useAiRun,
  useDraftDecision,
  type Feedback,
} from '../../ui';

interface ReferenceCheckProps {
  consult: ConsultationOverview;
  source: DoctorDataSource;
  feedback: Feedback;
}

// The prototype's "Reference & consistency check" (03-doctor.html, #txAssistCard): AMBER, on request,
// and only AMBER. Her recorded values held against published ranges and her own earlier values, and
// contradictions between records we already hold. Facts and questions: no block adjusts therapy.
export function ReferenceCheckCard({
  consult,
  source,
  feedback,
}: ReferenceCheckProps) {
  const run = useAiRun(
    () => source.runReferenceCheck(),
    consult.checkSteps.length,
  );
  const check = run.result;

  return (
    <Card className="border-l-rail border-l-warn">
      <CardHeader
        title={
          <>
            <AiMark /> Reference &amp; consistency check
          </>
        }
        description={consult.checkIntro}
        actions={
          <>
            <AiClassChip tier="amber" detail="reference" />
            <AiButton
              size="sm"
              state={
                run.phase === 'running'
                  ? 'thinking'
                  : run.phase === 'done'
                    ? 'done'
                    : 'idle'
              }
              thinkingLabel="Checking…"
              doneLabel="Check complete"
              aria-disabled={
                run.phase !== 'idle' && run.phase !== 'error' ? true : undefined
              }
              onClick={run.start}
            >
              Run the check
            </AiButton>
          </>
        }
      />
      {run.phase !== 'idle' ? (
        <CardBody>
          <Stack gap="s4">
            <AiRunSteps
              steps={consult.checkSteps}
              run={run}
              label="Reference check progress"
            />
            {run.phase === 'error' ? (
              <Text tone="crit">
                The check could not run. Nothing was changed.
              </Text>
            ) : null}
            {check ? (
              <>
                {check.blocks.map((block) => (
                  <CheckBlockView
                    key={block.id}
                    block={block}
                    doctorName={consult.doctorName}
                    source={source}
                    feedback={feedback}
                  />
                ))}
                <TierNote text={check.tierNote} />
              </>
            ) : null}
          </Stack>
        </CardBody>
      ) : null}
    </Card>
  );
}

interface CheckBlockViewProps {
  block: CheckBlock;
  doctorName: string;
  source: DoctorDataSource;
  feedback: Feedback;
}

// One block of the check. It is a draft the doctor accepts onto today's note, or dismisses with a
// reason: dismissals are logged with their name, the same as approvals.
function CheckBlockView({
  block,
  doctorName,
  source,
  feedback,
}: CheckBlockViewProps) {
  const decision = useDraftDecision(feedback, {
    approve: () => source.attachCheckBlock(block.id),
    reject: (reason) => source.dismissCheckBlock(block.id, reason),
  });
  return (
    <AiDraftBlock
      {...decision}
      title={block.title}
      approverName={doctorName}
      verb={block.actionLabel}
      approvedVerb={block.actionDone}
      badges={<Chip tone={block.chipTone}>{block.chip}</Chip>}
      source={
        <Stack gap="s2">
          <AiSourceLine>{block.sources}</AiSourceLine>
          <WhyTrail reasons={block.why} />
        </Stack>
      }
    >
      <Prose text={block.text} />
    </AiDraftBlock>
  );
}
