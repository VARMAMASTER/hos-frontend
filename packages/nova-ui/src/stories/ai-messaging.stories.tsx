import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AiDraftReply } from '../components/ai-draft-reply/ai-draft-reply';
import {
  CallSystemEvent,
  CallTranscriptConsole,
  CallTurn,
  CallWriteBack,
  type CallState,
} from '../components/call-transcript-console/call-transcript-console';
import {
  WaBilingualMessage,
  WaMessage,
  WaQuickReplyButtons,
  WaTypingIndicator,
  WhatsAppThread,
  type WaDeliveryStatus,
} from '../components/whatsapp-thread/whatsapp-thread';
import { motionAllowed } from '../primitives/motion';

// AI messaging and calls in one place: a WhatsApp booking, the AI calling console and an AI-drafted
// reply. Every patient and member of staff here is fictional. Nothing is sent anywhere: the flows
// below only change what is on screen. Flip the toolbar's scheme, theme and material, or open the
// Dark stories.
const meta = { title: 'AI/Messaging' } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const DARK = { scheme: 'dark' } as const;

// A pause between simulated steps: short when motion is unwelcome, so the final state shows at once.
const pause = (ms: number) => (motionAllowed() ? ms : 60);

function useTimers() {
  const timers = useRef<number[]>([]);
  useEffect(
    () => () => {
      for (const id of timers.current) window.clearTimeout(id);
    },
    [],
  );
  return (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, pause(ms)));
  };
}

const SLOTS = [
  { value: '10:00 AM', label: '10:00 AM — available' },
  { value: '11:30 AM', label: '11:30 AM — available' },
  { value: '04:00 PM', label: '04:00 PM — available' },
];

// The booking: typing, a bilingual reply with slot buttons that lock when one is picked, the
// patient's answer, then the confirmation moving through pending, sent, delivered and read. The
// after-hours badge says the AI is answering alone.
function WhatsAppBooking() {
  const later = useTimers();
  const [typing, setTyping] = useState<'in' | 'out' | null>('out');
  const [offered, setOffered] = useState(false);
  const [slot, setSlot] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [confirmation, setConfirmation] = useState<WaDeliveryStatus | null>(
    null,
  );

  useEffect(() => {
    later(() => {
      setTyping(null);
      setOffered(true);
    }, 1400);
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(value: string) {
    setSlot(value);
    setTyping('in');
    later(() => {
      setTyping(null);
      setAnswered(true);
      setTyping('out');
    }, 900);
    later(() => {
      setTyping(null);
      setConfirmation('pending');
    }, 2200);
    later(() => setConfirmation('sent'), 2900);
    later(() => setConfirmation('delivered'), 3600);
    later(() => setConfirmation('read'), 4600);
  }

  return (
    <WhatsAppThread
      name="Padma Sree"
      subtitle="+91 98480 1123•"
      status={
        <>
          <span aria-hidden="true">✦ </span>AI Assistant
        </>
      }
      badge={
        <>
          Front desk closed · 11:47 PM · <span aria-hidden="true">✦ </span>AI
          handling solo
        </>
      }
      maxBodyHeight={520}
    >
      <WaBilingualMessage
        lang="te"
        gloss="I need an appointment with Dr. Sunitha Rao tomorrow."
        time="11:47 PM"
      >
        Dr. Sunitha Rao గారికి అపాయింట్‌మెంట్ కావాలి, రేపు
      </WaBilingualMessage>
      {offered ? (
        <WaBilingualMessage
          direction="out"
          tone="ai"
          lang="te"
          gloss="Of course! Dr. Sunitha Rao’s open slots tomorrow (19 Jul) — pick one:"
          time="11:47 PM"
          status="read"
          actions={
            <WaQuickReplyButtons
              label="Pick a slot"
              options={SLOTS}
              value={slot}
              onValueChange={pick}
            />
          }
        >
          తప్పకుండా! రేపు (19 Jul) Dr. Sunitha Rao గారి అందుబాటులో ఉన్న
          స్లాట్‌లు — ఒకటి ఎంచుకోండి:
        </WaBilingualMessage>
      ) : null}
      {answered && slot ? (
        <WaBilingualMessage
          lang="te"
          gloss={`${slot} works 👍`}
          time="11:48 PM"
        >
          {slot} బాగుంటుంది 👍
        </WaBilingualMessage>
      ) : null}
      {confirmation ? (
        <WaMessage
          direction="out"
          tone="ai"
          time="11:48 PM"
          status={confirmation}
        >
          Confirmed ✅ Padma Sree — Dr. Sunitha Rao, 19 Jul 2026, {slot}, Room 5
          — token <b className="font-bold">T-27</b>. Front desk sees this when
          Swapna opens at 9:00 AM.
        </WaMessage>
      ) : null}
      {typing ? (
        <WaTypingIndicator
          direction={typing}
          label={
            typing === 'in' ? 'Padma Sree is typing' : 'AI assistant is typing'
          }
        />
      ) : null}
    </WhatsAppThread>
  );
}

export const WhatsAppBookingStory: Story = {
  name: 'WhatsApp booking',
  render: () => <WhatsAppBooking />,
};
export const WhatsAppBookingDark: Story = {
  name: 'WhatsApp booking (dark)',
  render: () => <WhatsAppBooking />,
  globals: DARK,
};

// A failed send, beside the other delivery states.
export const WhatsAppDeliveryStates: Story = {
  render: () => (
    <WhatsAppThread name="Mohd. Irfan" subtitle="+91 98480 2231•">
      <WaMessage time="11:02 AM">Stuck in traffic, can I come later?</WaMessage>
      <WaMessage direction="out" tone="ai" time="11:02 AM" status="read">
        No problem — 12:30 PM is open with Dr. K. Ramesh.
      </WaMessage>
      <WaMessage direction="out" time="11:03 AM" status="delivered">
        Please reach Room 3 by 12:20 PM.
      </WaMessage>
      <WaMessage direction="out" time="11:03 AM" status="sent">
        Bring your previous prescription.
      </WaMessage>
      <WaMessage direction="out" time="11:04 AM" status="pending">
        Pay the ₹500 fee by UPI to skip the queue.
      </WaMessage>
      <WaMessage
        direction="out"
        time="11:04 AM"
        status="failed"
        onRetry={() => undefined}
      >
        UPI link: pay.hospital.example/T-31
      </WaMessage>
    </WhatsAppThread>
  ),
};

type Line =
  | {
      kind: 'turn';
      ai?: boolean;
      speaker?: string;
      te: string;
      en: string;
      at: string;
      seconds: number;
    }
  | { kind: 'sys'; text: ReactNode; critical?: boolean };

const ESCALATION: Line[] = [
  {
    kind: 'sys',
    text: 'Inbound · +91 90104 8•••• · number matches the record of B. Nagaraju, 49M · answered by the agent in 1.2 s',
  },
  {
    kind: 'turn',
    ai: true,
    te: 'నమస్తే, శ్రీ వేంకటేశ్వర హాస్పిటల్. నేను హాస్పిటల్ AI అసిస్టెంట్‌ని. ఇది నాగరాజు గారి నంబర్ లాగా కనిపిస్తోంది — ఎలా సహాయం చేయగలను?',
    en: 'Namaste, Sri Venkateshwara Hospital. I am the hospital’s AI assistant. This looks like Mr. Nagaraju’s number — how can I help?',
    at: '0:04',
    seconds: 4,
  },
  {
    kind: 'turn',
    speaker: 'Caller · son',
    te: 'మా నాన్నగారికి ఛాతీలో నొప్పిగా ఉంది, చెమటలు పడుతున్నాయి. ఏం చేయాలి?',
    en: 'My father has chest pain and he is sweating. What should we do?',
    at: '0:14',
    seconds: 14,
  },
  {
    kind: 'turn',
    ai: true,
    te: 'ఇది నేను చెప్పగలిగే విషయం కాదు. మిమ్మల్ని ఇప్పుడే మా ఫ్రంట్ డెస్క్‌లో స్వప్న గారికి కలుపుతున్నాను — లైన్‌లోనే ఉండండి. మీకు అత్యవసరం అనిపిస్తే వెంటనే 108కి కాల్ చేయండి.',
    en: 'This is not something I can advise on. I am connecting you to Swapna at our front desk right now — please stay on the line. If you feel this is an emergency, call 108 immediately.',
    at: '0:21',
    seconds: 21,
  },
  {
    kind: 'sys',
    critical: true,
    text: 'Transferred to Swapna · 3.1 s after the symptom was mentioned · the call never dropped · she picked up at 10:39 AM',
  },
  {
    kind: 'sys',
    text: 'The agent asked no follow-up question, gave no advice and assigned no urgency level. Stopping here is the designed behaviour, not a failure.',
  },
];

function renderLines(lines: Line[]) {
  return lines.map((line, index) =>
    line.kind === 'sys' ? (
      <CallSystemEvent key={index} critical={line.critical}>
        {line.text}
      </CallSystemEvent>
    ) : (
      <CallTurn
        key={index}
        ai={line.ai}
        speaker={line.speaker}
        contentLang="te"
        gloss={line.en}
        time={line.at}
      >
        {line.te}
      </CallTurn>
    ),
  );
}

const LANGUAGES = [
  { code: 'te', label: 'తెలుగు · Telugu' },
  { code: 'hi', label: 'हिन्दी · Hindi' },
  { code: 'en', label: 'English' },
];

// The live escalation, as the front desk watches it: the escalation pill is the crit tone with an
// icon and the word "Escalation" for a screen reader.
function LiveEscalation() {
  return (
    <div className="max-w-2xl">
      <CallTranscriptConsole
        title="Inbound · B. Nagaraju, 49M"
        subtitle="Escalation · +91 90104 8•••• · Telugu"
        languages={LANGUAGES}
        language="te"
        state="live"
        elapsed={24}
      >
        {renderLines(ESCALATION)}
      </CallTranscriptConsole>
    </div>
  );
}

export const CallLiveEscalation: Story = { render: () => <LiveEscalation /> };
export const CallLiveEscalationDark: Story = {
  render: () => <LiveEscalation />,
  globals: DARK,
};

// Replaying the call: press Play; turns arrive with the typing dots between them; Pause holds the
// replay; at the end, the call ends and the records it wrote appear in the footer.
function ReplayingCall() {
  const later = useTimers();
  const [state, setState] = useState<CallState>('idle');
  const [paused, setPaused] = useState(false);
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  function step(index: number) {
    if (pausedRef.current) {
      later(() => step(index), 300);
      return;
    }
    if (index >= ESCALATION.length) {
      setTyping(false);
      setState('ended');
      return;
    }
    const next = ESCALATION[index];
    if (next?.kind === 'turn') {
      setTyping(true);
      later(() => {
        if (pausedRef.current) {
          later(() => step(index), 300);
          return;
        }
        setTyping(false);
        setShown(index + 1);
        later(() => step(index + 1), 500);
      }, 1100);
    } else {
      setShown(index + 1);
      later(() => step(index + 1), 700);
    }
  }

  function start() {
    setShown(0);
    setPaused(false);
    later(() => step(0), 300);
  }

  const last = ESCALATION.slice(0, shown)
    .filter((line) => line.kind === 'turn')
    .slice(-1)[0];
  const elapsed =
    state === 'ended' ? 31 : last?.kind === 'turn' ? last.seconds : 0;

  return (
    <div className="max-w-2xl">
      <CallTranscriptConsole
        title="Inbound · B. Nagaraju, 49M"
        subtitle="Replay of the 10:39 escalation · Telugu"
        languages={LANGUAGES}
        language="te"
        state={state}
        onStateChange={setState}
        paused={paused}
        onPausedChange={setPaused}
        onPlay={start}
        onReplay={start}
        elapsed={elapsed}
        typing={typing}
        typingLabel="Speaking…"
        footer={
          <CallWriteBack
            records={
              state === 'ended'
                ? [
                    {
                      id: 'handoff',
                      title: 'Live call handed to Swapna',
                      detail: '10:39 AM · front desk · the call never dropped',
                    },
                    {
                      id: 'record',
                      title: 'Recording and transcript attached',
                      detail:
                        'To B. Nagaraju’s record · AI worker named in the audit log',
                    },
                  ]
                : []
            }
            empty="Nothing yet. Play the call — every record the agent creates appears here as it happens."
          />
        }
      >
        {state === 'idle' ? (
          <CallSystemEvent>
            The agent identifies itself as an AI in the first sentence of every
            call. It is never introduced as a person.
          </CallSystemEvent>
        ) : (
          renderLines(ESCALATION.slice(0, shown))
        )}
      </CallTranscriptConsole>
    </div>
  );
}

export const CallReplaying: Story = { render: () => <ReplayingCall /> };
export const CallReplayingDark: Story = {
  render: () => <ReplayingCall />,
  globals: DARK,
};

// An AI draft reply: approve it as it is (Approve & send), or edit it first (Edit, then Save & send
// in the dialog). What onSend received is shown underneath; nothing leaves the page.
function DraftReplies() {
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <AiDraftReply
        title="AI reschedule reply"
        channel="whatsapp"
        recipient="Mohd. Irfan · +91 98480 2231•"
        approverName="Swapna"
        defaultMessage="Namaste Mohd. Irfan — no problem! We have moved your appointment with Dr. K. Ramesh to 12:30 PM today. Please reach Room 3 by 12:20 PM. — Sri Venkateshwara Multi-Speciality Hospital"
        consent="Patient consented to WhatsApp reminders · ₹0.45 per generated reply"
        onSend={(text) => setSent((all) => [...all, `WhatsApp: ${text}`])}
      />
      <AiDraftReply
        title="AI-drafted acceptance reply"
        channel="email"
        recipient="Apollo Diagnostics, Kukatpally"
        approverName="Swapna"
        defaultMessage="Referral received — B. Srinu scheduled with Dr. P. Anil Kumar (Orthopedics) on 21 Jul 2026, 10:30 AM. X-ray and prior notes received, thank you."
        onSend={(text) => setSent((all) => [...all, `Email: ${text}`])}
      />
      <section
        aria-label="What onSend received"
        className="text-[12px] text-ink-2"
      >
        <p className="font-semibold text-ink">
          What onSend received (story only)
        </p>
        {sent.length === 0 ? (
          <p>Nothing yet. Nothing is sent until someone approves.</p>
        ) : (
          <ul className="list-disc pl-4">
            {sent.map((text, index) => (
              <li key={index}>{text}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export const DraftReplyApproveOrEdit: Story = {
  render: () => <DraftReplies />,
};
export const DraftReplyDark: Story = {
  render: () => <DraftReplies />,
  globals: DARK,
};

// The edit dialog, open: Save & send is the approval, so it sends only from here.
export const DraftReplyEditing: Story = {
  render: () => <DraftReplyEditingDemo />,
};

function DraftReplyEditingDemo() {
  useEffect(() => {
    const edit = document.querySelector<HTMLButtonElement>(
      '[data-action="edit"]',
    );
    edit?.click();
  }, []);
  return (
    <div className="max-w-2xl">
      <AiDraftReply
        title="AI reschedule reply"
        channel="whatsapp"
        recipient="Mohd. Irfan · +91 98480 2231•"
        approverName="Swapna"
        defaultMessage="Namaste Mohd. Irfan — we have moved your appointment with Dr. K. Ramesh to 12:30 PM today."
        onSend={() => undefined}
      />
    </div>
  );
}
