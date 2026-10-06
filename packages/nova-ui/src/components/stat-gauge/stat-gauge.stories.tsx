import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { StatGauge } from './stat-gauge';

const narrow: Decorator = (Story) => (
  <div className="max-w-xs">
    <Story />
  </div>
);

const meta = {
  title: 'Components/StatGauge',
  component: StatGauge,
  args: { label: 'Bed occupancy', value: 72 },
  decorators: [narrow],
} satisfies Meta<typeof StatGauge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Percentage: Story = {};
export const CustomText: Story = {
  args: { label: 'Beds in use', value: 42, max: 60, valueText: '42 of 60' },
};
export const Empty: Story = { args: { value: 0 } };
export const Full: Story = { args: { value: 100 } };
