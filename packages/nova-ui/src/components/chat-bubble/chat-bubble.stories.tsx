import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatBubble } from './chat-bubble';

// Fictional patients and staff throughout.
const meta = {
  title: 'AI/ChatBubble',
  component: ChatBubble,
  decorators: [
    (Story) => (
      <div className="flex max-w-md flex-col gap-s3 rounded-overlay bg-surface-2 p-s5">
        <Story />
      </div>
    ),
  ],
  args: { children: 'Yes, this is her.' },
} satisfies Meta<typeof ChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

// The other side, on the left, in the panel white.
export const Incoming: Story = {
  args: {
    speaker: 'K. Yadamma · patient',
    contentLang: 'te',
    children: 'అవును, నేనే మాట్లాడుతున్నాను.',
    gloss: 'Yes, this is her.',
    time: '0:12',
  },
};

// This side, on the right, in the brand's soft tint.
export const Outgoing: Story = {
  args: { direction: 'out', speaker: 'Swapna · front desk', time: '0:14' },
};

// A machine's words: the ✦ and a word, never colour alone.
export const Ai: Story = {
  args: {
    tone: 'ai',
    speaker: 'AI agent',
    contentLang: 'te',
    children:
      'నమస్తే, ఇది శ్రీ వేంకటేశ్వర హాస్పిటల్ నుండి ఆటోమేటిక్ కాల్. నేను హాస్పిటల్ AI అసిస్టెంట్‌ని — మనిషిని కాదు.',
    gloss:
      'Namaste, this is an automated call from Sri Venkateshwara Hospital. I am the hospital’s AI assistant — not a person.',
    time: '0:06',
  },
};

export const System: Story = {
  args: {
    tone: 'system',
    children: 'Call ended · 2:12 · metered ₹5.50 at ₹2.50/min',
  },
};

// An escalation: the crit tone, an icon, and "Escalation" for a screen reader.
export const Critical: Story = {
  args: {
    tone: 'system',
    critical: true,
    children:
      'Transferred to Swapna · 3.1 s after the symptom was mentioned · the call never dropped',
  },
};

export const Typing: Story = {
  args: { typing: true, typingLabel: 'K. Yadamma is speaking' },
};

// WhatsApp's own colours, from the --nova-wa-* tokens.
export const WhatsApp: Story = {
  decorators: [
    (Story) => (
      <div className="nova-wa-wall flex max-w-xs flex-col gap-s3 p-s5">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <ChatBubble palette="whatsapp" senderLabel="Patient said" time="09:24 AM">
        Is Dr. Ramesh in tomorrow morning?
      </ChatBubble>
      <ChatBubble
        palette="whatsapp"
        direction="out"
        tone="ai"
        aiLabel="AI assistant"
        senderLabel="AI assistant sent"
        time="09:24 AM"
      >
        Yes — 09:15 AM and 09:45 AM are open.
      </ChatBubble>
    </>
  ),
};
