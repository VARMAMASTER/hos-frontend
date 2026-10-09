import { useState } from 'react';
import {
  AiMark,
  AiButton,
  AiClassChip,
  AiDraftBlock,
  Banner,
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stack,
  Text,
} from '@hos/nova-ui';
import type {
  DiscussOverview,
  DoctorDataSource,
  Lens,
  LensAction,
  LensActionResult,
  PanelResult,
} from '../../data';
import {
  AiRunSteps,
  LabelDialog,
  Prose,
  TierNote,
  useAiRun,
  useDraftDecision,
  type Feedback,
} from '../../ui';
import { LensBlock, LensDraftBlock } from './lens-block';

interface PanelCardProps {
  discussion: DiscussOverview;
  source: DoctorDataSource;
  feedback: Feedback;
}

interface PreparedDraft {
  key: string;
  lensId: string;
  actionId: string;
  draft: NonNullable<LensActionResult['draft']>;
}

// The lens identity colours (03-doctor.html, .dis-row): deliberately not the tier colours, so the
// safety lens is never read as the red-tier lens. The words say which lens is speaking.
const LENS_RAIL: Record<string, string> = {
  safety: 'border-l-info',
  cost: 'border-l-good',
  gaps: 'border-l-ai',
};

// The prototype's "Convene the panel": three lenses read the record separately and do not see each
// other's answers. Their disagreement is the output, not a fake consensus: no lens recommends an
// action, there is no fourth lens to resolve them, and the decision is the doctor's.
export function PanelCard({ discussion, source, feedback }: PanelCardProps) {
  const run = useAiRun(() => source.convenePanel(), discussion.steps.length);
  const panel = run.result;
  const [labelOpen, setLabelOpen] = useState(false);
  const [drafts, setDrafts] = useState<PreparedDraft[]>([]);

  async function act(lens: Lens, action: LensAction) {
    if (action.kind === 'label') {
      setLabelOpen(true);
      return;
    }
    const result: { value?: LensActionResult } = {};
    const ok = await feedback.attempt(async () => {
      result.value = await source.runLensAction(lens.id, action.id);
    });
    const { value } = result;
    if (!ok || !value) return;
    feedback.notify({
      tone: value.draft ? 'info' : 'good',
      title: value.title,
      detail: value.detail,
    });
    const prepared = value.draft;
    if (prepared) {
      setDrafts((current) => [
        ...current.filter((item) => item.key !== `${lens.id}:${action.id}`),
        {
          key: `${lens.id}:${action.id}`,
          lensId: lens.id,
          actionId: action.id,
          draft: prepared,
        },
      ]);
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title={
            <>
              <AiMark /> Convene the panel
            </>
          }
          description="Three lenses read her record separately and do not see each other's answers. Expect them to disagree — that is what you are here for."
          actions={
            <>
              <AiClassChip tier="amber" detail="reference & consistency" />
              <AiButton
                state={
                  run.phase === 'running'
                    ? 'thinking'
                    : run.phase === 'done'
                      ? 'done'
                      : 'idle'
                }
                thinkingLabel="Convening…"
                doneLabel="Panel convened"
                aria-disabled={
                  run.phase === 'running' || run.phase === 'done'
                    ? true
                    : undefined
                }
                onClick={run.start}
              >
                Convene the three lenses
              </AiButton>
            </>
          }
        />
        <CardBody>
          <Stack gap="s4">
            <AiRunSteps
              steps={discussion.steps}
              run={run}
              label="Convening the panel"
            />
            {run.phase === 'error' ? (
              <Text tone="crit">
                The panel could not be convened. Nothing was changed.
              </Text>
            ) : null}
            {run.phase === 'idle' ? (
              <Box border radius="card" surface="inset" padding="s4">
                <Prose text={discussion.conveneIntro} />
              </Box>
            ) : null}
            {panel ? (
              <Banner tone="ai" title="Three lenses reported">
                They do not agree, and the disagreement is set out below the
                three of them — followed by five questions and no
                recommendation.
              </Banner>
            ) : null}
          </Stack>
        </CardBody>
      </Card>

      {panel ? (
        <PanelResultView
          panel={panel}
          doctorName={discussion.doctorName}
          drafts={drafts}
          onAction={(lens, action) => void act(lens, action)}
          source={source}
          feedback={feedback}
        />
      ) : null}

      {panel ? (
        <LabelDialog
          open={labelOpen}
          onClose={() => setLabelOpen(false)}
          label={panel.label}
        />
      ) : null}
    </>
  );
}

interface PanelResultViewProps {
  panel: PanelResult;
  doctorName: string;
  drafts: PreparedDraft[];
  onAction: (lens: Lens, action: LensAction) => void;
  source: DoctorDataSource;
  feedback: Feedback;
}

function PanelResultView({
  panel,
  doctorName,
  drafts,
  onAction,
  source,
  feedback,
}: PanelResultViewProps) {
  return (
    <Stack gap="s6">
      <Stack gap="s4">
        {panel.lenses.map((lens) => (
          <LensBlock key={lens.id} lens={lens} onAction={onAction} />
        ))}
        {drafts.map((item) => (
          <LensDraftBlock
            key={item.key}
            lensId={item.lensId}
            actionId={item.actionId}
            draft={item.draft}
            doctorName={doctorName}
            source={source}
            feedback={feedback}
          />
        ))}
      </Stack>

      <Box border="left" radius="card" padding="s6" surface="elevated">
        <Stack gap="s3">
          <Heading level="h3" size="subhead" weight="bold">
            The three lenses do not agree, and we are not going to hide that
          </Heading>
          <Text size="xs" tone="muted">
            Each read her record without seeing the others&apos; answers. This
            is where they landed.
          </Text>
          {panel.disagreements.map((row) => (
            <Box
              key={row.id}
              className={`border-l-rail ${LENS_RAIL[row.id] ?? ''} pl-s5`}
            >
              <Text as="span" size="xs" weight="bold">
                {row.label}
              </Text>
              <Prose text={row.text} />
            </Box>
          ))}
          <Banner tone="ai" title="No recommendation, by design">
            <Prose text={panel.noRecommendation} />
          </Banner>
        </Stack>
      </Box>

      <Box radius="card" padding="s6" className="bg-chrome-1 text-chrome-ink">
        <Stack gap="s3">
          <Heading
            level="h3"
            size="subhead"
            weight="bold"
            className="text-chrome-ink"
          >
            {panel.yours.title}
          </Heading>
          {panel.yours.paragraphs.map((paragraph) => (
            <Prose key={paragraph} text={paragraph} />
          ))}
        </Stack>
      </Box>

      <ChartNote
        note={panel.chartNote}
        doctorName={doctorName}
        source={source}
        feedback={feedback}
      />
    </Stack>
  );
}

interface ChartNoteProps {
  note: PanelResult['chartNote'];
  doctorName: string;
  source: DoctorDataSource;
  feedback: Feedback;
}

// The one thing the panel can file: a record that the discussion happened. It documents; it does not
// decide, it contains no plan, and it is a draft until the doctor approves it.
function ChartNote({ note, doctorName, source, feedback }: ChartNoteProps) {
  const decision = useDraftDecision(feedback, {
    approve: () => source.approveReviewNote(),
  });
  return (
    <AiDraftBlock
      {...decision}
      title={note.title}
      approverName={doctorName}
      verb="Approve & add to her chart"
      approvedVerb="Added to her chart"
      rejectable={false}
      badges={<AiClassChip tier="green" detail="documents, does not decide" />}
      source={<TierNote text={note.tierNote} />}
    >
      <Prose text={note.text} />
    </AiDraftBlock>
  );
}
