import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiDraftReply } from './ai-draft-reply';

// Fictional patients and staff throughout. Nothing is sent: onSend does nothing here.
const meta = {
  title: 'AI/AiDraftReply',
  component: AiDraftReply,
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: {
    channel: 'whatsapp',
    recipient: 'Mohd. Irfan · +91 98480 2231•',
    approverName: 'Swapna',
    defaultMessage:
      'Namaste Mohd. Irfan — no problem! We have moved your appointment with Dr. K. Ramesh to 12:30 PM today. Please reach Room 3 by 12:20 PM. — Sri Venkateshwara Multi-Speciality Hospital',
    consent: 'Patient consented to WhatsApp reminders · ₹0.45 per reply',
    onSend: () => undefined,
  },
} satisfies Meta<typeof AiDraftReply>;

export default meta;
type Story = StoryObj<typeof meta>;

// Approve & send, Edit (Save & send in a dialog), or Reject with a reason.
export const Pending: Story = {};

export const Sent: Story = {
  args: { status: 'approved', approvedAt: '10:47 AM' },
};

export const Rejected: Story = {
  args: {
    status: 'rejected',
    rejectedBy: 'Swapna',
    rejectionReason: 'The 12:30 PM slot was taken at the counter.',
  },
};

export const Email: Story = {
  args: {
    title: 'AI-drafted acceptance reply',
    channel: 'email',
    recipient: 'Apollo Diagnostics, Kukatpally',
    defaultMessage:
      'Referral received — B. Srinu scheduled with Dr. P. Anil Kumar (Orthopedics) on 21 Jul 2026, 10:30 AM. X-ray and prior notes received, thank you.',
    consent: undefined,
  },
};

export const SmsTelugu: Story = {
  args: {
    channel: 'sms',
    recipient: 'K. Yadamma · +91 98493 21574',
    contentLang: 'te',
    defaultMessage:
      'యాదమ్మ గారు, సోమవారం 20 జూలై ఉదయం 9:30కి Dr. K. Ramesh గారితో మీ అపాయింట్‌మెంట్ బుక్ అయ్యింది. టోకెన్ T-27.',
    consent: 'SMS fallback: no WhatsApp on this number',
  },
};

export const PendingDark: Story = { globals: { scheme: 'dark' } };
