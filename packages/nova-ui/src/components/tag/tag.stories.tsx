import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from './tag';

const meta = {
  title: 'Components/Tag',
  component: Tag,
  args: { children: 'Offline' },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = { args: { variant: 'solid' } };
export const Outline: Story = { args: { variant: 'outline' } };

export const AllCombinations: Story = {
  render: () => (
    <div className="grid grid-cols-[auto_auto_auto_auto] items-center justify-start gap-x-s6 gap-y-s5 text-control text-ink-2">
      <span />
      <span>neutral</span>
      <span>brand</span>
      <span>ai</span>
      <span>solid</span>
      <Tag tone="neutral">Offline</Tag>
      <Tag tone="brand">Beta</Tag>
      <Tag tone="ai">AI assist</Tag>
      <span>outline</span>
      <Tag variant="outline" tone="neutral">
        Offline
      </Tag>
      <Tag variant="outline" tone="brand">
        Beta
      </Tag>
      <Tag variant="outline" tone="ai">
        AI assist
      </Tag>
    </div>
  ),
};
