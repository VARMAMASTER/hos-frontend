import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './text-field';

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13.5 13.5L17 17" />
    </svg>
  );
}

const meta = {
  title: 'Components/TextField',
  component: TextField,
  args: { label: 'Patient name' },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = {
  args: { label: 'MRN', hint: 'Printed on the wristband' },
};
export const Required: Story = { args: { required: true } };
export const WithError: Story = {
  args: {
    label: 'Mobile number',
    defaultValue: '98765',
    error: 'Enter a 10-digit mobile number',
  },
};
export const WithIcons: Story = {
  args: {
    label: 'Search patients',
    placeholder: 'Name or MRN',
    leadingIcon: <SearchIcon />,
  },
};
export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Ramesh' },
};
