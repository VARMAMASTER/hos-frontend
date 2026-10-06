import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { AiActionFeed, type AiAction } from './ai-action-feed';

// Every patient and member of staff here is fictional.
const ACTIONS: AiAction[] = [
  {
    id: 'a9',
    agent: 'Discharge Drafter',
    body: 'drafted a discharge summary for B. Srinu — post-op knee, day 4.',
    time: '12:15 PM',
    resolution: 'pending',
  },
  {
    id: 'a8',
    agent: 'Billing Agent',
    body: 'drafted pharmacy bill ₹1,240 for Lakshmi Devi, GST 12% applied.',
    time: '11:54 AM',
    resolution: 'approved',
    resolutionLabel: 'Approved by Ravi Teja',
  },
  {
    id: 'a7',
    agent: 'WhatsApp Assistant',
    body: 'could not match a reply about a refund to any bill; handed to the front desk.',
    time: '11:31 AM',
    resolution: 'escalated',
  },
  {
    id: 'a6',
    agent: 'AI Scribe',
    body: 'drafted antenatal visit note for Dr. Sunitha Rao — Padma Sree, 24 weeks.',
    time: '11:26 AM',
    resolution: 'approved',
    resolutionLabel: 'Approved in 31s',
  },
  {
    id: 'a5',
    agent: 'Lab Summarizer',
    body: 'sent a CBC + TSH summary in Telugu — “అన్ని విలువలు సాధారణ పరిధిలో ఉన్నాయి”.',
    time: '10:18 AM',
    resolution: 'approved',
    resolutionLabel: 'Signed off by Prasad',
    lang: 'te',
  },
  {
    id: 'a4',
    agent: 'AI Scribe',
    body: 'drafted a referral letter that left out the problem list.',
    time: '09:58 AM',
    resolution: 'rejected',
    resolutionLabel: 'Rejected by Dr. K. Ramesh',
  },
  {
    id: 'a3',
    agent: 'WhatsApp Assistant',
    body: 'booked K. Manjula (36F) — Gynecology, token T-04, tomorrow 10:30 AM.',
    time: '09:42 AM',
    resolution: 'approved',
    resolutionLabel: 'Confirmed by Swapna',
  },
];

const meta = {
  title: 'AI/AiActionFeed',
  component: AiActionFeed,
  args: { actions: ACTIONS },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AiActionFeed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Today: Story = {};

export const AwaitingApproval: Story = {
  args: { defaultResolutionFilter: 'pending' },
};

export const NothingMatches: Story = {
  args: {
    defaultAgentFilter: 'AI Scribe',
    defaultResolutionFilter: 'escalated',
  },
};

// New entries arrive at the top and are announced politely: agent and resolution, never the body.
export const LiveEntries: Story = {
  render: () => <Live />,
};

function Live() {
  const [added, setAdded] = useState(0);
  const fresh = Array.from({ length: added }, (_, index) => ({
    ...(ACTIONS[index % 2] ?? ACTIONS[0]!),
    id: `new-${index}`,
    time: 'Just now',
  })).reverse();
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button variant="ai" size="sm" onClick={() => setAdded(added + 1)}>
          Simulate an AI action
        </Button>
      </div>
      <AiActionFeed actions={[...fresh, ...ACTIONS.slice(2)]} />
    </div>
  );
}
