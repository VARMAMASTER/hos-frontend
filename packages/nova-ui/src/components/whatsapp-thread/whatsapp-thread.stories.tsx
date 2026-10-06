import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  PhoneFrame,
  WaBilingualMessage,
  WaMessage,
  WaQuickReplyButtons,
  WaTypingIndicator,
  WhatsAppThread,
} from './whatsapp-thread';

// Fictional patients and staff throughout. The thread is the hospital's view: the patient's
// messages come in on the left, the hospital's (the AI assistant's, marked ✦) go out on the right.
const meta = {
  title: 'AI/WhatsAppThread',
  component: WhatsAppThread,
  args: {
    name: 'Padma Sree',
    subtitle: '+91 98480 1123•',
    status: (
      <>
        <span aria-hidden="true">✦ </span>AI Assistant
      </>
    ),
  },
} satisfies Meta<typeof WhatsAppThread>;

export default meta;
type Story = StoryObj<typeof meta>;

const SLOTS = [
  { value: '10:00', label: '10:00 AM — available' },
  { value: '11:30', label: '11:30 AM — available' },
  { value: '16:00', label: '04:00 PM — available' },
];

// A booking: a Telugu request, the AI's bilingual answer with slot buttons. Pick one: they lock.
export const Booking: Story = {
  render: (args) => (
    <WhatsAppThread {...args}>
      <WaBilingualMessage
        lang="te"
        gloss="I need an appointment with Dr. Sunitha Rao tomorrow."
        time="09:23 AM"
      >
        Dr. Sunitha Rao గారికి అపాయింట్‌మెంట్ కావాలి, రేపు
      </WaBilingualMessage>
      <WaBilingualMessage
        direction="out"
        tone="ai"
        lang="te"
        gloss="Of course! Dr. Sunitha Rao’s open slots tomorrow (19 Jul) — pick one:"
        time="09:24 AM"
        status="read"
        actions={<WaQuickReplyButtons label="Pick a slot" options={SLOTS} />}
      >
        తప్పకుండా! రేపు (19 Jul) Dr. Sunitha Rao గారి అందుబాటులో ఉన్న స్లాట్‌లు
        — ఒకటి ఎంచుకోండి:
      </WaBilingualMessage>
    </WhatsAppThread>
  ),
};

// Every delivery state, each a mark and a word. The failed one offers Retry.
export const DeliveryStates: Story = {
  render: (args) => (
    <WhatsAppThread {...args}>
      <WaMessage direction="out" time="09:20 AM" status="pending">
        Your token for tomorrow is T-27.
      </WaMessage>
      <WaMessage direction="out" time="09:21 AM" status="sent">
        Room 5, first floor.
      </WaMessage>
      <WaMessage direction="out" time="09:22 AM" status="delivered">
        Please bring your previous reports.
      </WaMessage>
      <WaMessage direction="out" time="09:23 AM" status="read">
        Pay the ₹500 fee by UPI to skip the counter queue.
      </WaMessage>
      <WaMessage
        direction="out"
        time="09:24 AM"
        status="failed"
        onRetry={() => undefined}
      >
        Reply STOP to stop reminders.
      </WaMessage>
    </WhatsAppThread>
  ),
};

// After hours: the badge says the front desk is closed and the AI is answering alone.
export const AfterHours: Story = {
  args: {
    badge: (
      <>
        Front desk closed · 11:47 PM · <span aria-hidden="true">✦ </span>AI
        handling solo
      </>
    ),
  },
  render: (args) => (
    <WhatsAppThread {...args}>
      <WaMessage time="11:47 PM" contentLang="te">
        రేపు పొద్దున్న Dr. Ramesh గారికి చూపించుకోవాలి, స్లాట్ ఉందా?
      </WaMessage>
      <WaTypingIndicator direction="out" label="AI assistant is typing" />
    </WhatsAppThread>
  ),
};

// The lab's Telugu report summary, and the patient's reply with the report buttons.
export const LabReport: Story = {
  args: { name: 'Lakshmi Devi', subtitle: '+91 98480 1123•' },
  render: (args) => (
    <WhatsAppThread {...args}>
      <WaBilingualMessage
        direction="out"
        tone="ai"
        lang="te"
        gloss="Your new lab report is published. Your HbA1c is a little high — please consult Dr. Ramesh soon."
        time="10:02 AM"
        status="delivered"
      >
        నమస్తే Lakshmi Devi గారు 🙏 మీ కొత్త ల్యాబ్ రిపోర్ట్ ప్రచురించబడింది.
        HbA1c కొంచెం ఎక్కువగా ఉంది — Dr. Ramesh గారిని త్వరలో సంప్రదించండి.
      </WaBilingualMessage>
      <WaMessage time="10:04 AM" contentLang="te">
        ధన్యవాదాలు, రేపు అపాయింట్‌మెంట్ తీసుకుంటాను.
      </WaMessage>
      <WaQuickReplyButtons
        label="Report actions"
        options={[
          { value: 'pdf', label: '📄 View full report (PDF)' },
          { value: 'book', label: '📅 Book follow-up with Dr. Ramesh' },
        ]}
      />
    </WhatsAppThread>
  ),
};

// The bare phone, for a chat that has not started.
export const EmptyPhone: Story = {
  render: (args) => (
    <PhoneFrame name={args.name} subtitle={args.subtitle}>
      <p className="py-4 text-center text-[12px] text-wa-ink-2">
        Not sent yet — approve the summary to send it.
      </p>
    </PhoneFrame>
  ),
};

export const BookingDark: Story = { ...Booking, globals: { scheme: 'dark' } };
