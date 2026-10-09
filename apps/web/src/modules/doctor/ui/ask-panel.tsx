import { Fragment, useCallback, useRef, useState, type ReactNode } from 'react';
import {
  AiMark,
  AiChatThread,
  AiClassChip,
  AiSourceLine,
  AiThinking,
  ChatAnswer,
  ChatComposer,
  ChatQuestion,
  Stack,
} from '@hos/nova-ui';
import type { ChatReply } from '../data';

export interface AskPanelProps {
  ask: (question: string) => Promise<ChatReply>;
  suggestions: string[];
  // The AI in this conversation, by name: "AI Health Memory", "the panel".
  name: string;
  // Names the conversation for assistive technology.
  threadLabel: string;
  composerLabel: string;
  placeholder: string;
  emptyHint: ReactNode;
  thinkLabel: string;
  // What a failed answer says. Fixed words: the source's own error never reaches the screen.
  errorMessage: string;
}

interface Turn {
  id: number;
  question: string;
  phase: 'thinking' | 'done' | 'error';
  reply?: ChatReply;
}

const RED_REASON =
  'Choosing, starting, stopping or changing a dose for a named patient is a RED-tier action under the CDSCO SaMD framework. HOS holds no licence for it, so it will not answer it. It will hand you the facts instead.';

// A conversation with an AI that reads the record, the way the prototype's chat boxes work
// (HOS.aiChat): ask a question or choose one, watch it think, read an answer that cites where it came
// from, and follow up. Every answer is marked with the AI mark and the AI's name. An answer is evidence, never
// advice: the one that would be advice is shown as the blocked RED tier. Nothing is stored or
// logged: the thread lives on this screen only.
export function AskPanel({
  ask,
  suggestions,
  name,
  threadLabel,
  composerLabel,
  placeholder,
  emptyHint,
  thinkLabel,
  errorMessage,
}: AskPanelProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const nextId = useRef(1);
  const busy = turns.some((turn) => turn.phase === 'thinking');

  const settle = useCallback(
    async (id: number, question: string) => {
      try {
        const reply = await ask(question);
        setTurns((current) =>
          current.map((turn) =>
            turn.id === id ? { ...turn, phase: 'done', reply } : turn,
          ),
        );
      } catch {
        setTurns((current) =>
          current.map((turn) =>
            turn.id === id ? { ...turn, phase: 'error' } : turn,
          ),
        );
      }
    },
    [ask],
  );

  function send(question: string) {
    if (busy) return;
    const id = nextId.current++;
    setTurns((current) => [...current, { id, question, phase: 'thinking' }]);
    void settle(id, question);
  }

  function retry(turn: Turn) {
    setTurns((current) =>
      current.map((item) =>
        item.id === turn.id ? { ...item, phase: 'thinking' } : item,
      ),
    );
    void settle(turn.id, turn.question);
  }

  const last = turns[turns.length - 1]?.id;

  return (
    <Stack gap="s4">
      <AiChatThread
        label={threadLabel}
        busy={busy}
        emptyHint={
          <>
            <AiMark size="xs" className="mr-s1 align-text-bottom" />
            {emptyHint}
          </>
        }
        suggestions={suggestions}
        onSuggestion={send}
        suggestionsDisabled={busy}
        logClassName="max-h-(--nova-transcript-max-h)"
      >
        {turns.map((turn) => (
          <Fragment key={turn.id}>
            <ChatQuestion>{turn.question}</ChatQuestion>
            {turn.phase === 'thinking' ? (
              <AiThinking label={thinkLabel} />
            ) : turn.phase === 'error' || !turn.reply ? (
              <ChatAnswer
                label={name}
                speakerLabel={`${name} answered`}
                status="error"
                errorMessage={errorMessage}
                onRetry={() => retry(turn)}
              />
            ) : (
              <ChatAnswer
                label={name}
                speakerLabel={`${name} answered`}
                stream={turn.reply.text}
                source={
                  turn.reply.source ? (
                    <AiSourceLine>{turn.reply.source}</AiSourceLine>
                  ) : undefined
                }
                actions={
                  turn.reply.tier === 'red' ? (
                    <AiClassChip
                      tier="red"
                      detail="not answered"
                      reason={RED_REASON}
                    />
                  ) : turn.reply.tier === 'amber' ? (
                    <AiClassChip tier="amber" detail="evidence only" />
                  ) : undefined
                }
                followups={turn.id === last ? turn.reply.followups : undefined}
                onFollowup={send}
                followupsDisabled={busy}
              />
            )}
          </Fragment>
        ))}
      </AiChatThread>
      <ChatComposer
        onSend={send}
        busy={busy}
        label={composerLabel}
        placeholder={placeholder}
      />
    </Stack>
  );
}
