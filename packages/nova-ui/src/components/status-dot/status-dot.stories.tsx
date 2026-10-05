import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusDot } from './status-dot';

const meta = {
  title: 'Components/StatusDot',
  component: StatusDot,
  args: { tone: 'good', label: 'Stable' },
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// The label is mandatory: a bare coloured dot fails for colour-blind users and in greyscale print.
export const AllTones: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <StatusDot tone="good" label="Stable" />
      <StatusDot tone="warn" label="Under observation" />
      <StatusDot tone="crit" label="Critical" />
      <StatusDot tone="info" label="Awaiting review" />
      <StatusDot tone="neutral" label="Discharged" />
    </div>
  ),
};
