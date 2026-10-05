import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './textarea';

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  args: { label: 'Presenting complaint' },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = {
  args: { hint: 'Onset, duration and anything that makes it better or worse' },
};
export const Required: Story = { args: { required: true } };
export const WithError: Story = {
  args: { required: true, error: 'Describe the complaint in at least a line' },
};
export const MoreRows: Story = { args: { rows: 8 } };
export const Disabled: Story = { args: { disabled: true } };
