import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from './chip';

const meta = { title: 'Components/Chip', component: Chip } satisfies Meta<
  typeof Chip
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Chip>Pending</Chip>
      <Chip tone="good">Filed</Chip>
      <Chip tone="warn">Query raised</Chip>
      <Chip tone="crit">Denied</Chip>
      <Chip tone="info">Pre-auth</Chip>
      <Chip tone="ai">AI draft</Chip>
    </div>
  ),
};
