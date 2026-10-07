import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiClassChip } from './ai-class-chip';
import { TierCard } from './tier-card';

const meta = {
  title: 'AI/AiClassChip',
  component: AiClassChip,
  args: { tier: 'green' },
} satisfies Meta<typeof AiClassChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Green: Story = { args: { detail: 'productivity' } };

export const Amber: Story = { args: { tier: 'amber', detail: 'reference' } };

// RED is never a control: aria-disabled, out of the tab order, with "Why blocked" for the reason.
export const Red: Story = {
  args: {
    tier: 'red',
    detail: 'medical device',
    reason:
      'Needs a CDSCO Class C licence, an ICMR ethics review and separate DPDP consent.',
  },
};

export const Cards: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-s6 md:grid-cols-3">
      <TierCard
        tier="green"
        title="Discharge Drafter"
        detail="productivity"
        description="Drafts only. A human always signs."
      />
      <TierCard
        tier="amber"
        title="Lab Summarizer"
        detail="reference"
        description="Quotes the record and published ranges. Never tells you what to do."
      />
      <TierCard
        tier="red"
        title="Deterioration forecast"
        detail="medical device"
        description="Predicts a future clinical event. Not licensed in HOS."
        reason="Needs a CDSCO Class C licence, an ICMR ethics review and separate DPDP consent."
      />
    </div>
  ),
};
