import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiBadge } from './ai-badge';

const meta = {
  title: 'AI/AiBadge',
  component: AiBadge,
} satisfies Meta<typeof AiBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// AI is cyan, never a status colour, and never identified by colour alone: the ✦ spark and the
// label are both visible, so the badge survives colour blindness and greyscale print.
export const Default: Story = {};

export const CustomLabel: Story = { args: { label: 'AI summary' } };

export const InContext: Story = {
  render: () => (
    <p className="flex items-center gap-2 text-sm text-ink">
      Discharge summary
      <AiBadge />
    </p>
  ),
};
