import { useEffect, useRef, useState } from 'react';
import {
  AiChatThread,
  AiClassChip,
  AiDraftBlock,
  AiSourceLine,
  AiThinking,
  Button,
  ChatAnswer,
  ChatComposer,
  ChatQuestion,
  SafeMarkdown,
  Stack,
  Text,
  type AiDraftStatus,
} from '@hos/nova-ui';
import {
  usePatientRecord,
  usePatientRecordAction,
  type MemoryAnswer,
  type MemoryDraft,
  type MemoryOverview,
} from '../../data';
import { ActionFeedback, Section } from '../../ui';

export interface MemoryPanelProps {
  memory: MemoryOverview;
  // The clinician at the screen: the summary is approved against this name.
  clinician: string;
  patientId: string;
  readonly?: boolean;
}

interface Turn {
  id: number;
  question: string;
  state: 'thinking' | 'done' | 'error';
  answer?: MemoryAnswer;
}

// The patient-memory panel: a four-year summary drafted for approval, and questions answered from
// her record. Every answer quotes recorded values and cites where they came from, with how sure the
// reader is; none says what will happen to her. Answers are read, not filed: only an approved summary
// goes to the chart.
export function MemoryPanel({
  memory,
  clinician,
  patientId,
  readonly = false,
}: MemoryPanelProps) {
  const source = usePatientRecord();
  const action = usePatientRecordAction();
  const [draft, setDraft] = useState<MemoryDraft | null>(null);
  const [status, setStatus] = useState<AiDraftStatus>('pending');
  const [writing, setWriting] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const nextId = useRef(1);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function summarize() {
    setWriting(true);
    setStatus('generating');
    const written = await action.run(() => source.summarizeHistory(patientId));
    setWriting(false);
    if (written) {
      setDraft(written);
      setStatus('pending');
    }
  }

  async function approve() {
    if (!draft) return;
    const approved = await action.run(() =>
      source.approveMemoryDraft(draft.id, clinician),
    );
    // A failed approval leaves the summary a draft.
    if (!approved) setStatus('undone');
  }

  function change(id: number, next: Partial<Turn>) {
    if (!mounted.current) return;
    setTurns((all) =>
      all.map((turn) => (turn.id === id ? { ...turn, ...next } : turn)),
    );
  }

  async function load(id: number, question: string) {
    try {
      const answer = await source.askMemory(question, patientId);
      change(id, { state: 'done', answer });
    } catch {
      // The reason is not shown: an answer that cannot be got says so, in fixed words.
      change(id, { state: 'error' });
    }
  }

  function ask(question: string) {
    const id = nextId.current++;
    setTurns((all) => [...all, { id, question, state: 'thinking' }]);
    void load(id, question);
  }

  function retry(turn: Turn) {
    change(turn.id, { state: 'thinking' });
    void load(turn.id, turn.question);
  }

  const busy = turns.some((turn) => turn.state === 'thinking');

  return (
    <Section
      title="Patient memory"
      description="Ask about her record. Every answer says where it came from; nothing here is filed to the chart unless you approve it."
    >
      <Stack gap="s6">
        <ActionFeedback
          notice={null}
          error={action.error}
          onDismissError={action.clearError}
        />
        {draft || writing ? (
          <AiDraftBlock
            title={draft?.title ?? 'Four years in one glance'}
            status={status}
            onStatusChange={setStatus}
            approverName={clinician}
            canApprove={!readonly}
            verb="Approve to chart"
            approvedVerb="Approved to chart"
            onApprove={() => void approve()}
            onUndo={() => {
              if (draft) {
                void action.run(() => source.withdrawApproval(draft.id));
              }
            }}
            badges={
              <AiClassChip tier="green" detail="summary of recorded events" />
            }
            source={
              draft ? <AiSourceLine>{draft.sources}</AiSourceLine> : undefined
            }
          >
            {draft ? (
              <SafeMarkdown
                text={draft.findings
                  .map((finding) => `- ${finding}`)
                  .join('\n')}
              />
            ) : (
              <Text tone="muted">Reading her record…</Text>
            )}
          </AiDraftBlock>
        ) : (
          <Stack
            direction="horizontal"
            align="center"
            justify="between"
            wrap
            gap="s4"
          >
            <Text tone="muted" className="min-w-0 flex-1">
              A short summary of the whole record, written as a draft for you to
              approve.
            </Text>
            <Button variant="ai" size="sm" onClick={() => void summarize()}>
              Summarize 4 years
            </Button>
          </Stack>
        )}

        <AiChatThread
          busy={busy}
          suggestions={memory.suggestions}
          onSuggestion={ask}
          suggestionsDisabled={busy}
          logClassName="max-h-(--nova-measure-lg) pr-s2"
        >
          {turns.flatMap((turn) => [
            <ChatQuestion key={`q${turn.id}`}>{turn.question}</ChatQuestion>,
            turn.state === 'thinking' ? (
              <AiThinking key={`a${turn.id}`} label="Reading her record" />
            ) : turn.state === 'error' ? (
              <ChatAnswer
                key={`a${turn.id}`}
                status="error"
                onRetry={() => retry(turn)}
              />
            ) : (
              <ChatAnswer
                key={`a${turn.id}`}
                status="done"
                text={turn.answer?.text}
                source={
                  turn.answer ? (
                    <AiSourceLine confidence={turn.answer.confidence}>
                      {turn.answer.sources}
                    </AiSourceLine>
                  ) : undefined
                }
                followups={turn.answer?.followups}
                onFollowup={ask}
                followupsDisabled={busy}
              />
            ),
          ])}
        </AiChatThread>

        <ChatComposer
          onSend={ask}
          busy={busy}
          placeholder={memory.askPlaceholder}
        />
      </Stack>
    </Section>
  );
}
