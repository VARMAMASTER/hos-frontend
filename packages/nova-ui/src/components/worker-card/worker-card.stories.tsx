import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkerCard, WorkerGrid } from './worker-card';

const meta = {
  title: 'AI/WorkerCard',
  component: WorkerCard,
  args: {
    name: 'WhatsApp Assistant',
    role: 'Front desk · Te/En/Hi',
    stat: '23 chats answered · 14 bookings today',
    hint: 'Full stats, config and log in the WhatsApp Assistant tab',
  },
  decorators: [
    (Story) => (
      <div className="max-w-60">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WorkerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

// The dot pulses only while working, and only when motion is welcome.
export const Working: Story = { args: { status: 'working' } };

// Switched off: the status line says paused and the chip says Off.
export const Paused: Story = { args: { defaultEnabled: false } };

export const ErrorState: Story = {
  args: {
    status: 'error',
    errorMessage: 'WhatsApp Business API is not answering',
  },
};

// Turning it off asks first (here the browser's confirm stands in for a reason dialog).
export const ConfirmBeforeOff: Story = {
  args: {
    tier: 'green',
    tierDetail: 'productivity',
    confirmDisable: () =>
      window.confirm('Switch the WhatsApp Assistant off for this hospital?'),
  },
};

export const Grid: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <WorkerGrid aria-label="AI workers">
      <WorkerCard
        name="WhatsApp Assistant"
        role="Front desk · Te/En/Hi"
        stat="23 chats answered · 14 bookings today"
        status="working"
      />
      <WorkerCard
        name="AI Scribe"
        role="Consult notes · 4 doctors"
        stat="48 notes drafted · avg approval 38 sec"
      />
      <WorkerCard
        name="Billing Agent"
        role="OPD + IPD · GST-aware"
        stat="31 bills drafted · ₹4,320 unbilled caught"
      />
      <WorkerCard
        name="Discharge Drafter"
        role="IPD summaries"
        stat="3 summaries drafted · 4.2 hrs saved today"
        defaultEnabled={false}
      />
      <WorkerCard
        name="Lab Summarizer"
        role="Patient reports · Telugu"
        stat="19 summaries sent in Telugu today"
      />
    </WorkerGrid>
  ),
};
