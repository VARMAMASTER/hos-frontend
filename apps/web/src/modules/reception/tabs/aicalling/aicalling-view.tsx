import { useState } from 'react';
import {
  AiMark,
  AiDraftBlock,
  AiSourceLine,
  Banner,
  Button,
  ButtonGroup,
  ButtonGroupItem,
  Card,
  CardBody,
  CardHeader,
  Chip,
  EmptyState,
  SplitLayout,
  Stack,
  Text,
  type AiDraftStatus,
} from '@hos/nova-ui';
import {
  useReceptionAction,
  useReceptionQuery,
  type AiCall,
  type AiCallingOverview,
  type CallCampaign,
  type CallQueueEntry,
  type PatientLanguage,
  type ReceptionDataSource,
} from '../../data';
import {
  ActionFeedback,
  ReceptionKpis,
  ReceptionTab,
  type ActionNotice,
} from '../../ui';
import { CALL_LANGUAGES, CallPlayer } from './call-player';
import { ConsentCard, LimitsCard } from './call-policy';
import { CallLog, CallQueue, CampaignsTable } from './call-tables';
import type { AicallingWidgetProps } from './types';

const ESCALATION_CALL = 'call-escalation';

// The prototype's AI Calling (02-reception.html, data-panel="aicalling"): the voice agent's day. It
// books, reminds and confirms, never advises, and hands anything clinical to a person. Everything it
// drafts (the recall list, a follow-up message) is a draft until a person approves it.
export function AicallingWidget({
  patientId,
  compactMode,
  className,
}: AicallingWidgetProps) {
  const { query, source, reload, update } = useReceptionQuery((s) =>
    s.getAiCalling(),
  );
  return (
    <ReceptionTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="AI Calling"
      description="The voice agent's day: what it called, what it booked, and where it stopped and handed over."
      query={query}
      errorMessage="Could not load AI calling."
      onRetry={reload}
    >
      {query.status === 'ready' ? (
        <CallingDesk overview={query.data} source={source} onChange={update} />
      ) : null}
    </ReceptionTab>
  );
}

interface CallingDeskProps {
  overview: AiCallingOverview;
  source: ReceptionDataSource;
  onChange: (
    change: (overview: AiCallingOverview) => AiCallingOverview,
  ) => void;
}

function CallingDesk({ overview, source, onChange }: CallingDeskProps) {
  const action = useReceptionAction();
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [selectedId, setSelectedId] = useState(overview.calls[0]?.id ?? '');
  const [language, setLanguage] = useState<PatientLanguage>('te');
  // The call the banner asked to replay: it plays from the start the moment it appears.
  const [replay, setReplay] = useState<{ callId: string; n: number } | null>(
    null,
  );
  const [recallStatus, setRecallStatus] = useState<AiDraftStatus>('pending');
  const [running, setRunning] = useState<string | null>(null);
  // Follow-ups as they were when sent: an approved one stays on screen, settled.
  const [sent, setSent] = useState<Record<string, AiCall['followUp']>>({});

  const call =
    overview.calls.find((item) => item.id === selectedId) ?? overview.calls[0];

  async function perform<R>(id: string | null, task: () => Promise<R>) {
    setRunning(id);
    setNotice(null);
    const result = await action.run(task);
    setRunning(null);
    return result;
  }

  async function approveRecall(): Promise<boolean> {
    const done = await perform('recall', async () => {
      await source.approveRecallList(overview.recallDraft.id);
      return true;
    });
    if (!done) return false;
    setNotice({
      title: 'Recall approved — the agent starts dialling',
      detail: `Only inside the calling window, ${overview.consent.window}`,
    });
    return true;
  }

  async function sendFollowUp(
    target: AiCall,
    message: string,
  ): Promise<boolean> {
    const draft = target.followUp;
    const done = await perform('follow-up', async () => {
      await source.sendCallFollowUp(target.id, message);
      return true;
    });
    if (!done) return false;
    if (draft) setSent((current) => ({ ...current, [target.id]: draft }));
    onChange((current) => ({
      ...current,
      calls: current.calls.map((item) =>
        item.id === target.id ? { ...item, followUp: null } : item,
      ),
    }));
    setNotice({
      title: 'Follow-up approved & sent',
      detail: 'Delivered via WhatsApp',
    });
    return true;
  }

  async function toggleCampaign(campaign: CallCampaign, on: boolean) {
    const done = await perform(campaign.id, async () => {
      await source.setCampaignRunning(campaign.id, on);
      return true;
    });
    if (!done) return;
    onChange((current) => ({
      ...current,
      campaigns: current.campaigns.map((item) =>
        item.id === campaign.id ? { ...item, running: on } : item,
      ),
    }));
  }

  async function queueCall(entry: CallQueueEntry) {
    const done = await perform(entry.id, async () => {
      await source.queueCall(entry.id);
      return true;
    });
    if (!done) return;
    setNotice({
      title: `Queued — ${entry.patientName}`,
      detail: `${entry.language} script · the agent opens in the language on the record`,
    });
  }

  async function confirmDoNotCall() {
    const request = overview.consent.request;
    if (!request) return;
    const count = await perform(request.id, () =>
      source.confirmDoNotCall(request.id),
    );
    if (count === undefined) return;
    onChange((current) => ({
      ...current,
      consent: {
        ...current.consent,
        doNotCallCount: count,
        request: current.consent.request
          ? { ...current.consent.request, confirmed: true }
          : null,
      },
    }));
    setNotice({
      title: `${request.patientName} will never be contacted again`,
      detail: 'Voice, WhatsApp and SMS together · written to the audit log',
    });
  }

  return (
    <Stack gap="s6">
      <ActionFeedback
        notice={notice}
        error={action.error}
        onDismissNotice={() => setNotice(null)}
        onDismissError={action.clearError}
      />
      <Banner
        tone="ai"
        title={
          <>
            <AiMark size="xs" className="mr-s1 align-text-bottom" />
            {overview.banner}
          </>
        }
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedId(ESCALATION_CALL);
              setReplay((current) => ({
                callId: ESCALATION_CALL,
                n: (current?.n ?? 0) + 1,
              }));
            }}
          >
            <Text as="span" aria-hidden="true">
              ▶
            </Text>
            Replay the 10:39 escalation
          </Button>
        }
      />
      <ReceptionKpis label="AI calling figures" kpis={overview.kpis} />
      <Card>
        <CardHeader
          title="Listen to a call"
          description="The agent speaks first, the patient answers, and the record is written while the line is still open"
          actions={
            <Chip tone="good" icon="✓">
              GREEN tier · booking & reminders only
            </Chip>
          }
        />
        <CardBody>
          <SplitLayout
            ratio="3-2"
            primary={
              call ? (
                <Stack gap="s4">
                  <Stack direction="horizontal" gap="s4" wrap>
                    <ButtonGroup
                      aria-label="Call to replay"
                      size="sm"
                      value={call.id}
                      onValueChange={(value) => {
                        setReplay(null);
                        setSelectedId(value);
                      }}
                    >
                      {overview.calls.map((item) => (
                        <ButtonGroupItem key={item.id} value={item.id}>
                          {item.label}
                        </ButtonGroupItem>
                      ))}
                    </ButtonGroup>
                    <ButtonGroup
                      aria-label="Call language"
                      size="sm"
                      value={language}
                      onValueChange={(value) =>
                        setLanguage(value as PatientLanguage)
                      }
                    >
                      {CALL_LANGUAGES.map((item) => (
                        <ButtonGroupItem key={item.code} value={item.code}>
                          {item.label}
                        </ButtonGroupItem>
                      ))}
                    </ButtonGroup>
                  </Stack>
                  <Text size="sm" tone="muted">
                    Language on file: Telugu — override to hear the same call in
                    Hindi or English.
                  </Text>
                  <CallPlayer
                    key={`${call.id}-${replay?.callId === call.id ? replay.n : 0}`}
                    call={call}
                    language={language}
                    autoPlay={replay?.callId === call.id}
                    settledFollowUp={sent[call.id]}
                    onSendFollowUp={(message) => sendFollowUp(call, message)}
                  />
                </Stack>
              ) : (
                <EmptyState
                  title="No recorded calls to replay"
                  description="Calls the agent takes or makes are recorded and appear here."
                />
              )
            }
            secondary={
              <AiDraftBlock
                title={overview.recallDraft.title}
                status={recallStatus}
                onStatusChange={setRecallStatus}
                verb="Approve & start calling"
                approvedVerb="Started"
                undoable={false}
                busy={running === 'recall'}
                onApprove={() => {
                  void approveRecall().then((ok) => {
                    if (!ok) setRecallStatus('pending');
                  });
                }}
                source={
                  <AiSourceLine label="Read from">
                    {overview.recallDraft.source}
                  </AiSourceLine>
                }
              >
                <Text size="sm">{overview.recallDraft.body}</Text>
              </AiDraftBlock>
            }
          />
        </CardBody>
      </Card>
      <CampaignsTable
        campaigns={overview.campaigns}
        note={overview.campaignNote}
        onToggle={(campaign, on) => void toggleCampaign(campaign, on)}
      />
      <SplitLayout
        ratio="1-1"
        primary={
          <CallQueue
            queue={overview.queue}
            queuing={running}
            onCall={(entry) => void queueCall(entry)}
          />
        }
        secondary={
          <ConsentCard
            consent={overview.consent}
            busy={running === overview.consent.request?.id}
            onConfirm={() => void confirmDoNotCall()}
          />
        }
      />
      <LimitsCard limits={overview.limits} />
      <CallLog log={overview.log} />
    </Stack>
  );
}
