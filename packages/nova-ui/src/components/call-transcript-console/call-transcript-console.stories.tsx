import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CallSystemEvent,
  CallTranscriptConsole,
  CallTurn,
  CallWriteBack,
} from './call-transcript-console';

// Fictional patients and staff throughout; the scripts follow 02-reception's AI calling demo.
const meta = {
  title: 'AI/CallTranscriptConsole',
  component: CallTranscriptConsole,
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: {
    title: 'Outbound · K. Yadamma, 63F',
    subtitle: 'Follow-up recall · +91 98493 21574 · Telugu',
    languages: [
      { code: 'te', label: 'తెలుగు · Telugu' },
      { code: 'hi', label: 'हिन्दी · Hindi' },
      { code: 'en', label: 'English' },
    ],
    language: 'te',
  },
} satisfies Meta<typeof CallTranscriptConsole>;

export default meta;
type Story = StoryObj<typeof meta>;

const opening = (
  <>
    <CallSystemEvent>
      The agent identifies itself as an AI in the first sentence of every call.
      It is never introduced as a person.
    </CallSystemEvent>
    <CallTurn
      ai
      contentLang="te"
      gloss="Namaste, this is an automated call from Sri Venkateshwara Hospital. I am the hospital’s AI assistant — not a person. Am I speaking with Yadamma garu?"
      time="0:06"
    >
      నమస్తే, ఇది శ్రీ వేంకటేశ్వర హాస్పిటల్ నుండి ఆటోమేటిక్ కాల్. నేను హాస్పిటల్
      AI అసిస్టెంట్‌ని — మనిషిని కాదు. యాదమ్మ గారు మాట్లాడుతున్నారా?
    </CallTurn>
    <CallTurn
      speaker="K. Yadamma · patient"
      contentLang="te"
      gloss="Yes, this is her."
      time="0:12"
    >
      అవును, నేనే మాట్లాడుతున్నాను.
    </CallTurn>
  </>
);

export const Idle: Story = {
  args: { children: <CallSystemEvent>Ready to dial.</CallSystemEvent> },
};

export const Live: Story = {
  args: { state: 'live', elapsed: 12, children: opening },
};

export const Typing: Story = {
  args: {
    state: 'typing',
    elapsed: 21,
    typingLabel: 'AI agent is speaking',
    children: opening,
  },
};

// The inbound escalation: the caller describes symptoms; the agent advises nothing and hands the
// live call to the front desk.
export const Escalation: Story = {
  args: {
    title: 'Inbound · B. Nagaraju, 49M',
    subtitle: 'Number matches the record · Telugu',
    state: 'live',
    elapsed: 24,
    children: (
      <>
        <CallTurn
          ai
          contentLang="te"
          gloss="Namaste, Sri Venkateshwara Hospital. I am the hospital’s AI assistant. How can I help?"
          time="0:04"
        >
          నమస్తే, శ్రీ వేంకటేశ్వర హాస్పిటల్. నేను హాస్పిటల్ AI అసిస్టెంట్‌ని.
          ఎలా సహాయం చేయగలను?
        </CallTurn>
        <CallTurn
          speaker="Caller · son"
          contentLang="te"
          gloss="My father has chest pain and he is sweating. What should we do?"
          time="0:14"
        >
          మా నాన్నగారికి ఛాతీలో నొప్పిగా ఉంది, చెమటలు పడుతున్నాయి. ఏం చేయాలి?
        </CallTurn>
        <CallTurn
          ai
          contentLang="te"
          gloss="This is not something I can advise on. I am connecting you to Swapna at our front desk right now — please stay on the line. If this is an emergency, call 108 immediately."
          time="0:21"
        >
          ఇది నేను చెప్పగలిగే విషయం కాదు. మిమ్మల్ని ఇప్పుడే మా ఫ్రంట్ డెస్క్‌లో
          స్వప్న గారికి కలుపుతున్నాను — లైన్‌లోనే ఉండండి. అత్యవసరం అనిపిస్తే
          వెంటనే 108కి కాల్ చేయండి.
        </CallTurn>
        <CallSystemEvent critical>
          Transferred to Swapna · 3.1 s after the symptom was mentioned · the
          call never dropped
        </CallSystemEvent>
      </>
    ),
  },
};

export const Replaying: Story = {
  args: { state: 'replaying', elapsed: 12, children: opening },
};

export const Ended: Story = {
  args: {
    state: 'ended',
    elapsed: 132,
    children: (
      <>
        {opening}
        <CallSystemEvent>Call ended · 2:12 · metered ₹5.50</CallSystemEvent>
      </>
    ),
    footer: (
      <CallWriteBack
        records={[
          {
            id: 'appt',
            title: 'Appointment created',
            detail: 'Mon 20 Jul 2026, 09:30 AM · Dr. K. Ramesh · Room 3',
          },
          {
            id: 'token',
            title: 'Token T-27 issued',
            detail: 'From the same sequence as the counter',
          },
          {
            id: 'wa',
            title: 'WhatsApp confirmation sent',
            detail: 'To +91 98493 21574, in Telugu',
          },
        ]}
      />
    ),
  },
};

export const EscalationDark: Story = {
  ...Escalation,
  globals: { scheme: 'dark' },
};
