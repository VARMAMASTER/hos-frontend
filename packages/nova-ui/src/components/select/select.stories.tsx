import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './select';

const WARDS = [
  { value: 'general', label: 'General ward' },
  { value: 'icu', label: 'Intensive care' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'isolation', label: 'Isolation (no free beds)', disabled: true },
];

const meta = {
  title: 'Components/Select',
  component: Select,
  args: { label: 'Ward', options: WARDS },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithPlaceholder: Story = {
  args: { placeholder: 'Choose a ward' },
};
export const Required: Story = {
  args: { placeholder: 'Choose a ward', required: true },
};
export const WithHint: Story = {
  args: { hint: 'Beds update every few minutes' },
};
export const WithError: Story = {
  args: {
    placeholder: 'Choose a ward',
    required: true,
    error: 'Choose a ward before admitting',
  },
};
export const Disabled: Story = { args: { disabled: true } };
