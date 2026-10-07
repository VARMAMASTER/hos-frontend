import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { SearchField } from './search-field';

const onChrome: Decorator = (Story) => (
  <div className="nova-chrome max-w-md rounded-overlay p-s6">
    <Story />
  </div>
);

const meta = {
  title: 'Components/SearchField',
  component: SearchField,
  // The field is drawn for the dark chrome, so every story sits on it.
  decorators: [onChrome],
  args: {
    label: 'Search patients',
    placeholder: 'Search patients, claims and orders',
  },
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className="size-icon-md"
    >
      <circle cx="9" cy="9" r="5" />
      <path d="m13 13 3.5 3.5" />
    </svg>
  );
}

export const Default: Story = {};

export const WithIconAndShortcutHint: Story = {
  args: { icon: <SearchIcon />, shortcutHint: 'Ctrl K' },
};

export const Filled: Story = {
  args: { icon: <SearchIcon />, defaultValue: 'Ramesh' },
};

export const Disabled: Story = {
  args: { icon: <SearchIcon />, disabled: true },
};

function LiveSearch() {
  const [value, setValue] = useState('');
  return (
    <div className="flex flex-col gap-s5">
      <SearchField
        label="Search patients"
        icon={<SearchIcon />}
        placeholder="Type to search"
        onValueChange={setValue}
      />
      <p className="text-control text-[color:var(--nova-chrome-ink-2)]">
        onValueChange received: {value === '' ? 'nothing yet' : `"${value}"`}
      </p>
    </div>
  );
}

export const ReportsTypedValue: Story = {
  render: () => <LiveSearch />,
};
