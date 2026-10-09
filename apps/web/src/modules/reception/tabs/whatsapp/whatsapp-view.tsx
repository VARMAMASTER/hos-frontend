import { useState } from 'react';
import {
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
  WaBilingualMessage,
  WaMessage,
  WaQuickReplyButtons,
  WhatsAppThread,
} from '@hos/nova-ui';
import {
  useReceptionAction,
  useReceptionQuery,
  type ReceptionDataSource,
  type WhatsAppConversation,
  type WhatsAppDraft,
  type WhatsAppMessage,
  type WhatsAppOverview,
} from '../../data';
import {
  ActionFeedback,
  ReceptionDraftReply,
  ReceptionTab,
  type ActionNotice,
} from '../../ui';
import type { WhatsappWidgetProps } from './types';

// The prototype's WhatsApp Assistant (02-reception.html, data-panel="whatsapp"): the assistant's
// conversations in the phone, the week's figures, and the replies it drafts, which a person approves
// before anything is sent.
export function WhatsappWidget({
  patientId,
  compactMode,
  className,
}: WhatsappWidgetProps) {
  const { query, source, reload, update } = useReceptionQuery((s) =>
    s.getWhatsApp(),
  );
  return (
    <ReceptionTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="WhatsApp Assistant"
      description="What the assistant answered on WhatsApp, and the replies waiting for your approval."
      query={query}
      errorMessage="Could not load the WhatsApp assistant."
      onRetry={reload}
    >
      {query.status === 'ready' ? (
        <WhatsAppDesk overview={query.data} source={source} onChange={update} />
      ) : null}
    </ReceptionTab>
  );
}

interface WhatsAppDeskProps {
  overview: WhatsAppOverview;
  source: ReceptionDataSource;
  onChange: (change: (overview: WhatsAppOverview) => WhatsAppOverview) => void;
}

function WhatsAppDesk({ overview, source, onChange }: WhatsAppDeskProps) {
  const action = useReceptionAction();
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [selectedId, setSelectedId] = useState(overview.conversations[0]?.id);
  const [recovering, setRecovering] = useState(false);
  // Drafts as they were when sent: an approved reply stays on screen, settled, after the source has
  // closed it.
  const [sent, setSent] = useState<Record<string, WhatsAppDraft>>({});

  const selected =
    overview.conversations.find((item) => item.id === selectedId) ??
    overview.conversations[0];

  async function recover() {
    setNotice(null);
    setRecovering(true);
    const found = await action.run(() => source.recoverMissedCall());
    setRecovering(false);
    if (found === undefined) return;
    if (found === null) {
      setNotice({ title: 'No missed calls left to recover' });
      return;
    }
    onChange((current) => ({
      ...current,
      conversations: [found, ...current.conversations],
    }));
    setSelectedId(found.id);
    setNotice({
      title: 'Missed call found — reply drafted',
      detail: 'Nothing is sent until you approve it below.',
    });
  }

  async function sendReply(
    conversation: WhatsAppConversation,
    message: string,
  ): Promise<boolean> {
    const draft = conversation.draft;
    setNotice(null);
    const reply = await action.run(() =>
      source.sendWhatsAppReply(conversation.id, message),
    );
    if (!reply) return false;
    if (draft) setSent((current) => ({ ...current, [conversation.id]: draft }));
    onChange((current) => ({
      ...current,
      conversations: current.conversations.map((item) =>
        item.id === conversation.id
          ? {
              ...item,
              topic: 'Reply sent',
              messages: [...item.messages, reply],
              draft: null,
            }
          : item,
      ),
    }));
    setNotice({
      title: 'Reply approved & sent',
      detail: 'Delivered via WhatsApp',
    });
    return true;
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
        title={`✦ ${overview.banner}`}
        action={
          <Button
            variant="ghost"
            size="sm"
            loading={recovering}
            onClick={() => void recover()}
          >
            Recover missed calls
          </Button>
        }
      />
      <SplitLayout
        ratio="1-1"
        primary={
          selected ? (
            <ConversationPane
              conversations={overview.conversations}
              selected={selected}
              onSelect={setSelectedId}
              settled={sent[selected.id]}
              onSend={(message) => sendReply(selected, message)}
            />
          ) : (
            <EmptyState
              title="No conversations yet"
              description="Chats the assistant handles appear here, with any reply it drafts for you."
            />
          )
        }
        secondary={<WeekFigures stats={overview.stats} />}
      />
    </Stack>
  );
}

interface ConversationPaneProps {
  conversations: WhatsAppConversation[];
  selected: WhatsAppConversation;
  onSelect: (id: string) => void;
  // The draft that was sent from this conversation, shown settled.
  settled: WhatsAppDraft | undefined;
  onSend: (message: string) => Promise<boolean>;
}

function ConversationPane({
  conversations,
  selected,
  onSelect,
  settled,
  onSend,
}: ConversationPaneProps) {
  const draft = selected.draft ?? settled ?? null;
  return (
    <Stack gap="s4">
      <ButtonGroup
        aria-label="Conversations"
        size="sm"
        value={selected.id}
        onValueChange={onSelect}
      >
        {conversations.map((item) => (
          <ButtonGroupItem key={item.id} value={item.id}>
            {`${item.patientName} · ${item.topic}`}
          </ButtonGroupItem>
        ))}
      </ButtonGroup>
      <WhatsAppThread
        name={selected.patientName}
        subtitle={selected.phone}
        status={
          <Chip tone="ai" icon="✦">
            AI Assistant
          </Chip>
        }
      >
        {selected.messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
      </WhatsAppThread>
      {draft ? (
        <ReceptionDraftReply
          key={draft.id}
          title={draft.title}
          channel="whatsapp"
          recipient={`${selected.patientName} · ${selected.phone}`}
          message={draft.message}
          onSend={onSend}
          source={
            <Stack gap="s2">
              <Text size="sm">{draft.summary}</Text>
              <AiSourceLine label="Read from">
                The conversation · the doctor's day schedule · nothing is sent
                until you approve
              </AiSourceLine>
            </Stack>
          }
        />
      ) : null}
    </Stack>
  );
}

function Message({ message }: { message: WhatsAppMessage }) {
  const actions = message.quickReplies ? (
    <WaQuickReplyButtons
      label="Pick a slot"
      options={message.quickReplies}
      value={message.chosenReply ?? null}
    />
  ) : undefined;
  const common = {
    direction: message.direction,
    tone: message.ai ? ('ai' as const) : ('default' as const),
    time: message.time,
    actions,
  };
  if (message.lang && message.gloss) {
    return (
      <WaBilingualMessage {...common} lang={message.lang} gloss={message.gloss}>
        {message.text}
      </WaBilingualMessage>
    );
  }
  return (
    <WaMessage {...common} contentLang={message.lang}>
      {message.text}
    </WaMessage>
  );
}

function WeekFigures({ stats }: { stats: WhatsAppOverview['stats'] }) {
  return (
    <Card>
      <CardHeader
        title="Bookings via WhatsApp"
        actions={
          <Text as="span" size="xs" tone="muted">
            This week
          </Text>
        }
      />
      <CardBody>
        <Stack as="ul" gap="s3" aria-label="Bookings via WhatsApp">
          {stats.map((stat) => (
            <li key={stat.label}>
              <Stack direction="horizontal" justify="between" gap="s4">
                <Text as="span" size="sm" tone="muted">
                  {stat.label}
                </Text>
                <Text as="span" font="mono" weight="semibold">
                  {stat.value}
                </Text>
              </Stack>
            </li>
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
}
