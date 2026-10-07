import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { Surface } from '../../primitives/surface';
import { AiChatThread } from './ai-chat-thread';
import { AiStreamText } from './ai-stream-text';
import { AiThinking } from './ai-thinking';
import { ChatAnswer, type ChatAnswerStatus } from './chat-answer';
import { ChatComposer } from './chat-composer';
import { ChatQuestion } from './chat-question';
import { FollowupChips } from './followup-chips';

// Sample data only: a fictional patient (the prototype's Lakshmi Devi), no real record.
export interface DemoAnswer {
  keywords: readonly string[];
  text: string;
  followups?: readonly string[];
  // The first attempt fails, so Retry can be shown.
  failsOnce?: boolean;
}

export const PATIENT_HISTORY_BANK: readonly DemoAnswer[] = [
  {
    keywords: ['hba1c', 'sugar', 'diabetes', 'trend'],
    text: 'Her last **HbA1c was 8.4%** on 12 Sep, up from 7.9% in June. She is on **Metformin 1000mg BD** since 2022.',
    followups: [
      'Is the Metformin dose safe for her kidneys?',
      'Any allergies?',
    ],
  },
  {
    keywords: ['kidney', 'egfr', 'renal', 'metformin', 'dose'],
    text: 'Her **eGFR is 44** (CKD stage 3a). The Metformin label caps the dose at **1000mg a day** below an eGFR of 45, so *BD dosing needs review*.\n\n- Recheck eGFR in 4 weeks\n- Consider 500mg BD',
    followups: ['Any drug interactions?'],
  },
  {
    keywords: ['allerg'],
    text: 'Recorded allergies:\n- **Penicillin** (rash, 2019)\n- **Sulfa drugs**',
    followups: ['Any drug interactions?'],
  },
  {
    keywords: ['interaction'],
    text: 'No interactions between her current medicines. Avoid **NSAIDs** with her eGFR of 44.',
  },
  {
    keywords: ['imaging', 'scan', 'x-ray', 'report'],
    text: 'Her last chest X-ray (3 Aug) was **clear**. No imaging since.',
    failsOnce: true,
  },
  {
    keywords: [],
    text: 'I can answer from her record: try **“last HbA1c”**, **“kidney function”** or **“allergies”**.',
  },
];

function match(question: string, bank: readonly DemoAnswer[]): DemoAnswer {
  const q = question.toLowerCase();
  let best: DemoAnswer | undefined;
  let bestScore = 0;
  for (const item of bank) {
    const score = item.keywords.filter((k) => q.includes(k)).length;
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best ?? bank[bank.length - 1] ?? { keywords: [], text: '' };
}

interface Turn {
  id: number;
  question: string;
  answer: DemoAnswer;
  attempt: number;
  status: 'thinking' | ChatAnswerStatus;
}

// A pretend backend for the stories: think for a moment, then stream the matched answer. Nothing is
// fetched, logged or stored.
export function useDemoConversation(
  bank: readonly DemoAnswer[],
  thinkingLabel = 'Reading her record',
) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const update = (id: number, change: Partial<Turn>) =>
    setTurns((list) =>
      list.map((turn) => (turn.id === id ? { ...turn, ...change } : turn)),
    );

  const think = (id: number, fails: boolean) => {
    timers.current.push(
      window.setTimeout(
        () => update(id, { status: fails ? 'error' : 'streaming' }),
        800,
      ),
    );
  };

  const ask = (question: string) => {
    const id = nextId.current++;
    const answer = match(question, bank);
    setTurns((list) => [
      ...list,
      { id, question, answer, attempt: 1, status: 'thinking' },
    ]);
    think(id, answer.failsOnce === true);
  };

  const busy = turns.some(
    (turn) => turn.status === 'thinking' || turn.status === 'streaming',
  );

  const stop = () =>
    setTurns((list) =>
      list.map((turn) =>
        turn.status === 'thinking' || turn.status === 'streaming'
          ? { ...turn, status: 'stopped' }
          : turn,
      ),
    );

  const children: ReactNode[] = turns.flatMap((turn) => [
    <ChatQuestion key={`q${turn.id}`}>{turn.question}</ChatQuestion>,
    turn.status === 'thinking' ? (
      <AiThinking key={`t${turn.id}`} label={thinkingLabel} />
    ) : (
      <ChatAnswer
        key={`a${turn.id}.${turn.attempt}`}
        stream={turn.status === 'error' ? undefined : turn.answer.text}
        status={turn.status === 'streaming' ? undefined : turn.status}
        onComplete={() => update(turn.id, { status: 'done' })}
        followups={turn.answer.followups}
        onFollowup={ask}
        followupsDisabled={busy}
        onRetry={() => {
          update(turn.id, { status: 'thinking', attempt: turn.attempt + 1 });
          think(turn.id, false);
        }}
      />
    ),
  ]);

  return { children, ask, busy, stop };
}

const meta = {
  title: 'AI/AiChatThread',
  component: AiChatThread,
  excludeStories: ['PATIENT_HISTORY_BANK', 'useDemoConversation'],
  decorators: [
    (Story) => (
      <Surface
        material="card"
        radius="card"
        className="flex h-(--nova-measure-lg) max-w-md flex-col"
      >
        <Story />
      </Surface>
    ),
  ],
} satisfies Meta<typeof AiChatThread>;

export default meta;
type Story = StoryObj<typeof meta>;

const SUGGESTIONS = [
  'When was her last HbA1c?',
  'Any allergies?',
  'Any imaging on file?',
];

// The whole loop: ask (or pick a suggestion), HOS AI thinks, streams, then offers follow-ups.
// "Any imaging on file?" fails once, to show Retry. Stop (or Escape) stops an answer mid-stream.
export const PatientHistoryQA: Story = {
  render: function Render() {
    const demo = useDemoConversation(PATIENT_HISTORY_BANK);
    const composer = useRef<HTMLTextAreaElement>(null);
    return (
      <>
        <AiChatThread
          className="min-h-0 flex-1"
          logClassName="px-s6 pt-s5 pb-s3"
          busy={demo.busy}
          onStop={demo.stop}
          suggestions={SUGGESTIONS}
          onSuggestion={(question) => {
            demo.ask(question);
            composer.current?.focus();
          }}
        >
          {demo.children}
        </AiChatThread>
        <ChatComposer
          ref={composer}
          className="border-t border-border px-s6 pb-s6 pt-s4"
          onSend={demo.ask}
          busy={demo.busy}
          onStop={demo.stop}
        />
      </>
    );
  },
};

export const Empty: Story = {
  args: {
    logClassName: 'p-s6',
    suggestions: SUGGESTIONS,
    onSuggestion: () => undefined,
  },
};

export const Thinking: Story = {
  args: {
    logClassName: 'p-s6',
    busy: true,
    children: [
      <ChatQuestion key="q">When was her last HbA1c?</ChatQuestion>,
      <AiThinking key="t" label="Reading her record" />,
    ],
  },
};

export const Streaming: Story = {
  args: {
    logClassName: 'p-s6',
    busy: true,
    children: [
      <ChatQuestion key="q">When was her last HbA1c?</ChatQuestion>,
      <ChatAnswer
        key="a"
        status="streaming"
        text="Her last **HbA1c was 8.4%** on 12 Sep, up from"
      />,
    ],
  },
};

export const DoneWithFollowups: Story = {
  args: {
    logClassName: 'p-s6',
    children: [
      <ChatQuestion key="q">When was her last HbA1c?</ChatQuestion>,
      <ChatAnswer
        key="a"
        text={PATIENT_HISTORY_BANK[0]?.text}
        source="From the hospital lab report of 12 Sep"
        followups={PATIENT_HISTORY_BANK[0]?.followups}
        onFollowup={() => undefined}
      />,
    ],
  },
};

// The prototype has no failure state; Nova says so in words and offers a real Retry button.
export const ErrorAndRetry: Story = {
  args: {
    logClassName: 'p-s6',
    children: [
      <ChatQuestion key="q">Any imaging on file?</ChatQuestion>,
      <ChatAnswer key="a" status="error" onRetry={() => undefined} />,
    ],
  },
};

export const Stopped: Story = {
  args: {
    logClassName: 'p-s6',
    children: [
      <ChatQuestion key="q">
        Is the Metformin dose safe for her kidneys?
      </ChatQuestion>,
      <ChatAnswer
        key="a"
        status="stopped"
        text="Her **eGFR is 44** (CKD stage 3a). The Metformin label caps"
      />,
    ],
  },
};

// A Telugu answer with its English gloss underneath, each in its own language.
export const TeluguWithGloss: Story = {
  args: {
    logClassName: 'p-s6',
    children: [
      <ChatQuestion key="q" lang="te">
        ఆమె షుగర్ ఎలా ఉంది?
      </ChatQuestion>,
      <ChatAnswer
        key="a"
        lang="te"
        text="ఆమె చివరి **HbA1c 8.4%** — జూన్‌లో 7.9% నుండి పెరిగింది."
        gloss="Her last HbA1c is 8.4%, up from 7.9% in June."
      />,
    ],
  },
};

// The parts on their own.
export const Parts: StoryObj = {
  render: function Render() {
    const [run, setRun] = useState(0);
    return (
      <div className="flex max-w-md flex-col gap-s6">
        <AiThinking />
        <div className="flex flex-col gap-s3">
          <AiStreamText
            key={run}
            stream="Her **eGFR is 44** (CKD stage 3a). The Metformin label caps the dose at **1000mg a day** below an eGFR of 45."
          />
          <Button size="sm" variant="ghost" onClick={() => setRun(run + 1)}>
            Stream again
          </Button>
        </div>
        <FollowupChips
          questions={['Show her timeline', 'Any drug interactions?']}
          onSelect={() => undefined}
        />
      </div>
    );
  },
};
