import { useState } from 'react';
import {
  AiClassChip,
  AlertDialog,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Heading,
  LearnedPreferenceRow,
  Stack,
  Text,
} from '@hos/nova-ui';
import type {
  DoctorDataSource,
  DoctorMetric,
  LearnedPreference,
  PersonalAgent,
} from '../../data';
import { Bold, MetricStrip, Prose, TierNote, type Feedback } from '../../ui';

interface SahayakaCardProps {
  agent: PersonalAgent;
  onChange: (agent: PersonalAgent) => void;
  source: DoctorDataSource;
  feedback: Feedback;
}

// The four figures, from the rows: nothing here is typed in, so a switch and its count never differ.
function metricsOf(agent: PersonalAgent): DoctorMetric[] {
  const total =
    agent.preferences.length + agent.hiddenRunning + agent.hiddenOff;
  const running =
    agent.preferences.filter((item) => item.enabled).length +
    agent.hiddenRunning;
  return [
    {
      id: 'learned',
      value: String(total),
      label: 'Preferences learned in 30 days',
    },
    { id: 'running', value: String(running), label: 'Currently running' },
    {
      id: 'off',
      value: String(total - running),
      label: 'You switched off — and it stayed off',
    },
    {
      id: 'stopped',
      value: String(agent.correctionsStopped),
      label: 'Corrections it stopped needing you to make',
    },
  ];
}

// The prototype's personal agent (03-doctor.html, Sahayaka): it learns the doctor, and every learned
// behaviour is a row with its own off switch next to the sentence it governs. A system that quietly
// learns your habits and never shows the list is unsettling however good the habits are, so the
// list is the product. Nothing it learns is visible to management.
export function SahayakaCard({
  agent,
  onChange,
  source,
  feedback,
}: SahayakaCardProps) {
  const [forgetting, setForgetting] = useState(false);
  const total =
    agent.preferences.length + agent.hiddenRunning + agent.hiddenOff;

  function patch(id: string, change: Partial<LearnedPreference>) {
    onChange({
      ...agent,
      preferences: agent.preferences.map((item) =>
        item.id === id ? { ...item, ...change } : item,
      ),
    });
  }

  async function toggle(item: LearnedPreference, enabled: boolean) {
    const ok = await feedback.attempt(() =>
      source.setPreference(item.id, enabled),
    );
    if (!ok) return;
    patch(item.id, { enabled });
    feedback.notify(
      enabled
        ? {
            title: 'Switched on',
            detail: `${item.learned} — takes effect on your next draft`,
          }
        : {
            tone: 'info',
            title: 'Switched off, and it stays off',
            detail: `${item.learned} — it will not be re-learned unless you turn it back on`,
          },
    );
  }

  async function correct(item: LearnedPreference, correction: string) {
    const ok = await feedback.attempt(() =>
      source.correctPreference(item.id, correction),
    );
    if (ok) {
      feedback.notify({
        title: 'Correction recorded',
        detail:
          'Sahayaka stops doing it now · queued for the owner’s AI Quality review',
      });
    }
  }

  async function forgetAll() {
    const learned = total;
    const ok = await feedback.attempt(() => source.forgetAllPreferences());
    if (!ok) return;
    onChange({
      ...agent,
      preferences: agent.preferences.map((item) => ({
        ...item,
        enabled: false,
      })),
      hiddenOff: agent.hiddenOff + agent.hiddenRunning,
      hiddenRunning: 0,
    });
    feedback.notify({
      tone: 'info',
      title: `All ${learned} preferences forgotten`,
      detail:
        'Drafts revert to the unpersonalised default from your next consultation',
    });
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
        description={<Bold text={agent.subtitle} />}
        actions={<AiClassChip tier="green" detail="drafts & formats" />}
      />
      <CardBody>
        <Stack gap="s6">
          <MetricStrip
            label="Sahayaka figures"
            metrics={metricsOf(agent)}
            columns={2}
          />

          {total === 0 ? (
            <EmptyState
              title="Nothing learned about you yet"
              description="Sahayaka learns from the drafts you edit before you approve them. Once it has, every behaviour appears here with its own off switch."
            />
          ) : (
            <Stack gap="s3">
              <Heading level="h3" size="caption" tone="muted">
                What it has learned about you — showing the{' '}
                {agent.preferences.length} with the biggest effect
              </Heading>
              {agent.preferences.map((item) => (
                <LearnedPreferenceRow
                  key={item.id}
                  learned={item.learned}
                  why={<Bold text={item.why} />}
                  does={<Bold text={item.does} />}
                  whenOff={
                    item.whenOff ? <Bold text={item.whenOff} /> : undefined
                  }
                  enabled={item.enabled}
                  onEnabledChange={(enabled) => void toggle(item, enabled)}
                  onSubmitCorrection={(text) => void correct(item, text)}
                />
              ))}
              <Stack direction="horizontal" align="center" gap="s3" wrap>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setForgetting(true)}
                >
                  Forget everything it has learned about me
                </Button>
                <Text as="span" size="xs" tone="muted">
                  Resets all {total} to off. Your notes stay; only the
                  personalisation goes.
                </Text>
              </Stack>
            </Stack>
          )}

          <Stack gap="s3">
            <Heading level="h3" size="caption" tone="muted">
              What it will never learn to do
            </Heading>
            <Prose text={agent.neverDo} />
            <Stack direction="horizontal" gap="s3">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const ok = await feedback.attempt(() =>
                    source.reportOverstep(),
                  );
                  if (ok) {
                    feedback.notify({
                      tone: 'info',
                      title: 'Reported for review',
                      detail:
                        'Goes to the AI regulatory register in Administration, with the draft attached',
                    });
                  }
                }}
              >
                Report it stepping over the line
              </Button>
            </Stack>
          </Stack>

          <TierNote text={agent.learnsFrom} />
        </Stack>
      </CardBody>
      <AlertDialog
        open={forgetting}
        onClose={() => setForgetting(false)}
        title="Forget everything it has learned about you?"
        message={`Forget all ${total} preferences Sahayaka has learned about you? Your notes and transcripts are untouched — only the personalisation is cleared, and it will start learning again from your next approval.`}
        actions={[
          { label: 'Cancel', role: 'cancel' },
          {
            label: 'Forget everything',
            role: 'destructive',
            onSelect: () => void forgetAll(),
          },
        ]}
      />
    </Card>
  );
}
