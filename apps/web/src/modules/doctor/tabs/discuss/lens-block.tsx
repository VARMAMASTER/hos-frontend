import {
  AiClassChip,
  AiDraftBlock,
  AiPanel,
  AiSourceLine,
  Button,
  Chip,
  Stack,
  Text,
} from '@hos/nova-ui';
import type {
  DoctorDataSource,
  Lens,
  LensAction,
  LensActionResult,
} from '../../data';
import { Bold, Prose, useDraftDecision, type Feedback } from '../../ui';

interface LensBlockProps {
  lens: Lens;
  onAction: (lens: Lens, action: LensAction) => void;
}

// One lens (03-doctor.html, .lens). It reasoned alone, and it may do exactly three things: state a
// value that is in the record, quote a constraint published somewhere citable, or ask the doctor a
// question. It is an AI draft with its tier in words, and its buttons check or prepare: nothing a
// lens prepares goes anywhere until the doctor approves it.
export function LensBlock({ lens, onAction }: LensBlockProps) {
  return (
    <AiPanel
      title={lens.title}
      headingLevel={3}
      status={
        <>
          <AiClassChip tier={lens.tier} />
          <Chip>reasoned alone</Chip>
        </>
      }
      footer={
        <Stack gap="s3">
          <Stack direction="horizontal" gap="s3" wrap>
            {lens.actions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                onClick={() => onAction(lens, action)}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
          <AiSourceLine label="Sources">{lens.sources}</AiSourceLine>
        </Stack>
      }
    >
      <Stack gap="s3">
        {lens.paragraphs.map((paragraph) => (
          <Prose key={paragraph} text={paragraph} />
        ))}
        <Text size="xs" weight="bold" tone="muted">
          What this lens wants to ask you
        </Text>
        <Stack as="ul" gap="s2">
          {lens.questions.map((question) => (
            <li key={question} className="relative pl-s6">
              <Text
                as="span"
                aria-hidden="true"
                weight="bold"
                className="absolute left-s0 text-ai-deep"
              >
                ?
              </Text>
              <Text as="span" size="sm">
                <Bold text={question} />
              </Text>
            </li>
          ))}
        </Stack>
      </Stack>
    </AiPanel>
  );
}

interface LensDraftProps {
  lensId: string;
  actionId: string;
  draft: NonNullable<LensActionResult['draft']>;
  doctorName: string;
  source: DoctorDataSource;
  feedback: Feedback;
}

// What a lens prepared for the doctor to send (a lab chase, a cost sheet): a draft, approved by the
// doctor or not sent at all.
export function LensDraftBlock({
  lensId,
  actionId,
  draft,
  doctorName,
  source,
  feedback,
}: LensDraftProps) {
  const decision = useDraftDecision(feedback, {
    approve: () => source.approveLensDraft(lensId, actionId),
  });
  return (
    <AiDraftBlock
      {...decision}
      title={draft.title}
      approverName={doctorName}
      verb={draft.approveLabel}
      approvedVerb={draft.approvedVerb}
      rejectable={false}
    >
      <Text>{draft.body}</Text>
    </AiDraftBlock>
  );
}
