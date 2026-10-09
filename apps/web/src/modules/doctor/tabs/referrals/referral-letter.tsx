import { useState } from 'react';
import {
  AiClassChip,
  AiDraftBlock,
  Box,
  Button,
  Checkbox,
  Chip,
  Heading,
  Stack,
  Text,
  Textarea,
} from '@hos/nova-ui';
import type { DoctorDataSource, ReferralLetter, TeluguCopy } from '../../data';
import { Prose, TierNote, useDraftDecision, type Feedback } from '../../ui';

interface ReferralLetterBlockProps {
  letter: ReferralLetter;
  doctorName: string;
  source: DoctorDataSource;
  feedback: Feedback;
}

// The drafted letter (03-doctor.html, #refTemplate): the hospital's letterhead, the facts the record
// already holds, and one sentence that is not a fact, the question being asked. It is a draft until
// the doctor signs it, and nothing leaves the hospital before.
export function ReferralLetterBlock({
  letter,
  doctorName,
  source,
  feedback,
}: ReferralLetterBlockProps) {
  const [ask, setAsk] = useState(letter.ask);
  const [editing, setEditing] = useState(false);
  const [editedAsk, setEditedAsk] = useState(letter.ask);
  const [checked, setChecked] = useState<string[]>(
    letter.attachments.filter((item) => item.checked).map((item) => item.id),
  );
  const [teluguCopy, setTeluguCopy] = useState<TeluguCopy | null>(null);

  const decision = useDraftDecision(feedback, {
    approve: async () => {
      if (editing) throw new Error('Save or cancel your edit before signing.');
      await source.signReferral(letter.id, checked, ask);
    },
  });

  async function draftTelugu() {
    const result: { copy?: TeluguCopy } = {};
    const ok = await feedback.attempt(async () => {
      result.copy = await source.draftTeluguCopy(letter.id);
    });
    if (ok && result.copy) {
      setTeluguCopy(result.copy);
      feedback.notify({
        tone: 'info',
        title: 'Telugu summary drafted for the patient',
        detail:
          'A separate one-page sheet she can read, not a copy of your letter. Nothing is sent until you approve it.',
      });
    }
  }

  return (
    <Stack gap="s6">
      <AiDraftBlock
        {...decision}
        title={letter.title}
        approverName={doctorName}
        verb="Sign off & send"
        approvedVerb="Signed & sent"
        rejectable={false}
        labels={{ edit: 'Edit the letter' }}
        onEdit={
          editing
            ? undefined
            : () => {
                setEditedAsk(ask);
                setEditing(true);
              }
        }
        badges={<AiClassChip tier="green" detail="drafted from the record" />}
        actions={
          <Button variant="ghost" size="sm" onClick={() => void draftTelugu()}>
            Also draft her Telugu copy
          </Button>
        }
        source={<TierNote text={letter.note} />}
      >
        <Stack gap="s6">
          <Box border radius="card" surface="elevated" padding="s6">
            <Stack gap="s4">
              <Stack
                direction="horizontal"
                justify="between"
                align="start"
                wrap
                gap="s4"
              >
                <Stack gap="s1">
                  <Text weight="bold" font="display">
                    {letter.hospital}
                  </Text>
                  <Text size="xs" tone="muted">
                    {letter.hospitalMeta}
                  </Text>
                </Stack>
                <Stack gap="none">
                  {letter.to.map((line) => (
                    <Text key={line} size="xs" tone="muted" align="right">
                      {line}
                    </Text>
                  ))}
                </Stack>
              </Stack>
              <Text weight="semibold">{letter.re}</Text>
              <Text>{letter.dear}</Text>
              {letter.paragraphs.map((paragraph) => (
                <Prose key={paragraph} text={paragraph} />
              ))}
              {editing ? (
                <Stack gap="s3">
                  <Textarea
                    label="What you are asking"
                    rows={4}
                    value={editedAsk}
                    onChange={(event) => setEditedAsk(event.target.value)}
                  />
                  <Stack direction="horizontal" gap="s3">
                    <Button
                      size="sm"
                      onClick={() => {
                        setAsk(editedAsk.trim());
                        setEditing(false);
                      }}
                    >
                      Save the edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Text>{ask}</Text>
              )}
              <Text>With thanks,</Text>
              <Box border="top" paddingY="s3" className="text-label text-ink-2">
                <Prose text={letter.signature} />
              </Box>
            </Stack>
          </Box>

          <Stack gap="s2">
            <Heading level="h4" size="caption" tone="muted">
              {letter.attachmentsTitle}
            </Heading>
            {letter.attachments.map((item) => (
              <Checkbox
                key={item.id}
                checked={checked.includes(item.id)}
                onChange={(event) =>
                  setChecked((current) =>
                    event.target.checked
                      ? [...current, item.id]
                      : current.filter((id) => id !== item.id),
                  )
                }
                label={
                  <>
                    <Text as="span" weight="semibold">
                      {item.label}
                    </Text>
                    {item.detail ? ` · ${item.detail}` : ''}
                    {item.viaAbha ? (
                      <Chip tone="info" className="ml-s2">
                        via ABHA
                      </Chip>
                    ) : null}
                    {item.hint ? (
                      <Text as="span" size="xs" tone="muted">
                        {' '}
                        — {item.hint}
                      </Text>
                    ) : null}
                  </>
                }
              />
            ))}
          </Stack>
        </Stack>
      </AiDraftBlock>

      {teluguCopy ? (
        <TeluguCopyBlock
          copy={teluguCopy}
          letterId={letter.id}
          doctorName={doctorName}
          source={source}
          feedback={feedback}
        />
      ) : null}
    </Stack>
  );
}

interface TeluguCopyBlockProps {
  copy: TeluguCopy;
  letterId: string;
  doctorName: string;
  source: DoctorDataSource;
  feedback: Feedback;
}

// Her own one-page sheet, in Telugu: a second AI draft, sent only when the doctor approves it.
function TeluguCopyBlock({
  copy,
  letterId,
  doctorName,
  source,
  feedback,
}: TeluguCopyBlockProps) {
  const decision = useDraftDecision(feedback, {
    approve: () => source.approveTeluguCopy(letterId),
  });
  return (
    <AiDraftBlock
      {...decision}
      title="Telugu summary for the patient"
      approverName={doctorName}
      verb="Approve & send to her"
      approvedVerb="Sent"
      rejectable={false}
      contentLang="te"
      badges={<AiClassChip tier="green" detail="plain-language copy" />}
    >
      <Stack gap="s2">
        <Text lang="te">{copy.text}</Text>
        <Text size="sm" tone="muted" lang="en">
          {copy.gloss}
        </Text>
      </Stack>
    </AiDraftBlock>
  );
}
