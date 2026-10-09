import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiBadge } from './ai-badge';

const meta = {
  title: 'AI/AiBadge',
  component: AiBadge,
} satisfies Meta<typeof AiBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// AI is its own colour family (cyan in HOS Violet; each hospital theme derives its own hue), never a
// status colour, and never identified by colour alone: the ✦ spark and the label are both visible, so
// the badge survives colour blindness and greyscale print.
export const Default: Story = {};

export const CustomLabel: Story = { args: { label: 'AI summary' } };

export const Glowing: Story = {
  args: { variant: 'glow', label: 'AI draft' },
};

export const InContext: Story = {
  render: () => (
    <div className="flex flex-col gap-s3 text-control text-ink">
      <p className="flex items-center gap-s3">
        Discharge summary
        <AiBadge />
      </p>
      <p className="flex items-center gap-s3">
        Clinical suggestion
        <AiBadge variant="glow" label="AI recommended" />
      </p>
    </div>
  ),
};
