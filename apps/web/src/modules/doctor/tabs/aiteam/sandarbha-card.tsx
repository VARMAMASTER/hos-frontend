import { useState } from 'react';
import {
  AiClassChip,
  AiDraftBlock,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Dialog,
  Grid,
  Heading,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from '@hos/nova-ui';
import type { DoctorDataSource, RecallDraft, SpecialtyAgent } from '../../data';
import {
  AskPanel,
  Bold,
  Prose,
  TierNote,
  useDraftDecision,
  type Feedback,
} from '../../ui';

interface SandarbhaCardProps {
  agent: SpecialtyAgent;
  doctorName: string;
  source: DoctorDataSource;
  feedback: Feedback;
}

// The prototype's specialty agent (03-doctor.html, Sandarbha): depth in the specialty, not opinions
// about the doctor's patient. AMBER: every line traces to a citation, and it answers "what does the
// reference say" and "what does this hospital's data show", never "what is wrong with this patient".
export function SandarbhaCard({
  agent,
  doctorName,
  source,
  feedback,
}: SandarbhaCardProps) {
  const [bulletin, setBulletin] = useState(false);
  const [recall, setRecall] = useState<RecallDraft | null>(null);

  async function draftRecall() {
    const result: { draft?: RecallDraft } = {};
    const ok = await feedback.attempt(async () => {
      result.draft = await source.draftTbRecall();
    });
    if (ok && result.draft) {
      setRecall(result.draft);
      feedback.notify({
        tone: 'info',
        title: '4 TB patients listed for recall',
        detail:
          'Month-5 smear due per the NTEP card · a WhatsApp recall is drafted below, awaiting your approval',
      });
    }
  }

  return (
    <Card role="region" aria-label={agent.name}>
      <CardHeader
        title={
          <>
            <Text as="span" aria-hidden="true">
              {agent.initials}
            </Text>{' '}
            {agent.name}
          </>
        }
        actions={<AiClassChip tier="amber" detail="reference" />}
      />
      <CardBody>
        <Stack gap="s6">
          <Text size="sm" tone="muted">
            <Bold text={agent.subtitle} />
          </Text>
          <Stack gap="s3">
            <Heading level="h3" size="caption" tone="muted">
              What this specialty actually orders here
            </Heading>
            <Table caption="What this specialty orders here" density="compact">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Your rate</TableHeaderCell>
                  <TableHeaderCell>Item</TableHeaderCell>
                  <TableHeaderCell numeric>This hospital</TableHeaderCell>
                  <TableHeaderCell numeric>T2DM visits</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agent.orders.map((row) => (
                  <TableRow key={row.item}>
                    <TableCell>
                      <Text as="span" weight="bold">
                        {row.yourRate}
                      </Text>
                    </TableCell>
                    <TableCell>
                      {row.item}
                      {row.flag ? (
                        <Chip tone="warn" icon="◔" className="ml-s2">
                          {row.flag}
                        </Chip>
                      ) : null}
                    </TableCell>
                    <TableCell numeric>{row.hospitalRate}</TableCell>
                    <TableCell numeric mono>
                      {row.visits}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box className="text-caption text-ink-2">
              <Prose text={agent.ordersNote} />
            </Box>
          </Stack>

          <Stack gap="s3">
            <Heading level="h3" size="caption" tone="muted">
              What the season is doing in Kukatpally
            </Heading>
            {agent.season.map((paragraph) => (
              <Prose key={paragraph} text={paragraph} />
            ))}
            <Stack direction="horizontal" gap="s3" wrap>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void draftRecall()}
              >
                List the four TB patients
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBulletin(true)}
              >
                Open the bulletin
              </Button>
            </Stack>
            {recall ? (
              <RecallDraftBlock
                draft={recall}
                doctorName={doctorName}
                source={source}
                feedback={feedback}
              />
            ) : null}
          </Stack>

          <Stack gap="s3">
            <Heading level="h3" size="caption" tone="muted">
              How to say the difficult things in Telugu
            </Heading>
            {agent.phrases.map((phrase) => (
              <Stack
                key={phrase.id}
                gap="s1"
                className="border-l-emphasis border-ai-line pl-s5"
              >
                <Text size="xs" weight="bold" className="text-ai-deep">
                  {phrase.key}
                </Text>
                <Text lang="te">{phrase.local}</Text>
                <Text size="sm" tone="muted" lang="en">
                  {phrase.en}
                </Text>
              </Stack>
            ))}
            <Stack direction="horizontal" gap="s3" wrap>
              <Button
                size="sm"
                onClick={async () => {
                  const ok = await feedback.attempt(() =>
                    source.addToPhrasebook(),
                  );
                  if (ok) {
                    feedback.notify({
                      title: `${agent.phrases.length} phrases added to your phrasebook`,
                      detail:
                        'Sahayaka will use your version of these from here — edit any of them any time',
                    });
                  }
                }}
              >
                Add these to my phrasebook
              </Button>
            </Stack>
            <Box className="text-caption text-ink-2">
              <Prose text={agent.phrasesNote} />
            </Box>
          </Stack>

          <Stack gap="s3">
            <Heading level="h3" size="caption" tone="muted">
              Documentation templates for this specialty
            </Heading>
            <Grid columns={2} gap="s4">
              {agent.templates.map((template) => (
                <Box
                  key={template.id}
                  border
                  radius="card"
                  padding="s4"
                  surface="elevated"
                >
                  <Stack gap="s2" className="h-full">
                    <Heading level="h4" size="subhead" weight="semibold">
                      {template.name}
                    </Heading>
                    <Text size="xs" tone="muted">
                      <Bold text={template.meta} /> Used {template.uses} times
                    </Text>
                    <Stack
                      direction="horizontal"
                      align="center"
                      justify="between"
                      gap="s3"
                      className="mt-auto"
                    >
                      <AiClassChip tier="green" />
                      <Button
                        size="sm"
                        aria-label={`Use — ${template.name}`}
                        onClick={async () => {
                          const ok = await feedback.attempt(() =>
                            source.loadSpecialtyTemplate(template.id),
                          );
                          if (ok) feedback.notify(template.loaded);
                        }}
                      >
                        Use
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Grid>
          </Stack>

          <Stack gap="s3">
            <Heading level="h3" size="caption" tone="muted">
              Ask Sandarbha a reference question
            </Heading>
            <AskPanel
              ask={(question) => source.askSpecialty(question)}
              suggestions={agent.suggestions}
              name="Sandarbha"
              threadLabel="Conversation with Sandarbha"
              composerLabel="Ask Sandarbha a reference question"
              placeholder="Ask a reference question… labels, schedules, this hospital's own rates"
              emptyHint="✦ It answers “what does the reference say” and “what does this hospital’s data show”. It will not answer “what is wrong with this patient”."
              thinkLabel="Checking the references"
              errorMessage="Sandarbha could not answer that."
            />
          </Stack>

          <TierNote text={agent.citations} />
        </Stack>
      </CardBody>

      <Dialog
        open={bulletin}
        onClose={() => setBulletin(false)}
        title={agent.bulletin.title}
      >
        <Stack gap="s3">
          <Text size="sm">
            Ward-level notifications, Kukatpally circle, fortnight ending 17 Jul
            2026:
          </Text>
          <Stack as="ul" gap="s2" className="list-disc pl-s7">
            {agent.bulletin.lines.map((line) => (
              <li key={line}>
                <Text as="span" size="sm">
                  <Bold text={line} />
                </Text>
              </li>
            ))}
          </Stack>
          <Text size="xs" tone="muted">
            {agent.bulletin.note}
          </Text>
        </Stack>
      </Dialog>
    </Card>
  );
}

interface RecallDraftBlockProps {
  draft: RecallDraft;
  doctorName: string;
  source: DoctorDataSource;
  feedback: Feedback;
}

// The recall Sandarbha drafted for the four TB patients: a draft, sent only when the doctor
// approves it. Sandarbha never contacts a patient by itself.
function RecallDraftBlock({
  draft,
  doctorName,
  source,
  feedback,
}: RecallDraftBlockProps) {
  const decision = useDraftDecision(feedback, {
    approve: () => source.approveTbRecall(),
  });
  return (
    <AiDraftBlock
      {...decision}
      title={draft.title}
      approverName={doctorName}
      verb="Approve & send the recall"
      approvedVerb="Sent"
      rejectable={false}
      badges={<AiClassChip tier="amber" detail="schedule vs your records" />}
    >
      <Text>{draft.body}</Text>
    </AiDraftBlock>
  );
}
